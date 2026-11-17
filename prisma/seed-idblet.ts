import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@idblet.local";
  let owner = await prisma.user.findUnique({ where: { email } });
  if (!owner) {
    const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString("base64url");
    if (password.length < 10 || password.length > 72)
      throw new Error("ADMIN_PASSWORD deve ter entre 10 e 72 caracteres.");
    owner = await prisma.user.create({
      data: {
        email,
        username: "IdBletAdmin",
        name: "Administração IdBlet",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log("INITIAL_ADMIN_EMAIL=" + email);
    console.log("INITIAL_ADMIN_PASSWORD=" + password);
  } else console.log("Administrador já existe; senha preservada.");

  await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: {
      id: "site",
      data: {
        name: "IdBlet",
        tagline: "Seu lugar na comunidade.",
        logo: "/idblet.svg",
        primaryColor: "#e9ad4b",
        darkColor: "#292f27",
      },
    },
    update: {},
  });
  const category = await prisma.forumCategory.upsert({
    where: { slug: "comunidade" },
    create: {
      name: "Comunidade",
      slug: "comunidade",
      description: "Conversas, ideias e novidades do IdBlet",
      order: 0,
    },
    update: {},
  });
  const news = [
    {
      id: "news-team",
      title: "Vagas na Equipe",
      slug: "vagas-na-equipe",
      excerpt:
        "Ajude a construir o IdBlet. Conheça as áreas da equipe e participe da nossa comunidade.",
      image: "/images/community.svg",
      category: "IdBlet",
      content:
        "# Venha fazer parte do IdBlet\n\nEstamos preparando uma comunidade com espaço para quem gosta de criar, comunicar e compartilhar experiências.\n\n## Escolha sua área\n\n- Rádio: apresente programas e converse com os ouvintes.\n- Conteúdo: escreva notícias, guias e entrevistas.\n- Eventos: planeje atividades e desafios para a comunidade.\n- Design: produza artes, capas e materiais para o site.\n- Moderação: ajude a manter as conversas respeitosas.\n\n## Como participar\n\nApresente suas ideias no fórum ou no canal oficial da comunidade, quando divulgado. Conte qual área desperta seu interesse e o que você gostaria de criar.\n\n**Vamos construir o IdBlet juntos.**",
    },
    {
      id: "news-labyrinth",
      title: "Desafio do labirinto",
      slug: "desafio-do-labirinto",
      excerpt: "Prepare sua estratégia e participe dos desafios da comunidade.",
      image: "/images/events.svg",
      category: "Eventos",
      content:
        "# Um desafio para a comunidade\n\nPrepare sua estratégia e explore os caminhos do labirinto. Acompanhe as regras e a agenda para participar com a comunidade.\n\n## Como funciona\n\n- Leia as regras divulgadas pela organização.\n- Aguarde a confirmação do horário e do local.\n- Respeite os participantes e a equipe.\n\n## Programação\n\nA data, o quarto de entrada e as premiações serão definidos pela administração.\n\nAcompanhe também a [agenda de eventos](/eventos).",
    },
  ];
  for (const n of news)
    await prisma.news.upsert({
      where: { slug: n.slug },
      create: { ...n, authorId: owner.id, published: true },
      update: {},
    });
  await prisma.forumThread.upsert({
    where: { slug: "historias-da-comunidade" },
    create: {
      id: "thread-stories",
      slug: "historias-da-comunidade",
      title: "Histórias da comunidade",
      content:
        "# Qual história você está acompanhando?\n\nAs pequenas histórias criadas pela comunidade podem transformar assuntos simples em grandes conversas.\n\nCompartilhe suas impressões, recomende algo que você gostou e converse com os outros membros.\n\n**Lembre-se:** respeite opiniões diferentes e evite divulgar informações pessoais.\n\nQual personagem ou história você criaria?",
      authorId: owner.id,
      categoryId: category.id,
    },
    update: {},
  });
  const entries = [
    {
      id: "art-welcome",
      kind: "ART" as const,
      title: "Boas-vindas ao IdBlet",
      slug: "boas-vindas-idblet",
      excerpt: "A primeira arte da nossa comunidade.",
      image: "/welcome-idblet.svg",
      content:
        "# Um espaço para suas criações\n\nA galeria reúne as criações e as ideias dos membros do IdBlet.\n\nCurta e deixe seu comentário!",
      status: "Publicado",
    },
    {
      id: "idblet-labyrinth",
      kind: "EVENT" as const,
      title: "Desafio do labirinto",
      slug: "desafio-do-labirinto",
      excerpt: "Um desafio para reunir a comunidade.",
      image: "/images/events.svg",
      content:
        "## Evento em preparação\n\nConsulte a agenda para acompanhar o horário, o local, as regras e as premiações do evento.\n\nConfira as novidades no fórum do IdBlet.",
      status: "Em breve",
    },
    {
      id: "idblet-sobre",
      kind: "PAGE" as const,
      title: "Sobre o IdBlet",
      slug: "sobre",
      excerpt: "Seu lugar na comunidade.",
      image: null,
      content:
        "# Uma comunidade feita por pessoas\n\nO IdBlet reúne notícias, eventos, arte e conversas em um fã-site independente.\n\nAqui você pode acompanhar novidades, publicar tópicos, comentar nas publicações e conhecer outras pessoas da comunidade.\n\nEste site é administrado pela sua própria equipe e não representa outros fã-sites ou o hotel.",
      status: "Publicado",
    },
    {
      id: "idblet-regras",
      kind: "PAGE" as const,
      title: "Regras da comunidade",
      slug: "regras",
      excerpt: "Converse, compartilhe e respeite.",
      image: null,
      content:
        "# Convivência no IdBlet\n\n- Trate todas as pessoas com respeito.\n- Não publique dados pessoais seus ou de terceiros.\n- Não compartilhe golpes, spam ou conteúdo que viole direitos de outras pessoas.\n- Use as categorias corretas para seus tópicos.\n- Respeite a orientação da moderação.\n\nA equipe pode ocultar comentários, fechar tópicos e suspender contas que descumpram estas regras.\n\nEstas regras iniciais podem ser ajustadas pela administração no painel.",
      status: "Publicado",
    },
    {
      id: "idblet-privacidade",
      kind: "PAGE" as const,
      title: "Privacidade no IdBlet",
      slug: "privacidade",
      excerpt: "Informações sobre sua conta e suas publicações.",
      image: null,
      content:
        "# Dados da sua conta\n\nO IdBlet armazena o e-mail de cadastro, o nick, a senha em formato de hash e as informações que você adiciona ao perfil. Cookies de sessão mantêm sua conta conectada.\n\n## Participação pública\n\nTópicos, respostas, comentários, curtidas e os dados públicos do perfil são vinculados à sua conta. Evite inserir informações pessoais em publicações.\n\n## Administração\n\nMembros autorizados da equipe gerenciam conteúdo e contas. As alterações administrativas são registradas para acompanhamento.\n\n## Serviços externos\n\nCaso a administração configure Discord ou streaming, esses serviços recebem os dados necessários ao seu funcionamento.\n\nEntre em contato com a administração pelos canais divulgados no site para tratar de sua conta. ",
      status: "Publicado",
    },
    {
      id: "idblet-equipe",
      kind: "TEAM" as const,
      title: "Administração IdBlet",
      slug: "administracao-idblet",
      excerpt: "Gestão e comunidade",
      image: "/idblet.svg",
      content:
        "A equipe responsável por cuidar do site, publicar novidades e acompanhar a comunidade.",
      status: "Publicado",
    },
    {
      id: "idblet-banner",
      kind: "BANNER" as const,
      title: "Bem-vindo ao IdBlet",
      slug: "bem-vindo-idblet",
      excerpt: "Notícias, rádio, eventos e muita criatividade. Sua comunidade começa aqui.",
      image: "/welcome-idblet.svg",
      content: "Conheça o IdBlet e participe do fórum.",
      status: "Publicado",
    },
  ];
  for (const e of entries)
    await prisma.contentEntry.upsert({
      where: { slug: e.slug },
      create: { ...e, authorId: owner.id, published: true },
      update: {},
    });
  console.log("Conteúdo inicial IdBlet instalado sem substituir publicações existentes.");
}
main()
  .catch((error) => {
    console.error(
      "Falha na instalação. Verifique o banco e as variáveis ADMIN_EMAIL/ADMIN_PASSWORD.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
