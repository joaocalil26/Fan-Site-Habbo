import { Fragment } from "react";
import { mediaUrl } from "@/lib/site";
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link && mediaUrl(link[2]))
          return (
            <a key={i} href={mediaUrl(link[2])} rel="nofollow noopener noreferrer">
              {link[1]}
            </a>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
export default function RichContent({ content }: { content: string }) {
  return (
    <div className="rich-content">
      {content.split(/\r?\n/).map((line, i) => {
        const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (image && mediaUrl(image[2]))
          return (
            <figure key={i}>
              <img src={mediaUrl(image[2])} alt={image[1]} loading="lazy" />
              {image[1] && <figcaption>{image[1]}</figcaption>}
            </figure>
          );
        if (line.startsWith("### "))
          return (
            <h3 key={i}>
              <Inline text={line.slice(4)} />
            </h3>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={i}>
              <Inline text={line.slice(3)} />
            </h2>
          );
        if (line.startsWith("# "))
          return (
            <h2 key={i}>
              <Inline text={line.slice(2)} />
            </h2>
          );
        if (/^[-*] /.test(line))
          return (
            <p className="rich-bullet" key={i}>
              • <Inline text={line.slice(2)} />
            </p>
          );
        if (line.startsWith("> "))
          return (
            <blockquote key={i}>
              <Inline text={line.slice(2)} />
            </blockquote>
          );
        if (line.trim() === "---") return <hr key={i} />;
        return line.trim() ? (
          <p key={i}>
            <Inline text={line} />
          </p>
        ) : (
          <div key={i} className="paragraph-gap" />
        );
      })}
    </div>
  );
}
