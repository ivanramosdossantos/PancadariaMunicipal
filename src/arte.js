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
  const step = pose.walk ? Math.sin(phase * 1.4) * 11 : 0;
  const hop = pose.air ? 9 : 0;
  const kick = !mayor || pose.air;
  const bob = pose.crouch ? 18 : pose.walk ? Math.abs(step) * 0.17 : Math.sin(phase) * 1.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  if (pose.ko) {
    ctx.translate(-17, -9);
    ctx.rotate(-1.35);
  } else if (pose.hurt) {
    ctx.rotate(-0.11);
  }
  const torsoY = -43 + bob;
  const boot = (footX, footY, color) =>
    shape(ctx, [[footX-5,footY-5],[footX+4,footY-5],[footX+8,footY-1],[footX+8,footY+2],[footX-6,footY+2]], color);
  limb(ctx, [[-7,torsoY],[-13+step,-21+hop],[-14+step,-4-hop]], '#252b39', '#555362', 10);
  boot(-14+step,-3-hop,'#362d32');
  const kickX = kick ? strike * 26 : 0;
  const kickY = kick ? strike * 37 : 0;
  limb(ctx, [[7,torsoY],[11-step+kickX*0.52,-22-hop-kickY*0.7],[13-step+kickX,-4-hop-kickY]], '#343847', '#656778', 10.5);
  boot(13-step+kickX,-3-hop-kickY,mayor ? '#453037' : '#d8c4aa');

  ctx.translate(0,bob);
  limb(ctx, [[-11,-66],[-21,-54],[-14,-45]], profile.deep, profile.color, 9);
  oval(ctx,-14,-45,4.4,4.7,profile.skin,ink);
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
  if (!mayor) {
    shape(ctx,[[-13,-87],[-12,-94],[-5,-100],[5,-101],[14,-94],[16,-90],[23,-88],[21,-85],[10,-87],[-9,-85]],'#328779');
    line(ctx,[[-9,-93],[-3,-97],[7,-97]],'#83c4ac',1.1);
  }
  line(ctx,[[6,-83],[11,-83]],ink,1.5);
  line(ctx,[[7,-74],[11,-74]],'#713b39',1);
  oval(ctx,-7,-79,2.3,2.9,profile.skin,'#7d483e');
  if (!mayor) oval(ctx,-8,-75,1.2,1.4,'#ffce65');
  const reach = kick ? 0 : strike * 31;
  const hand = [20 + reach, -57 + strike * 4];
  limb(ctx, [[9,-64],[16+reach*0.45,-54],hand],profile.deep,profile.color,9);
  oval(ctx,...hand,5,4.3,profile.skin,ink);
  line(ctx,[[hand[0]+1,hand[1]-2],[hand[0]+4,hand[1]-1]],'#efb082',1);
  if (pose.special && !mayor) cavaco(ctx, phase % 2);
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
