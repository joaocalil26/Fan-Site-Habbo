# Perfil, foto e assinatura

## Editar o perfil

Entre na sua conta e acesse **Perfil → Editar perfil**, ou abra `/perfil/editar`.

- **Foto de perfil:** imagem circular no perfil e foto lateral nas publicações do fórum.
- **Capa do perfil:** banner horizontal acima do nome. Imagens largas funcionam melhor; o banner usa recorte central para se adaptar à tela.
- **Nome e biografia:** apresentação pessoal. O nome de usuário da conta permanece o mesmo.
- **Assinatura:** texto de até 1.000 caracteres exibido no perfil e abaixo dos tópicos e respostas do membro.
- **Imagem da assinatura:** imagem opcional junto ao texto, com altura limitada na exibição para preservar a leitura das publicações.

Para cada imagem, envie um arquivo do computador ou informe uma URL HTTPS que termine em `.png`, `.jpg`, `.jpeg`, `.gif` ou `.webp`. URLs podem incluir parâmetros, mas não credenciais. O envio aceita PNG, JPEG, GIF e WebP de até **2 MB por arquivo**. SVG e áudio não são aceitos no perfil.

Depois dos envios, clique em **Salvar perfil**. O formulário aguarda o término dos uploads antes de liberar o salvamento. Para retirar uma imagem, use **Remover imagem** e salve novamente. Uma conta conectada por Discord pode usar a foto fornecida pelo provedor quando não houver foto local definida.

## Exibição pública

O perfil mostra capa, foto circular, nome de usuário, tópicos, artes publicadas, comentários, emblemas, biografia, nível, XP e assinatura. Os comentários incluem respostas no fórum e comentários públicos em publicações; comentários ocultos não entram no total do perfil. A identificação de equipe aparece apenas para moderadores e administradores.

A coleção de emblemas usa páginas de 30 itens, ordenados pela data de obtenção. A seção de tópicos mostra as cinco publicações mais recentes do membro; a seção de artes exibe até quatro artes publicadas.

O botão de editar aparece apenas para o dono do perfil. O servidor identifica a conta pela sessão autenticada, sem aceitar um ID de usuário enviado pelo formulário como autorização. Contas suspensas não podem editar nem enviar imagens.

## Armazenamento e instalação existente

Os arquivos são armazenados em `public/uploads` e precisam de armazenamento persistente em produção. Não publique uploads pessoais no repositório. O `.gitignore` e a cópia de distribuição já excluem essa pasta.

Os novos campos do modelo `User` são `coverImage`, `signature` e `signatureImage`; a foto utiliza o campo `avatar` existente. Com o servidor parado, atualize o banco de desenvolvimento:

```bash
npx prisma db push
npm run build
npm run start
```

Em produção, revise a alteração de schema e faça backup antes de aplicá-la ao banco.

## Testes

Com o servidor ativo e um banco de desenvolvimento:

```bash
npm run test:profile
```

O teste verifica permissões, formatos, tamanho de arquivo, persistência, contadores, exibição no fórum, escape de texto e remoção das imagens. As contas, registros e arquivos criados pelo teste são removidos ao final.
