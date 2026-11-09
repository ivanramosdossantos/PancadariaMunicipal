# Contrato do lutador

## Arquivos

Entregue `ficha.json`, `retrato.png`, `pose.png` e `sprites.png` na mesma pasta. Use um ID ASCII minúsculo e estável. Retrato e pose podem ter escalas diferentes. A pose e o atlas usam fundo transparente. O retrato deve funcionar no recorte horizontal da grade. Na pose, preserve o corpo inteiro e o adereço principal. Use pixel art de bordas nítidas, sem suavização na ampliação.

A ficha registra `versao: 1`, `id`, `nome`, `cidade`, `descricao`, `normal`, `especial` e `animacoes`. Cada golpe tem `nome` e `efeito` em linguagem concreta. Para o especial, inclua `contraJogo` e, ao balancear, indique dano, alcance, recarga, número de impactos e unidade. Use `bordao` e `paleta` quando fizerem parte da proposta.

`animacoes` tem pelo menos os estados `parado`, `andar`, `pular`, `defender`, `normal`, `especial`, `atingido`, `nocaute` e `vitoria`. Cada estado contém uma lista de quadros, na ordem de reprodução. Cada quadro usa `x`, `y`, `largura`, `altura` no atlas, `pivoX` e `pivoY` locais ao quadro e `duracaoMs` positiva. A origem está no canto superior esquerdo. Mantenha os pés ancorados pelo pivô para que recortar poses diferentes não mova o lutador na arena. Nos golpes, marque o quadro de contato com `contato: true`. Efeitos que viajam, como a compactadora ou ondas do cavaco, têm vida e colisão próprias. O contato marcado indica o disparo nesses casos.

Prefira atlas orientado para a direita. Verifique a leitura à escala do jogo, onde o corpo em pé ocupa aproximadamente 100 unidades do Canvas lógico. Defina a escala de exportação de forma explícita ao entregar o pacote. Guarde caixas de combate e regras de dano no motor, vinculadas ao quadro ou evento correspondente.

## Integração com o jogo

Leia `src/elenco.js`, `src/municipal.js`, `src/arte.js`, `src/especiais.js` e `src/scenes/BattleScene.js`. Hoje o elenco usa objetos JavaScript com `id`, `nome`, `normal`, `estadoNormal`, `especial`, `descricao`, `base`, `efeito`, `recarga` e cores. A seleção e o combate usam `drawFighter` e o pacote PNG ainda exige um caminho de carregamento. `ficha.json` é um contrato de produção, não um registro já importado pelo runtime.

Ao integrar, reuse os estados e a colisão do motor. Se a tarefa pede arte final em PNG e o checkout ainda não oferece leitura de atlas, implemente a menor extensão reutilizável para retrato, pose e animação, mantendo o desenho existente como fallback. Verifique se o servidor local entrega PNG com o tipo correto. Para um lutador provisório em arte procedural, siga diretamente o cadastro existente. Em ambos os casos, preserve a seleção de P1 e CPU, a paleta alternativa para duelo espelhado e a revanche. Valide o carregamento pelo caminho normal do jogo e teste os dois golpes com oponente dentro e fora de alcance.
