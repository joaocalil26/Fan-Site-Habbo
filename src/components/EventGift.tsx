"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { claimGift } from "@/actions/gifts";

type Gift = { id: string; title: string; count: number };
export default function EventGift({ gifts }: { gifts: Gift[] }) {
  const path = usePathname();
  const [queue, setQueue] = useState(gifts);
  useEffect(() => {
    setQueue((previous) => [
      ...previous,
      ...gifts.filter((g) => !previous.some((p) => p.id === g.id)),
    ]);
  }, [gifts]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const gift = queue.find((g) => !dismissed.includes(g.id));
  if (path.startsWith("/admin") || !gift) return null;
  return <GiftBox key={gift.id} gift={gift} onClose={() => setDismissed((v) => [...v, gift.id])} />;
}
function GiftBox({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const [state, action, pending] = useActionState(claimGift, {});
  return (
    <section className="event-gift" aria-label="Presente do evento">
      <button className="gift-dismiss" onClick={onClose} aria-label="Fechar presente">
        ×
      </button>
      {state.success ? (
        <div role="status">
          <strong>{state.success}</strong>
          <div className="gift-badges">
            {state.badges?.map((b, i) => (
              <img key={i} src={b.image} alt={b.name} title={b.name} />
            ))}
          </div>
          <a href="/perfil">Ver meus emblemas →</a>
        </div>
      ) : (
        <form action={action}>
          <input type="hidden" name="eventId" value={gift.id} />
          <button
            className="gift-open"
            disabled={pending}
            aria-label={`Abrir presente: ${gift.title}`}
          >
            <span aria-hidden="true" className="pixel-gift">
              🎁
            </span>
            <span>
              <strong>{gift.title}</strong>
              <small>
                {pending
                  ? "Abrindo…"
                  : `Clique e receba ${gift.count} emblema${gift.count > 1 ? "s" : ""}`}
              </small>
            </span>
          </button>
          <p>Recompensas para seu perfil IdBlet.</p>
        </form>
      )}
      {state.error && <p role="alert">{state.error}</p>}
    </section>
  );
}
