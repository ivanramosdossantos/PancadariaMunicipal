const assetRoot = new URL('./lutadores/', import.meta.url);

async function carregarImagem(url) {
  const imagem = new Image();
  // Cache bust da arte junto da versão do módulo, inclusive dos PNGs.
  url.search = new URL(import.meta.url).search;
  imagem.src = url.href;
  await imagem.decode();
  return imagem;
}

export async function carregarArteLutador(perfil) {
  if (!perfil.pacoteArte) return;
  const pasta = new URL(perfil.id + '/', assetRoot);
  const fichaUrl = new URL('ficha.json', pasta);
  fichaUrl.search = new URL(import.meta.url).search;
  try {
    const [resposta, retrato, pose, atlas] = await Promise.all([
      fetch(fichaUrl),
      carregarImagem(new URL('retrato.png', pasta)),
      carregarImagem(new URL('pose.png', pasta)),
      carregarImagem(new URL('sprites.png', pasta)),
    ]);
    if (!resposta.ok) throw new Error('Ficha indisponível.');
    const ficha = await resposta.json();
    const escala = ficha.escala ?? 1;
    if (ficha.versao !== 1 || ficha.id !== perfil.id || !(escala > 0 && Number.isFinite(escala)) || !ficha.animacoes?.parado?.length) {
      throw new Error('Ficha de arte incompatível.');
    }
    const atlases = new Map([['sprites.png', atlas]]);
    const arquivos = new Set(Object.values(ficha.animacoes).flat().map(quadro => quadro.arquivo).filter(Boolean));
    await Promise.all([...arquivos].map(async arquivo => {
      if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*\.png$/.test(arquivo)) throw new Error('Nome de atlas inválido.');
      atlases.set(arquivo, await carregarImagem(new URL(arquivo, pasta)));
    }));
    perfil.arte = { retrato, pose, atlas, atlases, escala, animacoes: ficha.animacoes };
  } catch (error) {
    console.warn('Arte de ' + perfil.id + ': ' + error.message);
  }
}

export function desenharArteSelecao(context, perfil, tipo, largura, altura, direcao = 1) {
  const imagem = perfil.arte?.[tipo];
  if (!imagem) return false;
  const escala = Math.min(largura / imagem.width, altura / imagem.height);
  const w = Math.round(imagem.width * escala);
  const h = Math.round(imagem.height * escala);
  context.save();
  context.imageSmoothingEnabled = false;
  context.translate(largura / 2, 0);
  context.scale(direcao, 1);
  context.drawImage(imagem, -w / 2, Math.round((altura - h) / 2), w, h);
  context.restore();
  return true;
}

function quadroPorTempo(quadros, tempo, loop) {
  const duracao = quadros.reduce((total, quadro) => total + quadro.duracaoMs, 0);
  let relogio = loop ? Math.max(0, tempo) % duracao : Math.max(0, tempo);
  for (const quadro of quadros) {
    relogio -= quadro.duracaoMs;
    if (relogio < 0) return quadro;
  }
  return quadros.at(-1);
}

function quadroPorProgresso(quadros, progresso) {
  const duracao = quadros.reduce((total, quadro) => total + quadro.duracaoMs, 0);
  return quadroPorTempo(quadros, Math.max(0, Math.min(1, progresso)) * duracao, false);
}

function quadroDeAtaque(quadros, fase, progresso) {
  const primeiroContato = quadros.findIndex(quadro => quadro.contato);
  if (primeiroContato === -1 || !fase) return quadroPorProgresso(quadros, progresso);
  const ultimoContato = quadros.findLastIndex(quadro => quadro.contato);
  const trecho = fase === 'preparo' ? quadros.slice(0, primeiroContato)
    : fase === 'contato' ? quadros.slice(primeiroContato, ultimoContato + 1) : quadros.slice(ultimoContato + 1);
  return trecho.length ? quadroPorProgresso(trecho, progresso) : quadros[primeiroContato];
}

export function desenharSprite(context, perfil, x, y, direcao, animacao) {
  const arte = perfil.arte;
  if (!arte) return false;
  const quadros = [animacao.estado, animacao.fallback, 'parado']
    .map(estado => arte.animacoes[estado])
    .find(lista => Array.isArray(lista) && lista.length > 0);
  if (!quadros) return false;
  const quadro = animacao.loop ? quadroPorTempo(quadros, animacao.tempo, true)
    : quadroDeAtaque(quadros, animacao.fase, animacao.progresso);
  const { largura, altura, pivoX, pivoY } = quadro;
  const escala = quadro.escala ?? arte.escala;
  const atlas = arte.atlases?.get(quadro.arquivo ?? 'sprites.png') ?? arte.atlas;
  context.save();
  context.imageSmoothingEnabled = false;
  if (perfil.espelhoCpu) context.filter = 'brightness(0.82) saturate(1.35)';
  context.translate(Math.round(x), Math.round(y));
  context.scale(direcao, 1);
  context.drawImage(atlas, quadro.x, quadro.y, largura, altura,
    -pivoX * escala, -pivoY * escala, largura * escala, altura * escala);
  context.restore();
  return true;
}
