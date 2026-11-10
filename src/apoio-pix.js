import { codigoPix, copiarPix } from './pix/codigo.js?v=arcade-mobile-v1';

const apoio = document.getElementById('apoio');
const campoManual = apoio.querySelector('[data-pix-manual]');
const feedback = apoio.querySelector('[data-pix-feedback]');

apoio.querySelector('[data-copiar-pix]').addEventListener('click', () => {
  copiarPix(codigoPix, campoManual, feedback, 'Código Pix copiado.');
});
