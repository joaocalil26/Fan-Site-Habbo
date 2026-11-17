"use server";

import { signIn } from "@/auth";

export async function signInWithDiscord(callbackUrl = "/") {
  await signIn("discord", { redirectTo: callbackUrl });
}
