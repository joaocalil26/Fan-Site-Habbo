"use client";
export default function QuoteReply({ author, content }: { author: string; content: string }) {
  return (
    <button
      className="quote-reply"
      type="button"
      aria-label={`Citar ${author}`}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("forum-quote", { detail: { author, content: content.slice(0, 3000) } }),
        );
        document
          .getElementById("forum-reply")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      <span aria-hidden="true">❞</span> Citar
    </button>
  );
}
