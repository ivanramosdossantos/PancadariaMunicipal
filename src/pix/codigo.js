export const codigoPix = "00020126820014br.gov.bcb.pix013617a117cc-2168-437b-8b38-4cba4ebc61580220Pancadaria Municipal5204000053039865802BR5922I RAMOS SANTOS CONSULT6011Pato Branco62290525IRAMOSCO00000740555785ASA63041D5C";

export async function copiarPix(texto, campoManual, feedbackPix, mensagem) {
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
