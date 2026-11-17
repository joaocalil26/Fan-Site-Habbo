import AuthForm from "@/components/AuthForm";
export default function Page() {
  return (
    <AuthForm
      register
      discord={!!(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET)}
    />
  );
}
