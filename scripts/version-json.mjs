// version-json.mjs - the rules /version.json (D38) must meet, for
// verify-site.mjs's version leg (and test/test-version-json.mjs). Pure: it
// judges the parsed file against what the gate read elsewhere.
//
//   versionJsonProblems(vj, { stamp, pkg, posts }) -> [problem, ...] ([] passes)
//     vj      version.json, parsed
//     stamp   the staged game's stamp (the tree manifest's web-stamp)
//     pkg     package.sgl's version
//     posts   /news/'s list: [{ version, href, summary }], summary as listed
//             (HTML)
//
// The game's update line reads the file (D38), so it must name this build,
// this version and a date, with exactly its five fields. Then:
//   a version with a post   points at that post and carries its summary,
//                           which is not empty
//   0.4.1                   retains the 0.4.0 post and its summary (David's
//                           2026-10-14 ship decision)
//   a version with no post  (a quiet patch, as 0.3.1: David, 2026-10-11, "We
//                           don't need a news page for this release") carries
//                           an empty summary and points at the news index,
//                           as scripts/build-news.mjs writes it; the start
//                           screen then offers the reload and says nothing new
//                           ((substratic update) reads an empty summary as none)
// and the summary is drawable.

export const SITE = "https://harkfell.com";

// David's 0.4.1 ship decision keeps the 0.4 announcement. Other quiet
// patches keep their empty summary and news-index link.
export function releaseNewsPost(posts, version) {
  const announcedVersion = version === "0.4.1" ? "0.4.0" : version;
  return posts.find((post) => post.version === announcedVersion);
}

// DRAWABLE is the characters the start screen can draw at run time. Printable
// ASCII until the runtime glyph atlas lands in sigil-graphics (the leader,
// 2026-09-25, with LOOK); then this becomes that atlas's set.
// draw-start-updates! measures each summary and shrinks its font to fit the
// line. Character count is not its display limit; require drawable text below.
export const DRAWABLE = /^[\x20-\x7e]*$/;

export function versionJsonProblems(vj, { stamp, pkg, posts }) {
  const detail = [];
  const keys = Object.keys(vj).sort().join(",");
  if (keys !== "build,date,news,summary,version") detail.push(`version.json has the fields ${keys} (want build, date, news, summary, version)`);
  if (vj.build !== stamp) detail.push(`build "${vj.build}" is not the staged game's stamp ${stamp}`);
  if (vj.version !== pkg) detail.push(`version "${vj.version}" is not package.sgl's ${pkg}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vj.date || "")) detail.push(`date "${vj.date}" is not YYYY-MM-DD`);
  const post = releaseNewsPost(posts, vj.version);
  if (vj.version === "0.4.1" && !post) detail.push("0.4.1 requires the retained 0.4.0 announcement");
  if (!post) {
    // a release with no post: nothing new to say, and the index to point at
    if (vj.summary !== "") detail.push(`no news post for version ${vj.version} (posts: ${posts.map((p) => p.version).join(", ") || "none"}), yet the summary is "${vj.summary}"; a release with no post carries an empty summary`);
    if (vj.news !== `${SITE}/news/`) detail.push(`no news post for version ${vj.version}, and news "${vj.news}" is not the news index ${SITE}/news/`);
  } else {
    if (vj.news !== `${SITE}${post.href}`) detail.push(`news "${vj.news}" is not the post's URL ${SITE}${post.href}`);
    const listed = post.summary.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/<[^>]+>/g, "");
    if (vj.summary !== listed) detail.push(`summary differs from the post's: "${vj.summary}" against "${listed}"`);
    if (!vj.summary) detail.push("the summary is empty");
  }
  if (!DRAWABLE.test(vj.summary || "")) detail.push(`the summary has characters the game cannot draw: ${[...(vj.summary || "")].filter((c) => !DRAWABLE.test(c)).map((c) => `"${c}" U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(", ")}`);
  return detail;
}

// The pass line's account of the file.
export function versionJsonSummary(vj, posts) {
  return releaseNewsPost(posts, vj.version)
    ? `version.json ${vj.version} ${vj.date} build ${vj.build} -> ${vj.news}; summary ${vj.summary.length} chars, printable ASCII`
    : `version.json ${vj.version} ${vj.date} build ${vj.build} -> ${vj.news}; no post for this version: an empty summary, nothing new announced`;
}
