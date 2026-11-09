"use strict";

// A seleção e o combate leem o mesmo catálogo. Cada especial combina alcance,
// tempo, impactos e empurrão, com uma apresentação própria.
const roster = [
  {
    name: "Prefeito da Maquete", color: "#e9a54d", dark: "#875044", skin: "#da926e",
    accessory: "maquete", profile: "Vence espaço com um tapume de obra.",
    special: { name: "Obra Relâmpago", duration: 0.68, hits: [0.27], range: 145,
      box: { x: 30, y: -101, width: 93, height: 90 }, damage: 24, push: 83 },
  },
  {
    name: "Vereador Pagodeiro", color: "#56c8ad", dark: "#286969", skin: "#a86549",
    accessory: "pandeiro", profile: "Encurrala o rival com três batidas.",
    special: { name: "CPI do Pandeiro", duration: 0.91, hits: [0.16, 0.31, 0.46], range: 111,
      box: { x: 25, y: -96, width: 65, height: 51 }, damage: 8, push: 25 },
  },
];

const punch = { duration: 0.31, hits: [0.12],
  box: { x: 24, y: -89, width: 38, height: 24 }, damage: 9, push: 35 };
const airStrike = { duration: 0.32, hits: [0.12],
  box: { x: 24, y: -76, width: 34, height: 67 }, damage: 11, push: 36 };
// Caixas locais relativas aos pés. Ataques e áreas vulneráveis são espelhados
// pelo mesmo cálculo que o Fighter usa no projeto de Mayank Jain.
const hurtAreas = [
  { x: -17, y: -125, width: 38, height: 31 },
  { x: -24, y: -94, width: 48, height: 51 },
  { x: -27, y: -43, width: 54, height: 43 },
];
const width = 1000;
const floor = 370;
const arenaInset = 36;
const bodyWidth = 46;
const standingClearance = 124;
const crouchingClearance = 110;
const jumpSpeed = 680;
const gravity = 1420;
const jumpBufferTime = 0.14;
const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");
const arena = new Image();
arena.src = "matriz.svg";
const ui = Object.fromEntries(
  ["fighters", "start", "overlay", "round-title", "round-copy", "status",
   "left-name", "right-name", "left-hp", "right-hp", "clock", "caption"]
    .map(id => [id, document.getElementById(id)])
);

const keyCodes = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyZ", "KeyX"]);
const heldKeys = new Set();
const pointers = new Map();
const effects = [];
const buttons = [];
let selected = 0;
let fighters;
let active = false;
let time = 60;
let lastFrame;
let specialCaption = 0;
let jumpBuffer = 0;
let hitPause = 0;

function makeFighter(profile, x, facing) {
  return { profile, x, facing, hp: 100, y: 0, vy: 0, stun: 0, flash: 0,
    guard: false, specialDelay: 0, action: null, decision: 0, motion: 0, step: 0, intent: "idle" };
}

function prepare() {
  const opponent = roster[(selected + 1) % roster.length];
  fighters = [makeFighter(roster[selected], 307, 1), makeFighter(opponent, 692, -1)];
  time = 60;
  effects.length = 0;
  specialCaption = 0;
  hitPause = 0;
  ui.caption.textContent = "";
  ui["left-name"].textContent = fighters[0].profile.name;
  ui["right-name"].textContent = opponent.name;
  updateScore();
}

function resetInput() {
  heldKeys.clear();
  pointers.clear();
  jumpBuffer = 0;
}

function start() {
  if (active) return;
  resetInput();
  prepare();
  active = true;
  buttons.forEach(button => { button.disabled = true; });
  ui.overlay.hidden = true;
  ui.status.textContent = "Duelo iniciado. Você joga com " + fighters[0].profile.name + ".";
}

function finish() {
  active = false;
  resetInput();
  buttons.forEach(button => { button.disabled = false; });
  const [player, rival] = fighters;
  const result = player.hp === rival.hp ? "Empate!" : player.hp > rival.hp ? "Você venceu!" : "A CPU venceu!";
  ui["round-title"].textContent = result;
  ui["round-copy"].textContent = time <= 0 ? "Fim do tempo na praça." : "A rivalidade continua.";
  ui.start.textContent = "Jogar revanche";
  ui.status.textContent = result;
  ui.overlay.hidden = false;
  ui.start.focus();
}

for (const [index, profile] of roster.entries()) {
  const button = document.createElement("button");
  const name = document.createElement("strong");
  const description = document.createElement("small");
  name.textContent = profile.name;
  description.textContent = profile.special.name + " · " + profile.profile;
  button.append(name, description);
  button.type = "button";
  button.setAttribute("aria-pressed", String(index === selected));
  button.addEventListener("click", () => {
    if (active) return;
    selected = index;
    buttons.forEach((item, i) => item.setAttribute("aria-pressed", String(i === selected)));
    ui["round-title"].textContent = "Escolha seu lutador";
    ui["round-copy"].textContent = "O outro entra como adversário.";
    ui.start.textContent = "Começar duelo";
    prepare();
  });
  buttons.push(button);
  ui.fighters.append(button);
}

ui.start.addEventListener("click", start);
window.addEventListener("keydown", event => {
  if (!active || !keyCodes.has(event.code) || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  if (event.code === "ArrowUp" && !event.repeat) jumpBuffer = jumpBufferTime;
  heldKeys.add(event.code);
});
window.addEventListener("keyup", event => heldKeys.delete(event.code));
window.addEventListener("blur", resetInput);

for (const button of document.querySelectorAll("[data-key]")) {
  button.addEventListener("pointerdown", event => {
    if (!active) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (button.dataset.key === "ArrowUp") jumpBuffer = jumpBufferTime;
    pointers.set(event.pointerId, button.dataset.key);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(type, event => pointers.delete(event.pointerId));
  }
}

function input(code) {
  return heldKeys.has(code) || [...pointers.values()].includes(code);
}

function beginAttack(fighter, special) {
  if (special && fighter.specialDelay > 0) return;
  const move = special ? fighter.profile.special : fighter.y > 0 ? airStrike : punch;
  fighter.action = { move, elapsed: 0, nextHit: 0, special };
  if (special) {
    fighter.specialDelay = 2.6;
    ui.caption.textContent = move.name + "!";
    specialCaption = 1;
  }
}

function updateFighter(fighter, dt, motion, jump, defend, attack, special) {
  fighter.stun = Math.max(0, fighter.stun - dt);
  fighter.flash = Math.max(0, fighter.flash - dt);
  fighter.specialDelay = Math.max(0, fighter.specialDelay - dt);
  fighter.guard = defend && !fighter.stun && !fighter.action && fighter.y === 0;
  const canAct = !fighter.stun && !fighter.action && !fighter.guard;
  const tookOff = canAct && jump && fighter.y === 0;
  if (tookOff) fighter.vy = jumpSpeed;
  const airborne = fighter.y > 0 || tookOff;
  const canMove = canAct || (airborne && !fighter.stun);
  fighter.motion = canMove ? motion : 0;
  fighter.x += fighter.motion * (airborne ? 285 : 235) * dt;
  if (fighter.y > 0 || fighter.vy > 0) {
    fighter.y = Math.max(0, fighter.y + fighter.vy * dt - gravity * dt * dt / 2);
    fighter.vy = fighter.y > 0 ? fighter.vy - gravity * dt : 0;
    if (fighter.y === 0) {
      effects.push({ x: fighter.x, y: floor, kind: "landing", life: 0.22, facing: 1 });
    }
  }
  if (canAct) {
    if (special && fighter.specialDelay === 0) beginAttack(fighter, true);
    else if (attack) beginAttack(fighter, false);
  }
  fighter.step += dt * (fighter.motion ? 14 : 5);
  return tookOff;
}

function driveCpu(cpu, player, dt) {
  const distance = Math.abs(player.x - cpu.x);
  cpu.decision -= dt;
  if (cpu.decision <= 0 && !cpu.action && !cpu.stun) {
    cpu.decision = 0.16 + Math.random() * 0.14;
    if (distance > 104) cpu.intent = "approach";
    else if (player.action && Math.random() < 0.56) cpu.intent = "guard";
    else if (cpu.specialDelay === 0 && Math.random() < 0.28) cpu.intent = "special";
    else cpu.intent = distance <= 78 ? "attack" : "approach";
  }
  updateFighter(cpu, dt, cpu.intent === "approach" ? cpu.facing * 0.72 : 0, false,
    cpu.intent === "guard", cpu.intent === "attack", cpu.intent === "special");
}

function tickAttack(attacker, target, dt) {
  const action = attacker.action;
  if (!action) return;
  action.elapsed += dt;
  const { move } = action;
  while (action.nextHit < move.hits.length && action.elapsed >= move.hits[action.nextHit]) {
    action.nextHit++;
    if (action.special) effects.push({
      x: attacker.x + attacker.facing * (move.range * 0.63), y: floor - attacker.y - 66,
      kind: attacker.profile.accessory, life: 0.24, facing: attacker.facing,
    });
    const attackBox = fighterBox(attacker, move.box);
    const crouch = target.guard ? 12 : 0;
    const contact = hurtAreas.map(area => fighterBox(target, {
      ...area, y: area.y + crouch, height: Math.min(area.height, -area.y - crouch),
    })).find(area => boxOverlap(attackBox, area));
    if (contact) {
      const damage = target.guard ? Math.ceil(move.damage * 0.18) : move.damage;
      target.hp = Math.max(0, target.hp - damage);
      target.stun = target.guard ? 0.09 : 0.19;
      target.flash = 0.12;
      hitPause = target.guard ? 0.024 : action.special ? 0.056 : 0.04;
      if (!target.guard) target.action = null;
      const x = (Math.max(attackBox.x, contact.x) + Math.min(attackBox.x + attackBox.width, contact.x + contact.width)) / 2;
      const y = (Math.max(attackBox.y, contact.y) + Math.min(attackBox.y + attackBox.height, contact.y + contact.height)) / 2;
      target.x += attacker.facing * move.push * (target.guard ? 0.38 : 1);
      effects.push({ x, y, kind: target.guard ? "block" : "hit", life: 0.19, facing: 1 });
    }
  }
  if (action.elapsed >= move.duration) attacker.action = null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fighterBox(fighter, box) {
  return getActualBoxDimensions({ x: fighter.x, y: floor - fighter.y }, fighter.facing, box);
}

function pushBox(fighter) {
  const height = fighter.guard ? crouchingClearance : standingClearance;
  return fighterBox(fighter, { x: -bodyWidth / 2, y: -height, width: bodyWidth, height });
}

function confine(player, cpu, playerWasLeft) {
  player.x = clamp(player.x, arenaInset, width - arenaInset);
  cpu.x = clamp(cpu.x, arenaInset, width - arenaInset);
  if (boxOverlap(pushBox(player), pushBox(cpu))) {
    const halfBody = bodyWidth / 2;
    const inset = arenaInset + halfBody;
    const midpoint = clamp((player.x + cpu.x) / 2, inset, width - inset);
    const left = playerWasLeft ? player : cpu;
    const right = playerWasLeft ? cpu : player;
    left.x = midpoint - halfBody;
    right.x = midpoint + halfBody;
  }
  if (player.x === cpu.x) return;
  const playerDirection = player.x < cpu.x ? 1 : -1;
  if (!player.action) player.facing = playerDirection;
  if (!cpu.action) cpu.facing = -playerDirection;
}

function updateScore() {
  ui["left-hp"].style.width = fighters[0].hp + "%";
  ui["right-hp"].style.width = fighters[1].hp + "%";
  ui.clock.textContent = Math.ceil(time);
}

function update(dt) {
  // Assim como no BattleScene original, um impacto pausa brevemente os lutadores.
  if (hitPause > 0) {
    hitPause = Math.max(0, hitPause - dt);
    return;
  }
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].life -= dt;
    if (effects[i].life <= 0) effects.splice(i, 1);
  }
  if (specialCaption > 0) {
    specialCaption -= dt;
    if (specialCaption <= 0) ui.caption.textContent = "";
  }
  if (!active) return;
  const [player, cpu] = fighters;
  const playerWasLeft = player.x < cpu.x || (player.x === cpu.x && player.facing === 1);
  const jumped = updateFighter(player, dt, Number(input("ArrowRight")) - Number(input("ArrowLeft")),
    jumpBuffer > 0, input("ArrowDown"), input("KeyZ"), input("KeyX"));
  jumpBuffer = jumped ? 0 : Math.max(0, jumpBuffer - dt);
  driveCpu(cpu, player, dt);
  confine(player, cpu, playerWasLeft);
  const playerIsLeft = player.x < cpu.x || (player.x === cpu.x && playerWasLeft);
  tickAttack(player, cpu, dt);
  tickAttack(cpu, player, dt);
  confine(player, cpu, playerIsLeft);
  time = Math.max(0, time - dt);
  updateScore();
  if (!player.hp || !cpu.hp || time === 0) finish();
}

function polygon(points, fill, stroke = "#231b22", lineWidth = 3) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function ellipse(x, y, rx, ry, fill, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawFighter(fighter) {
  const { profile } = fighter;
  const mayor = profile.accessory === "maquete";
  ellipse(fighter.x, floor + 3, 32 - fighter.y * 0.12, 7, "#19131d72");
  ctx.save();
  ctx.translate(fighter.x, floor - fighter.y);
  ctx.scale(fighter.facing, 1);
  const step = fighter.y > 0 ? 8 : fighter.motion ? Math.sin(fighter.step) * 12 : 0;
  const crouch = fighter.guard ? 12 : 0;
  const bob = Math.sin(fighter.step) * 2 + crouch;
  const reach = fighter.action ? Math.sin(Math.min(Math.PI, fighter.action.elapsed / fighter.action.move.duration * Math.PI)) * 29 : 0;
  const color = fighter.flash ? "#fff0c2" : profile.color;
  polygon([[-19,-46+bob],[3,-43+bob],[-9-step,-12],[-10-step,0],[-36-step,0],[-28-step,-12]], profile.dark);
  polygon([[3,-45+bob],[22,-44+bob],[18+step,-15],[31+step,-4],[30+step,0],[5+step,0],[2+step,-14]], profile.dark);
  ctx.translate(0, bob);
  polygon([[-21,-93],[15,-94],[27,-82],[20,-42],[-24,-42],[-30,-72]], color);
  if (mayor) {
    polygon([[-11,-93],[10,-94],[13,-52],[-8,-49]], "#fff1d2", "#7c4a3d", 2);
    polygon([[1,-91],[9,-88],[5,-62],[-1,-58],[-5,-64]], "#923f39", "#7c4a3d", 1);
  } else {
    polygon([[-21,-85],[21,-87],[23,-77],[-26,-75]], "#f3d8a3", profile.dark, 2);
    polygon([[-23,-61],[21,-63],[21,-54],[-24,-52]], "#e2ae68", profile.dark, 2);
  }
  polygon([[-23,-87],[-37,-69],[-31,-51],[-18,-54],[-21,-70],[-12,-78]], profile.dark);
  ellipse(-24, -55, 8, 7, profile.skin, "#231b22");
  ellipse(3, -106, 18, 22, profile.skin, "#231b22");
  polygon(mayor ? [[-16,-110],[-18,-124],[-9,-132],[15,-131],[23,-119],[14,-116],[5,-120],[-7,-114],[-7,-105]]
    : [[-18,-110],[-20,-121],[-10,-133],[9,-136],[24,-124],[22,-119],[1,-118],[-9,-111]], mayor ? "#37282c" : "#1f4c53");
  if (!mayor) polygon([[-4,-119],[25,-124],[37,-119],[30,-114],[-5,-114]], "#3c8d7e");
  ctx.fillStyle = "#302029";
  ctx.fillRect(10, -110, 7, 3);
  ctx.fillRect(12, -97, 7, 2);
  const fistX = 32 + reach;
  const fistY = fighter.guard ? -102 : fighter.action?.move === airStrike ? -59 : -77;
  polygon([[13,-91],[25,-88],[fistX+3,fistY-7],[fistX+5,fistY+3],[25,-69],[13,-75]], color);
  ellipse(fistX+5, fistY-2, 10, 8, profile.skin, "#231b22");
  if (!mayor) {
    ellipse(fistX+6, fistY-1, 13, 16, "#e9ba6b", "#52352e");
    ellipse(fistX+6, fistY-1, 8, 10, "#fff0bc", "#8e6849");
  } else {
    polygon([[-41,-58],[-23,-58],[-18,-43],[-42,-43]], "#b37650", "#52352e", 2);
    polygon([[-40,-58],[-32,-66],[-22,-58]], "#edca7e", "#52352e", 2);
  }
  ctx.restore();
}

function drawEffect(effect) {
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.scale(effect.facing, 1);
  ctx.globalAlpha = Math.min(1, effect.life * 9);
  if (effect.kind === "landing") {
    const spread = 24 + (0.22 - effect.life) * 95;
    ellipse(-spread, 0, 12, 4, "#ead4ad80");
    ellipse(spread, 0, 12, 4, "#ead4ad80");
  } else if (effect.kind === "maquete") {
    polygon([[-22,34],[-22,-21],[37,-30],[37,30]], "#e4ad61", "#67453c");
    for (let x = -15; x <= 28; x += 14) {
      polygon([[x,30],[x,-18],[x+6,-20],[x+6,29]], "#ad603c", "#704832", 1);
    }
  } else if (effect.kind === "pandeiro") {
    ctx.strokeStyle = "#96ffe0";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-4, 0, 44 - effect.life * 85, -1.12, 1.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-6, 0, 34 - effect.life * 85, -1, 1);
    ctx.stroke();
  } else {
    polygon([[-19,0],[-7,-4],[-12,-16],[0,-9],[9,-20],[8,-6],[21,-5],[10,3],[16,14],[1,10],[-8,18],[-7,6]],
      effect.kind === "block" ? "#aee6ff" : "#ffe299", effect.kind === "block" ? "#588ac1" : "#f59449", 2);
  }
  ctx.restore();
}

function draw() {
  ctx.fillStyle = "#344853";
  ctx.fillRect(0, 0, width, canvas.height);
  if (arena.complete && arena.naturalWidth) ctx.drawImage(arena, 0, 0, width, canvas.height);
  fighters.forEach(drawFighter);
  effects.forEach(drawEffect);
}

function frame(timestamp) {
  const dt = lastFrame === undefined ? 0 : Math.min((timestamp - lastFrame) / 1000, 0.033);
  lastFrame = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

prepare();
requestAnimationFrame(frame);
