# Temas e efeitos do IdBlet

Acesse **Painel → Temas e efeitos** (`/admin/aparencia`). Esta área está disponível apenas para administradores.

1. Escolha **Halloween**, **Natal**, **Páscoa** ou **Festa Junina**.
2. Confira a prévia. Só selecionar uma opção não muda o site.
3. Marque ou desmarque **Ativar animações suaves**.
4. Clique em **Aplicar tema no site**.
5. Abra ou atualize o site para conferir. Abas públicas que já estavam abertas precisam ser atualizadas.

Selecione **Desativado** e salve para remover os efeitos. A ativação é manual; não muda automaticamente pelo calendário.

Os temas são leves e preservam a identidade dourada:

- **Halloween:** abóboras, fantasminha, morcegos e um detalhe de cor no destaque.
- **Natal:** neve, luzinhas, árvore e presente.
- **Páscoa:** ovos coloridos, coelhinho e detalhes pastel.
- **Festa Junina:** bandeirinhas, lanterna e confetes.

Os enfeites usam vetores em pixel art, não recebem cliques, não reproduzem sons e ficam ocultos no painel administrativo. A preferência de movimento reduzido do visitante desativa as animações, mesmo se o painel permitir movimento. Em celulares, há menos partículas e os enfeites são menores.

A preferência fica no objeto `seasonal` do JSON de configurações existente. Não é necessária uma migração de banco. Salvar identidade ou rádio preserva os efeitos; trocar os efeitos preserva as demais configurações. Toda mudança é registrada na auditoria.

Arquivos principais:

- `src/lib/seasonal-config.ts`: temas permitidos e validação.
- `src/actions/appearance.ts`: gravação autenticada.
- `src/components/AppearanceForm.tsx`: painel e prévia.
- `src/components/SeasonalDecor.tsx`: decoração pública.
- `src/components/SeasonPixel.tsx`: sprites vetoriais.
- `src/app/seasonal.css`: pequenos detalhes Habbo e animações.

Teste local, com o servidor ativo: `npm run test:seasonal`. O teste ativa temporariamente os temas e restaura a configuração ao terminar; use apenas no ambiente de desenvolvimento.
