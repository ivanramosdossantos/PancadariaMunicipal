import { BattleScene } from './scenes/BattleScene.js?v=piloto-v1';
import { Control } from './constants/controls.js';
import { FRAME_TIME } from './constants/game.js';
import { SCENE_WIDTH, SCENE_HEIGHT } from './constants/stage.js';
import { elenco } from './elenco.js?v=piloto-v1';
import { arenas } from './arenas.js';
import { carregarArteLutador, desenharArteSelecao } from './arte-lutador.js';
import { drawFighter } from './arte.js?v=pixel-real-v3';
import { drawPackPortrait, drawPackSelection, artDiagnostics } from './arte-pacotes.js?v=pixel-real-v3';

const $ = id => document.getElementById(id);
const selection = [null, null];
const cards = [];
const arenaCards = [];
const keyboard = new Set();
const touches = new Map();
const movementKeys = new Map([
  ['ArrowLeft', Control.LEFT], ['ArrowRight', Control.RIGHT],
  ['ArrowUp', Control.UP], ['ArrowDown', Control.DOWN],
]);
const actionKeys = new Map([['KeyZ', 'normal'], ['KeyX', 'special'], ['Sweep', 'sweep']]);
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
let selectedArena = null;

function unlockAudio() {
  if (!window.AudioContext) return;
  audio ??= new AudioContext();
  audio.resume().catch(() => {});
}

function playSound(kind) {
  if (audio?.state !== 'running') return;
  const tones = {
    prefeito: [150, 113, 68], pagodeiro: [392, 494, 587, 659],
    periquito: [1300, 1040], gladiador: [105, 175], oaa: [185, 155, 112], patinho: [310, 365],
    hit: [95], block: [270], swing: [156],
  };
  for (const [index, frequency] of (tones[kind] ?? [262, 392]).entries()) {
    const start = audio.currentTime + index * 0.066;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind === 'pagodeiro' || kind === 'oaa' ? 'triangle' : 'sine';
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

function drawCardPortrait(art, profile) {
  const portrait = art.getContext('2d');
  portrait.setTransform(1, 0, 0, 1, 0, 0);
  portrait.clearRect(0, 0, art.width, art.height);
  if (desenharArteSelecao(portrait, profile, 'retrato', art.width, art.height)) return;
  portrait.scale(2, 2);
  if (!drawPackPortrait(portrait, profile, 105, 56)) drawFighter(portrait, profile, 48, 105, 1);
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
    drawCardPortrait(art, profile);
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
  if (selectionStep === 2) {
    for (const item of arenaCards) item.button.setAttribute('aria-pressed', String(item === selectedArena));
    $('avancar').disabled = selectedArena?.status !== 'ready';
    const status = $('carregamento');
    status.textContent = selectedArena?.status === 'loading' ? 'Carregando a arena…'
      : selectedArena?.status === 'error' ? 'A arena não carregou. Selecione outra ou recarregue a página.' : '';
    status.hidden = !status.textContent;
    return;
  }
  const selected = selection[selectionStep];
  for (const button of cards) {
    button.setAttribute('aria-pressed', String(button.dataset.id === selected?.id));
  }
  const art = $('retrato');
  const portrait = art.getContext('2d');
  portrait.setTransform(1, 0, 0, 1, 0, 0);
  portrait.clearRect(0, 0, art.width, art.height);
  if (selected) {
    const direcao = selectionStep ? -1 : 1;
    if (!desenharArteSelecao(portrait, selected, 'pose', art.width, art.height, direcao)) {
      portrait.scale(3, 3);
      if (!drawPackSelection(portrait, selected, 68, 101, direcao)) {
        drawFighter(portrait, selected, 68, 101, direcao, { special: selected.id === 'pagodeiro' });
      }
    }
  }
  art.classList.toggle('vazio', !selected);
  $('nome-ficha').textContent = selected?.nome ?? 'Escolha na grade';
  $('golpes-ficha').textContent = selected ? 'Z · ' + selected.normal + '   /   X · ' + selected.especial : '';
  $('descricao-ficha').textContent = selected?.descricao ?? 'Selecione um retrato para ver os golpes.';
  $('avancar').disabled = !selected;
}

function makeArenaCards(container) {
  for (const [index, arena] of arenas.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card card-arena';
    button.dataset.arena = arena.id;
    const image = new Image();
    image.alt = '';
    const name = document.createElement('strong');
    name.textContent = arena.nome;
    const description = document.createElement('span');
    description.textContent = arena.descricao;
    const item = { arena, button, image, status: 'loading' };
    image.src = arena.imagem;
    image.decode().then(() => { item.status = 'ready'; }, () => { item.status = 'error'; })
      .then(() => { if (selectionStep === 2) updateSelection(); });
    button.append(image, name, description);
    button.addEventListener('click', () => {
      selectedArena = item;
      updateSelection();
    });
    button.addEventListener('keydown', event => {
      const next = index + ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 }[event.key] ?? 0);
      if (next === index || !arenaCards[next]) return;
      event.preventDefault();
      arenaCards[next].button.focus();
      arenaCards[next].button.click();
    });
    arenaCards.push(item);
    container.append(button);
  }
}

function showSelection(step, focus = true) {
  selectionStep = step;
  $('escolhas-lutadores').hidden = step === 2;
  $('escolhas-arenas').hidden = step !== 2;
  $('carregamento').hidden = true;
  $('etapa').textContent = ['01 / 03 · VOCÊ', '02 / 03 · MÁQUINA', '03 / 03 · ARENA'][step];
  $('titulo-selecao').textContent = ['Escolha seu lutador', 'Escolha o adversário', 'Escolha a arena'][step];
  $('lado-ficha').textContent = step === 1 ? 'ADVERSÁRIO · CPU' : 'SEU LUTADOR · 1P';
  $('avancar').textContent = ['Confirmar lutador →', 'Confirmar adversário →', 'Começar duelo →'][step];
  $('voltar-etapa').hidden = step === 0;
  $('voltar-etapa').textContent = step === 2 ? '← Voltar ao adversário' : '← Voltar ao seu lutador';
  $('resumo-selecao').textContent = step === 2 ? selection[0].nome + ' × ' + selection[1].nome
    : step === 1 ? 'Você joga com ' + selection[0].nome : 'Pato Branco · Edição 01';
  $('selecao').dataset.step = String(step);
  for (const label of document.querySelectorAll('[data-step-label]')) {
    if (Number(label.dataset.stepLabel) === step) label.setAttribute('aria-current', 'step');
    else label.removeAttribute('aria-current');
  }
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
  if (!selection[0] || !selection[1] || selectedArena?.status !== 'ready') return;
  unlockAudio();
  resetInput();
  elapsed = 0;
  accumulator = 0;
  last = null;
  const [player, opponent] = selection;
  const alternative = opponent.alternativa ?? { color: '#ac657d', deep: '#63304d', shine: '#f3c7b8' };
  const cpu = player === opponent ? { ...opponent, ...alternative, espelhoCpu: true } : opponent;
  battle = new BattleScene([player, cpu], selectedArena.image, playSound);
  $('edicao-duelo').textContent = 'Arena · ' + selectedArena.arena.cidade;
  $('arena-duelo').textContent = selectedArena.arena.nome;
  canvas.setAttribute('aria-label', 'Arena de combate · ' + selectedArena.arena.nome);
  $('selecao').hidden = true;
  $('duelo').hidden = false;
  $('fim').hidden = true;
  $('voltar').focus();
  render();
}

function render() {
  battle.draw(context, elapsed + accumulator);
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
  if (code === 'KeyZ' && (keyboard.has('ArrowDown') || [...touches.values()].includes('ArrowDown'))) action = 'sweep';
  else if (actionKeys.has(code)) action = actionKeys.get(code);
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
  button.addEventListener('click', event => {
    if (event.detail === 0 && battle && battle.result === null && actionKeys.has(button.dataset.key)) queue(button.dataset.key);
  });
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

function reportArtStatus() {
  const status = $('status-artes');
  if (!status) return;
  const {loaded, failed, requested, failures} = artDiagnostics;
  status.hidden = false;
  status.textContent = failed
    ? 'Erro no carregamento de ' + failed + ' imagens: ' + failures.slice(0,3).join(', ')
    : loaded === requested
      ? 'Artes atualizadas: 6 personagens carregados.'
      : 'Carregando artes dos personagens: ' + loaded + '/' + requested;
  status.dataset.state = failed ? 'error' : loaded === requested ? 'ready' : 'loading';
}
function refreshCards() {
  reportArtStatus();
  for (const button of cards) {
    const profile = elenco.find(item => item.id === button.dataset.id);
    if (!profile) continue;
    drawCardPortrait(button.querySelector('canvas'), profile);
  }
  updateSelection();
}
await Promise.all(elenco.filter(perfil => perfil.pacoteArte).map(carregarArteLutador));
window.addEventListener('pancadaria:arte-carregada', refreshCards);
makeCards($('elenco'));
makeArenaCards($('escolhas-arenas'));
showSelection(0, false);
reportArtStatus();
$('avancar').addEventListener('click', () => selectionStep < 2 ? showSelection(selectionStep + 1) : start());
$('voltar-etapa').addEventListener('click', () => showSelection(selectionStep - 1));
$('revanche').addEventListener('click', start);
$('voltar').addEventListener('click', () => {
  battle = null;
  resetInput();
  $('duelo').hidden = true;
  $('selecao').hidden = false;
  showSelection(0);
});
requestAnimationFrame(frame);
