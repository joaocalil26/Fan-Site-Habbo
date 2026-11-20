<div align="center">

<img src="public/idblet.svg" alt="Logo IdBlet" width="120" />

# IdBlet

### Comunidade, conteudo e radio em uma aplicação web completa.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-111111?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

[Apresentação](#sobre-o-projeto) · [Funcionalidades](#funcionalidades) · [Instalação](#instalação) · [Autor](#autor)

</div>

---

## Sobre o projeto

O **IdBlet** é um fã-site com identidade visual própria, inspirado na estética pixel art dos hotéis virtuais. Reúne publicações, interações entre membros e rádio online em uma interface responsiva com tons de dourado e laranja.

Este repositório integra o portfólio, e apresenta a aplicação de conceitos de desenvolvimento web: modelagem relacional, autenticação, autorização, integração com APIs e testes de fluxos completos.

<img src="public/idblet-studio.svg" alt="Ilustração do estúdio da rádio IdBlet" width="100%" />

## Funcionalidades

- **Conteúdo:** notícias, eventos, podcasts, galeria e páginas institucionais.
- **Comunidade:** fórum, respostas, comentários, curtidas, perfis e denúncias.
- **Administração:** gestão de conteúdo, usuários, permissões e histórico de alterações.
- **Rádio:** player conectado a um streaming configurável pelo painel.
- **Catálogo:** emblemas e mobis recentes via HabboAssets, com valores mantidos pela equipe.
- **Personalização:** identidade do site e efeitos de Halloween, Natal, Páscoa e Festa Junina.
- **Acesso:** login por senha e integração opcional com Discord.

## Arquitetura

A aplicação utiliza o **App Router do Next.js**. Páginas e componentes compõem a interface; Server Actions e rotas de API processam as operações do servidor. O Prisma conecta essas operações ao MySQL, enquanto o Auth.js gerencia a autenticação.

```mermaid
flowchart LR
    A[Navegador] --> B[Next.js / React]
    B --> C[Server Actions e APIs]
    C --> D[Prisma]
    D --> E[(MySQL)]
    C --> F[HabboAssets]
    B --> G[Streaming de rádio]
    C --> H[Auth.js]
```

As permissões são verificadas no servidor. A interface administrativa distingue membros, moderadores e administradores, e registra as alterações administrativas para consulta posterior.

## Tecnologias

A linguagem principal é **TypeScript**, utilizada no frontend e no backend.

| Tecnologia         | Uso                                         |
| ------------------ | ------------------------------------------- |
| Next.js 16         | Rotas, renderização e endpoints do servidor |
| React 19 e TSX     | Componentes da interface                    |
| CSS e Tailwind CSS | Estilos e layout responsivo                 |
| MySQL              | Banco de dados                              |
| Prisma             | Modelagem e consultas ao banco              |
| Auth.js            | Autenticação por senha e Discord            |
| bcryptjs           | Hash de senhas                              |

## Requisitos

- Node.js **22.18 ou superior**.
- npm, instalado junto com o Node.js.
- MySQL **8 ou superior**, local ou remoto.

No Windows, o MySQL do Laragon pode ser utilizado. Inicie o serviço antes de configurar o projeto.

## Instalação

### 1. Baixar o projeto

```bash
git clone URL_DO_REPOSITORIO idblet
cd idblet
npm ci
```

Substitua `URL_DO_REPOSITORIO` pelo endereço deste repositório.

### 2. Criar o banco

Execute no seu gerenciador MySQL:

```sql
CREATE DATABASE idblet
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar o ambiente

Copie `.env.example` para `.env`.

**Linux/macOS:**

```bash
cp .env.example .env
```

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

Edite os valores do arquivo:

```dotenv
DATABASE_URL="mysql://USUARIO:SENHA@127.0.0.1:3306/idblet"
AUTH_SECRET="COLOQUE_UMA_CHAVE_ALEATORIA_AQUI"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAIL="admin@idblet.local"
ADMIN_PASSWORD=""
```

Substitua `USUARIO` e `SENHA` pelas credenciais do MySQL. Caracteres especiais na senha devem ser codificados para uso em URL.

Para gerar uma chave de autenticação:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copie o resultado para `AUTH_SECRET`. Mantenha o `.env` fora do repositório; ele já está no `.gitignore`.

### 4. Preparar as tabelas e a conta administrativa

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

O instalador cria as páginas iniciais e a conta definida por `ADMIN_EMAIL`. Se `ADMIN_PASSWORD` estiver vazia, uma senha aleatória será exibida no terminal apenas na primeira criação da conta. Para definir uma senha, use de 10 a 72 caracteres.

Executar o instalador novamente preserva contas, senhas e publicações existentes. Depois do primeiro login, altere sua senha em **Perfil → Editar perfil**.

### 5. Iniciar o site

```bash
npm run dev
```

- **Site:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Painel:** http://localhost:3000/admin

No PowerShell, se os comandos npm forem bloqueados pela política de execução, use `npm.cmd` e `npx.cmd`.

## Painel administrativo

| Área                               | Função                                          |
| ---------------------------------- | ----------------------------------------------- |
| Notícias                           | Criar, editar, agendar e publicar notícias      |
| Eventos                            | Gerenciar agenda, horários e status             |
| Galeria                            | Publicar artes e descrições                     |
| Podcasts                           | Publicar episódios e arquivos de áudio          |
| Equipe, páginas e banners          | Editar o conteúdo institucional                 |
| Mobis e valores                    | Manter os itens e preços do catálogo IdBlet     |
| Emblemas e usuários                | Gerenciar a coleção e os inventários            |
| Comentários, respostas e denúncias | Moderar a comunidade                            |
| Rádio e AutoDJ                     | Conectar o streaming de áudio                   |
| Temas e efeitos                    | Ativar Halloween, Natal, Páscoa ou Festa Junina |
| Configurações                      | Ajustar nome, logo, cores e links               |
| Histórico                          | Consultar as alterações administrativas         |

### Permissões

- **USER:** participa do fórum, comenta, curte e envia denúncias.
- **MODERATOR:** modera tópicos, respostas, comentários e denúncias.
- **ADMIN:** administra todo o site e as permissões dos membros.

### Conteúdo

O editor aceita Markdown simples: títulos com `#`, negrito com `**texto**`, listas com `-`, links e imagens. Marque **Publicado no site** para liberar o conteúdo. Notícias agendadas só ficam públicas na data informada. Os horários do painel usam o fuso de Brasília.

### Rádio

Em **Painel → Rádio e AutoDJ**, informe a URL direta do seu streaming e salve. O provedor da rádio deve estar transmitindo. O player tenta reconectar em caso de interrupção e exige o primeiro clique do visitante para iniciar o áudio.

A playlist e a transmissão ficam no seu provedor de streaming. O contador de ouvintes é configurado manualmente no painel.

### Catálogos

Os emblemas e mobis recentes do Habbo Brasil são consultados na API pública da **HabboAssets**, com cache de cinco minutos. A coleção local permanece separada do inventário externo.

Os **valores dos mobis são cadastrados pela sua equipe** em **Mobis e valores**. Não há consulta de preços a outro fã-site.

## Perfil e assinatura

Os membros podem personalizar a foto, a capa, a biografia e a assinatura em **Perfil → Editar perfil**. O envio de imagens aceita arquivos de até 2 MB. A foto e a assinatura também aparecem nas publicações do fórum.

Veja o [guia do perfil](docs/PERFIL.md). O fluxo pode ser verificado com `npm run test:profile`.

## Emblemas e presentes de eventos

Os tópicos exibem cartões com avatar, nível, XP e emblemas. O administrador pode importar um emblema pelo código Habbo, enviar uma imagem própria e entregar recompensas aos usuários.

Em **Painel → Eventos**, ative o presente e escolha os códigos das recompensas. Durante o evento, cada membro pode abrir o presente uma única vez e receber os emblemas no perfil IdBlet. As recompensas não são transferidas para o Habbo Hotel.

Consulte o [guia de emblemas e presentes](docs/EMBLEMAS-E-PRESENTES.md). Para verificar o fluxo, execute `npm run test:gifts` com o servidor ativo.

## Login com Discord

O login por senha funciona sem serviços adicionais. Para ativar Discord, preencha `AUTH_DISCORD_ID` e `AUTH_DISCORD_SECRET` no `.env` e cadastre a URL de retorno:

```text
http://localhost:3000/api/auth/callback/discord
```

Em produção, use seu domínio HTTPS. Veja [DISCORD-OAUTH.md](docs/DISCORD-OAUTH.md).

## Produção

Pare o servidor de desenvolvimento e execute:

```bash
npm run build
npm run start
```

Configure `AUTH_URL` e `NEXT_PUBLIC_APP_URL` com o endereço HTTPS definitivo. A aplicação precisa de um servidor Node.js, acesso ao MySQL e armazenamento persistente para `public/uploads`.

Faça backup do banco e dos uploads para poder restaurar o site. Em bancos com conteúdo, revise as alterações de schema antes de aplicá-las.

## Comandos

| Comando                    | Descrição                                    |
| -------------------------- | -------------------------------------------- |
| `npm run dev`              | Desenvolvimento com atualização automática   |
| `npm run build`            | Gerar a versão de produção                   |
| `npm run start`            | Executar a versão de produção                |
| `npm run typecheck`        | Verificar os tipos TypeScript                |
| `npm run format`           | Formatar código e documentação               |
| `npm run format:check`     | Conferir a formatação                        |
| `npm run db:seed`          | Preparar o conteúdo inicial                  |
| `npm run db:studio`        | Abrir o gerenciador do Prisma                |
| `npm run test:integration` | Testar autenticação, publicação e comunidade |
| `npm run test:catalog`     | Testar catálogos e fontes externas           |
| `npm run test:seasonal`    | Testar ativação dos temas                    |
| `npm run test:radio`       | Testar as configurações da rádio             |

Os testes de integração exigem o servidor ativo e um banco de desenvolvimento. Eles criam registros temporários e os removem ao terminar. Os testes de catálogos também precisam de acesso à internet.

## Estrutura

```text
src/app/          Páginas, rotas de API e estilos
src/actions/      Ações executadas no servidor
src/components/   Componentes da interface
src/lib/          Consultas, autenticação e integrações
prisma/           Schema e instalador do banco
public/           Imagens, fontes e arquivos públicos
scripts/          Testes de integração
docs/             Documentação complementar
```

## Documentação

- [Banco de dados](README-DB.md)
- [Equipe e cargos](docs/EQUIPE.md)
- [APIs de catálogo](docs/APIS-CATALOGO.md)
- [Rádio e AutoDJ](docs/RADIO-AUTODJ.md)
- [Temas e efeitos](docs/TEMAS-EFEITOS.md)
- [Licenças das fontes](docs/licenses/)

As fontes e os assets externos mantêm suas respectivas licenças e atribuições.

## Autor

**João Calil** — estudante de Engenharia de Software.

[![Portfólio](https://img.shields.io/badge/Conheça_meu_portfólio-E9A23B?style=for-the-badge&logo=vercel&logoColor=111111)](https://joaocalildev.vercel.app/)

## Créditos e uso

Este projeto é um fã-site independente, sem vínculo oficial com o Habbo ou seus titulares. Marcas, fontes e assets de terceiros permanecem sujeitos aos direitos e licenças de seus respectivos autores. Consulte as atribuições em `docs/licenses/`.

A disponibilidade pública deste repositório não substitui uma licença de uso. Para reutilização do código, entre em contato com o autor.
