# Indicações na planilha

Cada envio aparece na aba privada `Indicações` com um **Número da indicação**, a partir de `1001`. O jogador informa esse número na descrição do Pix. Procure por ele na planilha para conferir o pagamento e atualizar a coluna **Pix**. O protocolo interno identifica tentativas repetidas. A propriedade `ULTIMA_INDICACAO` é criada pelo script e guarda o último número reservado.

1. Abra um projeto no [Google Apps Script](https://script.google.com/) e cole o conteúdo de `Code.gs`.
2. Em **Configurações do projeto → Propriedades do script**, crie `PLANILHA_ID` com o trecho entre `/d/` e `/edit` do link da planilha. Mantenha a planilha privada.
3. Em **Implantar → Nova implantação → Aplicativo da Web**, selecione **Executar como eu** e **Quem pode acessar → Qualquer pessoa** para aceitar jogadores sem login. Autorize o acesso à planilha. A implantação recebe apenas os campos do formulário e responde com o protocolo.
4. Copie a URL que termina em `/exec` para `DESTINO` em `src/indicacoes.js`. A URL da implantação é pública. O identificador da planilha fica nas propriedades do script.
5. Faça uma indicação de teste e verifique a mensagem no jogo e a linha na planilha antes de usar em produção.

Para atualizar a integração existente e manter a URL, use **Implantar → Gerenciar implantações → Editar → Nova versão**.
