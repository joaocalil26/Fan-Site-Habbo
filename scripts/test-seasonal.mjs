import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const tag = "season-" + randomUUID().slice(0, 8);
const password = randomBytes(18).toString("base64url");
const users = [];
const original = await prisma.siteSetting.findUnique({ where: { id: "site" } });
let passes = 0;
function check(value, message) {
  assert.ok(value, message);
  passes++;
  console.log("PASS " + message);
}
function client() {
  const jar = new Map();
  return async (path, options = {}) => {
    const headers = new Headers(options.headers);
    if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    const r = await fetch(new URL(path, base), { ...options, headers, redirect: "manual" });
    for (const c of r.headers.getSetCookie()) {
      const pair = c.split(";")[0];
      const at = pair.indexOf("=");
      jar.set(pair.slice(0, at), pair.slice(at + 1));
    }
    return r;
  };
}
async function login(user) {
  const request = client();
  const { csrfToken } = await (await request("/api/auth/csrf")).json();
  await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: base },
    body: new URLSearchParams({
      csrfToken,
      email: user.email,
      password,
      callbackUrl: base + "/admin/aparencia",
    }),
  });
  const session = await (await request("/api/auth/session")).json();
  assert.equal(session.user.id, user.id);
  return request;
}
function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
function form(html, needle) {
  const target = (html.match(/<form\b[\s\S]*?<\/form>/g) || []).find((s) => s.includes(needle));
  assert.ok(target, "Form found: " + needle);
  const data = new FormData();
  for (const field of target.match(/<input\b[^>]*>/g) || []) {
    const name = field.match(/\bname="([^"]+)"/);
    if (name) data.set(decode(name[1]), decode(field.match(/\bvalue="([^"]*)"/)?.[1] || ""));
  }
  for (const t of target.match(/<textarea\b[\s\S]*?<\/textarea>/g) || []) {
    const name = t.match(/\bname="([^"]+)"/);
    if (name)
      data.set(
        decode(name[1]),
        decode(t.replace(/^<textarea[^>]*>/, "").replace(/<\/textarea>$/, "")),
      );
  }
  return data;
}
async function apply(request, theme, motion = true) {
  const html = await (await request("/admin/aparencia")).text();
  const body = form(html, 'name="theme"');
  body.set("theme", theme);
  if (motion) body.set("motion", "on");
  else body.delete("motion");
  const response = await request("/admin/aparencia", {
    method: "POST",
    headers: { origin: base },
    body,
  });
  check(response.status < 500, "Appearance action responds for " + theme);
  return response;
}
try {
  assert.ok(original, "An installed local database is required");
  for (const role of ["ADMIN", "MODERATOR", "USER"])
    users.push(
      await prisma.user.create({
        data: {
          email: `${tag}-${role.toLowerCase()}@idblet.test`,
          username: `${tag}_${role.toLowerCase()}`,
          role,
          passwordHash: await bcrypt.hash(password, 10),
        },
      }),
    );
  const [admin, moderator, member] = await Promise.all(users.map(login));
  const guest = client();
  check(
    (await guest("/admin/aparencia")).status === 307,
    "Guest cannot access appearance settings",
  );
  check(
    (await member("/admin/aparencia")).status === 307,
    "Member cannot access appearance settings",
  );
  check(
    (await moderator("/admin/aparencia")).status === 307,
    "Moderator cannot access appearance settings",
  );
  check(
    (await admin("/admin/aparencia")).status === 200,
    "Administrator can access the theme panel",
  );
  for (const theme of ["halloween", "christmas", "easter", "junina"]) {
    await apply(admin, theme);
    const settings = await prisma.siteSetting.findUnique({ where: { id: "site" } });
    check(
      settings.data.seasonal.theme === theme && settings.data.seasonal.motion === true,
      "Theme persists: " + theme,
    );
    check(
      settings.data.primaryColor === original.data.primaryColor &&
        settings.data.name === original.data.name,
      "Theme preserves identity: " + theme,
    );
    const html = await (await guest("/")).text();
    check(
      html.includes(`data-season="${theme}"`) && html.includes(`season-${theme}`),
      "Theme is rendered publicly: " + theme,
    );
    check(
      html.includes('class="seasonal-effects') && html.includes('aria-hidden="true"'),
      "Decorations are separate from accessible page content",
    );
  }
  await apply(admin, "christmas", false);
  const staticHtml = await (await guest("/noticias/vagas-na-equipe")).text();
  check(
    staticHtml.includes("season-christmas") && staticHtml.includes('data-motion="off"'),
    "Static decorations apply to internal pages",
  );
  const settingsBody = form(await (await admin("/admin/configuracoes")).text(), 'name="name"');
  await admin("/admin/configuracoes", {
    method: "POST",
    headers: { origin: base },
    body: settingsBody,
  });
  check(
    (await prisma.siteSetting.findUnique({ where: { id: "site" } })).data.seasonal.theme ===
      "christmas",
    "Saving identity settings preserves seasonal settings",
  );
  const malicious = form(await (await admin("/admin/aparencia")).text(), 'name="theme"');
  malicious.set("theme", "halloween");
  malicious.set("motion", "on");
  await member("/admin/aparencia", { method: "POST", headers: { origin: base }, body: malicious });
  check(
    (await prisma.siteSetting.findUnique({ where: { id: "site" } })).data.seasonal.theme ===
      "christmas",
    "Forged appearance action is rejected for members",
  );
  await apply(admin, "__proto__");
  check(
    (await prisma.siteSetting.findUnique({ where: { id: "site" } })).data.seasonal.theme ===
      "christmas",
    "Unknown theme is rejected",
  );
  await apply(admin, "none");
  const off = await (await guest("/")).text();
  check(
    off.includes('data-season="none"') && !off.includes('class="seasonal-effects'),
    "Disabling theme removes effect markup",
  );
  check(
    (await prisma.auditLog.count({ where: { actorId: users[0].id, resource: "aparencia" } })) >= 6,
    "Theme changes are audited",
  );
  console.log("SUCCESS " + passes + " seasonal checks");
} catch (error) {
  console.error("FAIL " + error.message);
  process.exitCode = 1;
} finally {
  if (original)
    await prisma.siteSetting.update({ where: { id: "site" }, data: { data: original.data } });
  const ids = users.map((u) => u.id);
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
}
