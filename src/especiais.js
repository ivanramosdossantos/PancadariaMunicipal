import { FighterAttackStrength, FighterAttackType, FighterHurtArea } from './constants/fighter.js';
import { STAGE_FLOOR } from './constants/stage.js';
import { boxOverlap, getActualBoxDimensions } from './utils/collisions.js';
import { drawRoller } from './arte.js';

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

export class AsphaltRoller {
  constructor(owner, time, entities) {
    this.entities = entities;
    this.target = owner.opponent;
    this.direction = owner.direction;
    this.x = owner.position.x - 62 * owner.direction;
    this.age = 0;
    this.connected = false;
  }

  update(time) {
    const previous = this.x;
    this.age += time.secondsPassed;
    this.x += this.direction * 304 * time.secondsPassed;
    const box = { x: Math.min(previous, this.x) - 35, y: STAGE_FLOOR - 48,
      width: Math.abs(this.x - previous) + 70, height: 48 };
    if (!this.connected) this.connected = hitArea(this.target, box, time, FighterAttackStrength.HEAVY, 34, this.direction);
    if (this.age > 1.55) this.entities.remove(this);
  }

  draw(context, camera) {
    drawRoller(context, this.x - camera.position.x, STAGE_FLOOR - camera.position.y, this.direction, this.age * 9);
  }
}

export class WaveSpecial {
  constructor(owner, time, entities) {
    this.entities = entities;
    this.target = owner.opponent;
    this.direction = owner.direction;
    this.origin = { x: owner.position.x + 25 * owner.direction, y: owner.position.y - 44 };
    this.age = 0;
    const { delays = [0, 0.12, 0.24], damage = 9, speed = 218, tint = '#b6ffe8' } = owner.profile.onda ?? {};
    this.waves = delays.map(delay => ({ delay, connected: false }));
    this.damage = damage;
    this.speed = speed;
    this.tint = tint;
  }

  update(time) {
    this.age += time.secondsPassed;
    for (const wave of this.waves) {
      const elapsed = this.age - wave.delay;
      if (elapsed < 0 || elapsed > 0.55 || wave.connected) continue;
      const x = this.origin.x + elapsed * this.speed * this.direction;
      wave.connected = hitArea(this.target, { x: x - 13, y: this.origin.y - 20, width: 26, height: 40 },
        time, FighterAttackStrength.LIGHT, this.damage, this.direction);
    }
    if (this.age > 0.8) this.entities.remove(this);
  }

  draw(context, camera) {
    context.save();
    for (const wave of this.waves) {
      const elapsed = this.age - wave.delay;
      if (elapsed < 0 || elapsed > 0.55) continue;
      const x = this.origin.x + elapsed * this.speed * this.direction - camera.position.x;
      const y = this.origin.y - camera.position.y;
      context.globalAlpha = 1 - elapsed;
      context.strokeStyle = this.tint;
      context.lineWidth = 2.1;
      for (const radius of [9, 14, 20]) {
        context.beginPath();
        const angle = this.direction === 1 ? 0 : Math.PI;
        context.arc(x, y, radius + elapsed * 10, angle - 0.95, angle + 0.95);
        context.stroke();
      }
    }
    context.restore();
  }
}
