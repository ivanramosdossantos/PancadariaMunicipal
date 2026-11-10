# Integração da arte pixel art

## Pacotes novos

Use o Pagodeiro como piloto. Guarde `retrato.png`, `pose.png`, `sprites.png` e `ficha.json` em `src/lutadores/<id>/` e ative `pacoteArte` no perfil em `src/elenco.js`. O jogo usa o retrato na grade, a pose de corpo inteiro na seleção e os quadros e pivôs da ficha na arena. Os golpes e as colisões são definidos pelo motor.

Siga o [contrato do pacote](../skills/pancadaria-lutador/references/pacote.md) e execute `node skills/verificar-pacote.mjs lutador src/lutadores/<id>`.

## Artes anteriores

O GitHub Pages extrai `artes-pancadaria.zip` e publica as imagens em `assets/lutadores/<id>/`. Essas artes continuam disponíveis para o elenco e como alternativa quando um pacote novo falha. Para testá-las com o servidor local, extraia o ZIP na raiz do checkout.

As fotos reais de referência não devem ser copiadas para o repositório.

## Homologação mínima
Teste a seleção 1P/CPU de todos os seis, mesmo personagem em ambos lados, Z, X, ↓+Z, dano, quedas, especiais, as três arenas e revanche. Faça os testes antes de publicar em produção.
