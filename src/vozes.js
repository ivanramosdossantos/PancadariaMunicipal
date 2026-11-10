const momentos = ['selecao', 'especial', 'vitoria'];
const versao = new URL(import.meta.url).search;

export function criarVozes(audio, reduzirMusica) {
  const cache = new Map();
  const volume = audio.createGain();
  volume.gain.value = .8;
  volume.connect(audio.destination);
  let fonte;
  let pedido = 0;

  function carregar(perfil, momento) {
    const arquivo = new URL(`./lutadores/${perfil.id}/vozes/${momento}.mp3`, import.meta.url);
    arquivo.search = versao;
    if (!cache.has(arquivo.href)) {
      const dados = fetch(arquivo)
        .then(resposta => {
          if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
          return resposta.arrayBuffer();
        })
        .then(buffer => audio.decodeAudioData(buffer))
        .catch(erro => {
          cache.delete(arquivo.href);
          console.warn('Falha ao carregar a voz de ' + perfil.nome, erro);
          return null;
        });
      cache.set(arquivo.href, dados);
    }
    return cache.get(arquivo.href);
  }

  function parar() {
    pedido++;
    if (!fonte) return;
    fonte.onended = null;
    fonte.stop();
    fonte.disconnect();
    fonte = null;
    reduzirMusica(false);
  }

  return {
    preparar(perfil) {
      if (perfil.voz) for (const momento of momentos) carregar(perfil, momento);
    },
    async tocar(perfil, momento, atraso = 0) {
      if (!perfil.voz) return;
      parar();
      const atual = pedido;
      const buffer = await carregar(perfil, momento);
      if (!buffer || pedido !== atual) return;
      fonte = audio.createBufferSource();
      fonte.buffer = buffer;
      fonte.connect(volume);
      fonte.onended = () => {
        fonte.disconnect();
        fonte = null;
        reduzirMusica(false);
      };
      reduzirMusica(true);
      fonte.start(atraso ? audio.currentTime + atraso : 0);
    },
    parar,
  };
}
