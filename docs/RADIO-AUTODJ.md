# Rádio e AutoDJ por streaming

Acesse **Painel → Rádio e AutoDJ** (`/admin/radio`) com uma conta de administrador.

1. Informe a URL direta de áudio do seu servidor de streaming, por exemplo `https://servidor.exemplo/stream`.
2. Ajuste o nome do programa.
3. Use **Preparar teste de áudio** e clique no play do teste para conferir o endereço.
4. Clique em **Conectar AutoDJ**.
5. Abra o site e clique no botão de play, no destaque ou no player fixo.

O AutoDJ e a playlist são executados pelo seu provedor de streaming. O IdBlet conecta o player a essa transmissão; ele não contrata hospedagem, cria uma estação externa ou programa uma playlist no provedor. A reprodução depende de uma URL de áudio válida e de o servidor estar transmitindo.

O primeiro play exige interação do visitante, conforme as regras de áudio dos navegadores. O player só indica reprodução e anima as barras quando recebe o evento real de áudio tocando.

Se o streaming falhar após o play, o player tenta reconectar três vezes, com intervalos de 4, 8 e 12 segundos. Pausar cancela as tentativas. Se o navegador bloquear áudio ou as tentativas acabarem, o player mostra uma mensagem para tentar novamente.

Use HTTPS em um site HTTPS. O formulário rejeita protocolos inseguros e URLs que incluam usuário e senha. Para parar a rádio no site, use **Desativar rádio**. As configurações de identidade e os efeitos sazonais são preservados.

Teste local de configuração e permissões: `npm run test:radio`. O teste usa uma URL fictícia para validar a gravação, sem reproduzir áudio, e restaura as configurações ao terminar. A reprodução real precisa ser conferida com o endereço do seu streaming.
