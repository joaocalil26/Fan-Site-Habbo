import { profileImage } from "@/lib/profile";
export default function MemberSignature({
  text,
  image,
}: {
  text: string | null;
  image: string | null;
}) {
  const src = profileImage(image);
  if (!text && !src) return null;
  return (
    <div className="member-signature" aria-label="Assinatura do membro">
      {text && <p>{text}</p>}
      {src && <img src={src} alt="Assinatura do membro" loading="lazy" />}
    </div>
  );
}
