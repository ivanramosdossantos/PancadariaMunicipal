import { codigoPix } from './pix/codigo.js';

const DESTINO = 'https://script.google.com/macros/s/AKfycbzg_vyxjOI59Rpb0ktjjowAkDwO-tmz1wO4r6UeNus7gcfT7riivB_0fs9ghfn28ImG/exec';

export function configurarIndicacoes(formulario, botao, status, painelPix, destino = DESTINO) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(destino)) return;

  const { lutador, cidade, golpe, protocolo, origem } = formulario.elements;
  const campos = [lutador, cidade, golpe];
  const aviso = painelPix.querySelector('#aviso-pix-indicacao');
  const copiarPix = painelPix.querySelector('[data-copiar-pix]');
  const copiarReferencia = painelPix.querySelector('[data-copiar-referencia]');
  const campoManual = painelPix.querySelector('[data-pix-manual]');
  const feedbackPix = painelPix.querySelector('[data-pix-feedback]');
  let numeroPix;
  let envio;
  let prazo;
  let aguardando = false;
  formulario.action = destino;
  botao.disabled = false;
  status.textContent = 'Os dados serão registrados na planilha de indicações.';
  const instrucaoInicial = 'Antes de pagar, envie sua indicação. O número para colocar na descrição do Pix aparece aqui.';
  aviso.textContent = instrucaoInicial;

  async function copiar(texto, mensagem) {
    campoManual.hidden = true;
    try {
      await navigator.clipboard.writeText(texto);
      feedbackPix.textContent = mensagem;
    } catch {
      campoManual.value = texto;
      campoManual.hidden = false;
      campoManual.focus();
      campoManual.select();
      feedbackPix.textContent = 'Toque e segure no campo para copiar o texto.';
    }
  }

  copiarPix.addEventListener('click', () => copiar(codigoPix, 'Código Pix copiado.'));
  copiarReferencia.addEventListener('click', () => copiar(String(numeroPix), 'Referência copiada.'));

  function terminar(mensagem) {
    clearTimeout(prazo);
    aguardando = false;
    botao.disabled = false;
    campos.forEach(campo => { campo.readOnly = false; });
    status.textContent = mensagem;
  }

  formulario.addEventListener('submit', evento => {
    if (aguardando || campos.some(campo => !campo.value.trim())) {
      evento.preventDefault();
      if (!aguardando) status.textContent = 'Preencha os três campos para enviar.';
      return;
    }
    const dados = JSON.stringify(campos.map(campo => campo.value.trim()));
    if (envio?.dados !== dados) envio = { dados, protocolo: crypto.randomUUID() };
    protocolo.value = envio.protocolo;
    origem.value = location.origin;
    aguardando = true;
    botao.disabled = true;
    campos.forEach(campo => { campo.readOnly = true; });
    aviso.textContent = instrucaoInicial;
    copiarReferencia.hidden = true;
    campoManual.hidden = true;
    feedbackPix.textContent = '';
    status.textContent = 'Enviando indicação…';
    prazo = setTimeout(() => terminar('Ainda não recebemos a confirmação. Você pode tentar novamente.'), 15000);
  });

  window.addEventListener('message', evento => {
    if (!/^https:\/\/(?:script\.google\.com|(?:[\w-]+-)?script\.googleusercontent\.com)$/.test(evento.origin)) return;
    const resposta = evento.data;
    if (!envio || resposta?.tipo !== 'pancadaria:indicacao' || resposta.protocolo !== envio.protocolo) return;
    if (resposta.ok === true) {
      const numero = resposta.numero;
      if (!Number.isSafeInteger(numero) || numero < 1001) {
        terminar('A indicação foi registrada, mas o número para o Pix ainda não está disponível. Tente novamente antes de pagar.');
        return;
      }
      if (envio.dados === JSON.stringify(campos.map(campo => campo.value.trim()))) formulario.reset();
      numeroPix = numero;
      copiarReferencia.hidden = false;
      const destaque = document.createElement('strong');
      destaque.textContent = numero;
      aviso.replaceChildren('Na descrição ou mensagem do Pix, digite somente ', destaque, '. Assim podemos localizar sua indicação.');
      terminar('Indicação recebida! Seu número é ' + numero + '.');
      envio = null;
    } else if (aguardando) terminar('Não foi possível registrar a indicação. Tente novamente.');
  });
}
