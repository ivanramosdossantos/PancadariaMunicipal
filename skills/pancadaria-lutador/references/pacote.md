# Contrato do lutador

## Arquivos

Entregue `ficha.json`, `retrato.png`, `pose.png` e `sprites.png` na mesma pasta. Use um ID ASCII minúsculo e estável. Retrato e pose podem ter escalas diferentes. A pose e o atlas usam fundo transparente. O retrato deve funcionar no recorte horizontal da grade. Na pose, preserve o corpo inteiro e o adereço principal. Use pixel art de bordas nítidas, sem suavização na ampliação.

A ficha registra `versao: 1`, `id`, `nome`, `cidade`, `descricao`, `normal`, `especial` e `animacoes`. Cada golpe tem `nome` e `efeito` em linguagem concreta. Para o especial, inclua `contraJogo` e, ao balancear, indique dano, alcance, recarga, número de impactos e unidade. Use `bordao` e `paleta` quando fizerem parte da proposta.

`animacoes` tem pelo menos os estados `parado`, `andar`, `pular`, `defender`, `normal`, `especial`, `atingido`, `nocaute` e `vitoria`. Cada estado contém uma lista de quadros, na ordem de reprodução. Cada quadro usa `x`, `y`, `largura`, `altura` no atlas, `pivoX` e `pivoY` locais ao quadro e `duracaoMs` positiva. A origem está no canto superior esquerdo. Mantenha os pés ancorados pelo pivô para que recortar poses diferentes não mova o lutador na arena. Nos golpes, marque o quadro de contato com `contato: true`. Efeitos que viajam, como a compactadora ou ondas do cavaco, têm vida e colisão próprias. O contato marcado indica o disparo nesses casos.

Prefira atlas orientado para a direita. Verifique a leitura à escala do jogo, onde o corpo em pé ocupa aproximadamente 100 unidades do Canvas lógico. Informe `escala` na ficha como a quantidade de unidades lógicas por pixel do atlas. Use `1` para um sprite com aproximadamente 100 pixels de altura. Guarde caixas de combate e regras de dano no motor, vinculadas ao quadro ou evento correspondente.

## Integração com o jogo

Leia `src/elenco.js`, `src/arte-lutador.js` e `src/scenes/BattleScene.js`. Salve o pacote em `src/lutadores/<id>/` e marque `pacoteArte: true` no registro correspondente do elenco. O jogo carrega as imagens e as animações de `ficha.json`. O registro JavaScript continua definindo o golpe, o efeito e a recarga.

Ao integrar, reuse os estados e a colisão do motor. Os estados complementares `rasteira`, `queda` e `aereo` têm alternativas visuais quando ausentes. Para uma arte provisória, use o cadastro procedural existente. Teste a seleção de P1 e CPU, o duelo espelhado, a revanche e os dois golpes com oponente dentro e fora de alcance.
