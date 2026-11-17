import assert from "node:assert/strict";
const base = "http://localhost:3000";
const get = async (path) => {
  const r = await fetch(base + path);
  assert.equal(r.status, 200);
  return r.json();
};
const first = await get("/api/emblemas?take=6");
assert.equal(first.source, "habboassets");
assert.equal(first.hotel, "com.br");
assert.equal(first.items.length, 6);
assert.ok(
  first.items.every(
    (b) =>
      b.code &&
      b.name &&
      b.image.startsWith("https://cdn.habboassets.com/") &&
      b.rarity === null &&
      b.releasedAt === null,
  ),
);
console.log("PASS latest public badges: " + first.items.map((b) => b.code).join(", "));
const second = await get("/api/emblemas?take=6&cursor=" + encodeURIComponent(first.nextCursor));
assert.equal(second.page, 2);
assert.equal(second.source, "habboassets");
assert.ok(second.items.length > 0);
console.log("PASS cursor pagination");
const search = await get("/api/emblemas?take=6&q=" + encodeURIComponent(first.items[0].code));
assert.ok(search.items.some((b) => b.code === first.items[0].code));
console.log("PASS badge search");
const local = await get("/api/emblemas?source=local&take=6");
assert.equal(local.source, "local");
assert.ok(local.items.length > 0);
console.log("PASS local collection preserved");
const invalid = await get("/api/emblemas?take=NaN&page=-5");
assert.equal(invalid.page, 1);
assert.ok(invalid.items.length <= 6);
console.log("PASS invalid pagination bounded");
const values = await get("/api/valores?take=6");
assert.equal(values.source, "local");
assert.ok(values.items.length <= 6);
console.log("PASS local price catalogue");
const furniture = await get("/api/mobis?take=6");
assert.equal(furniture.source, "habboassets");
assert.ok(furniture.items.length > 0 && furniture.items.length <= 6);
assert.ok(furniture.items.every((m) => m.image.startsWith("https://") && m.classname));
assert.equal(new Set(furniture.items.map((m) => m.classname)).size, furniture.items.length);
console.log("PASS latest furniture with unique classnames and real images");
const furnitureSearch = await get(
  "/api/mobis?take=6&q=" + encodeURIComponent(furniture.items[0].classname),
);
assert.ok(furnitureSearch.items.some((m) => m.classname === furniture.items[0].classname));
console.log("PASS recent furniture search");
for (const path of ["/", "/emblemas", "/emblemas?page=2", "/emblemas?source=local", "/mobis"]) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.ok(!html.includes("Internal Server Error"));
  if (!path.includes("source=local")) assert.ok(html.includes("HabboAssets"));
  console.log("PASS rendered " + path);
}
