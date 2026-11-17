"use client";

import { useActionState } from "react";
import { createThreadAction, type ForumActionState } from "@/actions/forum";

const initial: ForumActionState = {};

type Cat = { id: string; name: string };

export default function NewThreadForm({ categories }: { categories: Cat[] }) {
  const [state, formAction, pending] = useActionState(createThreadAction, initial);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
    >
      <div>
        <label className="mb-1.5 block text-sm text-slate-300">Categoria</label>
        <select
          name="categoryId"
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
          defaultValue=""
        >
          <option value="" disabled>
            Selecione...
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-slate-300">Título</label>
        <input
          name="title"
          required
          minLength={5}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-cyan-500"
          placeholder="Sobre o que você quer falar?"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-slate-300">Conteúdo</label>
        <textarea
          name="content"
          required
          minLength={10}
          rows={8}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-cyan-500 resize-y"
          placeholder="Escreva sua mensagem..."
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Publicando..." : "Publicar tópico"}
      </button>
    </form>
  );
}
