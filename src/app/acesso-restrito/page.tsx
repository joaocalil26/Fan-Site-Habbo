import Link from "next/link";
export default function Page() {
  return (
    <div className="public-shell">
      <div className="paper">
        <h1>Acesso restrito</h1>
        <p>Esta área está disponível apenas para membros autorizados da equipe.</p>
        <Link className="primary-button" href="/">
          Voltar ao IdBlet
        </Link>
      </div>
    </div>
  );
}
