import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { unlink } from "node:fs/promises";
import { resolve, sep } from "node:path";
const prisma = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const tag = "it-" + randomUUID().slice(0, 8);
const password = randomBytes(20).toString("base64url");
const accounts = [];
const uploaded = [];
let passed = 0;
function check(value, message) {
  assert.ok(value, message);
  console.log("PASS " + message);
  passed++;
}
function client() {
  const jar = new Map();
  return async (path, options = {}) => {
    const headers = new Headers(options.headers);
    if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    const res = await fetch(new URL(path, base), { ...options, headers, redirect: "manual" });
    for (const cookie of res.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const index = pair.indexOf("=");
      jar.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return res;
  };
}
async function login(email, loginPassword = password) {
  const request = client();
  const res = await request("/api/auth/csrf");
  const { csrfToken } = await res.json();
  const response = await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: base },
    body: new URLSearchParams({
      csrfToken,
      email,
      password: loginPassword,
      callbackUrl: base + "/admin",
    }),
  });
  check(response.status === 302 || response.status === 303, "Credentials authentication redirects");
  const session = await (await request("/api/auth/session")).json();
  check(!!session.user?.id, "Authenticated session exists");
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
function formData(html, needle) {
  const forms = html.match(/<form\b[\s\S]*?<\/form>/g) || [];
  const form = forms.find((s) => s.toLowerCase().includes(needle.toLowerCase()));
  assert.ok(form, "Server-rendered form found: " + needle);
  const data = new FormData();
  for (const input of form.match(/<input\b[^>]*>/g) || []) {
    const name = input.match(/\bname="([^"]+)"/);
    if (name) data.set(decode(name[1]), decode(input.match(/\bvalue="([^"]*)"/)?.[1] || ""));
  }
  for (const textarea of form.match(/<textarea\b[\s\S]*?<\/textarea>/g) || []) {
    const name = textarea.match(/\bname="([^"]+)"/);
    if (name)
      data.set(
        decode(name[1]),
        decode(textarea.replace(/^<textarea[^>]*>/, "").replace(/<\/textarea>$/, "")),
      );
  }
  return data;
}
async function submit(request, url, needle, values) {
  const html = await (await request(url)).text();
  const body = formData(html, needle);
  for (const [key, value] of Object.entries(values)) {
    if (value === false) body.delete(key);
    else body.set(key, String(value));
  }
  const res = await request(url, { method: "POST", headers: { origin: base }, body });
  const text = await res.text();
  assert.ok(res.status < 500, "Server action response: " + text.slice(0, 200));
  return { text, status: res.status, location: res.headers.get("location") };
}
try {
  for (const role of ["ADMIN", "MODERATOR", "USER"]) {
    const u = await prisma.user.create({
      data: {
        email: `${tag}-${role.toLowerCase()}@idblet.test`,
        username: `${tag}_${role.toLowerCase()}`,
        role,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    accounts.push(u);
  }
  const [admin, moderator, member] = await Promise.all(accounts.map((u) => login(u.email)));
  const guest = client();
  for (const path of [
    "/",
    "/noticias",
    "/noticias/vagas-na-equipe",
    "/eventos/desafio-do-labirinto",
    "/forum/historias-da-comunidade",
    "/galeria/boas-vindas-idblet",
    "/equipe",
    "/ranking",
    "/emblemas",
    "/valores",
    "/pagina/sobre",
    "/register",
  ])
    check((await guest(path)).status === 200, "Public route " + path);
  for (const [path, target] of [
    ["/noticia/593/vagas-na-equipe", "/noticias/vagas-na-equipe"],
    ["/noticia/589/desafio-do-labirinto", "/noticias/desafio-do-labirinto"],
    ["/topico/889/historias-da-comunidade", "/forum/historias-da-comunidade"],
    ["/arte/480/boas-vindas-idblet", "/galeria/boas-vindas-idblet"],
  ]) {
    const r = await guest(path);
    check(
      [307, 308].includes(r.status) && r.headers.get("location")?.includes(target),
      "Route alias " + path,
    );
  }
  check((await guest("/admin")).status === 307, "Anonymous admin access is redirected");
  check((await member("/admin")).status === 307, "Member cannot access admin dashboard");
  check(
    (await member("/admin/noticias")).status === 307,
    "Member cannot access editorial management",
  );
  check(
    (await moderator("/admin/configuracoes")).status === 307,
    "Moderator cannot access site settings",
  );
  check((await moderator("/admin/comentarios")).status === 200, "Moderator can manage comments");
  for (const path of [
    "/admin",
    "/admin/noticias",
    "/admin/eventos",
    "/admin/galeria",
    "/admin/podcasts",
    "/admin/equipe",
    "/admin/usuarios",
    "/admin/configuracoes",
    "/admin/auditoria",
  ])
    check((await admin(path)).status === 200, "Admin route " + path);
  await submit(admin, "/admin/noticias?novo=1", 'name="resource"', {
    resource: "noticias",
    title: tag + " Draft",
    slug: tag,
    excerpt: "Integration test",
    content: "## Safe test\n\n<script>alert(1)</script>",
    category: "Test",
    published: false,
  });
  let news = await prisma.news.findUnique({ where: { slug: tag } });
  check(!!news && !news.published, "Admin creates a persistent draft");
  check((await guest("/noticias/" + tag)).status === 404, "Draft cannot be read publicly");
  await submit(admin, "/admin/noticias?edit=" + news.id, 'name="resource"', {
    resource: "noticias",
    id: news.id,
    title: tag + " Published",
    slug: tag,
    excerpt: "Integration test",
    content: "## Safe test\n\n<script>alert(1)</script>",
    category: "Test",
    published: "on",
  });
  news = await prisma.news.findUnique({ where: { slug: tag } });
  check(news.published, "Admin publishes the draft");
  const article = await (await guest("/noticias/" + tag)).text();
  check(article.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "Article HTML is escaped");
  await submit(member, "/noticias/" + tag, 'name="content"', {
    type: "news",
    id: news.id,
    content: "Integration comment " + tag,
  });
  check(
    (await prisma.comment.count({ where: { newsId: news.id, authorId: accounts[2].id } })) === 1,
    "Member comment persists",
  );
  await submit(member, "/noticias/" + tag, 'name="type"', { type: "news", id: news.id });
  check(
    (await prisma.reaction.count({ where: { targetId: news.id, userId: accounts[2].id } })) === 1,
    "Member like persists",
  );
  await submit(member, "/noticias/" + tag, 'name="type"', { type: "news", id: news.id });
  check(
    (await prisma.reaction.count({ where: { targetId: news.id, userId: accounts[2].id } })) === 0,
    "Member can remove like",
  );
  const comment = await prisma.comment.findFirst({ where: { newsId: news.id } });
  await submit(moderator, "/admin/comentarios?edit=" + comment.id, 'name="resource"', {
    resource: "comentarios",
    id: comment.id,
    content: comment.content,
    hidden: "on",
  });
  check(
    !(await (await guest("/noticias/" + tag)).text()).includes("Integration comment " + tag),
    "Moderator hides a public comment",
  );
  const editHtml = await (await admin("/admin/noticias?edit=" + news.id)).text();
  const forged = formData(editHtml, 'name="resource"');
  forged.set("resource", "noticias");
  forged.set("id", news.id);
  forged.set("title", "FORGED");
  forged.set("content", "Forged content");
  forged.set("category", "Test");
  await member("/admin/noticias?edit=" + news.id, {
    method: "POST",
    headers: { origin: base },
    body: forged,
  });
  check(
    (await prisma.news.findUnique({ where: { id: news.id } })).title === tag + " Published",
    "Forged admin server action is rejected for member",
  );
  const category = await prisma.forumCategory.findFirst({ orderBy: { order: "asc" } });
  await submit(member, "/forum/novo", 'name="categoryId"', {
    categoryId: category.id,
    title: tag + " Community thread",
    content: "This is an integration test topic with **safe formatting**.",
  });
  const topic = await prisma.forumThread.findFirst({
    where: { authorId: accounts[2].id, title: tag + " Community thread" },
  });
  check(!!topic, "Member creates a forum topic");
  await submit(member, "/forum/" + topic.slug, 'name="threadId"', {
    threadId: topic.id,
    threadSlug: topic.slug,
    content: "Integration reply " + tag,
  });
  check(
    (await prisma.forumThread.findUnique({ where: { id: topic.id } })).replyCount === 1,
    "Forum reply count updates atomically",
  );
  check(
    (await prisma.forumPost.count({ where: { threadId: topic.id } })) === 1,
    "Forum reply persists",
  );
  const replyForm = formData(
    await (await member("/forum/" + topic.slug)).text(),
    'name="threadId"',
  );
  replyForm.set("content", "Reply to locked topic");
  await submit(moderator, "/admin/topicos?edit=" + topic.id, 'name="resource"', {
    resource: "topicos",
    id: topic.id,
    title: topic.title,
    content: topic.content,
    locked: "on",
    pinned: "on",
  });
  await member("/forum/" + topic.slug, {
    method: "POST",
    headers: { origin: base },
    body: replyForm,
  });
  check(
    (await prisma.forumPost.count({ where: { threadId: topic.id } })) === 1,
    "Closed topic rejects additional replies",
  );
  await submit(member, "/noticias/" + tag, 'maxLength="1500"', {
    type: "news",
    id: news.id,
    content: "Integration report about this publication " + tag,
  });
  check(
    (await prisma.report.count({ where: { targetId: news.id, userId: accounts[2].id } })) === 1,
    "Publication report reaches moderation",
  );
  await submit(admin, "/admin/galeria?novo=1", 'name="resource"', {
    resource: "galeria",
    title: tag + " Artwork",
    slug: tag + "-art",
    content: "Original test artwork.",
    image: "/welcome-idblet.svg",
    published: "on",
  });
  check(
    (await guest("/galeria/" + tag + "-art")).status === 200,
    "Admin publishes a gallery entry",
  );
  const upload = new FormData();
  upload.set(
    "file",
    new File(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG9sAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      "pixel.png",
      { type: "image/png" },
    ),
  );
  const imageResponse = await admin("/api/admin/upload", {
    method: "POST",
    headers: { origin: base },
    body: upload,
  });
  const image = await imageResponse.json();
  check(
    imageResponse.status === 200 && image.url?.startsWith("/uploads/"),
    "Admin image upload succeeds",
  );
  uploaded.push(image.url);
  check((await guest(image.url)).status === 200, "Uploaded media is served");
  const partial = await guest(image.url, { headers: { range: "bytes=0-7" } });
  check(
    partial.status === 206 && (await partial.arrayBuffer()).byteLength === 8,
    "Uploaded media supports byte ranges",
  );
  check(
    (await member("/api/admin/upload", { method: "POST", headers: { origin: base }, body: upload }))
      .status === 403,
    "Member upload is rejected",
  );
  const scriptUpload = new FormData();
  scriptUpload.set(
    "file",
    new File(['<svg onload="alert(1)"/>'], "evil.svg", { type: "image/svg+xml" }),
  );
  check(
    (
      await admin("/api/admin/upload", {
        method: "POST",
        headers: { origin: base },
        body: scriptUpload,
      })
    ).status === 400,
    "Executable SVG upload is rejected",
  );
  const validComment = formData(await (await member("/noticias/" + tag)).text(), 'name="content"');
  validComment.set("content", "Banned member comment");
  const userPage = "/admin/usuarios?edit=" + accounts[2].id;
  await submit(admin, userPage, 'name="resource"', {
    resource: "usuarios",
    id: accounts[2].id,
    name: "Test member",
    role: "USER",
    isBanned: "on",
    isPremium: false,
  });
  const commentsBefore = await prisma.comment.count({ where: { authorId: accounts[2].id } });
  await member("/noticias/" + tag, {
    method: "POST",
    headers: { origin: base },
    body: validComment,
  });
  check(
    (await prisma.comment.count({ where: { authorId: accounts[2].id } })) === commentsBefore,
    "Suspended account cannot post with an existing session",
  );
  const badge = await prisma.emblem.findFirst();
  if (badge) {
    await submit(admin, "/admin/usuarios?edit=" + accounts[2].id, 'name="userId"', {
      userId: accounts[2].id,
      emblemId: badge.id,
      operation: "award",
    });
    check(
      (await prisma.userEmblem.count({ where: { userId: accounts[2].id, emblemId: badge.id } })) ===
        1,
      "Admin awards an emblem to a member",
    );
    await submit(admin, "/admin/usuarios?edit=" + accounts[2].id, 'name="userId"', {
      userId: accounts[2].id,
      emblemId: badge.id,
      operation: "revoke",
    });
    check(
      (await prisma.userEmblem.count({ where: { userId: accounts[2].id, emblemId: badge.id } })) ===
        0,
      "Admin can revoke a member emblem",
    );
  }
  const settingsHtml = await (await admin("/admin/configuracoes")).text();
  const settingsBody = formData(settingsHtml, 'name="name"');
  const originalTagline = settingsBody.get("tagline");
  settingsBody.set("tagline", tag + " tagline");
  await admin("/admin/configuracoes", {
    method: "POST",
    headers: { origin: base },
    body: settingsBody,
  });
  check(
    (await prisma.siteSetting.findUnique({ where: { id: "site" } })).data.tagline ===
      tag + " tagline",
    "Admin saves site settings",
  );
  check(
    (await (await guest("/")).text()).includes(tag + " tagline"),
    "Site identity updates in public metadata",
  );
  settingsBody.set("tagline", originalTagline);
  await admin("/admin/configuracoes", {
    method: "POST",
    headers: { origin: base },
    body: settingsBody,
  });
  const secondSession = await login(accounts[1].email);
  const newPassword = randomBytes(20).toString("base64url");
  await submit(moderator, "/perfil/editar", 'name="currentPassword"', {
    currentPassword: password,
    newPassword,
  });
  check(
    (await secondSession("/admin/comentarios")).status === 307,
    "Password change invalidates previous sessions",
  );
  check(
    (await (await login(accounts[1].email, newPassword))("/admin/comentarios")).status === 200,
    "New password restores authorized access",
  );
  await submit(admin, "/admin/noticias?edit=" + news.id, 'class="delete-box"', {
    resource: "noticias",
    id: news.id,
  });
  check(
    !(await prisma.news.findUnique({ where: { id: news.id } })),
    "Admin can delete a publication",
  );
  check(
    (await prisma.comment.count({ where: { newsId: news.id } })) === 0,
    "Publication deletion cascades to comments",
  );
  check(
    (await prisma.auditLog.count({ where: { actorId: { in: accounts.map((u) => u.id) } } })) >= 4,
    "Administrative changes are audited",
  );
  console.log(`SUCCESS ${passed} checks`);
} catch (error) {
  console.error("FAIL", error.message);
  process.exitCode = 1;
} finally {
  const ids = accounts.map((u) => u.id);
  const rows = await prisma.news.findMany({
    where: { slug: { startsWith: tag } },
    select: { id: true },
  });
  await prisma.reaction.deleteMany({
    where: { OR: [{ userId: { in: ids } }, { targetId: { in: rows.map((r) => r.id) } }] },
  });
  await prisma.news.deleteMany({ where: { slug: { startsWith: tag } } });
  await prisma.contentEntry.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.report.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  for (const url of uploaded) {
    const file = resolve("public", "." + url);
    if (file.startsWith(resolve("public", "uploads") + sep)) await unlink(file);
  }
  await prisma.$disconnect();
}
