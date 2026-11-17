import { teamRoles } from "@/lib/team";
export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "number" | "datetime-local" | "url" | "select";
  required?: boolean;
  options?: string[];
};
const editorial: Field[] = [
  { name: "title", label: "Título", required: true },
  { name: "slug", label: "Endereço (slug; deixe vazio para gerar)" },
  { name: "excerpt", label: "Resumo", type: "textarea" },
  {
    name: "content",
    label: "Conteúdo (Markdown: # título, **negrito**, listas e imagens)",
    type: "textarea",
    required: true,
  },
  { name: "image", label: "Imagem de capa (URL ou arquivo enviado)", type: "url" },
  { name: "published", label: "Publicado no site", type: "checkbox" },
];
export const resources: Record<
  string,
  {
    label: string;
    model: string;
    kind?: "EVENT" | "ART" | "PODCAST" | "PAGE" | "BANNER" | "TEAM";
    adminOnly?: boolean;
    fields: Field[];
  }
> = {
  noticias: {
    label: "Notícias",
    model: "news",
    fields: [
      ...editorial,
      { name: "category", label: "Categoria", required: true },
      { name: "publishedAt", label: "Data de publicação", type: "datetime-local" },
    ],
  },
  eventos: {
    label: "Eventos",
    model: "contentEntry",
    kind: "EVENT",
    fields: [
      ...editorial,
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Em breve", "Ao vivo", "Finalizado"],
      },
      { name: "startsAt", label: "Início", type: "datetime-local" },
      { name: "endsAt", label: "Término", type: "datetime-local" },
      { name: "giftEnabled", label: "Exibir presente de emblemas", type: "checkbox" },
      {
        name: "rewardCodes",
        label: "Códigos dos emblemas (separados por espaço ou vírgula; até 20)",
        type: "textarea",
      },
    ],
  },
  galeria: { label: "Galeria", model: "contentEntry", kind: "ART", fields: editorial },
  podcasts: {
    label: "Podcasts",
    model: "contentEntry",
    kind: "PODCAST",
    fields: [
      ...editorial,
      { name: "mediaUrl", label: "Áudio (URL ou envio de MP3)", type: "url", required: true },
    ],
  },
  paginas: { label: "Páginas", model: "contentEntry", kind: "PAGE", fields: editorial },
  banners: {
    label: "Banners",
    model: "contentEntry",
    kind: "BANNER",
    fields: [
      ...editorial,
      { name: "mediaUrl", label: "Link de destino", type: "url" },
      { name: "order", label: "Ordem", type: "number" },
    ],
  },
  equipe: {
    label: "Equipe",
    model: "contentEntry",
    kind: "TEAM",
    fields: [
      { name: "title", label: "Nome ou nick do membro", required: true },
      { name: "slug", label: "Identificador (deixe vazio para gerar)" },
      { name: "excerpt", label: "Cargo", type: "select", options: teamRoles },
      {
        name: "image",
        label: "Avatar ou personagem (URL ou caminho do arquivo enviado)",
        type: "url",
      },
      { name: "published", label: "Exibir na equipe", type: "checkbox" },
      { name: "order", label: "Ordem de exibição", type: "number" },
    ],
  },
  emblemas: {
    label: "Emblemas",
    model: "emblem",
    fields: [
      { name: "name", label: "Nome", required: true },
      { name: "code", label: "Código", required: true },
      { name: "description", label: "Descrição", type: "textarea" },
      { name: "image", label: "Imagem", type: "url", required: true },
      {
        name: "rarity",
        label: "Raridade",
        type: "select",
        options: ["COMUM", "RARO", "EPICO", "LENDARIO"],
      },
      { name: "isLimited", label: "Limitado", type: "checkbox" },
    ],
  },
  mobis: {
    label: "Mobis e valores",
    model: "mobi",
    fields: [
      { name: "name", label: "Nome", required: true },
      { name: "image", label: "Imagem", type: "url", required: true },
      { name: "price", label: "Valor em moedas", type: "number", required: true },
      { name: "isLimited", label: "Limitado", type: "checkbox" },
    ],
  },
  categorias: {
    label: "Categorias do fórum",
    model: "forumCategory",
    fields: [
      { name: "name", label: "Nome", required: true },
      { name: "slug", label: "Endereço" },
      { name: "description", label: "Descrição", type: "textarea" },
      { name: "order", label: "Ordem", type: "number" },
    ],
  },
  topicos: {
    label: "Tópicos",
    model: "forumThread",
    fields: [
      { name: "title", label: "Título", required: true },
      { name: "content", label: "Conteúdo", type: "textarea", required: true },
      { name: "pinned", label: "Fixado", type: "checkbox" },
      { name: "locked", label: "Fechado para respostas", type: "checkbox" },
    ],
  },
  comentarios: {
    label: "Comentários",
    model: "comment",
    fields: [
      { name: "content", label: "Comentário", type: "textarea", required: true },
      { name: "hidden", label: "Ocultar do site", type: "checkbox" },
    ],
  },
  respostas: {
    label: "Respostas do fórum",
    model: "forumPost",
    fields: [{ name: "content", label: "Resposta", type: "textarea", required: true }],
  },
  denuncias: {
    label: "Denúncias",
    model: "report",
    fields: [
      { name: "content", label: "Motivo informado", type: "textarea", required: true },
      {
        name: "status",
        label: "Andamento",
        type: "select",
        options: ["Aberta", "Em análise", "Resolvida"],
      },
    ],
  },
  usuarios: {
    label: "Usuários",
    model: "user",
    adminOnly: true,
    fields: [
      { name: "name", label: "Nome" },
      { name: "bio", label: "Biografia", type: "textarea" },
      { name: "role", label: "Permissão", type: "select", options: ["USER", "MODERATOR", "ADMIN"] },
      { name: "isBanned", label: "Conta suspensa", type: "checkbox" },
      { name: "isPremium", label: "Premium", type: "checkbox" },
    ],
  },
};
