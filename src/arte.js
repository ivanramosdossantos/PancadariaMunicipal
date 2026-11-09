const ink = '#241a23';

function shape(ctx, points, fill, outline = ink, width = 1.45) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function line(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function oval(ctx, x, y, rx, ry, color, outline) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}

function limb(ctx, points, shade, light, width) {
  line(ctx, points, ink, width + 2.7);
  line(ctx, points, shade, width);
  line(ctx, points.map(([x, y]) => [x - 0.9, y - 0.7]), light, width * 0.4);
}

function cavaco(ctx, strum) {
  ctx.save();
  ctx.translate(9, -41);
  ctx.rotate(-0.24);
  oval(ctx, -5, 0, 11, 8, '#8d4335', ink);
  oval(ctx, -5, -1.8, 10, 6.4, '#e3a557', '#5e352c');
  oval(ctx, -1, -1.3, 3.1, 2.6, '#34232a');
  shape(ctx, [[1,-4],[25,-4],[28,-1],[25,2],[1,1]], '#654136');
  line(ctx, [[-10,-2],[26,-2]], '#ffe2a7', 0.55);
  line(ctx, [[-10,0],[26,0]], '#ffe2a7', 0.55);
  oval(ctx, -7 + strum * 6, -6 + strum * 9, 4, 3, '#bd7850', ink);
  ctx.restore();
}

export function drawFighter(ctx, profile, x, y, facing, pose = {}) {
  const mayor = profile.id === 'prefeito';
  const phase = pose.phase ?? 0;
  const strike = pose.strike ?? 0;
  const windup = pose.windup ?? 0;
  const stride = pose.walk ? Math.sin(phase * 1.6) * (pose.backward ? -1 : 1) : 0;
  const step = stride * 12;
  const hop = pose.air ? 5 + (pose.airLift ?? 0) * 8 : 0;
  const kick = profile.estadoNormal.endsWith('Kick') || pose.air;
  const crouch = pose.crouch ?? 0;
  const hurt = pose.hurt ?? 0;
  const bob = crouch * 18 + (pose.walk ? Math.abs(step) * 0.18 : Math.sin(phase) * 1.4) + windup * 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  if (pose.ko) {
    ctx.translate(-17, -9);
    ctx.rotate(-1.35);
  } else if (pose.hurt) {
    ctx.rotate(-hurt * 0.17);
  }
  const torsoY = -43 + bob;
  const boot = (footX, footY, color) =>
    shape(ctx, [[footX-5,footY-5],[footX+4,footY-5],[footX+8,footY-1],[footX+8,footY+2],[footX-6,footY+2]], color);
  const rearFoot = [-14 + step - crouch * 4, -3 - hop - Math.max(0, stride) * 7];
  limb(ctx, [[-7,torsoY],[-13+step*0.5,-21+hop+bob*0.4],rearFoot], '#252b39', '#555362', 10);
  boot(...rearFoot,'#362d32');
  const kickX = kick ? strike * 29 + windup * 4 : 0;
  const kickY = kick ? strike * 38 + windup * 14 : 0;
  const frontFoot = [13-step+kickX+crouch*5,-3-hop-kickY-Math.max(0,-stride)*7];
  limb(ctx, [[7,torsoY],[11-step*0.5+kickX*0.54,-22-hop-kickY*0.66+bob*0.42],frontFoot], '#343847', '#656778', 10.5);
  boot(...frontFoot,mayor ? '#453037' : '#d8c4aa');
  if (kick && strike > 0.55) {
    line(ctx, [[frontFoot[0]-18,frontFoot[1]+6],[frontFoot[0]+2,frontFoot[1]+4],[frontFoot[0]+10,frontFoot[1]-1]], '#ffdd9b90', 1.5);
  }

  ctx.translate(strike * (kick ? -3 : 7) - windup * 6 + stride * 2,bob);
  ctx.rotate(strike * (kick ? -0.08 : 0.12) - windup * 0.1);
  const rearHand = pose.guard ? [1,-74] : [-14-step*0.4-strike*6,-45-hop*0.52-windup*5];
  limb(ctx, [[-11,-66],[-21-step*0.24,-54],rearHand], profile.deep, profile.color, 9);
  oval(ctx,...rearHand,4.4,4.7,profile.skin,ink);
  const jacket = ctx.createLinearGradient(-17,-67,16,-38);
  jacket.addColorStop(0, profile.shine);
  jacket.addColorStop(0.43, profile.color);
  jacket.addColorStop(1, profile.deep);
  shape(ctx,[[-13,-68],[-4,-73],[10,-71],[16,-62],[12,-42],[4,-38],[-12,-41],[-17,-54]],jacket);
  if (mayor) {
    shape(ctx,[[-6,-69],[7,-70],[9,-42],[-5,-42]],'#f3dfbb','#805344',0.8);
    shape(ctx,[[0,-65],[5,-65],[5,-60],[3,-47],[-2,-45],[-3,-51]],'#a93837','#653130',0.65);
    line(ctx,[[-10,-65],[-6,-54],[-10,-47]],'#ffc879',1.35);
    shape(ctx,[[9,-62],[13,-62],[13,-59],[9,-59]],'#fff0bb',null);
  } else {
    line(ctx,[[-13,-64],[-8,-60],[12,-62]],'#a5dec6',2.9);
    line(ctx,[[-14,-52],[-5,-48],[12,-51]],'#d7c68d',2.6);
    line(ctx,[[-8,-70],[3,-62],[12,-61]],'#de9c52',1.3);
  }
  oval(ctx,-1,-71,5,5,profile.skin,ink);
  shape(ctx,[[-10,-84],[-6,-93],[4,-96],[13,-90],[13,-83],[16,-79],[13,-77],[12,-71],[3,-69],[-5,-73],[-10,-78]],profile.skin);
  shape(ctx,[[-7,-84],[-2,-90],[9,-89],[12,-84],[13,-91],[8,-96],[-2,-97],[-9,-93],[-12,-87],[-10,-78]],mayor?'#392732':'#2e3543');
  if (profile.id === 'pagodeiro') {
    shape(ctx,[[-13,-87],[-12,-94],[-5,-100],[5,-101],[14,-94],[16,-90],[23,-88],[21,-85],[10,-87],[-9,-85]],'#328779');
    line(ctx,[[-9,-93],[-3,-97],[7,-97]],'#83c4ac',1.1);
  } else if (profile.acessorio === 'capacete') {
    shape(ctx,[[-13,-79],[-14,-91],[-7,-100],[7,-102],[16,-96],[19,-85],[12,-77]],profile.color);
    shape(ctx,[[1,-91],[17,-92],[19,-85],[4,-84]],'#b6deea');
  } else if (profile.acessorio === 'lenco' || profile.acessorio === 'faixa') {
    shape(ctx,[[-13,-89],[-8,-94],[10,-94],[15,-89],[12,-85],[-10,-85]],profile.shine);
    shape(ctx,[[-11,-90],[-19,-90],[-15,-83],[-10,-86]],profile.color);
  } else if (profile.acessorio === 'fone') {
    line(ctx,[[-10,-80],[-11,-92],[-4,-99],[8,-99],[14,-91]],profile.shine,3);
    oval(ctx,-9,-82,4,6,profile.deep,ink);
  } else if (profile.acessorio === 'oculos') {
    line(ctx,[[-4,-83],[14,-83]],ink,2);
    oval(ctx,10,-82,4,3,'#55404a',ink);
  }
  line(ctx,[[6,-83],[11,-83]],ink,1.5);
  line(ctx,[[7,-74],[11,-74]],'#713b39',1);
  oval(ctx,-7,-79,2.3,2.9,profile.skin,'#7d483e');
  if (!mayor) oval(ctx,-8,-75,1.2,1.4,'#ffce65');
  const reach = kick ? 0 : strike * 31;
  const hand = pose.guard ? [19,-76] : [20+reach+step*0.6-windup*12,-57-hop*0.45-strike*4+windup*9];
  limb(ctx, [[9,-64],[16+reach*0.45+step*0.22,-54-windup*3],hand],profile.deep,profile.color,9);
  oval(ctx,...hand,5,4.3,profile.skin,ink);
  line(ctx,[[hand[0]+1,hand[1]-2],[hand[0]+4,hand[1]-1]],'#efb082',1);
  if (!kick && strike > 0.55) {
    line(ctx, [[hand[0]-24,hand[1]+6],[hand[0]-10,hand[1]+4],[hand[0]-3,hand[1]+1]], '#ffdd9b90', 1.5);
  }
  if (pose.special && profile.id === 'pagodeiro') cavaco(ctx, (Math.sin(phase * 2.4) + 1) / 2);
  if (pose.special && mayor) {
    shape(ctx,[[8,-50],[21,-52],[24,-40],[11,-38]],'#f6db9e','#6b4841');
    line(ctx,[[12,-47],[20,-48],[13,-44],[20,-45]],'#a97555',0.9);
  }
  ctx.restore();
}

export function drawRoller(ctx, x, y, facing, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  for (let i=0;i<6;i++) {
    oval(ctx,-34-i*4, -6-Math.sin(i*2+phase)*4, 7+i, 2+i*0.5, '#ddae7070');
  }
  oval(ctx,0,2,44,5,'#28222a99');
  shape(ctx,[[-38,-14],[-37,-32],[-13,-36],[16,-33],[25,-18],[41,-14],[41,-8],[-36,-8]],'#eaa046','#372631',2);
  shape(ctx,[[-16,-34],[-13,-58],[9,-58],[14,-34]],'#ffce67','#372631',2);
  shape(ctx,[[-11,-38],[-9,-54],[5,-54],[9,-38]],'#6a8e91','#413742',1.4);
  line(ctx,[[-8,-50],[0,-53]],'#c4e1cc',1);
  shape(ctx,[[-37,-20],[-26,-19],[-26,-11],[-37,-11]],'#71494c');
  oval(ctx,-25,-10,13,12,'#39343d','#1f1a26');
  oval(ctx,-25,-10,6,6,'#a7826e','#584653');
  oval(ctx,29,-10,17,13,'#7c7480','#302938');
  oval(ctx,32,-10,12,11,'#a49aa2','#4a4450');
  const spoke = phase * 5;
  line(ctx,[[32+Math.cos(spoke)*8,-10+Math.sin(spoke)*8],[32-Math.cos(spoke)*8,-10-Math.sin(spoke)*8]],'#615866',1.4);
  for(let i=0;i<4;i++) line(ctx,[[-7+i*4,-24],[-4+i*4,-18]],'#704344',1.6);
  oval(ctx,17,-30,3.3,3.1,'#fff1a9',ink);
  ctx.restore();
}
