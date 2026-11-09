# Integração da arte pixel art (pacotes opcionais)

O motor da branch `motor-combate` agora lê `assets/lutadores/{id}/retrato.png`, `pose.png` e `sprites.png` nos ids `periquito`, `pagodeiro`, `prefeito`, `gladiador`, `oaa` e `patinho`.

- Sem os PNGs, a seleção e a luta continuam com o desenho procedural antigo (fallback).
- Cada `sprites.png` usa 5 colunas, quadros de 128 × 128 px e até 20 quadros; o arquivo `ficha.json` acompanha os recortes.
- Os retratos são usados nas cartas; `pose.png` na ficha da seleção; `sprites.png` no combate.
- Os especiais, dano, colisões, CPU, arenas, rasteira e revanche permanecem no motor anterior.

## Publicar os assets
Extraia o pacote de arte gerado no chat na raiz do checkout (caminho dentro do ZIP: `assets/lutadores/...`). Verifique as imagens no navegador; **os quadros foram normalizados automaticamente e precisam de revisão visual e correção de pivô antes de considerar as animações finais**.

As fotos reais de referência não devem ser copiadas para o repositório.

## Homologação mínima
Teste a seleção 1P/CPU de todos os seis, mesmo personagem em ambos lados, Z, X, ↓+Z, dano, quedas, especiais, as três arenas e revanche. Faça os testes antes de publicar em produção.
