# APIs de catálogo

## Emblemas

Fonte: [HabboAssets](https://www.habboassets.com/api).

```text
https://www.habboassets.com/api/v2/badges?hotel=com.br&limit=6&offset=0&order=desc
```

A API pública permite pesquisar por código ou nome com `term`. O IdBlet usa o hotel `com.br`, cache de cinco minutos e timeout de cinco segundos. Se a fonte estiver indisponível, a coleção local é utilizada.

```text
GET /api/emblemas?take=6
GET /api/emblemas?page=2&take=24
GET /api/emblemas?q=PTF
GET /api/emblemas?source=local
```

O retorno contém `items`, `total`, `page`, `hasMore`, `nextCursor`, `source` e `hotel`. Os cursores externos usam o formato `ha:2`; cursores locais e filtros por raridade continuam disponíveis.

A data `found` da fonte é exposta como `discoveredAt`. Ela representa a descoberta do asset, não o lançamento de uma campanha. Nenhuma raridade é atribuída automaticamente aos emblemas externos. Disponibilidade no catálogo não significa emblema gratuito ou disponível em outro hotel.

## Mobis recentes

```text
GET https://www.habboassets.com/api/v2/feed?category=furniture&page=1&per_page=100
X-Hotel-ID: 2
Accept: application/json
```

O IdBlet consulta o feed público, seleciona eventos `furni_added` do Habbo Brasil e remove classes repetidas. Os ícones vêm do próprio feed.

```text
GET /api/mobis?take=6
GET /api/mobis?take=24&q=classname
```

A consulta cobre a janela recente de eventos, não o catálogo completo. O retorno identifica o escopo como `recent-feed`. São usados cache de cinco minutos e timeout de cinco segundos. O fallback local só inclui itens com imagem válida.

## Valores

Os preços pertencem ao catálogo local do IdBlet e são gerenciados em **Painel → Mobis e valores**.

```text
GET /api/valores?page=1&take=6
GET /api/valores?page=2&take=24&q=cadeira
```

O retorno contém `items`, `total`, `page`, `hasMore` e `source: "local"`. Não há requisições a serviços externos de preços. O endpoint usa `Cache-Control: no-store` para refletir os dados do painel.
