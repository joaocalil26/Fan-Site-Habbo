# Banco de dados

O IdBlet utiliza MySQL e Prisma. O modelo está em `prisma/schema.prisma`.

```sql
CREATE DATABASE idblet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Configure a conexão no `.env`:

```dotenv
DATABASE_URL="mysql://USUARIO:SENHA@127.0.0.1:3306/idblet"
```

Prepare o banco:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

O instalador cria o administrador e as páginas iniciais. As publicações e senhas de uma instalação existente são preservadas.

As tabelas abrangem contas, autenticação, notícias, fórum, emblemas, inventários, mobis, conteúdo editorial, comentários, reações, denúncias, configurações e auditoria. Eventos, artes, podcasts, páginas, banners e equipe utilizam `ContentEntry`.

Antes de alterar o schema de um banco com conteúdo, faça backup e revise as mudanças. Mantenha também uma cópia de `public/uploads` e armazene o `.env` separadamente do código público.

No Windows, pare o Next.js antes de regenerar o cliente Prisma para evitar que a DLL esteja em uso.
