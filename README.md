# Pancadaria Municipal

Jogo de luta em 2D inspirado em rivalidades e personagens fictícios de cada cidade. O primeiro protótipo é o **Duelo na Matriz**, edição Pato Branco.

## Jogar localmente

Na pasta do projeto, execute `node serve.mjs` e abra [o jogo local](http://127.0.0.1:8765/). Confirme seu lutador, o adversário da máquina e a arena. Qualquer lutador pode jogar na Prefeitura, no Bobódromo ou na Frente da Matriz.

- **← / →** movem, **↑** pula e **↓** defende.
- **Z** ataca e **X** ativa o especial.
- Para saltar por cima do rival, aproxime-se, segure a direção dele e aperte **↑**.
- Use **Z** no ar para atacar na descida.

| Lutador | Golpe normal | Especial |
| --- | --- | --- |
| Periquito do Estar | Tapão do Talão | Multa |
| Pagodeiro Maluco | Chute do Compasso | Cavaco da Morte |
| Prefeito | Soco de Gabinete | Asfaltadora da Morte |
| Gladiador da Avenida | Escudada da Avenida | Vodka Shot |
| OAA | Soco Ignorante | Grito OAA |
| Patinho Futsal | Chute de Bico | Bicada Mortal |

## Criação de conteúdo

A [prancha do design system](design/index.html) define a identidade do Fliperama de Praça.

- [`pancadaria-lutador`](skills/pancadaria-lutador/SKILL.md) cria a ficha, os golpes e a arte de um lutador.
- [`pancadaria-arena`](skills/pancadaria-arena/SKILL.md) cria o cenário, a ficha e as camadas de uma arena.

## Créditos

O combate usa a base de estados, quadros de animação, colisão e câmera do [StreetFighter de Mayank Jain](https://github.com/Mayank-Jain-1/StreetFighter/tree/643b01e5ad0f148ffa883b5b52f069d0288232a3), sob licença MIT. O aviso de licença acompanha o código em [LICENSE](LICENSE). A arena, as ilustrações dos personagens e os sons do duelo são próprios desta adaptação.
