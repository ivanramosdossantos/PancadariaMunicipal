// Pacotes PNG opcionais. Se um arquivo estiver ausente ou falhar, o desenho procedural permanece ativo.
const ids = ['periquito','pagodeiro','prefeito','gladiador','oaa'];
const packages = new Map();
export const artDiagnostics = { loaded: 0, failed: 0, requested: ids.length * 3, failures: [] };
function notify(id, kind, success, url) {
  if (success) artDiagnostics.loaded++;
  else {
    artDiagnostics.failed++;
    artDiagnostics.failures.push(id + '/' + kind + ' (' + url + ')');
    console.warn('[Pancadaria] Arte não encontrada:', id, kind, url);
  }
  window.dispatchEvent(new CustomEvent('pancadaria:arte-carregada', { detail: { id, kind, success } }));
}

for (const id of ids) {
  const pack = { retrato: null, pose: null, sprites: null };
  packages.set(id, pack);
  for (const kind of ['retrato','pose','sprites']) {
    const img = new Image();
    img.onload = () => {
      pack[kind] = img;
      notify(id, kind, true, img.src);
    };
    img.onerror = () => { pack[kind] = null; notify(id, kind, false, img.src); };
    img.src = new URL('assets/lutadores/' + id + '/' + kind + '.png?v=artes-20261109-2', document.baseURI).href;
  }
}
const rect = (ctx,img,x,y,w,h) => ctx.drawImage(img,x,y,w,h);
export function drawPackPortrait(ctx, profile, width, height) {
  const image = packages.get(profile.id)?.retrato;
  if (!image) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Algumas imagens exportadas tinham miniaturas extras nas laterais/rodapé.
  // Mostrar exclusivamente o retrato principal aprovado.
  const crop = {
    oaa: [0, 0, 226, 225],
    periquito: [0, 0, 320, 277],
    prefeito: [0, 0, 300, 290],
    gladiador: [0, 0, 305, 301],
    patinho: [0, 0, 256, 253],
    pagodeiro: [0, 0, 320, 214],
  }[profile.id] || [0, 0, image.width, image.height];
  const [sx,sy,sw,sh]=crop;
  const scale=Math.min(width/sw,height/sh)*1.04;
  const w=sw*scale,h=sh*scale;
  ctx.drawImage(image,sx,sy,sw,sh,(width-w)/2,(height-h)/2,w,h);
  ctx.restore();
  return true;
}
// Apenas quadros íntegros, conferidos visualmente. Os antigos atlas contêm
// figuras cortadas e não devem ser percorridos sequencialmente.
const stableFrame = Object.freeze({
  pagodeiro: [0, 1, 2, 3],
  prefeito: [0, 1, 2, 3],
  gladiador: [0, 1, 0, 1],
  oaa: [0, 1, 0, 1],
  periquito: [0, 0, 0, 0],
  patinho: [5, 5, 5, 5],
});
function drawFrame(ctx,image,frame) {
  const left=(frame%5)*128, top=Math.floor(frame/5)*128;
  ctx.drawImage(image,left,top,128,128,-48,-100,96,100);
}
// O atlas do Patinho foi gerado com cabeça e pés em quadros diferentes.
// Remontar uma pose única com regiões existentes sem depender de novas ilustrações.
function drawPatinho(ctx,image){
  // A exportação contém cabeça e pernas em componentes separados.
  // Construir UMA silhueta completa uma única vez, sem figuras repetidas.
  if (!image.cleanPatinho) {
    const layer=document.createElement('canvas');
    layer.width=128;layer.height=80;
    const g=layer.getContext('2d');
    g.imageSmoothingEnabled=false;
    g.drawImage(image,0,64,128,45,0,5,128,45);
    g.drawImage(image,0,36,128,28,0,46,128,28);
    image.cleanPatinho=layer;
  }
  ctx.drawImage(image.cleanPatinho,0,0,128,80,-48,-100,96,100);
}
export function drawPackFighter(ctx,profile,x,y,facing,pose={}){
  const image=packages.get(profile.id)?.sprites;
  if(!image)return false;
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(facing,1);
  ctx.imageSmoothingEnabled=false;
  const walking=!!pose.walk;
  const step=walking ? Math.sin((pose.phase??0)*1.6)*2 : 0;
  const recoil=(pose.hurt??0)*4;
  const crouch=(pose.crouch??0)*9;
  const strike=(pose.strike??0)*3;
  const jump=pose.air?3:0;
  const frameList=stableFrame[profile.id]||[0];
  const frame=walking ? frameList[Math.floor((pose.phase??0)*.9)%frameList.length] : frameList[0];
  ctx.translate(step-(pose.hurt?recoil:0),crouch+jump);
  if(pose.ko||pose.fall){
    const fall=pose.ko?1:Math.max(0,Math.min(1,pose.fall));
    ctx.translate(-24*fall,-4*fall);
    ctx.rotate(-1.45*fall);
  }else if(pose.strike>0.05)ctx.rotate(-0.04*strike);
  if(profile.id==='patinho')drawPatinho(ctx,image);
  else drawFrame(ctx,image,frame);
  ctx.restore();
  return true;
}
export function drawPackSelection(ctx, profile, x, y, facing=1) {
  return drawPackFighter(ctx,profile,x,y,facing,{phase:0});
}
