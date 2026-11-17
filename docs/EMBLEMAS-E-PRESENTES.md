# Emblemas, níveis e presentes

## Cartões no fórum

Os tópicos e respostas exibem avatar, nome, nível, XP, quantidade de comentários e até 12 emblemas recentes do membro. O avatar é configurado em **Perfil → Editar perfil**. Na ausência de imagem, o cartão mostra a inicial do nome. A identificação de equipe aparece apenas para moderadores e administradores.

Os níveis acompanham o XP do usuário: criar um tópico concede 25 XP e responder concede 10 XP. O botão **Citar** preenche o formulário de resposta com uma citação do texto escolhido. Tópicos fechados não aceitam respostas nem citações.

## Adicionar um emblema

Em **Painel → Emblemas**, use **Adicionar emblema por código ou arquivo**:

- **Código Habbo:** informe o código exato, como `ACH_BasicClub1`, e clique em **Importar do Habbo**. O servidor consulta as imagens GIF e PNG do CDN oficial `images.habbo.com`. Preserve as letras maiúsculas e minúsculas do código original. Não é necessário token.
- **Arquivo próprio:** envie PNG, JPEG, GIF ou WebP, escolha um código exclusivo e informe um nome. A imagem enviada será usada no lugar da consulta ao Habbo.

O emblema fica disponível no catálogo local. A importação não entrega automaticamente o item aos membros. Se o código já existir, a importação por código reutiliza o cadastro; um upload com código repetido é recusado para evitar substituir emblemas já entregues.

## Entregar ao usuário

1. Abra **Painel → Usuários** e edite o membro.
2. Em **Inventário de emblemas**, digite o código Habbo ou selecione um item cadastrado.
3. Escolha **Entregar ao membro** e confirme em **Atualizar inventário**.

O código digitado tem prioridade na entrega. Para revogar, escolha o emblema na lista e use **Remover do perfil**. As operações exigem acesso de administrador e são registradas no histórico.

## Evento com presente

1. Acesse **Painel → Eventos → Novo registro**.
2. Preencha título, conteúdo e, se desejar, imagem e datas.
3. Marque **Publicado no site** e **Exibir presente de emblemas**.
4. Informe os códigos dos emblemas separados por espaço, vírgula ou ponto e vírgula. São permitidos até 20 códigos distintos. Códigos locais, inclusive de imagens próprias, também são aceitos.
5. Defina o status **Em breve** ou **Ao vivo** e salve.

Durante o período configurado, um presente aparece para membros autenticados que ainda não resgataram aquele evento. O presente fica nas páginas públicas, acima do player, e pode ser fechado. Havendo vários eventos, o próximo presente aparece ao fechar o atual. O fechamento vale para a navegação atual; um novo acesso pode voltar a exibir presentes não resgatados.

O início é inclusivo e o término é exclusivo, no fuso de Brasília. Sem início, o presente pode ser resgatado imediatamente; sem término, permanece disponível até ser desativado ou finalizado. Rascunhos, eventos com status **Finalizado**, eventos futuros e eventos encerrados não permitem resgate.

Cada conta pode resgatar cada evento uma única vez. O resgate e a entrega ocorrem na mesma transação, com uma restrição única no banco para impedir duplicidade em cliques simultâneos. Emblemas já existentes no inventário são preservados sem criar cópias. Contas suspensas e sessões inválidas não podem resgatar.

Depois do primeiro resgate, a lista de recompensas não pode ser alterada. Crie outro evento para uma nova distribuição. Você ainda pode editar o conteúdo ou desativar o presente. Excluir um evento remove seu histórico de resgates, mas preserva os emblemas já entregues aos usuários.

**Os emblemas são recompensas do perfil IdBlet. O sistema não concede itens dentro da conta do Habbo Hotel.**

## Atualizar uma instalação existente

Com o servidor parado, aplique o schema atualizado ao banco de desenvolvimento:

```bash
npx prisma db push
npm run build
npm run start
```

As estruturas adicionadas são `EventReward`, `GiftClaim` e o campo `ContentEntry.giftEnabled`. Para produção, revise o schema e aplique a mudança com backup do banco, seguindo o processo de implantação do projeto.

## Verificação

Com o site ativo e um banco de desenvolvimento configurado:

```bash
npm run test:gifts
```

Os testes usam contas e registros temporários. Verificam permissões, upload, importação do Habbo, prazos, resgates concorrentes, entrega única e renderização dos cartões do fórum. O teste de importação precisa de conexão com o CDN do Habbo.
