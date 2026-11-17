import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { mediaUrl } from "@/lib/site";

export const forumMemberSelect = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  image: true,
  level: true,
  xp: true,
  rank: true,
  role: true,
  isBanned: true,
  signature: true,
  signatureImage: true,
  _count: { select: { posts: true, comments: true } },
  userEmblems: { orderBy: { obtainedAt: "desc" }, take: 12, include: { emblem: true } },
} satisfies Prisma.UserSelect;

export default function ForumMemberCard({
  user,
}: {
  user: Prisma.UserGetPayload<{ select: typeof forumMemberSelect }>;
}) {
  const name = user.isBanned ? "Usuário suspenso" : user.username || user.name || "Membro";
  const avatar = !user.isBanned && (mediaUrl(user.avatar) || mediaUrl(user.image));
  return (
    <aside className="forum-member-card">
      <div className="forum-member-name">
        <Link href={`/perfil?u=${encodeURIComponent(user.username || "")}`}>{name}</Link>
        {!user.isBanned && user.role !== "USER" && (
          <span className="staff-check" title="Equipe IdBlet" aria-label="Equipe IdBlet">
            ✓
          </span>
        )}
      </div>
      <div className="forum-member-portrait">
        {avatar ? (
          <img src={avatar} alt={`Avatar de ${name}`} />
        ) : (
          <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="forum-member-level">
        <strong>Nível {user.level}</strong>
        <span>
          {user.rank} · {user.xp} XP
        </span>
      </div>
      <p className="forum-member-count">{user._count.posts + user._count.comments} comentários</p>
      <div className="forum-member-badges" aria-label={`Emblemas de ${name}`}>
        {!user.isBanned &&
          user.userEmblems.map(({ emblem }) => (
            <img
              key={emblem.id}
              src={emblem.image}
              alt={emblem.name}
              title={`${emblem.name} (${emblem.code})`}
              loading="lazy"
            />
          ))}
        {!user.userEmblems.length && <small>Ainda sem emblemas</small>}
      </div>
    </aside>
  );
}
