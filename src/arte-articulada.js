// Personagens vetoriais articulados: um único corpo coerente por pose, sem recortes de atlas.
// Unidades em coordenadas do Canvas do jogo, âncora no chão (0,0), lutador para a direita.
const clamp = (n, a=0, b=1) => Math.max(a, Math.min(b,n));
const lerp = (a,b,t) => a+(b-a)*clamp(t);
const ink = '#25202b';
function path(ctx, p, color, stroke=ink, w=1.5) {
  ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)ctx.lineTo(...p[i]);
  ctx.closePath();ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
}
function ellipse(ctx,x,y,rx,ry,c,stroke=ink,w=1.2){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
}
function stroke(ctx,p,color,width,outline=2.1){
  ctx.lineJoin='round';ctx.lineCap='round';
  for(const [c,w] of [[ink,width+outline],[color,width]]){
    ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)ctx.lineTo(...p[i]);
    ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();
  }
}
function arm(ctx,shoulder,elbow,hand,sleeve,skin,shortSleeve){
  stroke(ctx,[shoulder,elbow],sleeve,9.3);
  if(shortSleeve)stroke(ctx,[elbow,hand],skin,8.2);
  else stroke(ctx,[elbow,hand],sleeve,8);
  ellipse(ctx,...hand,4.6,4.6,skin);
}
function leg(ctx,hip,knee,foot,cloth,shoe){
  stroke(ctx,[hip,knee,foot],cloth,11);
  stroke(ctx,[[knee[0]+2,knee[1]],[foot[0]+1,foot[1]]],'#4a526c',2,0);
  path(ctx,[[foot[0]-5,foot[1]-4],[foot[0]+3,foot[1]-5],[foot[0]+9,foot[1]-1],[foot[0]+9,foot[1]+2],[foot[0]-6,foot[1]+2]],shoe);
  stroke(ctx,[[foot[0]-5,foot[1]+.2],[foot[0]+9,foot[1]+.2]],'#eee2cf',1.3,0);
}
function cavaco(ctx,beat){
  ctx.save();ctx.translate(11,-48);ctx.rotate(-0.23+beat*.09);
  ellipse(ctx,-5,0,10,8,'#d58b37','#50301d',2);
  ellipse(ctx,-5,-1,7.6,6,'#edb45c','#8d4d25',1);
  ellipse(ctx,-4,0,2.4,2.6,'#473126');
  path(ctx,[[0,-3],[25,-3],[27,-1],[25,2],[0,2]],'#a86636','#53311c');
  for(let i=-1;i<=1;i++)stroke(ctx,[[-10,i*.85],[26,i*.85]],'#f2da9c',.45,0);
  ctx.restore();
}
export function drawRig(ctx,profile,x,y,facing,pose={}){
  if(profile.id!=='prefeito' && profile.id!=='pagodeiro')return false;
  const mayor=profile.id==='prefeito';
  const skin=mayor?'#e2a078':'#b76e48';
  const shirt=mayor?'#eee6dc':'#38313f';
  const shadow=mayor?'#b5b9cb':'#252431';
  const pants='#303c58';
  const shoe=mayor?'#302e39':'#eee7da';
  const t=pose.phase||0;
  const walking=pose.walk?Math.sin(t*1.6)*(pose.backward?-1:1):0;
  const crouch=clamp(pose.crouch||0);
  const strike=clamp(pose.strike||0),wind=clamp(pose.windup||0);
  const hurt=clamp(pose.hurt||0);
  const kick=!!pose.sweep||!!pose.air||(!pose.special&&profile.estadoNormal?.endsWith('Kick'));
  const attacking=strike>0||wind>0;
  const bob=9*crouch+Math.abs(walking)*1.7+Math.sin(t*.65)*1.1;
  const jump=pose.air?5+8*clamp(pose.airLift||0):0;
  const crouchY=15*crouch;
  const hip=[0,-44+bob+crouchY];
  const rearFoot=[-12+walking*12,-2-jump];
  const frontFoot=[12-walking*12,-2-jump];
  const kickAmount=pose.sweep?40:34;
  if(kick && attacking){
    frontFoot[0]+=strike*kickAmount;
    frontFoot[1]-=strike*(pose.sweep?7:35);
  }
  const rearKnee=[-10+walking*5,-25+bob*.8];
  const frontKnee=[10-walking*6+(kick?strike*12:0),-26+bob*.8-(kick?strike*18:0)];
  ctx.save();ctx.translate(x,y);ctx.scale(facing,1);
  if(pose.ko||pose.fall){
    const amount=pose.ko?1:clamp(pose.fall);
    ctx.translate(-28*amount,-3*amount);
    ctx.rotate(-1.45*amount);
  }else if(hurt)ctx.rotate(-.13*hurt);
  leg(ctx,[-7,hip[1]],rearKnee,rearFoot,pants,shoe);
  leg(ctx,[7,hip[1]],frontKnee,frontFoot,pants,shoe);
  ctx.translate(-wind*3+(kick?-2:5)*strike,bob+crouchY);
  ctx.rotate((kick?-.045:.085)*strike-.09*wind+(pose.dash?.13:0));
  const rearShoulder=[-12,-67],frontShoulder=[12,-66];
  const rearHand=pose.guard?[-2,-77]:[-19-walking*2,-51-wind*4];
  const hand=pose.guard?[17,-77]:pose.special?
    (mayor?[21,-56]:[18,-56]):kick?[18,-59]:
    [18+strike*29-wind*7,-57-strike*4+wind*8];
  arm(ctx,rearShoulder,[-21,-56],rearHand,shirt,skin,!mayor);
  // Camiseta/camisa ocupa o mesmo espaço em todas as poses.
  path(ctx,[[-13,-68],[-4,-73],[11,-70],[17,-60],[12,-43],[5,-39],[-13,-41],[-17,-54]],shirt);
  path(ctx,[[-12,-66],[-7,-71],[-7,-47],[-12,-46]],mayor?'#ffffff':'#484051',null);
  path(ctx,[[7,-68],[11,-65],[13,-51],[8,-47]],shadow,null);
  if(mayor){
    // Grade da camisa original. Padrão desenhado no corpo, sem recortes.
    ctx.save();ctx.beginPath();ctx.moveTo(-13,-68);ctx.lineTo(-4,-73);ctx.lineTo(11,-70);
    ctx.lineTo(17,-60);ctx.lineTo(12,-43);ctx.lineTo(5,-39);ctx.lineTo(-13,-41);
    ctx.lineTo(-17,-54);ctx.closePath();ctx.clip();
    for(let xx=-16;xx<=16;xx+=6)stroke(ctx,[[xx,-73],[xx,-40]],'#a6afc1',.55,0);
    for(let yy=-68;yy<=-42;yy+=6)stroke(ctx,[[-18,yy],[18,yy]],'#a9b2c1',.55,0);
    ctx.restore();path(ctx,[[-3,-72],[3,-72],[1,-63],[-1,-61]],'#f5f4f0',null);
    stroke(ctx,[[-1,-63],[-1,-42]],'#8b9aaa',.8,0);
    ellipse(ctx,0,-56,2.8,3.1,'#202a35','#b4bdc8',.7);
  }else{
    stroke(ctx,[[-14,-59],[12,-59]],'#4c4555',1.4,0);
    stroke(ctx,[[-13,-44],[12,-44]],'#24222f',2,0);
    // corrente dourada pesada
    for(let i=0;i<9;i++){
      const a=Math.PI*.1+i*Math.PI*.8/8;
      const px=-10+20*i/8,py=-68+8*Math.sin(a);
      ellipse(ctx,px,py,2.3,3.3,'#f4c344','#976020',.5);
    }
  }
  stroke(ctx,[[1,-43],[9,-43]],'#1e202c',2.3,0); // cós
  ellipse(ctx,1,-43,2,1.4,'#e4b47b',null);
  // pescoço, orelha, rosto. Sempre ancorados no mesmo corpo.
  stroke(ctx,[[0,-73],[0,-77]],skin,7);
  ellipse(ctx,2,-87,12.5,13.5,skin);
  ellipse(ctx,-9,-86,3,4,skin);
  if(mayor){
    ellipse(ctx,0,-95,10,4.5,'#e8ab80',null); // careca
    stroke(ctx,[[-5,-89],[9,-89]],'#2b2831',1.3,0);
    for(const sx of [-4,5]){
      path(ctx,[[sx-5,-91],[sx+3,-91],[sx+3,-84],[sx-4,-84]],'#d9b9a3','#29262f',1.5);
      stroke(ctx,[[sx-4,-88],[sx+3,-88]],'#2e3343',.7,0);
    }
    stroke(ctx,[[8,-81],[11,-81]],'#8e483e',1,0);
    path(ctx,[[7,-75],[12,-76],[12,-74],[8,-73]],'#85483e',null);
  }else{
    // Barba, óculos aviador, boné LA branco de aba verde.
    path(ctx,[[-10,-84],[-5,-76],[4,-73],[12,-78],[14,-86],[7,-81],[-4,-83]],'#2e2530',null);
    path(ctx,[[-12,-91],[-9,-98],[-2,-102],[9,-100],[15,-95],[18,-90],[21,-87],[12,-88],[-8,-87]],'#f2e9d8');
    path(ctx,[[-10,-90],[-8,-96],[9,-97],[14,-91]],'#ffffff',null);
    path(ctx,[[3,-100],[4,-95],[7,-94],[7,-99]],'#204584',null);
    path(ctx,[[5,-97],[10,-97],[10,-95],[5,-95]],'#204584',null);
    path(ctx,[[8,-91],[23,-89],[21,-86],[7,-87]],'#768057');
    ellipse(ctx,-3,-87,5.8,3.4,'#1f2834','#ddab45',1.1);
    ellipse(ctx,8,-87,5.8,3.4,'#1f2834','#ddab45',1.1);
    stroke(ctx,[[2,-88],[3,-88]],'#dfb451',1,0);
    ellipse(ctx,-10,-79,1.8,2.5,'#f7ca45',null);
    stroke(ctx,[[6,-76],[11,-76]],'#eac5a8',1.1,0);
  }
  arm(ctx,frontShoulder,[15+strike*17,-57-strike*3],hand,shirt,skin,!mayor);
  if(pose.special&&!mayor)cavaco(ctx,(Math.sin(t*2)+1)/2);
  if(pose.special&&mayor){
    path(ctx,[[12,-49],[24,-51],[25,-40],[11,-39]],'#f4dfaa','#735348');
    stroke(ctx,[[14,-45],[21,-45]],'#9d6a52',.8,0);
  }
  if(attacking&&strike>.55&&!kick){
    ctx.save();ctx.globalAlpha=.75;
    stroke(ctx,[[hand[0]-17,hand[1]+7],[hand[0]-7,hand[1]+2]],'#ffe0aa',1.8,0);
    ctx.restore();
  }
  ctx.restore();
  return true;
}
