import { BattleScene } from './scenes/BattleScene.js';
import { Control } from './constants/controls.js';
import { FRAME_TIME } from './constants/game.js';
import { SCENE_WIDTH, SCENE_HEIGHT } from './constants/stage.js';
import { elenco } from './elenco.js';
import { drawFighter } from './arte.js';

const $ = id => document.getElementById(id);
const selection = [null, null];
const cards = [];
const keyboard = new Set();
const touches = new Map();
const movementKeys = new Map([
  ['ArrowLeft', Control.LEFT], ['ArrowRight', Control.RIGHT],
  ['ArrowUp', Control.UP], ['ArrowDown', Control.DOWN],
]);
const actionKeys = new Map([['KeyZ', 'normal'], ['KeyX', 'special']]);
const canvas = document.querySelector('.arena canvas');
const context = canvas.getContext('2d');
context.setTransform(canvas.width / SCENE_WIDTH, 0, 0, canvas.height / SCENE_HEIGHT, 0, 0);
const sides = [0, 1].map(id => ({ name: $('nome' + id), life: $('vida' + id), special: $('especial' + id) }));
let battle = null;
let action = null;
let jumpTap = false;
let elapsed = 0;
let accumulator = 0;
let last = null;
let audio;
let selectionStep = 0;
let arenaReady = false;

function unlockAudio() {
  if (!window.AudioContext) return;
  audio ??= new AudioContext();
  audio.resume().catch(() => {});
}

function playSound(kind) {
  if (audio?.state !== 'running') return;
  const tones = {
    prefeito: [68, 58, 47], pagodeiro: [392, 494, 587, 659],
    hit: [95], block: [270], swing: [156],
  };
  for (const [index, frequency] of (tones[kind] ?? [262, 392]).entries()) {
    const start = audio.currentTime + index * 0.066;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind === 'pagodeiro' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.52, start + 0.11);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(kind === 'swing' ? 0.038 : 0.13, start + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.13);
  }
}

function makeCards(container) {
  for (const [index, profile] of elenco.entries()) {
    const button = document.createElement('button');
    const art = document.createElement('canvas');
    const name = document.createElement('strong');
    button.type = 'button';
    button.className = 'card';
    button.dataset.id = profile.id;
    art.width = 210;
    art.height = 112;
    art.setAttribute('aria-hidden', 'true');
    const portrait = art.getContext('2d');
    portrait.scale(2, 2);
    drawFighter(portrait, profile, 48, 105, 1);
    name.textContent = profile.nome;
    button.append(art, name);
    button.addEventListener('click', () => {
      selection[selectionStep] = profile;
      updateSelection();
    });
    button.addEventListener('keydown', event => {
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[event.key];
      if (!delta) return;
      event.preventDefault();
      const next = index + delta;
      if (!cards[next] || (Math.abs(delta) === 1 && Math.floor(next / 3) !== Math.floor(index / 3))) return;
      cards[next].focus();
      cards[next].click();
    });
    cards.push(button);
    container.append(button);
  }
  for (let slot = cards.length; slot < 9; slot++) {
    const placeholder = document.createElement('div');
    placeholder.className = 'vaga';
    placeholder.textContent = 'Em breve';
    container.append(placeholder);
  }
}

function updateSelection() {
  const selected = selection[selectionStep];
  for (const button of cards) {
    button.setAttribute('aria-pressed', String(button.dataset.id === selected?.id));
  }
  const art = $('retrato');
  const portrait = art.getContext('2d');
  portrait.setTransform(1, 0, 0, 1, 0, 0);
  portrait.clearRect(0, 0, art.width, art.height);
  if (selected) {
    portrait.scale(3, 3);
    drawFighter(portrait, selected, 68, 101, selectionStep ? -1 : 1,
      { special: selected.id === 'pagodeiro' });
  }
  art.classList.toggle('vazio', !selected);
  $('nome-ficha').textContent = selected?.nome ?? 'Escolha na grade';
  $('golpes-ficha').textContent = selected ? 'Z · ' + selected.normal + '   /   X · ' + selected.especial : '';
  $('descricao-ficha').textContent = selected?.descricao ?? 'Selecione um retrato para ver os golpes.';
  $('avancar').disabled = !selected || (selectionStep === 1 && !arenaReady);
}

function showSelection(step, focus = true) {
  selectionStep = step;
  $('etapa').textContent = step ? '02 / 02 · MÁQUINA' : '01 / 02 · VOCÊ';
  $('titulo-selecao').textContent = step ? 'Escolha o adversário' : 'Escolha seu lutador';
  $('lado-ficha').textContent = step ? 'ADVERSÁRIO · CPU' : 'SEU LUTADOR · 1P';
  $('avancar').textContent = step ? 'Começar duelo →' : 'Confirmar lutador →';
  $('voltar-etapa').hidden = step === 0;
  $('resumo-selecao').textContent = step ? 'Você joga com ' + selection[0].nome : 'Arena · Praça da Matriz';
  $('selecao').dataset.step = String(step);
  updateSelection();
  if (focus) $('titulo-selecao').focus();
}

function resetInput() {
  keyboard.clear();
  touches.clear();
  action = null;
  jumpTap = false;
}

function start() {
  unlockAudio();
  resetInput();
  elapsed = 0;
  accumulator = 0;
  last = null;
  const [player, opponent] = selection;
  const alternative = opponent.alternativa ?? { color: '#ac657d', deep: '#63304d', shine: '#f3c7b8' };
  const cpu = player === opponent ? { ...opponent, ...alternative } : opponent;
  battle = new BattleScene([player, cpu], $('matriz'), playSound);
  $('selecao').hidden = true;
  $('duelo').hidden = false;
  $('fim').hidden = true;
  $('voltar').focus();
  render();
}

function render() {
  battle.draw(context, elapsed);
  for (const [id, side] of sides.entries()) {
    const { profile, specialReady } = battle.fighters[id];
    side.name.textContent = (id === 0 ? 'Você · ' : 'CPU · ') + profile.nome;
    side.life.value = battle.health[id];
    const seconds = Math.ceil(Math.max(0, specialReady - elapsed) / 1000);
    side.special.textContent = seconds ? 'Especial em ' + seconds + ' s' : 'Especial pronto';
  }
  $('tempo').textContent = Math.ceil(battle.remaining);
  const caption = battle.caption.until > elapsed ? battle.caption.text : '';
  if ($('chamada').textContent !== caption) $('chamada').textContent = caption;
  if (battle.result !== null && $('fim').hidden) {
    $('resultado').textContent = ['Você venceu!', 'A máquina venceu!'][battle.result] ?? 'Empate!';
    $('fim').hidden = false;
    $('revanche').focus();
  }
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!battle) return;
  const dt = last === null ? 0 : Math.min(100, timestamp - last);
  last = timestamp;
  accumulator += dt;
  const movement = new Set();
  for (const code of [...keyboard, ...touches.values()]) {
    const direction = movementKeys.get(code);
    if (direction && direction !== Control.UP) movement.add(direction);
  }
  if (jumpTap) movement.add(Control.UP);
  while (accumulator >= FRAME_TIME) {
    elapsed += FRAME_TIME;
    battle.update({ previous: elapsed, secondsPassed: FRAME_TIME / 1000 }, movement, action);
    movement.delete(Control.UP);
    jumpTap = false;
    action = null;
    accumulator -= FRAME_TIME;
  }
  render();
}

function queue(code) {
  if (actionKeys.has(code)) action = actionKeys.get(code);
  if (code === 'ArrowUp') jumpTap = true;
}

window.addEventListener('keydown', event => {
  if (!battle || battle.result !== null || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!movementKeys.has(event.code) && !actionKeys.has(event.code)) return;
  event.preventDefault();
  keyboard.add(event.code);
  if (!event.repeat) queue(event.code);
});
window.addEventListener('keyup', event => keyboard.delete(event.code));
window.addEventListener('blur', resetInput);

for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', event => {
    if (!battle || battle.result !== null) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, button.dataset.key);
    queue(button.dataset.key);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(event, ({ pointerId }) => touches.delete(pointerId));
  }
}

makeCards($('elenco'));
showSelection(0, false);
$('avancar').addEventListener('click', () => selectionStep === 0 ? showSelection(1) : start());
$('voltar-etapa').addEventListener('click', () => showSelection(0));
$('revanche').addEventListener('click', start);
$('voltar').addEventListener('click', () => {
  battle = null;
  resetInput();
  $('duelo').hidden = true;
  $('selecao').hidden = false;
  showSelection(0);
});
$('matriz').decode().then(() => {
  arenaReady = true;
  $('carregamento').hidden = true;
  updateSelection();
}).catch(() => { $('carregamento').textContent = 'A arena não carregou. Recarregue a página.'; });
requestAnimationFrame(frame);
