# Identidade visual IdBlet

O tema atual usa uma direção editorial com dourado alaranjado, marfim e carvão. A página inicial tem um cabeçalho compacto, uma ilustração própria de estúdio, rádio integrada, notícias em destaque, descoberta de emblemas e valores, conversas, eventos, galeria e membros da comunidade.

- Dourado principal: `#e9ad4b`
- Laranja de detalhe: `#cc783f`
- Marfim: `#f7f6f0`
- Carvão: `#292f27`

Nome, logo e cores principais continuam em **Painel → Configurações e rádio**. Os padrões de novas instalações estão em `src/lib/site.ts` e no seed.

Componentes da identidade:

- `src/app/golden.css`: layout e tema atual, incluindo adaptações para celular.
- `src/components/HomeContent.tsx`: página inicial.
- `src/components/HeaderClient.tsx`: navegação principal e menu móvel.
- `src/components/RadioPlayer.tsx`: um único player de áudio, controlado também pelo botão da página inicial.
- `src/components/Icon.tsx`: ícones vetoriais do site.
- `public/idblet.svg`: marca horizontal.
- `public/idblet-studio.svg`: ilustração original do estúdio.

As animações respeitam a preferência de redução de movimento. As barras de áudio só animam quando o player informa reprodução. A navegação móvel pode ser fechada com Escape.
