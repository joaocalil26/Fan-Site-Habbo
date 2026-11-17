import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentMember } from "@/lib/access";
import ArticleShell from "@/components/ArticleShell";
import { ProfileForm, PasswordForm } from "@/components/CommunityForms";
import { mediaUrl } from "@/lib/site";
export default async function Page() {
  const user = await currentMember();
  if (!user) redirect("/login");
  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      name: true,
      bio: true,
      avatar: true,
      image: true,
      coverImage: true,
      signature: true,
      signatureImage: true,
    },
  });
  return (
    <ArticleShell section="Editar perfil">
      <div className="paper">
        <h1>Seu perfil, do seu jeito</h1>
        <ProfileForm
          name={profile.name || ""}
          bio={profile.bio || ""}
          avatar={mediaUrl(profile.avatar) || mediaUrl(profile.image)}
          coverImage={profile.coverImage || ""}
          signature={profile.signature || ""}
          signatureImage={profile.signatureImage || ""}
        />
      </div>
      <div className="paper">
        <h2>Alterar senha</h2>
        <PasswordForm />
      </div>
    </ArticleShell>
  );
}
