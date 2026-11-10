import { Control } from '../constants/controls.js';
import {
  FighterAttackBaseData, FighterAttackStrength, FighterAttackType, FighterHurtStates, FighterState, FrameDelay,
} from '../constants/fighter.js';
import { SCENE_HEIGHT, SCENE_WIDTH, STAGE_FLOOR, STAGE_MID_POINT, STAGE_PADDING } from '../constants/stage.js';
import { Camera } from '../engine/Camera.js';
import { EntityList } from '../engine/EntityList.js';
import { setVirtualMovement } from '../engine/InputHandler.js';
import { getActualBoxDimensions } from '../utils/collisions.js';
import { drawFighter, oval } from '../arte.js';
import { desenharSprite } from '../arte-lutador.js';
import { hitArea } from '../especiais.js';

const specialState = FighterState.SPECIAL_1_HEAVY;
const groundedActions = [FighterState.IDLE, FighterState.WALK_FORWARD, FighterState.WALK_BACKWARD];
const sweepFrom = [...groundedActions, FighterState.CROUCH_DOWN, FighterState.CROUCH, FighterState.CROUCH_UP, FighterState.CROUCH_TURN];
const airborne = [FighterState.JUMP_UP, FighterState.JUMP_FORWARD, FighterState.JUMP_BACKWARD];
const normalStates = [FighterState.LIGHT_PUNCH, FighterState.MEDIUM_PUNCH, FighterState.HEAVY_PUNCH,
  FighterState.LIGHT_KICK, FighterState.MEDIUM_KICK, FighterState.HEAVY_KICK];
const animationRates = Object.fromEntries(Object.values(FighterState).map(state => [state,
  normalStates.includes(state) ? 1.23 : state.startsWith('hurt') ? 1.4 : state === specialState ? 1.13 : 1.1]));
const airContact = 65;
const airRecovery = 200;
const clamp = value => Math.max(0, Math.min(1, value));

function installSweep(fighter) {
  const [crouch] = fighter.animations[FighterState.CROUCH][0];
  const [idle] = fighter.animations[FighterState.IDLE][0];
  const [sprite, push, hurt] = fighter.frames.get(crouch);
  fighter.frames.set('sweep-contact', [sprite, push, hurt, [10, -19, 53, 17]]);
  fighter.frames.set('sweep-down', [sprite, [-19, -18, 38, 18]]);
  fighter.animations[FighterState.SWEEP] = [
    [crouch, 5], ['sweep-contact', 4], [crouch, 12], [crouch, FrameDelay.TRANSITION],
  ];
  fighter.animations[FighterState.KNOCKDOWN] = [
    ['sweep-down', 6], ['sweep-down', 23], ['sweep-down', 10], [idle, FrameDelay.TRANSITION],
  ];
  const recover = time => {
    if (fighter.isAnimationCompleted()) fighter.changeState(FighterState.IDLE, time);
  };
  fighter.states[FighterState.SWEEP] = {
    init: fighter.resetVelocities, update: recover, validFrom: sweepFrom,
    attackType: FighterAttackType.KICK, attackStrength: FighterAttackStrength.LIGHT,
  };
  fighter.states[FighterState.KNOCKDOWN] = {
    init: fighter.resetVelocities, update: recover, validFrom: FighterHurtStates,
  };
  fighter.states[FighterState.IDLE].validFrom.push(FighterState.SWEEP, FighterState.KNOCKDOWN);
}

function attackMotion(fighter, frame) {
  const animation = fighter.animations[fighter.currentState];
  const activeFrames = animation.map(([key], index) => fighter.frames.get(key)?.[3]?.[2] > 0 ? index : -1)
    .filter(index => index >= 0);
  if (!activeFrames.length) return { strike: 0, windup: 0 };
  const first = activeFrames[0];
  const last = activeFrames.at(-1);
  if (frame < first) {
    const progress = frame / first;
    return { strike: clamp((progress - 0.72) / 0.28), windup: Math.sin(Math.PI * progress),
      fase: 'preparo', progresso: progress };
  }
  if (frame < last + 1) return { strike: 1, windup: 0, fase: 'contato', progresso: (frame - first) / (last - first + 1) };
  const progress = clamp((frame - last - 1) / Math.max(1, animation.length - last - 2));
  return { strike: 1 - progress, windup: 0, fase: 'retorno', progresso: progress };
}

function animacaoDoSprite(fighter, frame, pose, tempo, airAge) {
  const state = fighter.currentState;
  const ultimoQuadro = Math.max(1, fighter.animations[state].length - 1);
  const progresso = frame / ultimoQuadro;
  if (state === FighterState.KO) return { estado: 'nocaute', progresso: 1 };
  if (state === FighterState.KNOCKDOWN) return { estado: 'queda', fallback: 'nocaute', progresso };
  if (state === FighterState.VICTORY) return { estado: 'vitoria', progresso: 1 };
  if (state.startsWith('hurt')) return { estado: 'atingido', progresso };
  if (pose.special) {
    const fase = frame < 3 ? 'preparo' : frame < 4 ? 'contato' : 'retorno';
    const segmento = frame < 3 ? frame / 3 : frame < 4 ? frame - 3 : (frame - 4) / Math.max(1, ultimoQuadro - 4);
    return { estado: 'especial', fase, progresso: segmento };
  }
  if (pose.sweep || normalStates.includes(state)) {
    return { estado: pose.sweep ? 'rasteira' : 'normal', fallback: 'defender', fase: pose.fase, progresso: pose.progresso ?? progresso };
  }
  if (airAge < airRecovery) {
    const fase = airAge < airContact ? 'preparo' : airAge < 150 ? 'contato' : 'retorno';
    const segmento = airAge < airContact ? airAge / airContact : airAge < 150
      ? (airAge - airContact) / (150 - airContact) : (airAge - 150) / (airRecovery - 150);
    return { estado: 'aereo', fallback: 'pular', fase, progresso: segmento };
  }
  if (pose.air || state === FighterState.JUMP_START || state === FighterState.JUMP_LAND) return { estado: 'pular', progresso };
  if (pose.crouch) return { estado: 'defender', progresso: pose.crouch };
  return { estado: pose.walk ? 'andar' : 'parado', loop: true, tempo };
}

export class BattleScene {
  constructor(profiles, background, sound = () => {}) {
    this.entities = new EntityList();
    this.background = background;
    this.sound = sound;
    this.health = [100, 100];
    this.effects = [];
    this.remaining = 60;
    this.freezeUntil = 0;
    this.impactTime = 0;
    this.shakeUntil = 0;
    this.caption = { text: 'Valendo!', until: 750 };
    this.drawOrder = [0, 1];
    this.cpu = { decision: 0, movement: new Set(), action: null };
    this.result = null;
    this.fighters = profiles.map((profile, id) => {
      const fighter = new profile.base(id, this.onHit, this.entities);
      fighter.profile = profile;
      fighter.specialMoves = [];
      installSweep(fighter);
      fighter.animationRates = animationRates;
      fighter.initialVelocity.jump *= 1.05;
      fighter.gravity *= 1.12;
      for (const state of Object.keys(fighter.initialVelocity.x)) fighter.initialVelocity.x[state] *= 1.12;
      fighter.specialReady = 0;
      fighter.queued = null;
      fighter.airStrike = null;
      fighter.states[specialState].init = () => {
        fighter.resetVelocities();
        fighter.effectSpawned = false;
        fighter.specialDashing = false;
      };
      fighter.states[specialState].update = time => {
        if (fighter.animationFrame >= 3 && !fighter.effectSpawned) {
          fighter.effectSpawned = true;
          this.entities.add(profile.efeito, fighter, time);
          this.sound(profile.id);
          if (profile.id === 'oaa' && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            this.shakeUntil = time.previous + 150;
          }
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
    this.impactTime = time.previous;
    this.freezeUntil = time.previous + (impact.blocked ? 25 : strength === FighterAttackStrength.HEAVY ? 68 : 39);
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
    this.cpu.decision = time.previous + 90 + Math.random() * 115;
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
    if (action) fighter.queued = { action, until: now + 175 };
    if (fighter.queued?.until < now) fighter.queued = null;
    if (now < this.freezeUntil) {
      fighter.updateHurtShake(time, this.freezeUntil);
      return;
    }
    const sweep = fighter.queued?.action === 'sweep' || (fighter.queued?.action === 'normal' && movement.has(Control.DOWN));
    if (sweep && sweepFrom.includes(fighter.currentState) && fighter.position.y >= STAGE_FLOOR) {
      fighter.guarding = false;
      fighter.direction = fighter.getDirection();
      fighter.attackStruck = false;
      fighter.changeState(FighterState.SWEEP, time);
      fighter.queued = null;
      this.sound('swing');
    } else if (fighter.queued && !sweep && !fighter.guarding) {
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
    if (fighter.airStrike && !fighter.airStrike.hit && now - fighter.airStrike.start >= airContact && now - fighter.airStrike.start < 150) {
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
    context.save();
    if (now < this.shakeUntil) context.translate(Math.sin(now / 8) * (this.shakeUntil - now) / 75, 0);
    context.drawImage(this.background, -pan * 105, STAGE_FLOOR - 228 - y, SCENE_WIDTH + 105, 262);
    for (const fighter of this.fighters) {
      const height = Math.max(0, STAGE_FLOOR - fighter.position.y);
      oval(context, fighter.position.x - x, STAGE_FLOOR - y + 2, 21 - height / 9, 4, '#21172288');
    }
    for (const id of this.drawOrder) {
      const fighter = this.fighters[id];
      const state = fighter.currentState;
      const poseTime = now < this.freezeUntil ? this.impactTime : now;
      const frameLength = fighter.animationTimer - fighter.animationStarted;
      const frame = fighter.animationFrame + (frameLength > 0 ? clamp((poseTime - fighter.animationStarted) / frameLength) : 0);
      const airAge = fighter.airStrike ? poseTime - fighter.airStrike.start : Infinity;
      const airStrike = airAge < airRecovery;
      const sweeping = state === FighterState.SWEEP;
      const motion = sweeping || normalStates.includes(state) ? attackMotion(fighter, frame) : { strike: 0, windup: 0 };
      if (airStrike) {
        motion.strike = airAge < airContact ? clamp(airAge / airContact) : 1 - clamp((airAge - 115) / (airRecovery - 115));
        motion.windup = Math.sin(Math.PI * clamp(airAge / airContact));
      }
      const facing = airStrike ? Math.sign(fighter.opponent.position.x - fighter.position.x) || fighter.direction : fighter.direction;
      const pose = {
        phase: poseTime / 100,
        walk: state.startsWith('walk'),
        backward: state === FighterState.WALK_BACKWARD,
        air: airborne.includes(state),
        airLift: clamp(-fighter.velocity.y / 420),
        crouch: sweeping ? 1 : state === FighterState.CROUCH_DOWN ? clamp((frame + 1) / 2)
          : state === FighterState.CROUCH_UP ? 1 - clamp(frame / 2)
          : state === FighterState.JUMP_START || state === FighterState.JUMP_LAND ? 0.55
          : fighter.guarding || state === FighterState.CROUCH || state === FighterState.CROUCH_TURN ? 1 : 0,
        guard: fighter.guarding,
        sweep: sweeping,
        fall: state === FighterState.KNOCKDOWN ? frame < 1 ? frame : 1 - clamp(frame - 2) : 0,
        ...motion,
        special: state === specialState,
        dash: state === specialState && fighter.specialDashing,
        feint: state === specialState && fighter.profile.id === 'patinho' && frame < 3 ? Math.sin(frame * Math.PI / 3) : 0,
        hurt: clamp(((fighter.flashUntil ?? 0) - poseTime) / 155),
        ko: state === FighterState.KO,
      };
      const fighterX = fighter.position.x - x - (pose.hurt ? fighter.hurtShake : 0);
      const fighterY = fighter.position.y - y;
      if (!fighter.profile.arte || !desenharSprite(context, fighter.profile, fighterX, fighterY, facing,
        animacaoDoSprite(fighter, frame, pose, poseTime, airAge))) {
        drawFighter(context, fighter.profile, fighterX, fighterY, facing, pose);
      }
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
    context.restore();
  }
}
