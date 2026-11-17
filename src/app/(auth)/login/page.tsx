import AuthForm from "@/components/AuthForm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const url =
    sp.callbackUrl && sp.callbackUrl.startsWith("/") && !sp.callbackUrl.startsWith("//")
      ? sp.callbackUrl
      : "/";
  return (
    <AuthForm
      callbackUrl={url}
      discord={!!(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET)}
    />
  );
}
