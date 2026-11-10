// Pix estático do Pancadaria Municipal, fornecido pelo responsável do jogo.
// Sem valor fixo: o jogador escolhe o valor no aplicativo do banco.
// O QR é desenhado localmente, sem biblioteca externa nem envio a terceiros.
const pix = '00020126820014br.gov.bcb.pix013617a117cc-2168-437b-8b38-4cba4ebc61580220Pancadaria Municipal5204000053039865802BR5922I RAMOS SANTOS CONSULT6011Pato Branco62290525IRAMOSCO00000740555785ASA63041D5C';
const rows = [
"0000000000000000","0000000000000000","0000000000000000","0000000000000000",
"01fc59113626c7f0","0104192b986fe410","0175daf125fb25d0","017590ab8482d5d0",
"01752b67f18a45d0","0105815b14f74410","01fd5555555557f0","0001dc8915a30000",
"017c35abf12477c0","00412f072a106910","01f630ef02c495a0","015a081030cf2420",
"0147f671d3b450e0","01bbc4fc9c996920","001e8f4666941410","004817cd18610ba0",
"003782e1e01ef270","0112c5481f68c100","0077cf4628d21e20","0059c43d2d0964d0",
"012dafe436f27f20","0003087bada24200","01a757e110fa9500","01183886f5626020",
"019fd681f6075f60","013140cf179b7110","01b5026b545c5520","01917dbf104d5100",
"001ff019f7a81fe0","0100dea41a806590","0177526fecfda2e0","0129af787aa5ada0",
"013e091be03aea50","0160d2b824b96100","01169e58298698a0","01f8687ea5a575a0",
"010c5efc2752d860","00d96993ecca4f50","014daf2830121af0","014230708d4e2660",
"01cd53883ef29110","00b05793ef0e4a50","01be980890e29020","00c0339f45026fb0",
"0027bcd9f6855fa0","0001063f15225110","01fc6e1554d47520","0105fe5d19b65100",
"0175f175f0305fe0","01756b2b8cea5000","01758c6d74e68fc0","0104ee7b24c1d8a0",
"01fdac8667be4e40","0000000000000000","0000000000000000","0000000000000000","0000000000000000"
];
function paintQR() {
  const canvas = document.getElementById('apoio-qr');
  if (!canvas) return;
  const size = 61, scale = 5;
  canvas.width = canvas.height = size * scale;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#000';
  rows.forEach((hex,y) => {
    const bits = BigInt('0x'+hex);
    for (let x=0; x<size; x++) {
      if ((bits >> BigInt(60-x)) & 1n) ctx.fillRect(x*scale,y*scale,scale,scale);
    }
  });
}
const modal = document.getElementById('apoio-modal');
const openers = document.querySelectorAll('[data-abrir-apoio]');
const closers = document.querySelectorAll('[data-fechar-apoio]');
const copy = document.getElementById('apoio-copiar');
const feedback = document.getElementById('apoio-feedback');
let formerFocus;
function openModal(){
  formerFocus = document.activeElement;
  modal.hidden=false;
  feedback.textContent='';
  paintQR();
  document.getElementById('apoio-fechar').focus();
}
function closeModal(){
  modal.hidden=true;
  formerFocus?.focus();
}
openers.forEach(el=>el.addEventListener('click',openModal));
closers.forEach(el=>el.addEventListener('click',closeModal));
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
document.addEventListener('keydown',e=>{
  if(modal.hidden)return;
  if(e.key==='Escape'){e.preventDefault();closeModal();}
  if(e.key==='Tab'){
    const list=[...modal.querySelectorAll('button:not([disabled])')];
    const first=list[0],last=list[list.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
copy.addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText(pix);
    feedback.textContent='Pix copiado! Cole no aplicativo do seu banco.';
  }catch{
    const input=document.getElementById('apoio-codigo');
    input.value=pix;input.hidden=false;input.focus();input.select();
    feedback.textContent='Selecione e copie o código Pix abaixo.';
  }
});
