// Pacotes PNG opcionais. Se um arquivo estiver ausente ou falhar, o desenho procedural permanece ativo.
const ids = ['periquito','pagodeiro','prefeito','gladiador','oaa','patinho'];
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
  const scale = Math.min(width / image.width, height / image.height) * 1.02;
  const w = image.width * scale, h = image.height * scale;
  rect(ctx,image,(width-w)/2,(height-h)/2,w,h);
  ctx.restore();
  return true;
}
export function drawPackSelection(ctx, profile, x, y, facing = 1) {
  const image = packages.get(profile.id)?.pose;
  if (!image) return false;
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(facing,1);
  ctx.imageSmoothingEnabled = false;
  const ratio = Math.min(92/image.height,85/image.width);
  rect(ctx,image,-image.width*ratio/2,-image.height*ratio,image.width*ratio,image.height*ratio);
  ctx.restore();
  return true;
}
const frameIndex = (pose) => {
  if (pose.ko || pose.fall) return 15;
  if (pose.hurt) return 14;
  if (pose.special) return 12 + (Math.floor(pose.phase*0.6)%2);
  if (pose.sweep) return 17;
  if (pose.strike > 0.25) return pose.air ? 8 : 10 + (pose.strike>0.75?1:0);
  if (pose.guard) return 9;
  if (pose.air) return 7;
  if (pose.crouch > .3) return 6;
  if (pose.walk) return 2 + (Math.floor(pose.phase*.55)%4);
  return Math.floor(pose.phase*.13)%2;
};
export function drawPackFighter(ctx, profile, x, y, facing, pose = {}) {
  const image = packages.get(profile.id)?.sprites;
  if (!image) return false;
  const cols = 5, size = 128;
  const frame = Math.max(0, Math.min(19, frameIndex(pose)));
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(facing,1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image,(frame%cols)*size,Math.floor(frame/cols)*size,size,size,-47,-94,94,94);
  ctx.restore();
  return true;
}
