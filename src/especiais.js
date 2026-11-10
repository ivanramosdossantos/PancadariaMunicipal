import { FIGHTER_DEFAULT_WIDTH, FighterAttackStrength, FighterAttackType, FighterHurtArea, FighterState } from './constants/fighter.js';
import { SCENE_WIDTH, STAGE_FLOOR } from './constants/stage.js';
import { boxOverlap, getActualBoxDimensions } from './utils/collisions.js';
import { drawParkingCart, drawRoller } from './arte.js?v=pixel-real-v3';

export function hitArea(fighter, box, time, strength, damage, direction) {
  for (const [area, [x, y, width, height]] of Object.entries(fighter.boxes.hurt)) {
    if (!width || !height) continue;
    const target = getActualBoxDimensions(fighter.position, fighter.direction, { x, y, width, height });
    if (!boxOverlap(box, target)) continue;
    fighter.handleAttackHit(time, strength, area || FighterHurtArea.BODY, FighterAttackType.PUNCH,
      { x: Math.max(box.x, target.x) + Math.min(box.width, target.width) / 2,
        y: Math.max(box.y, target.y) + Math.min(box.height, target.height) / 2 },
      { damage, direction });
    return true;
  }
  return false;
}

const vehicles = {
  asfalto: { speed: 224, height: 48, reach: 35, damage: 34, life: 2, draw: drawRoller },
  fiscalizacao: { speed: 335, height: 28, reach: 24, damage: 23, life: 1.45, draw: drawParkingCart },
};

export class GroundVehicle {
  constructor(owner, time, entities) {
    this.entities = entities;
    this.target = owner.opponent;
    this.direction = owner.direction;
    this.vehicle = vehicles[owner.profile.veiculo];
    this.x = owner.position.x - 62 * owner.direction;
    this.age = 0;
    this.connected = false;
  }

  update(time) {
    const previous = this.x;
    this.age += time.secondsPassed;
    const { speed, height, reach, damage, life } = this.vehicle;
    this.x += this.direction * speed * time.secondsPassed;
    const box = { x: Math.min(previous, this.x) - reach, y: STAGE_FLOOR - height,
      width: Math.abs(this.x - previous) + 2 * reach, height };
    if (!this.connected) this.connected = hitArea(this.target, box, time, FighterAttackStrength.HEAVY, damage, this.direction);
    if (this.age > life) this.entities.remove(this);
  }

  draw(context, camera) {
    this.vehicle.draw(context, this.x - camera.position.x, STAGE_FLOOR - camera.position.y, this.direction, this.age * 9);
  }
}

export class WaveSpecial {
  constructor(owner, time, entities) {
    this.entities = entities;
    this.target = owner.opponent;
    this.direction = owner.direction;
    this.origin = { x: owner.position.x + 25 * owner.direction, y: owner.position.y - 44 };
    this.age = 0;
    const { delays = [0, 0.12, 0.24], damage = 9, speed = 218, duration = 0.55, height = 40,
      tint = '#b6ffe8', forte = false } = owner.profile.onda ?? {};
    this.waves = delays.map(delay => ({ delay, connected: false }));
    this.damage = damage;
    this.speed = speed;
    this.tint = tint;
    this.duration = duration;
    this.height = height;
    this.strength = forte ? FighterAttackStrength.HEAVY : FighterAttackStrength.LIGHT;
    this.life = duration + delays.at(-1);
  }

  update(time) {
    this.age += time.secondsPassed;
    for (const wave of this.waves) {
      const elapsed = this.age - wave.delay;
      if (elapsed < 0 || elapsed > this.duration || wave.connected) continue;
      const x = this.origin.x + elapsed * this.speed * this.direction;
      wave.connected = hitArea(this.target, { x: x - 13, y: this.origin.y - this.height / 2, width: 26, height: this.height },
        time, this.strength, this.damage, this.direction);
    }
    if (this.age > this.life) this.entities.remove(this);
  }

  draw(context, camera) {
    context.save();
    for (const wave of this.waves) {
      const elapsed = this.age - wave.delay;
      if (elapsed < 0 || elapsed > this.duration) continue;
      const x = this.origin.x + elapsed * this.speed * this.direction - camera.position.x;
      const y = this.origin.y - camera.position.y;
      context.globalAlpha = 1 - elapsed;
      context.strokeStyle = this.tint;
      context.lineWidth = 2.1;
      for (const radius of [9, 14, 20]) {
        context.beginPath();
        const angle = this.direction === 1 ? 0 : Math.PI;
        context.arc(x, y, radius * this.height / 40 + elapsed * 10, angle - 0.95, angle + 0.95);
        context.stroke();
      }
    }
    context.restore();
  }
}

export class LungeSpecial {
  constructor(owner, time, entities) {
    this.owner = owner;
    this.target = owner.opponent;
    this.entities = entities;
    this.direction = owner.direction;
    this.move = owner.profile.investida;
    this.age = 0;
    this.connected = false;
  }

  update(time, camera) {
    const { owner, target, direction, move } = this;
    this.age += time.secondsPassed;
    const elapsed = this.age - move.delay;
    if (owner.currentState !== FighterState.SPECIAL_1_HEAVY || elapsed >= move.duration) {
      owner.specialDashing = false;
      this.entities.remove(this);
      return;
    }
    if (elapsed < 0 || this.connected) return;
    owner.specialDashing = true;
    const wall = camera.position.x + (direction > 0 ? SCENE_WIDTH - FIGHTER_DEFAULT_WIDTH : FIGHTER_DEFAULT_WIDTH);
    const room = Math.min((target.position.x - owner.position.x) * direction - 31, (wall - owner.position.x) * direction);
    owner.position.x += direction * Math.min(move.speed * time.secondsPassed, Math.max(0, room));
    const box = getActualBoxDimensions(owner.position, direction, { x: 10, y: -72, width: 44, height: 51 });
    this.connected = hitArea(target, box, time, FighterAttackStrength.HEAVY, move.damage, direction);
    if (this.connected) owner.specialDashing = false;
  }

  draw(context, camera) {
    if (!this.owner.specialDashing) return;
    const x = this.owner.position.x - camera.position.x;
    const y = this.owner.position.y - camera.position.y;
    context.save();
    context.globalAlpha = 0.65;
    context.fillStyle = this.move.tint;
    for (let i = 0; i < 3; i++) context.fillRect(x - this.direction * (35 + i * 6), y - 22 - i * 12, 16, 2);
    context.restore();
  }
}
