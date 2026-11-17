# Consultas ao banco

O schema MySQL utiliza índices compostos para os filtros e as ordenações mais frequentes:

- Notícias publicadas, data de publicação e categoria.
- Emblemas por raridade e data.
- Tópicos por categoria, fixação e última atividade.
- Respostas por tópico e data.
- Membros por nível e XP.
- Conteúdo editorial por tipo, publicação, ordem e data.

`src/lib/queries.ts` concentra as consultas utilizadas pelas APIs com paginação por cursor. As consultas públicas selecionam somente os campos necessários para a listagem.

A contagem `replyCount` é atualizada junto com a criação de respostas dentro de transações. Alterações administrativas são registradas em `AuditLog`.

Use `EXPLAIN` no MySQL e dados representativos da sua instalação antes de modificar índices. A manutenção de índices e de migrações deve acompanhar o histórico real do banco.
