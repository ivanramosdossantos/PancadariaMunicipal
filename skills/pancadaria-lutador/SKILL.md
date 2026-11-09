---
name: pancadaria-lutador
description: Cria ou revisa lutadores do Pancadaria Municipal a partir de ficha, foto opcional ou ideia de personagem, com identidade visual, golpe normal, especial, retrato e animações em pixel art. Use para preparar o pacote ou integrar o lutador quando solicitado.
---

# Criar lutador do Pancadaria Municipal

Localize o checkout do Pancadaria Municipal por `design/tokens.css` e `src/elenco.js`. Leia a direção de arte em `design/index.html` e consulte [o contrato do lutador](references/pacote.md) antes de produzir os arquivos. Se estiver fora do checkout e precisar do jogo ou da identidade visual, peça a pasta do projeto.

1. **Entenda a figura.** Use a cidade, o codinome ou arquétipo, o traço visual marcante e a ideia de golpe. A foto é opcional. Proponha nome, bordão e golpe quando faltarem e a escolha for reversível. Com uma pessoa real reconhecível, confirme autorização para usar a semelhança ou faça um personagem composto e fictício. Use a foto como referência de criação e mantenha o original fora do pacote e do repositório.
2. **Faça o especial contar a piada.** Dê ao golpe normal (`Z`) uma ação corporal legível. Para o especial (`X`), descreva o que se vê, quando atinge, como o rival reage e como evita ou defende. Mantenha preparação, contato e recuperação visíveis. O Pagodeiro Maluco, por exemplo, ergue o cavaco e dispara três ondas espaçadas. Se reutilizar o comportamento de um efeito, adapte a apresentação à nova figura.
3. **Crie as peças conforme o pedido.** Na fase de conceito, entregue ficha e direção visual. Para um pacote jogável, produza retrato, pose de corpo inteiro, atlas de animação, ficha estruturada e efeitos específicos quando necessários. Use geração de imagem quando disponível e confira o resultado quadro a quadro. Preserve roupa, proporções, paleta, adereço e pivô dos pés. A silhueta precisa funcionar na miniatura e na arena. Se faltar arte ou algum estado, identifique o que ainda é provisório.
4. **Valide antes de entregar.** Use `node skills/verificar-pacote.mjs lutador <pasta-do-pacote>` na raiz do projeto. Compare a pose de seleção com o atlas e inspecione os quadros de contato, inclusive com a imagem espelhada. Entregue os caminhos, o funcionamento dos dois golpes e o status real da integração.

Quando o usuário pedir para adicionar o lutador, siga a seção de integração do contrato e teste seleção para P1 e CPU, golpe normal, especial, dano e revanche. Criação e integração local não autorizam publicação, cobrança ou envio de foto a terceiros.
