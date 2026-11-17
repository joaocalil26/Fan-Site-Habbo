# Equipe

A página `/equipe` apresenta a hierarquia completa de cargos e os cartões dos membros, sem o formato de lista de notícias.

Os níveis são **Gestão, Direção, Administração, Coordenação, Supervisão, Análise e Equipe Base**. Os cargos são definidos em `src/lib/team.ts`, compartilhados pela página pública e pelo formulário administrativo.

## Cadastrar um membro

1. Acesse **Painel → Equipe → Novo registro**.
2. Informe o nome ou nick e escolha o cargo.
3. Adicione uma imagem do personagem ou avatar. Para enviar do computador, use o campo de upload e copie o caminho retornado para o campo de avatar. PNG transparente é indicado para personagens sem fundo.
4. Marque **Exibir na equipe**, defina a ordem e salve.

Os cartões mostram imagem, nome e cargo. Sem imagem, aparece a inicial do nome. A página usa quatro colunas em telas grandes e duas em celulares. Membros não publicados ficam ocultos.

Os registros existentes foram preservados e podem ser ajustados pelo painel. Cadastrar alguém na página Equipe não altera as permissões de sua conta; permissões de acesso continuam sendo gerenciadas em **Usuários**.
