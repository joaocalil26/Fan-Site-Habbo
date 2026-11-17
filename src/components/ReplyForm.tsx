"use client";

import { useActionState, useEffect, useRef } from "react";
import { createReplyAction, type ForumActionState } from "@/actions/forum";
import Link from "next/link";

const initial: ForumActionState = {};

type Props = {
  threadId: string;
  threadSlug: string;
  locked?: boolean;
  isLoggedIn: boolean;
};

export default function ReplyForm({ threadId, threadSlug, locked, isLoggedIn }: Props) {
  const [state, formAction, pending] = useActionState(createReplyAction, initial);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const quote = (event: Event) => {
      const detail = (event as CustomEvent<{ author: string; content: string }>).detail;
      if (!textarea.current || !detail) return;
      const text = `> ${detail.author} escreveu:\n${detail.content
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")}\n\n`;
      textarea.current.value = (text + textarea.current.value).slice(0, 10000);
      textarea.current.focus({ preventScroll: true });
    };
    window.addEventListener("forum-quote", quote);
    return () => window.removeEventListener("forum-quote", quote);
  }, []);

  if (locked) {
    return <p className="mt-8 text-center text-sm text-slate-500">Este tópico está fechado.</p>;
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-slate-600 p-6 text-center">
        <p className="text-slate-400 text-sm mb-3">Faça login para responder</p>
        <Link
          href={`/login?callbackUrl=/forum/${threadSlug}`}
          className="inline-block rounded-full bg-slate-800 border border-slate-600 px-5 py-2 text-sm text-slate-200 hover:bg-slate-700"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <form
      id="forum-reply"
      action={formAction}
      className="mt-8 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
    >
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="threadSlug" value={threadSlug} />
      <label className="block text-sm text-slate-300">Sua resposta</label>
      <textarea
        ref={textarea}
        maxLength={10000}
        name="content"
        required
        minLength={2}
        rows={4}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-cyan-500 resize-y"
        placeholder="Escreva sua resposta..."
      />
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Responder"}
      </button>
    </form>
  );
}
