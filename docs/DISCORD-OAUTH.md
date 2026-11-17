# Discord OAuth — passo a passo

## 1. Criar aplicação no Discord

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** → nome (ex: IdBlet)
3. Menu **OAuth2** → **General**
4. Em **Redirects**, adicione:
   - Desenvolvimento: `http://localhost:3000/api/auth/callback/discord`
   - Produção: `https://seu-dominio.com/api/auth/callback/discord`
5. Salve
6. Copie **Client ID**
7. Em **Client Secret**, clique Reset/Copy e copie o secret

## 2. Variáveis de ambiente

```env
AUTH_DISCORD_ID="seu_client_id"
AUTH_DISCORD_SECRET="seu_client_secret"
AUTH_SECRET="..."   # já usado pelo Auth.js
AUTH_URL="http://localhost:3000"
```

## 3. Scopes usados (padrão Auth.js Discord)

- `identify`
- `email`

O e-mail do Discord precisa estar **verificado** na conta do usuário para o provider retornar email.

## 4. Fluxo no app

1. Usuário clica **Continuar com Discord**
2. Autoriza no Discord
3. Callback → Auth.js cria `User` + `Account`
4. Event `createUser` define `username` único a partir do nick Discord
5. Sessão JWT com id, username, avatar, level, role

## 5. Vincular conta existente

`allowDangerousEmailAccountLinking: true` permite que, se o e-mail Discord coincidir com um user já cadastrado (credentials), a conta OAuth seja vinculada.

Sem isso, o Auth.js pode retornar `OAuthAccountNotLinked`.

## 6. Produção

- Atualize `AUTH_URL` e o redirect no portal Discord
- Nunca commite o Client Secret
- Use HTTPS

## Teste rápido

```bash
npm run dev
# abra /login → Continuar com Discord
```
