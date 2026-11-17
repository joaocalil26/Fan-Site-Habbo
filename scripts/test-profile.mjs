import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient(),
  base = process.env.TEST_BASE_URL || "http://localhost:3000",
  tag = "profile-" + randomUUID().slice(0, 8),
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
const images = [];
let threadId, emblemId, artId;
try {
  for (const index of [1, 2])
    users.push(
      await p.user.create({
        data: {
          email: `${tag}-${index}@idblet.test`,
          username: `${tag}_${index}`,
          passwordHash: await bcrypt.hash(password, 10),
        },
      }),
    );
  const [member, other] = await Promise.all(users.map(login)),
    guest = client(),
    path = "/perfil/editar";
  check((await guest(path)).status === 307, "Anonymous editor requires login");
  const html = await (await member(path)).text(),
    edit = form(html, "name");
  check(
    html.includes('name="avatar"') &&
      html.includes('name="coverImage"') &&
      html.includes('name="signature"') &&
      html.includes('name="signatureImage"'),
    "Editor exposes photo, cover and signature fields",
  );
  async function upload(r, blob, origin = base) {
    const body = new FormData();
    body.set("file", blob, "photo.png");
    return r("/api/perfil/upload", { method: "POST", headers: { origin }, body });
  }
  const png = () =>
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    );
  check((await upload(guest, png())).status === 401, "Anonymous photo upload rejected");
  check(
    (await upload(member, png(), "https://example.invalid")).status === 403,
    "Cross-origin upload rejected",
  );
  check(
    (
      await upload(
        member,
        new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], {
          type: "image/png",
        }),
      )
    ).status === 400,
    "Disguised SVG photo rejected",
  );
  check(
    (await upload(member, new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: "image/png" })))
      .status >= 400,
    "Oversized photo rejected",
  );
  for (let i = 0; i < 3; i++) {
    const r = await upload(member, png()),
      j = await r.json();
    assert.ok(r.ok);
    images.push(j.url);
  }
  check(images.length === 3, "Member uploads photo, cover and signature image");
  const signature = '<script>alert("signature")</script> Minha assinatura';
  const fields = {
    name: "Nome atualizado",
    bio: "Minha biografia",
    avatar: images[0],
    coverImage: images[1],
    signature,
    signatureImage: images[2],
  };
  await send(guest, path, edit, fields);
  check(
    !(await p.user.findUnique({ where: { id: users[0].id } })).signature,
    "Anonymous profile update rejected",
  );
  await send(member, path, edit, {
    ...fields,
    userId: users[1].id,
    id: users[1].id,
    role: "ADMIN",
  });
  const saved = await p.user.findUnique({ where: { id: users[0].id } });
  check(
    saved.avatar === images[0] &&
      saved.coverImage === images[1] &&
      saved.signature === signature &&
      saved.signatureImage === images[2],
    "Photo, cover and signature persist",
  );
  check(
    saved.role === "USER" && !(await p.user.findUnique({ where: { id: users[1].id } })).signature,
    "Forged account and role fields cannot change another user",
  );
  const cat = await p.forumCategory.findFirst();
  assert.ok(cat);
  const thread = await p.forumThread.create({
    data: {
      title: tag,
      slug: tag,
      content: "Publicacao para verificar perfil",
      authorId: users[0].id,
      categoryId: cat.id,
    },
  });
  threadId = thread.id;
  const badge = await p.emblem.create({
    data: { code: tag.replaceAll("-", "").toUpperCase(), name: tag, image: images[0] },
  });
  emblemId = badge.id;
  await p.userEmblem.create({ data: { userId: users[0].id, emblemId } });
  const art = await p.contentEntry.create({
    data: {
      title: tag,
      slug: tag,
      kind: "ART",
      content: "Arte do membro",
      published: true,
      authorId: users[0].id,
      image: images[1],
    },
  });
  artId = art.id;
  await p.comment.create({
    data: { authorId: users[0].id, entryId: artId, content: "Comentario publico" },
  });
  await p.comment.create({
    data: { authorId: users[0].id, entryId: artId, content: "Comentario oculto", hidden: true },
  });
  const publicProfile = await (await guest(`/perfil?u=${users[0].username}`)).text(),
    plain = publicProfile.replace(/<!--.*?-->/g, "");
  check(
    publicProfile.includes("member-profile-hero") &&
      publicProfile.includes(images[0]) &&
      publicProfile.includes(images[1]),
    "Public profile renders cover and circular photo",
  );
  check(
    plain.includes("<b>1</b> tópicos") &&
      plain.includes("<b>1</b> artes") &&
      plain.includes("<b>1</b> comentários"),
    "Profile counters reflect published data and exclude hidden comments",
  );
  check(
    publicProfile.includes("member-badge-tile") && publicProfile.includes(`alt="${tag}"`),
    "Profile renders member badges",
  );
  check(!publicProfile.includes("profile-edit-link"), "Visitor does not see owner edit link");
  check(
    (await (await member("/perfil")).text()).includes("profile-edit-link"),
    "Owner sees edit profile link",
  );
  const forum = await (await guest(`/forum/${tag}`)).text();
  check(
    forum.includes("member-signature") && forum.includes(images[2]) && forum.includes(images[0]),
    "Forum renders updated photo and signature",
  );
  check(
    forum.includes("&lt;script&gt;") && !forum.includes('<script>alert("signature")'),
    "Signature text is escaped",
  );
  await send(member, path, edit, { ...fields, avatar: "javascript:alert(1)" });
  check(
    (await p.user.findUnique({ where: { id: users[0].id } })).avatar === images[0],
    "Unsafe avatar URL rejected",
  );
  await send(member, path, edit, {
    ...fields,
    coverImage: "https://user:secret@example.invalid/a.png",
  });
  check(
    (await p.user.findUnique({ where: { id: users[0].id } })).coverImage === images[1],
    "Image URL with embedded credentials rejected",
  );
  await send(member, path, edit, { ...fields, signature: "x".repeat(1001) });
  check(
    (await p.user.findUnique({ where: { id: users[0].id } })).signature === signature,
    "Signature length limit enforced",
  );
  await p.user.update({ where: { id: users[0].id }, data: { isBanned: true } });
  check((await upload(member, png())).status === 401, "Suspended member cannot upload");
  await send(member, path, edit, { ...fields, signature: "Banned mutation" });
  check(
    (await p.user.findUnique({ where: { id: users[0].id } })).signature === signature,
    "Suspended member cannot update profile",
  );
  await p.user.update({ where: { id: users[0].id }, data: { isBanned: false } });
  await send(member, path, edit, {
    name: "",
    bio: "",
    signature: "",
    signatureImage: "",
    avatar: "",
    coverImage: "",
  });
  const cleared = await p.user.findUnique({ where: { id: users[0].id } });
  check(
    !cleared.avatar && !cleared.coverImage && !cleared.signature && !cleared.signatureImage,
    "Member can remove photo, cover and signature",
  );
  console.log("SUCCESS " + count + " profile checks");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  if (artId) await p.contentEntry.deleteMany({ where: { id: artId } });
  if (threadId) await p.forumThread.deleteMany({ where: { id: threadId } });
  const ids = users.map((u) => u.id);
  await p.user.deleteMany({ where: { id: { in: ids } } });
  if (emblemId) await p.emblem.deleteMany({ where: { id: emblemId } });
  await p.authThrottle.deleteMany({
    where: { key: { in: ids.map((id) => `profile-upload:${id}`) } },
  });
  const { unlink } = await import("node:fs/promises");
  for (const url of images) await unlink("public" + url).catch(() => {});
  await p.$disconnect();
}
