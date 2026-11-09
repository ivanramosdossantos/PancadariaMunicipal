# Contrato da arena

## Arquivos

Entregue `arena.json` e `panorama.png`. O panorama é o cenário composto e opaco, sem personagem, barra de vida, título ou botão. Para parallax, entregue também PNGs alinhados no mesmo tamanho com transparência onde necessário. A prévia com sobreposição de HUD e lutadores é separada dos arquivos de jogo.

A ficha registra `versao: 1`, `id` ASCII minúsculo, `nome`, `cidade`, `marcoVisual`, `largura`, `altura` e `linhaChao` em pixels do panorama, medidos a partir do topo. Quando entregar camadas, inclua `camadas` na ordem de fundo para frente, cada entrada com `arquivo` e `parallax` entre 0 e 1. Use 0 para o que fica fixo na tela e 1 para o que acompanha o movimento integral da câmera.

Na configuração atual, a janela lógica é 382 × 224. `BattleScene.draw` exibe o panorama em 487 × 262, com deslocamento horizontal de até 105 unidades. A origem vertical é 228 unidades acima do piso lógico. Como ponto de partida, exporte em 487 × 262 ou em múltiplo inteiro, com a linha de apoio em y = 228 no tamanho base ou y = 456 em 974 × 524. Ajuste com base na composição e valide o alinhamento com o motor se modificar essa geometria. Deixe cobertura de arte até as bordas do panorama, inclusive na parte inferior.

## Integração com o jogo

Leia `index.html`, `src/municipal.js`, `src/scenes/BattleScene.js`, `src/constants/stage.js`, `src/engine/Camera.js` e `serve.mjs`. Hoje a Matriz é um SVG carregado na abertura e passado como imagem para `BattleScene`. O manifesto e as camadas são formatos de produção. O jogo atual ainda não tem catálogo de arenas nem importação desse manifesto.

Ao integrar uma nova arena mantendo a Matriz, crie o menor cadastro reutilizável, com ID, nome, cidade e imagem. Carregue e decodifique a imagem antes de liberar a luta e deixe a Matriz disponível como padrão. Se houver parallax, adicione apenas o caminho necessário para renderizar as camadas. Preserve piso, limites e câmera existentes, a menos que o pedido exija outra geometria. Verifique se o servidor local entrega PNG com o tipo correto. Teste em largura de desktop e celular, com os lutadores próximos e separados. O piso deve permanecer sob os pés nos extremos da câmera.
