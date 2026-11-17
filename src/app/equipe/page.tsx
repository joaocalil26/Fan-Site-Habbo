import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/site";
import { teamHierarchy, teamRoles } from "@/lib/team";
export const dynamic = "force-dynamic";
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="8" cy="7" r="3" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M2 20v-2a6 6 0 0 1 12 0v2H2Zm12-7a5 5 0 0 1 8 4v3h-5" />
    </svg>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cargo?: string }>;
}) {
  const { cargo } = await searchParams;
  const selected = cargo && teamRoles.includes(cargo) ? cargo : null;
  const members = selected
    ? await prisma.contentEntry.findMany({
        where: { kind: "TEAM", published: true, excerpt: selected },
        select: { id: true, title: true, image: true, excerpt: true },
        orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
      })
    : [];
  return (
    <div className="public-shell team-page">
      <nav className="breadcrumbs" aria-label="Navegação">
        <Link href="/">Início</Link>
        <span>›</span>
        <span>Equipe</span>
      </nav>
      <h1 className="team-page-title">
        <span>
          <PeopleIcon />
        </span>{" "}
        Equipe
      </h1>
      <section className="paper team-hierarchy" aria-label="Hierarquia da equipe">
        {teamHierarchy.map((group) => (
          <section className="team-tier" key={group.name}>
            <h2>
              <span className="team-tier-icon">
                <PeopleIcon />
              </span>
              <span className="team-tier-label">{group.name}</span>
            </h2>
            <ul>
              {group.roles.map((role) => (
                <li key={role}>
                  <Link
                    href={`/equipe?cargo=${encodeURIComponent(role)}`}
                    scroll={false}
                    aria-current={selected === role ? "true" : undefined}
                  >
                    {role}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
      {selected && (
        <section className="paper team-members" aria-label={`Membros: ${selected}`}>
          <h2 className="team-selected-title">{selected}</h2>
          {members.length ? (
            <div className="team-member-grid">
              {members.map((member) => (
                <article className="team-member-tile" key={member.id}>
                  <div className="team-member-avatar">
                    {mediaUrl(member.image) ? (
                      <img
                        src={mediaUrl(member.image)}
                        alt={`Avatar de ${member.title}`}
                        loading="lazy"
                      />
                    ) : (
                      <span aria-hidden="true">{member.title.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <h2>{member.title}</h2>
                  <p>{member.excerpt || "Equipe IdBlet"}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Nenhum membro cadastrado neste cargo.</p>
          )}
        </section>
      )}
    </div>
  );
}
