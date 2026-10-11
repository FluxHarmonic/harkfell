// scripts/version-json.mjs: verify-site's version rules (D38), with a
// release that has no post (0.3.1, a quiet patch) allowed in exactly one
// shape. Run: node --test test/test-version-json.mjs
//
// LEGACY is the version leg as verify-site.mjs had it inline at 0.3.0
// (ed20653), copied verbatim, so the posted cases prove the move kept its
// behaviour byte for byte.
import assert from "node:assert/strict";
import { test } from "node:test";
import { versionJsonProblems, versionJsonSummary } from "../scripts/version-json.mjs";

const DRAWABLE = /^[\x20-\x7e]*$/;
function LEGACY(vj, header, pkg, newsPosts) {
  const detail = [];
    const keys = Object.keys(vj).sort().join(",");
    if (keys !== "build,date,news,summary,version") detail.push(`version.json has the fields ${keys} (want build, date, news, summary, version)`);
    if (vj.build !== header["web-stamp"]) detail.push(`build "${vj.build}" is not the staged game's stamp ${header["web-stamp"]}`);
    if (vj.version !== pkg) detail.push(`version "${vj.version}" is not package.sgl's ${pkg}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vj.date || "")) detail.push(`date "${vj.date}" is not YYYY-MM-DD`);
    const post = newsPosts.find((p) => p.version === vj.version);
    if (!post) detail.push(`no news post for version ${vj.version} (posts: ${newsPosts.map((p) => p.version).join(", ") || "none"}); the game would announce it with nothing to say`);
    else {
      if (vj.news !== `https://harkfell.com${post.href}`) detail.push(`news "${vj.news}" is not the post's URL https://harkfell.com${post.href}`);
      const listed = post.summary.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/<[^>]+>/g, "");
      if (vj.summary !== listed) detail.push(`summary differs from the post's: "${vj.summary}" against "${listed}"`);
    }
    if (!vj.summary) detail.push("the summary is empty");
    if (!DRAWABLE.test(vj.summary || "")) detail.push(`the summary has characters the game cannot draw: ${[...(vj.summary || "")].filter((c) => !DRAWABLE.test(c)).map((c) => `"${c}" U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(", ")}`);
  return detail;
}
const LEGACY_PASS = (vj) => `version.json ${vj.version} ${vj.date} build ${vj.build} -> ${vj.news}; summary ${vj.summary.length} chars, printable ASCII`;

const STAMP = "ed20653abcde-1791700000";
const POSTS = [
  { version: "0.3.0", href: "/news/harkfell-0-3/", summary: "Take Harkfell offline, see what&#39;s new &amp; hear the water." },
  { version: "0.2.0", href: "/news/harkfell-0-2/", summary: "Glasswood." },
];
const posted = (over = {}) => ({ version: "0.3.0", date: "2026-10-11", build: STAMP,
  summary: "Take Harkfell offline, see what&#39;s new & hear the water.", news: "https://harkfell.com/news/harkfell-0-3/", ...over });
const quiet = (over = {}) => ({ version: "0.3.1", date: "2026-10-11", build: STAMP,
  summary: "", news: "https://harkfell.com/news/", ...over });
const judge = (vj, pkg) => versionJsonProblems(vj, { stamp: STAMP, pkg, posts: POSTS });

test("a posted version is judged exactly as before the move, green and red", () => {
  const cases = [
    posted(),
    posted({ summary: "" }),                                   // an existing post with an empty summary
    posted({ summary: "Something else." }),
    posted({ news: "https://harkfell.com/news/" }),
    posted({ summary: "Café — new." }),
    posted({ build: "other" }),
    posted({ date: "11 Oct" }),
    posted({ extra: 1 }),
    { version: "0.3.0", build: STAMP },
  ];
  for (const vj of cases) {
    for (const pkg of ["0.3.0", "0.3.1"]) {
      assert.deepEqual(judge(vj, pkg), LEGACY(vj, { "web-stamp": STAMP }, pkg, POSTS), JSON.stringify(vj));
    }
  }
  assert.equal(versionJsonSummary(posted(), POSTS), LEGACY_PASS(posted()));
});

test("the good posted version passes", () => {
  assert.deepEqual(judge(posted(), "0.3.0"), []);
});

test("an existing post with an empty summary is refused", () => {
  assert.ok(judge(posted({ summary: "" }), "0.3.0").includes("the summary is empty"));
});

test("a release with no post passes with an empty summary and the news index", () => {
  assert.deepEqual(judge(quiet(), "0.3.1"), []);
  assert.match(versionJsonSummary(quiet(), POSTS), /no post for this version: an empty summary, nothing new announced$/);
});

test("a release with no post is refused with a summary", () => {
  const p = judge(quiet({ summary: "Region names and the creature's icon." }), "0.3.1");
  assert.equal(p.length, 1);
  assert.match(p[0], /^no news post for version 0\.3\.1 \(posts: 0\.3\.0, 0\.2\.0\), yet the summary is /);
  // and an earlier release's summary, carried over, is refused the same way
  assert.equal(judge(quiet({ summary: "Take Harkfell offline, see what's new & hear the water." }), "0.3.1").length, 1);
});

test("a release with no post is refused when news points anywhere but the index", () => {
  for (const news of ["https://harkfell.com/news/harkfell-0-3/", "", "https://harkfell.com/"]) {
    const p = judge(quiet({ news }), "0.3.1");
    assert.equal(p.length, 1, news);
    assert.match(p[0], /is not the news index https:\/\/harkfell\.com\/news\/$/);
  }
});

test("a release with no post keeps every other check", () => {
  assert.equal(judge(quiet(), "0.3.0")[0], `version "0.3.1" is not package.sgl's 0.3.0`);
  assert.equal(judge(quiet({ build: "old" }), "0.3.1")[0], `build "old" is not the staged game's stamp ${STAMP}`);
  assert.equal(judge(quiet({ date: "" }), "0.3.1")[0], `date "" is not YYYY-MM-DD`);
  assert.match(judge(quiet({ extra: true }), "0.3.1")[0], /^version\.json has the fields build,date,extra,news,summary,version/);
  const { summary, ...noSummary } = quiet();
  assert.ok(judge(noSummary, "0.3.1").some((p) => p.startsWith("version.json has the fields build,date,news,version")));
  assert.ok(judge(noSummary, "0.3.1").some((p) => p.startsWith("no news post for version 0.3.1")));
});
