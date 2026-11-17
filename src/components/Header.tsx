import { auth } from "@/auth";
import HeaderClient from "./HeaderClient";
import { getSiteConfig } from "@/lib/site";
export default async function Header() {
  const [session, site] = await Promise.all([auth(), getSiteConfig()]);
  return (
    <HeaderClient
      site={site}
      user={
        session?.user
          ? {
              id: session.user.id,
              name: session.user.name,
              username: session.user.username,
              role: session.user.role,
            }
          : null
      }
    />
  );
}
