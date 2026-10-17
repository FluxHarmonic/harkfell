// Persist complete, independently revalidated physics verdicts beside evidence.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const sha = value => createHash('sha256').update(value).digest('hex');
const nativeFile = file => file.startsWith('src/') || ['package.sgl', 'sigil.lock'].includes(file);
const nativeDigest = source => sha(JSON.stringify(source.manifest.filter(([file]) => nativeFile(file))));

export function verifyFreshBuild(source, binary) {
  const built = fs.statSync(binary, { bigint: true }).mtimeNs;
  for (const [file] of source.manifest) {
    if (nativeFile(file) && fs.statSync(file, { bigint: true }).mtimeNs > built) {
      throw Error(`stale checker build: ${binary} is older than ${file}; rebuild the release executable`);
    }
  }
}

export function attestBuild(source, binary, file = 'build/release/reach-build.json') {
  verifyFreshBuild(source, binary);
  const receipt = { schema: 1, nativeInputs: nativeDigest(source), binaryHash: sha(fs.readFileSync(binary)) };
  fs.writeFileSync(file, JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

export function verifyBuild(source, binary, file = 'build/release/reach-build.json') {
  verifyFreshBuild(source, binary);
  const receipt = JSON.parse(fs.readFileSync(file));
  if (receipt.schema !== 1 || receipt.nativeInputs !== nativeDigest(source)
      || receipt.binaryHash !== sha(fs.readFileSync(binary))) {
    throw Error('stale checker build: rebuild and record its exact source inputs');
  }
  return receipt;
}

export function dependencyScopes(text, ids) {
  if (!text.includes('PASS reach-cache-inputs: parse seams map green; 11 physics scopes')
      || /^(FAIL|SETUP-FAILED)|Error \(/m.test(text)) throw Error('dependency preflight failed');
  const rooms = Object.fromEntries(ids.map(id => [id, []]));
  const abilities = [], layout = [];
  const roomPath = /^world\/rooms\/[A-Za-z0-9_-]+\/x-?\d+y-?\d+\.room$/;
  for (const line of text.split('\n')) {
    if (line.startsWith('CACHE-ROOM ')) {
      const [, id, file, ...rest] = line.split(' ');
      if (!rooms[id] || !roomPath.test(file) || rest.length) throw Error('invalid room dependency');
      rooms[id].push(file);
    } else if (line.startsWith('CACHE-ABILITY ')) {
      const file = line.slice(14);
      if (!roomPath.test(file)) throw Error('invalid ability dependency');
      abilities.push(file);
    } else if (line.startsWith('CACHE-LAYOUT ')) {
      if (!/^CACHE-LAYOUT [A-Za-z0-9_-]+ -?\d+ -?\d+$/.test(line)) throw Error('invalid layout dependency');
      layout.push(line);
    }
  }
  for (const files of Object.values(rooms)) {
    if (!files.length || files.length !== new Set(files).size) throw Error('empty/duplicate room scope');
    files.sort();
  }
  if (!layout.length || !abilities.length || new Set(layout).size !== layout.length
      || new Set(abilities).size !== abilities.length) throw Error('invalid cross-region context');
  return { rooms, abilities: abilities.sort(), layout: layout.sort() };
}

export function cacheDescriptor(id, source, dependencies, binaryHash, policy) {
  const byPath = new Map(source.manifest);
  const roomPaths = [...new Set([...dependencies.rooms[id], ...dependencies.abilities])].sort();
  const rooms = roomPaths.map(file => {
    if (!byPath.has(file)) throw Error(`unrecorded dependency: ${file}`);
    return [file, byPath.get(file)];
  });
  return { schema: 1, id, policy, binaryHash,
    checker: source.manifest.filter(([file]) => !file.startsWith('world/')),
    worldMetadata: source.manifest.filter(([file]) => /^world\/(world\.sgl|regions\/[^/]+\.map)$/.test(file)),
    layout: dependencies.layout, abilities: dependencies.abilities, rooms };
}

export function cachedVerdict(cache, descriptor, validate, normalize) {
  const key = sha(JSON.stringify(descriptor));
  try {
    const entry = JSON.parse(fs.readFileSync(path.join(cache, `${key}.json`)));
    const { record, text } = entry;
    if (entry.schema !== 1 || entry.key !== key || sha(JSON.stringify(entry.descriptor)) !== key
        || record.id !== descriptor.id || record.binaryHash !== descriptor.binaryHash || !record.passed
        || JSON.stringify(record.args) !== JSON.stringify(descriptor.policy.args)
        || sha(text) !== record.logHash || sha(normalize(record.id, text)) !== record.resultHash
        || !validate(record.id, record.code, text)) return { key, hit: false, reason: 'invalid evidence' };
    return { key, hit: true, record, text };
  } catch (error) {
    return { key, hit: false, reason: error.code === 'ENOENT' ? 'absent' : 'unreadable evidence' };
  }
}

export function storeVerdict(cache, descriptor, record, text) {
  if (!record.passed) return;
  fs.mkdirSync(cache, { recursive: true });
  const key = sha(JSON.stringify(descriptor));
  const file = path.join(cache, `${key}.json`);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify({ schema: 1, key, descriptor, record, text }) + '\n', { flag: 'wx' });
    fs.renameSync(temporary, file); // Atomic publication; concurrent readers see complete evidence.
  } finally { fs.rmSync(temporary, { force: true }); }
}
