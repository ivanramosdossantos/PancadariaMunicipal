import { Control } from '../constants/controls.js';
import {
  FighterAttackBaseData, FighterAttackStrength, FighterState,
} from '../constants/fighter.js';
import { SCENE_HEIGHT, SCENE_WIDTH, STAGE_FLOOR, STAGE_MID_POINT, STAGE_PADDING } from '../constants/stage.js';
import { Camera } from '../engine/Camera.js';
import { EntityList } from '../engine/EntityList.js';
import { setVirtualMovement } from '../engine/InputHandler.js';
import { getActualBoxDimensions } from '../utils/collisions.js';
import { drawFighter, oval } from '../arte.js';
import { hitArea } from '../especiais.js';

const specialState = FighterState.SPECIAL_1_HEAVY;
const groundedActions = [FighterState.IDLE, FighterState.WALK_FORWARD, FighterState.WALK_BACKWARD];
const airborne = [FighterState.JUMP_UP, FighterState.JUMP_FORWARD, FighterState.JUMP_BACKWARD];

export class BattleScene {
  constructor(profiles, background, sound = () => {}) {
    this.entities = new EntityList();
    this.background = background;
    this.sound = sound;
    this.health = [100, 100];
    this.effects = [];
    this.remaining = 60;
    this.freezeUntil = 0;
    this.caption = { text: 'Valendo!', until: 750 };
    this.drawOrder = [0, 1];
    this.cpu = { decision: 0, movement: new Set(), action: null };
    this.result = null;
    this.fighters = profiles.map((profile, id) => {
      const fighter = new profile.base(id, this.onHit, this.entities);
      fighter.profile = profile;
      fighter.specialMoves = [];
      fighter.specialReady = 0;
      fighter.queued = null;
      fighter.airStrike = null;
      fighter.states[specialState].init = () => {
        fighter.resetVelocities();
        fighter.effectSpawned = false;
      };
      fighter.states[specialState].update = time => {
        if (fighter.animationFrame >= 3 && !fighter.effectSpawned) {
          fighter.effectSpawned = true;
          this.entities.add(profile.efeito, fighter, time);
          this.sound(profile.id);
        }
        if (fighter.isAnimationCompleted()) fighter.changeState(FighterState.IDLE, time);
      };
      return fighter;
    });
    const [player, cpu] = this.fighters;
    player.opponent = cpu;
    cpu.opponent = player;
    const startTime = { previous: 0, secondsPassed: 0 };
    this.fighters.forEach(fighter => fighter.setAnimationFrame(0, startTime));
    this.camera = new Camera(STAGE_PADDING + STAGE_MID_POINT - SCENE_WIDTH / 2, 16, this.fighters);
  }

  onHit = (time, source, target, position, strength, impact) => {
    if (this.result !== null) return;
    const defender = this.fighters[target];
    const damage = impact.damage ?? FighterAttackBaseData[strength].damage;
    this.health[target] = Math.max(0, this.health[target] - (impact.blocked ? Math.ceil(damage * 0.2) : damage));
    this.drawOrder = [target, source];
    if (!airborne.includes(defender.currentState)) defender.direction = -impact.direction;
    defender.flashUntil = time.previous + 155;
    this.freezeUntil = time.previous + (impact.blocked ? 35 : strength === FighterAttackStrength.HEAVY ? 88 : 57);
    if (position) this.effects.push({ ...position, blocked: impact.blocked, start: time.previous });
    this.sound(impact.blocked ? 'block' : 'hit');
    if (this.health[target] === 0) this.finish(source, time);
  };

  finish(winner, time) {
    this.result = winner;
    for (const [id, fighter] of this.fighters.entries()) {
      setVirtualMovement(id, new Set());
      const state = winner < 0 ? FighterState.IDLE : id === winner ? FighterState.VICTORY : FighterState.KO;
      if (winner < 0) {
        fighter.currentState = state;
        fighter.resetVelocities();
        fighter.setAnimationFrame(0, time);
      } else {
        fighter.changeState(state, time);
      }
      fighter.position.y = STAGE_FLOOR;
      fighter.resetSlide();
    }
  }

  decideCpu(time) {
    if (time.previous < this.cpu.decision) return;
    const [player, cpu] = this.fighters;
    const distance = Math.abs(player.position.x - cpu.position.x);
    const towards = player.position.x < cpu.position.x ? Control.LEFT : Control.RIGHT;
    const movement = new Set();
    this.cpu.decision = time.previous + 105 + Math.random() * 145;
    this.cpu.action = null;
    if (distance > 75) movement.add(towards);
    if (time.previous > 1100) {
      if (distance < 90 && player.states[player.currentState].attackType && Math.random() < 0.52) {
        movement.clear();
        movement.add(Control.DOWN);
      } else if (distance > 52 && distance < 155 && time.previous > cpu.specialReady && Math.random() < 0.22) {
        this.cpu.action = 'special';
      } else if (distance < 65 && Math.random() < 0.77) {
        this.cpu.action = 'normal';
      } else if (distance < 112 && distance > 58 && Math.random() < 0.16) {
        movement.add(Control.UP);
      }
    }
    this.cpu.movement = movement;
  }

  updateFighter(fighter, movement, action, time) {
    const now = time.previous;
    setVirtualMovement(fighter.playerId, movement);
    fighter.guarding = movement.has(Control.DOWN) && fighter.position.y >= STAGE_FLOOR
      && (groundedActions.includes(fighter.currentState) || fighter.currentState.startsWith('crouch'));
    if (action) fighter.queued = { action, until: now + 150 };
    if (fighter.queued?.until < now) fighter.queued = null;
    if (now < this.freezeUntil) {
      fighter.updateHurtShake(time, this.freezeUntil);
      return;
    }
    if (fighter.queued && !fighter.guarding) {
      const command = fighter.queued.action;
      if (groundedActions.includes(fighter.currentState) && !movement.has(Control.UP)) {
        const state = command === 'normal' ? fighter.profile.estadoNormal : specialState;
        if (command === 'normal' || now >= fighter.specialReady) {
          fighter.direction = fighter.getDirection();
          fighter.attackStruck = false;
          fighter.changeState(state, time);
          fighter.queued = null;
          if (command === 'special') {
            fighter.specialReady = now + fighter.profile.recarga;
            this.caption = { text: fighter.profile.especial, until: now + 1250 };
          } else {
            this.sound('swing');
          }
        }
      } else if (command === 'normal' && airborne.includes(fighter.currentState) && !fighter.airStrike) {
        fighter.airStrike = { start: now, hit: false };
        fighter.queued = null;
        this.sound('swing');
      }
    }
    fighter.update(time, this.camera);
    if (!airborne.includes(fighter.currentState)) fighter.airStrike = null;
    if (fighter.airStrike && !fighter.airStrike.hit && now - fighter.airStrike.start >= 75 && now - fighter.airStrike.start < 225) {
      const direction = Math.sign(fighter.opponent.position.x - fighter.position.x) || fighter.direction;
      const box = getActualBoxDimensions(fighter.position, direction, { x: 12, y: -36, width: 40, height: 42 });
      fighter.airStrike.hit = hitArea(fighter.opponent, box, time, FighterAttackStrength.LIGHT, 13, direction);
    }
  }

  update(time, movement, action) {
    if (this.result !== null) return;
    this.decideCpu(time);
    this.updateFighter(this.fighters[0], movement, action, time);
    if (this.result !== null) return;
    this.updateFighter(this.fighters[1], this.cpu.movement, this.cpu.action, time);
    this.cpu.action = null;
    if (this.result !== null) return;
    this.entities.update(time, this.camera);
    this.camera.update(time);
    this.effects = this.effects.filter(effect => time.previous - effect.start < 230);
    this.remaining = Math.max(0, this.remaining - time.secondsPassed);
    if (this.remaining === 0 && this.result === null) {
      this.finish(this.health[0] === this.health[1] ? -1 : this.health[0] > this.health[1] ? 0 : 1, time);
    }
  }

  draw(context, now) {
    const { x, y } = this.camera.position;
    const pan = (x - STAGE_PADDING) / (STAGE_MID_POINT * 2 - SCENE_WIDTH);
    context.fillStyle = '#344258';
    context.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    context.drawImage(this.background, -pan * 105, STAGE_FLOOR - 228 - y, SCENE_WIDTH + 105, 262);
    for (const fighter of this.fighters) {
      const height = Math.max(0, STAGE_FLOOR - fighter.position.y);
      oval(context, fighter.position.x - x, STAGE_FLOOR - y + 2, 21 - height / 9, 4, '#21172288');
    }
    for (const id of this.drawOrder) {
      const fighter = this.fighters[id];
      const state = fighter.currentState;
      const box = fighter.boxes.hit;
      const normal = Boolean(fighter.states[state].attackType);
      const airStrike = fighter.airStrike && now - fighter.airStrike.start < 225;
      const facing = airStrike ? Math.sign(fighter.opponent.position.x - fighter.position.x) || fighter.direction : fighter.direction;
      const pose = {
        phase: state === specialState ? (now / 65) % 2 : fighter.animationFrame,
        walk: state.startsWith('walk'),
        air: airborne.includes(state),
        crouch: fighter.guarding || state.startsWith('crouch'),
        strike: airStrike ? 1 : normal && box.width > 0 ? 1 : normal ? 0.18 : 0,
        special: state === specialState,
        hurt: fighter.flashUntil > now,
        ko: state === FighterState.KO,
      };
      drawFighter(context, fighter.profile, fighter.position.x - x - (pose.hurt ? fighter.hurtShake : 0),
        fighter.position.y - y, facing, pose);
    }
    this.entities.draw(context, this.camera);
    for (const effect of this.effects) {
      const age = (now - effect.start) / 230;
      if (age >= 1) continue;
      context.save();
      context.translate(effect.x - x, effect.y - y);
      context.globalAlpha = 1 - age;
      context.strokeStyle = effect.blocked ? '#a9e7ff' : '#ffbd5d';
      context.lineWidth = 1.8;
      for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9 + age;
        const r = 5 + age * 17;
        context.beginPath();
        context.moveTo(Math.cos(angle) * r / 2, Math.sin(angle) * r / 2);
        context.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        context.stroke();
      }
      oval(context, 0, 0, 4 + age * 6, 4 + age * 6, '#fff1ba');
      context.restore();
    }
  }
}
