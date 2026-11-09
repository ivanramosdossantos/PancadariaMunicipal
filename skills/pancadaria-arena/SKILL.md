---
name: pancadaria-arena
description: Cria ou revisa arenas do Pancadaria Municipal a partir de cidade, lugar e fotos opcionais, com cenário em pixel art, piso de combate, camadas e enquadramento. Use para preparar a arte e a ficha da arena ou integrar a arena quando solicitado.
---

# Criar arena do Pancadaria Municipal

Localize o checkout por `design/tokens.css` e `src/constants/stage.js`. Leia a direção de arte em `design/index.html` e consulte [o contrato da arena](references/pacote.md). Se estiver fora do checkout e precisar da referência ou da integração, peça a pasta do projeto.

1. **Escolha o que torna o lugar reconhecível.** Use cidade, nome do local e um ou dois elementos visuais. A foto é opcional. Para a Matriz de Pato Branco, a fachada amarela e a torre do relógio resolvem a leitura. Quando houver foto, use a arquitetura, o piso e o ângulo como referências e entregue uma composição original. Mantenha a foto original fora do pacote.
2. **Desenhe a arena para os lutadores.** Separe horizonte, arquitetura e piso. Preserve uma linha de chão contínua e espaço para saltos. Concentre o detalhe arquitetônico atrás ou acima da faixa de luta e use contraste suficiente para ler pernas, projéteis e efeitos de impacto. Teste o centro e os extremos da câmera antes de fechar o enquadramento. Quando fizer sentido, proponha um detalhe ambiental discreto, como um poste aceso.
3. **Entregue conforme o pedido.** Na fase de conceito, entregue composição, paleta e referências do lugar. Para o pacote, produza panorama, ficha e camadas alinhadas quando houver parallax. Inclua uma prévia com dois lutadores e o placar sobreposto, fora do cenário exportado. Use geração de imagem quando disponível e confira a continuidade do piso, o recorte e a leitura das silhuetas.
4. **Valide antes de entregar.** Rode `node skills/verificar-pacote.mjs arena <pasta-do-pacote>` na raiz do projeto. Confira a linha do chão no panorama e nos extremos da câmera. Entregue os caminhos, o ponto de referência preservado e o status real da integração.

Quando o usuário pedir para adicionar a arena, siga a seção de integração do contrato e teste início do duelo, centro e extremos da câmera, salto, revanche e carregamento da Matriz como arena existente. Criação e integração local não autorizam publicação nem envio de fotos a terceiros.
