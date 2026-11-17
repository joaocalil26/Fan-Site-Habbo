import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient(),
  base = process.env.TEST_BASE_URL || "http://localhost:3000",
  tag = "radio-" + randomUUID().slice(0, 8),
  password = randomBytes(18).toString("base64url"),
  users = [];
const original = await p.siteSetting.findUnique({ where: { id: "site" } });
let count = 0;
function check(x, m) {
  assert.ok(x, m);
  count++;
  console.log("PASS " + m);
}
function client() {
  const jar = new Map();
  return async (path, options = {}) => {
    const headers = new Headers(options.headers);
    if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    const r = await fetch(new URL(path, base), { ...options, headers, redirect: "manual" });
    for (const c of r.headers.getSetCookie()) {
      const v = c.split(";")[0],
        i = v.indexOf("=");
      jar.set(v.slice(0, i), v.slice(i + 1));
    }
    return r;
  };
}
async function login(u) {
  const r = client(),
    { csrfToken } = await (await r("/api/auth/csrf")).json();
  await r("/api/auth/callback/credentials", {
    method: "POST",
    headers: { origin: base, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email: u.email,
      password,
      callbackUrl: base + "/admin/radio",
    }),
  });
  assert.equal((await (await r("/api/auth/session")).json()).user.id, u.id);
  return r;
}
function dec(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
function form(html) {
  const f = (html.match(/<form\b[\s\S]*?<\/form>/g) || []).find((x) =>
    x.includes('name="streamUrl"'),
  );
  assert.ok(f);
  const d = new FormData();
  for (const i of f.match(/<input\b[^>]*>/g) || []) {
    const n = i.match(/\bname="([^"]+)"/);
    if (n) d.set(dec(n[1]), dec(i.match(/\bvalue="([^"]*)"/)?.[1] || ""));
  }
  return d;
}
async function send(r, fields, body) {
  const data = body || form(await (await r("/admin/radio")).text());
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  const result = await r("/admin/radio", { method: "POST", headers: { origin: base }, body: data });
  assert.ok(result.status < 500);
  return result;
}
try {
  assert.ok(original);
  for (const role of ["ADMIN", "MODERATOR", "USER"])
    users.push(
      await p.user.create({
        data: {
          email: `${tag}-${role}@idblet.test`,
          username: `${tag}_${role}`,
          role,
          passwordHash: await bcrypt.hash(password, 10),
        },
      }),
    );
  const [admin, mod, member] = await Promise.all(users.map(login));
  const guest = client();
  check((await guest("/admin/radio")).status === 307, "Anonymous radio management rejected");
  check((await mod("/admin/radio")).status === 307, "Moderator radio management rejected");
  check((await member("/admin/radio")).status === 307, "Member radio management rejected");
  check((await admin("/admin/radio")).status === 200, "Admin can open radio panel");
  await send(admin, { mode: "stream", streamUrl: "javascript:alert(1)", show: "Test" });
  check(
    (await p.siteSetting.findUnique({ where: { id: "site" } })).data.streamUrl ===
      original.data.streamUrl,
    "Unsafe protocol rejected",
  );
  await send(admin, {
    mode: "stream",
    streamUrl: "https://user:secret@example.invalid/stream",
    show: "Test",
  });
  check(
    (await p.siteSetting.findUnique({ where: { id: "site" } })).data.streamUrl ===
      original.data.streamUrl,
    "Embedded credentials rejected",
  );
  const url = "https://example.invalid/idblet-test-stream.mp3";
  await send(admin, { mode: "stream", streamUrl: url, show: tag });
  const connected = (await p.siteSetting.findUnique({ where: { id: "site" } })).data;
  check(connected.streamUrl === url && connected.dj === "AutoDJ", "Admin can save AutoDJ stream");
  check(
    connected.name === original.data.name && connected.primaryColor === original.data.primaryColor,
    "Stream update preserves identity",
  );
  check(
    JSON.stringify(connected.seasonal) === JSON.stringify(original.data.seasonal),
    "Stream update preserves seasonal settings",
  );
  const html = await (await guest("/")).text();
  check(html.includes(url) && html.includes(tag), "Configured URL reaches the real audio player");
  const forged = form(await (await admin("/admin/radio")).text());
  await send(member, { mode: "off" }, forged);
  check(
    (await p.siteSetting.findUnique({ where: { id: "site" } })).data.streamUrl === url,
    "Forged radio action rejected for ordinary member",
  );
  await send(admin, { mode: "off", streamUrl: "", show: tag });
  check(
    (await p.siteSetting.findUnique({ where: { id: "site" } })).data.streamUrl === "",
    "Admin can disable radio",
  );
  check(
    (await p.auditLog.count({ where: { actorId: users[0].id, resource: "radio" } })) >= 2,
    "Radio changes are audited",
  );
  console.log("SUCCESS " + count + " radio checks");
} catch (e) {
  console.error("FAIL " + e.message);
  process.exitCode = 1;
} finally {
  if (original)
    await p.siteSetting.update({ where: { id: "site" }, data: { data: original.data } });
  const ids = users.map((x) => x.id);
  await p.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await p.user.deleteMany({ where: { id: { in: ids } } });
  await p.$disconnect();
}
