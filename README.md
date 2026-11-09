# Pancadaria Municipal

Jogo de luta em 2D inspirado em rivalidades e personagens fictícios de cada cidade. O primeiro protótipo é o **Duelo na Matriz**, edição Pato Branco.

## Jogar localmente

Na pasta do projeto, execute `node serve.mjs` e abra [o jogo local](http://127.0.0.1:8765/). Selecione seu lutador na primeira tela, confirme e escolha o adversário da máquina na segunda. A grade tem sete personagens jogáveis e duas vagas para expansão.

- **← / →** movem, **↑** pula e **↓** defende.
- **Z** ataca e **X** ativa o especial.
- Para saltar por cima do rival, aproxime-se, segure a direção dele e aperte **↑**.
- Use **Z** no ar para atacar na descida.

| Lutador | Golpe normal | Especial |
| --- | --- | --- |
| Prefeito da Maquete | Soco de gabinete | Asfalto Superfaturado |
| Pagodeiro Maluco | Chute do compasso | Pagode de Choque |

## Criação de conteúdo

A [prancha do design system](design/index.html) define a identidade do Fliperama de Praça.

- [`pancadaria-lutador`](skills/pancadaria-lutador/SKILL.md) cria a ficha, os golpes e a arte de um lutador.
- [`pancadaria-arena`](skills/pancadaria-arena/SKILL.md) cria o cenário, a ficha e as camadas de uma arena.

## Créditos

O combate usa a base de estados, quadros de animação, colisão e câmera do [StreetFighter de Mayank Jain](https://github.com/Mayank-Jain-1/StreetFighter/tree/643b01e5ad0f148ffa883b5b52f069d0288232a3), sob licença MIT. O aviso de licença acompanha o código em [LICENSE](LICENSE). A arena, as ilustrações dos personagens e os sons do duelo são próprios desta adaptação.
