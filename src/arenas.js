const cidade = 'Pato Branco';

export const arenas = [
  {
    id: 'prefeitura', referencia: 'A prefeitura e a fila da senha', nome: 'Prefeitura', cidade, imagem: './src/arenas/prefeitura.svg',
    musica: './src/arenas/audio/prefeitura.mp3',
    inicioMusica: 1,
    descricao: 'Pegue a senha e aguarde sua vez. Aqui até o nocaute sai com número de protocolo.',
  },
  {
    id: 'bobodromo', referencia: 'Um ponto de encontro na Avenida Tupi', nome: 'Bobódromo', cidade, imagem: './src/arenas/bobodromo.svg',
    musica: './src/arenas/audio/bobodromo.mp3',
    descricao: 'Era só uma saideira na Avenida Tupi. Cinco minutos depois, o ponto de ônibus já virou arquibancada.',
  },
  {
    id: 'matriz', referencia: 'A praça em frente à igreja', nome: 'Frente da Matriz', cidade, imagem: './matriz.svg',
    musica: './src/arenas/audio/matriz.m4a',
    descricao: 'Na praça, todo mundo pede paz. Aí o sino toca e o perdão fica pra depois do duelo.',
  },
];
