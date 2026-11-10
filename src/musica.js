export function criarMusicaDeArena(audio) {
  const faixas = new Map();
  const volume = audio.createGain();
  volume.gain.value = .19;
  volume.connect(audio.destination);
  let tocando;
  let pedido = 0;
  let silenciada = false;
  let reduzida = false;

  function atualizarVolume() {
    volume.gain.setTargetAtTime(silenciada ? 0 : reduzida ? .065 : .19, audio.currentTime, .025);
  }

  function preparar(url) {
    if (!url) return;
    if (!faixas.has(url)) {
      const carregamento = fetch(url)
        .then(resposta => {
          if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
          return resposta.arrayBuffer();
        })
        .then(dados => audio.decodeAudioData(dados))
        .catch(erro => {
          faixas.delete(url);
          console.warn('Não foi possível carregar a música da arena.', erro);
          return null;
        });
      faixas.set(url, carregamento);
    }
    return faixas.get(url);
  }

  function parar() {
    pedido++;
    if (!tocando) return;
    tocando.stop();
    tocando.disconnect();
    tocando = null;
  }

  return {
    preparar,
    async tocar(url, inicio = 0) {
      parar();
      const atual = pedido;
      const buffer = await preparar(url);
      if (!buffer || atual !== pedido) return;
      tocando = audio.createBufferSource();
      tocando.buffer = buffer;
      tocando.loop = true;
      tocando.loopStart = inicio;
      tocando.connect(volume);
      tocando.start(0, inicio);
    },
    parar,
    silenciar(semMusica) {
      silenciada = semMusica;
      atualizarVolume();
    },
    reduzir(ativo) {
      reduzida = ativo;
      atualizarVolume();
    },
  };
}
