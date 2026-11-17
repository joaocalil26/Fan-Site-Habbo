import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient(),
  base = process.env.TEST_BASE_URL || "http://localhost:3000",
  tag = "gifts-" + randomUUID().slice(0, 8),
  password = randomBytes(18).toString("base64url"),
  users = [];
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
function form(html, marker) {
  const f = (html.match(/<form\b[\s\S]*?<\/form>/g) || []).find((x) =>
    x.includes(`name="${marker}"`),
  );
  assert.ok(f, `Form missing: ${marker}`);
  const data = new FormData();
  for (const i of f.match(/<input\b[^>]*>/g) || []) {
    const n = i.match(/\bname="([^"]+)"/);
    if (n) data.set(dec(n[1]), dec(i.match(/\bvalue="([^"]*)"/)?.[1] || ""));
  }
  return data;
}
async function send(r, path, data, fields = {}) {
  const d = new FormData();
  for (const [k, v] of data) d.set(k, v);
  for (const [k, v] of Object.entries(fields)) d.set(k, v);
  return r(path, { method: "POST", headers: { origin: base }, body: d });
}
let eventId, emblemId, customId, threadId, remoteId;
const remoteExisted = await p.emblem.findUnique({ where: { code: "ACH_BasicClub1" } });
try {
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
  const [admin, mod, member] = await Promise.all(users.map(login)),
    guest = client();
  const code = tag.replaceAll("-", "").toUpperCase();
  await p.emblem.create({
    data: { code: code + "SECOND", name: tag + " second", image: "/idblet.svg" },
  });
  const badge = await p.emblem.create({ data: { code, name: tag, image: "/idblet.svg" } });
  emblemId = badge.id;
  const eventPage = "/admin/eventos?novo=1";
  const editor = form(await (await admin(eventPage)).text(), "resource");
  const fields = {
    resource: "eventos",
    id: "",
    title: tag,
    slug: tag,
    content: "Evento de teste de presentes",
    published: "on",
    status: "Ao vivo",
    giftEnabled: "on",
    rewardCodes: code + ", " + code + "SECOND",
  };
  await send(member, eventPage, editor, fields);
  check(
    !(await p.contentEntry.findUnique({ where: { slug: tag } })),
    "Member cannot create gift event",
  );
  await send(mod, eventPage, editor, fields);
  check(
    !(await p.contentEntry.findUnique({ where: { slug: tag } })),
    "Moderator cannot create gift event",
  );
  await send(admin, eventPage, editor, fields);
  const event = await p.contentEntry.findUnique({
    where: { slug: tag },
    include: { rewards: true },
  });
  eventId = event?.id;
  check(event?.giftEnabled && event.rewards.length === 2, "Admin creates event with reward codes");
  check(
    !(await (await guest("/")).text()).includes(`name="eventId" value="${eventId}"`),
    "Guest is not offered authenticated gift",
  );
  const home = await (await member("/")).text();
  const giftForm = form(home, "eventId");
  giftForm.set("eventId", eventId);
  check(
    home.includes("Clique e receba") && home.includes(tag),
    "Active event gift appears to member",
  );
  await send(guest, "/", giftForm);
  check((await p.giftClaim.count({ where: { eventId } })) === 0, "Anonymous claim rejected");
  await p.contentEntry.update({
    where: { id: eventId },
    data: { startsAt: new Date(Date.now() + 3600000) },
  });
  await send(member, "/", giftForm);
  check((await p.giftClaim.count({ where: { eventId } })) === 0, "Future event cannot be claimed");
  await p.contentEntry.update({
    where: { id: eventId },
    data: { startsAt: null, endsAt: new Date(Date.now() - 1000) },
  });
  await send(member, "/", giftForm);
  check((await p.giftClaim.count({ where: { eventId } })) === 0, "Expired event cannot be claimed");
  await p.contentEntry.update({
    where: { id: eventId },
    data: { endsAt: null, giftEnabled: false },
  });
  await send(member, "/", giftForm);
  check((await p.giftClaim.count({ where: { eventId } })) === 0, "Disabled gift cannot be claimed");
  await p.contentEntry.update({
    where: { id: eventId },
    data: { giftEnabled: true, published: false },
  });
  await send(member, "/", giftForm);
  check((await p.giftClaim.count({ where: { eventId } })) === 0, "Draft gift cannot be claimed");
  await p.contentEntry.update({
    where: { id: eventId },
    data: { published: true, status: "Finalizado" },
  });
  await send(member, "/", giftForm);
  check(
    (await p.giftClaim.count({ where: { eventId } })) === 0,
    "Finished event cannot be claimed",
  );
  await p.contentEntry.update({ where: { id: eventId }, data: { status: "Ao vivo" } });
  await p.userEmblem.create({ data: { userId: users[2].id, emblemId } });
  await Promise.all([send(member, "/", giftForm), send(member, "/", giftForm)]);
  check(
    (await p.giftClaim.count({ where: { eventId, userId: users[2].id } })) === 1,
    "Concurrent clicks create exactly one claim",
  );
  check(
    (await p.userEmblem.count({ where: { userId: users[2].id, emblemId } })) === 1,
    "Previously owned badge is not duplicated",
  );
  check(
    (await p.userEmblem.count({ where: { userId: users[2].id } })) === 2,
    "All event rewards are granted together",
  );
  await send(member, "/", giftForm);
  check((await p.giftClaim.count({ where: { eventId } })) === 1, "Repeated claim is rejected");
  check(
    !(await (await member("/")).text()).includes(`name="eventId" value="${eventId}"`),
    "Claimed gift disappears",
  );
  const editPath = `/admin/eventos?edit=${eventId}`,
    edit = form(await (await admin(editPath)).text(), "resource");
  await send(admin, editPath, edit, {
    ...fields,
    id: eventId,
    rewardCodes: code,
    giftEnabled: "on",
  });
  check(
    (await p.eventReward.count({ where: { eventId } })) === 2,
    "Reward changes blocked after first claim",
  );
  await send(admin, "/", giftForm);
  check(
    (await p.giftClaim.count({ where: { eventId } })) === 2,
    "Different accounts can claim same event independently",
  );
  await p.user.update({ where: { id: users[1].id }, data: { isBanned: true } });
  await send(mod, "/", giftForm);
  check(
    (await p.giftClaim.count({ where: { eventId, userId: users[1].id } })) === 0,
    "Suspended account cannot claim gift with existing session",
  );
  await p.user.update({ where: { id: users[1].id }, data: { isBanned: false } });
  const userPath = `/admin/usuarios?edit=${users[1].id}`,
    award = form(await (await admin(userPath)).text(), "userId");
  await send(member, userPath, award, { userId: users[1].id, badgeCode: code, operation: "award" });
  check(
    (await p.userEmblem.count({ where: { userId: users[1].id, emblemId } })) === 0,
    "Forged badge award rejected",
  );
  await send(admin, userPath, award, { userId: users[1].id, badgeCode: code, operation: "award" });
  check(
    (await p.userEmblem.count({ where: { userId: users[1].id, emblemId } })) === 1,
    "Admin awards badge using code",
  );
  const importPath = "/admin/emblemas",
    imp = form(await (await admin(importPath)).text(), "code");
  await send(admin, importPath, imp, { code: "../INVALID", image: "" });
  check(
    !(await p.emblem.findUnique({ where: { code: "../INVALID" } })),
    "Invalid remote badge code rejected",
  );
  await send(admin, importPath, imp, { code: "ACH_BasicClub1", image: "" });
  const remote = await p.emblem.findUnique({ where: { code: "ACH_BasicClub1" } });
  remoteId = remote?.id;
  check(
    remote?.image.startsWith("https://images.habbo.com/c_images/album1584/"),
    "Habbo badge imports from official CDN by code",
  );
  const body = new FormData();
  body.set(
    "file",
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    ),
    "badge.png",
  );
  const upload = await admin("/api/admin/upload", {
    method: "POST",
    headers: { origin: base },
    body,
  });
  const uploaded = await upload.json();
  check(upload.ok && uploaded.url, "Administrator uploads custom badge image");
  globalThis.uploadedBadge = uploaded.url;
  await send(admin, importPath, imp, {
    code: code + "CUSTOM",
    name: "Custom badge",
    image: uploaded.url,
  });
  const custom = await p.emblem.findUnique({ where: { code: code + "CUSTOM" } });
  customId = custom?.id;
  check(custom?.image === uploaded.url, "Uploaded image becomes custom badge");
  await send(admin, userPath, award, {
    userId: users[2].id,
    emblemId: customId,
    operation: "award",
    badgeCode: "",
  });
  check(
    (await p.userEmblem.count({ where: { userId: users[2].id, emblemId: customId } })) === 1,
    "Uploaded badge can be awarded to member",
  );
  const cat = await p.forumCategory.findFirst();
  assert.ok(cat);
  const thread = await p.forumThread.create({
    data: {
      title: tag,
      slug: tag,
      content: "Conteudo do topico",
      authorId: users[2].id,
      categoryId: cat.id,
    },
  });
  threadId = thread.id;
  const forum = await (await member(`/forum/${tag}`)).text();
  check(
    forum.includes("forum-member-card") &&
      forum.replace(/<!--.*?-->/g, "").includes("N\u00edvel 1") &&
      forum.includes("XP"),
    "Topic renders member card with level and XP",
  );
  check(forum.includes(`title="${tag} (${code})"`), "Earned badge renders on forum member card");
  check(forum.includes("Citar"), "Logged-in member can quote topic");
  const alias = await member(`/topico/${threadId}/${tag}`);
  check(
    alias.status === 307 && alias.headers.get("location").includes(`/forum/${tag}`),
    "Topic alias reaches new layout",
  );
  console.log("SUCCESS " + count + " gift and forum checks");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  if (threadId) await p.forumThread.deleteMany({ where: { id: threadId } });
  if (eventId) await p.contentEntry.deleteMany({ where: { id: eventId } });
  if (remoteId && !remoteExisted) await p.emblem.deleteMany({ where: { id: remoteId } });
  const ids = users.map((u) => u.id);
  await p.auditLog.deleteMany({ where: { actorId: { in: ids } } });
  await p.user.deleteMany({ where: { id: { in: ids } } });
  await p.emblem.deleteMany({
    where: {
      OR: [{ id: { in: [emblemId, customId].filter(Boolean) } }, { name: tag + " second" }],
    },
  });
  if (globalThis.uploadedBadge) {
    const { unlink } = await import("node:fs/promises");
    await unlink("public" + globalThis.uploadedBadge).catch(() => {});
  }
  await p.$disconnect();
}
