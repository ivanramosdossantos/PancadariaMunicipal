import { BattleScene } from './scenes/BattleScene.js?v=brita-v1';
import { Control } from './constants/controls.js';
import { FRAME_TIME, VICTORY_MS } from './constants/game.js?v=arcade-v1';
import { SCENE_WIDTH, SCENE_HEIGHT } from './constants/stage.js';
import { elenco } from './elenco.js?v=patinho-retorno-v1';
import { arenas } from './arenas.js?v=desastroso-v1';
import { carregarArteLutador, desenharArteSelecao, desenharSprite } from './arte-lutador.js?v=brita-v1';
import { drawFighter } from './arte.js?v=pixel-real-v3';
import { drawPackPortrait, drawPackSelection, artDiagnostics } from './arte-pacotes.js?v=pixel-real-v3';
import { criarMusicaDeArena } from './musica.js?v=vozes-v1';
import { criarVozes } from './vozes.js?v=selecao-arcade-v1';
import { configurarIndicacoes } from './indicacoes.js?v=desastroso-v1';

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
const controlButtons = document.querySelectorAll('[data-key]');
const musicButtons = document.querySelectorAll('[data-musica]');
const menusIniciais = ['capa', 'indicacao', 'apoio'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const COUNTDOWN_MS = 3000;
const CURTAIN_MS = 280;
const PREVIEW_MS = 210;
const CONFIRM_VOICE_DELAY = .135;
// Frequência, atraso, duração, volume e forma de onda de cada nota do menu.
const MENU_CUES = {
  select: [[698, 0, .046, .034, 'square'], [932, .025, .038, .022, 'triangle']],
  confirm: [[523, 0, .071, .039, 'square'], [784, .046, .073, .034, 'square'], [1047, .073, .057, .023, 'triangle']],
  versus: [[196, 0, .15, .047, 'triangle'], [392, .025, .112, .029, 'square'], [588, .062, .095, .021, 'triangle']],
  count3: [[330, 0, .12, .042, 'square']],
  count2: [[392, 0, .12, .042, 'square']],
  count1: [[494, 0, .13, .047, 'square']],
  go: [[261, 0, .24, .055, 'triangle'], [523, 0, .15, .044, 'square'], [659, .03, .19, .036, 'square'], [1047, .058, .18, .025, 'triangle']],
};
const TEMA_DO_JOGO = new URL('./audio/largada-de-praca.mp3', import.meta.url).href;
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
let musica;
let vozes;
let musicaLigada = true;
let selectionStep = 0;
let selectedArena = null;
let confirmUntil = null;
let previewSince = null;
let cardPreview = null;
let versusUntil = null;
let curtainLeft = 0;
let countdownLeft = 0;

function unlockAudio() {
  if (!window.AudioContext) return;
  audio ??= new AudioContext();
  if (!musica) {
    musica = criarMusicaDeArena(audio);
    musica.silenciar(!musicaLigada);
    vozes = criarVozes(audio, ativo => musica.reduzir(ativo));
    for (const perfil of elenco) vozes.preparar(perfil);
    musica.tocar(TEMA_DO_JOGO);
  }
  audio.resume().catch(() => {});
}

function playSound(kind, perfil) {
  const cue = MENU_CUES[kind];
  if (audio && cue) {
    const now = audio.currentTime;
    for (const [frequency, delay, duration, volume, wave] of cue) {
      const start = now + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = wave;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + .005);
      gain.gain.exponentialRampToValueAtTime(.001, start + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    }
    return;
  }
  if (audio?.state !== 'running') return;
  if (perfil) vozes.tocar(perfil, 'especial');
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
    const stage = document.createElement('span');
    const art = document.createElement('canvas');
    const sprite = document.createElement('canvas');
    const name = document.createElement('strong');
    button.type = 'button';
    button.className = 'card';
    button.dataset.id = profile.id;
    art.width = 210;
    art.height = 112;
    sprite.width = art.width;
    sprite.height = art.height;
    sprite.className = 'card-sprite';
    stage.className = 'card-palco';
    stage.setAttribute('aria-hidden', 'true');
    stage.append(art, sprite);
    drawCardPortrait(art, profile);
    name.textContent = profile.nome;
    button.append(stage, name);
    button.addEventListener('click', () => {
      if (confirmUntil !== null || selection[selectionStep] === profile) return;
      unlockAudio();
      playSound('select');
      selection[selectionStep] = profile;
      previewSince = performance.now();
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

function drawSelectionPreview(now) {
  const selected = selection[selectionStep];
  const art = $('retrato');
  const portrait = art.getContext('2d');
  portrait.setTransform(1, 0, 0, 1, 0, 0);
  portrait.clearRect(0, 0, art.width, art.height);
  if (!selected) return;
  const facing = selectionStep === 1 ? -1 : 1;
  const entrance = reducedMotion.matches || previewSince === null ? 0
    : Math.max(0, 1 - Math.max(0, now - previewSince) / PREVIEW_MS);
  const motion = confirmUntil === null
    ? { estado: 'parado', loop: true, tempo: reducedMotion.matches ? 0 : now - (previewSince ?? 0) }
    : { estado: 'vitoria', progresso: reducedMotion.matches ? 1 : 1 - (confirmUntil - now) / VICTORY_MS };
  if (cardPreview) {
    const mini = cardPreview.getContext('2d');
    const center = cardPreview.width / 2;
    const floor = cardPreview.height - 5;
    mini.clearRect(0, 0, cardPreview.width, cardPreview.height);
    mini.save();
    mini.fillStyle = '#10182780';
    mini.beginPath();
    mini.ellipse(center, floor, 25, 3, 0, 0, 2 * Math.PI);
    mini.fill();
    mini.translate(center - Math.round(16 * entrance ** 2) * facing, floor);
    mini.scale(.88, .88);
    desenharSprite(mini, selected, 0, 0, facing, motion);
    mini.restore();
  }
  portrait.save();
  portrait.translate(art.width / 2 - Math.round(24 * entrance ** 2) * facing, art.height - 12);
  portrait.globalAlpha = 1 - .28 * entrance;
  portrait.scale(2.45, 2.45);
  const animated = desenharSprite(portrait, selected, 0, 0, facing, motion);
  portrait.restore();
  if (animated || desenharArteSelecao(portrait, selected, 'pose', art.width, art.height, facing)) return;
  portrait.scale(3, 3);
  if (!drawPackSelection(portrait, selected, 68, 101, facing)) drawFighter(portrait, selected, 68, 101, facing);
}

function updateSelection() {
  if (selectionStep === 2) {
    for (const item of arenaCards) item.button.setAttribute('aria-pressed', String(item === selectedArena));
    $('avancar').disabled = !selectedArena || selectedArena.status === 'error';
    const status = $('carregamento');
    status.textContent = selectedArena?.status === 'loading' ? 'Carregando a arena…'
      : selectedArena?.status === 'error' ? 'A arena não carregou. Selecione outra ou recarregue a página.' : '';
    status.hidden = !status.textContent;
    return;
  }
  const selected = selection[selectionStep];
  cardPreview = null;
  for (const button of cards) {
    const active = button.dataset.id === selected?.id;
    const animated = active && Boolean(selected.arte);
    button.setAttribute('aria-pressed', String(active));
    if (animated) cardPreview = button.querySelector('.card-sprite');
    button.toggleAttribute('data-animado', animated);
    button.disabled = confirmUntil !== null;
  }
  drawSelectionPreview(performance.now());
  $('retrato').classList.toggle('vazio', !selected);
  $('confirmado').hidden = confirmUntil === null;
  $('nome-ficha').textContent = selected?.nome ?? 'Escolha na grade';
  $('golpes-ficha').textContent = selected ? 'Z · ' + selected.normal + '   /   X · ' + selected.especial : '';
  $('descricao-ficha').textContent = selected?.descricao ?? 'Selecione um retrato para ver os golpes.';
  $('avancar').disabled = !selected || confirmUntil !== null;
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
    const referencia = document.createElement('span');
    referencia.className = 'referencia-arena';
    referencia.textContent = arena.referencia;
    const description = document.createElement('span');
    description.textContent = arena.descricao;
    const item = { arena, button, image, status: 'loading' };
    image.src = arena.imagem;
    image.decode().then(() => { item.status = 'ready'; }, () => { item.status = 'error'; })
      .then(() => { if (selectionStep === 2) updateSelection(); });
    button.append(image, name, referencia, description);
    button.addEventListener('click', () => {
      if (selectedArena === item) return;
      unlockAudio();
      playSound('select');
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
  confirmUntil = null;
  previewSince = null;
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
  for (const button of controlButtons) delete button.dataset.pressionado;
  action = null;
  jumpTap = false;
}

function showVersus() {
  if (!selection[0] || !selection[1] || !selectedArena || selectedArena.status === 'error') return;
  unlockAudio();
  playSound('versus');
  musica?.preparar(selectedArena.arena.musica);
  versusUntil = performance.now() + 720;
  drawCardPortrait($('versus-p1'), selection[0]);
  drawCardPortrait($('versus-cpu'), selection[1]);
  $('versus-nome0').textContent = selection[0].nome;
  $('versus-nome1').textContent = selection[1].nome;
  $('versus-arena').textContent = selectedArena.arena.nome;
  $('versus-status').hidden = selectedArena.status === 'ready';
  $('selecao').hidden = true;
  $('versus').hidden = false;
  $('titulo-versus').focus();
}

function returnToArena() {
  versusUntil = null;
  $('versus').hidden = true;
  $('selecao').hidden = false;
  showSelection(2);
}

function showStartCue(text) {
  const cue = $('largada');
  if ($('contagem').textContent === text) return;
  const label = document.createElement('span');
  label.textContent = text;
  cue.hidden = false;
  cue.dataset.go = String(text === 'VALENDO!');
  $('contagem').replaceChildren(label);
  if (text === 'VALENDO!') $('dica-largada').hidden = true;
  playSound(text === 'VALENDO!' ? 'go' : 'count' + text);
}

function start(mostrarDica = true) {
  if (!selection[0] || !selection[1] || selectedArena?.status !== 'ready') return;
  unlockAudio();
  if (battle) vozes?.parar();
  musica?.preparar(selectedArena.arena.musica);
  resetInput();
  elapsed = 0;
  accumulator = 0;
  last = null;
  versusUntil = null;
  curtainLeft = reducedMotion.matches ? 0 : CURTAIN_MS;
  countdownLeft = COUNTDOWN_MS;
  const [player, opponent] = selection;
  const alternative = opponent.alternativa ?? { color: '#ac657d', deep: '#63304d', shine: '#f3c7b8' };
  const cpu = player === opponent ? { ...opponent, ...alternative, espelhoCpu: true } : opponent;
  battle = new BattleScene([player, cpu], selectedArena.image, playSound);
  $('edicao-duelo').textContent = 'Arena · ' + selectedArena.arena.cidade;
  $('arena-duelo').textContent = selectedArena.arena.nome;
  canvas.setAttribute('aria-label', 'Arena de combate · ' + selectedArena.arena.nome);
  $('selecao').hidden = true;
  $('versus').hidden = true;
  $('duelo').hidden = false;
  $('fim').hidden = true;
  for (const button of controlButtons) button.disabled = true;
  $('cortina-arena').hidden = curtainLeft === 0;
  $('largada').hidden = true;
  $('contagem').textContent = '';
  $('dica-largada').hidden = !mostrarDica;
  if (curtainLeft === 0) showStartCue('3');
  $('voltar').focus({ preventScroll: true });
  render();
}

function render() {
  battle.draw(context, countdownLeft > 0 ? (reducedMotion.matches ? 0 : COUNTDOWN_MS - countdownLeft) : elapsed + accumulator);
  if (elapsed >= 600) $('largada').hidden = true;
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
    musica?.parar();
    vozes?.parar();
    if (battle.result >= 0) vozes?.tocar(battle.fighters[battle.result].profile, 'vitoria');
    $('resultado').textContent = ['Você venceu!', 'A máquina venceu!'][battle.result] ?? 'Empate!';
    $('fim').hidden = false;
    resetInput();
    $('revanche').focus({ preventScroll: true });
  }
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (document.hidden || $('patrocinar').open) {
    resetInput();
    last = null;
    return;
  }
  if (!battle) {
    if (versusUntil !== null) {
      if (selectedArena.status === 'error') returnToArena();
      else if (selectedArena.status === 'ready') {
        $('versus-status').hidden = true;
        if (timestamp >= versusUntil) start();
      }
    } else if (confirmUntil !== null && timestamp >= confirmUntil) {
      showSelection(selectionStep + 1);
    } else if (!$('selecao').hidden && selectionStep < 2 && selection[selectionStep]) {
      drawSelectionPreview(timestamp);
    }
    return;
  }
  const dt = last === null ? 0 : Math.min(100, timestamp - last);
  last = timestamp;
  if (curtainLeft > 0) {
    curtainLeft = Math.max(0, curtainLeft - dt);
    if (curtainLeft === 0) {
      $('cortina-arena').hidden = true;
      showStartCue('3');
    }
    return;
  }
  if (countdownLeft > 0) {
    countdownLeft = Math.max(0, countdownLeft - dt);
    if (countdownLeft > 0) showStartCue(String(Math.ceil(countdownLeft / 1000)));
    else {
      showStartCue('VALENDO!');
      musica?.tocar(selectedArena.arena.musica, selectedArena.arena.inicioMusica);
      for (const button of controlButtons) button.disabled = false;
    }
    render();
    return;
  }
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
  if ($('patrocinar').open) return;
  if (!battle || battle.result !== null || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!movementKeys.has(event.code) && !actionKeys.has(event.code)) return;
  event.preventDefault();
  if (countdownLeft > 0) return;
  keyboard.add(event.code);
  if (!event.repeat) queue(event.code);
});
window.addEventListener('keyup', event => keyboard.delete(event.code));
window.addEventListener('blur', resetInput);
document.addEventListener('visibilitychange', () => {
  resetInput();
  last = null;
});

for (const button of controlButtons) {
  button.addEventListener('click', event => {
    if (event.detail === 0 && battle && !countdownLeft && battle.result === null && actionKeys.has(button.dataset.key)) queue(button.dataset.key);
  });
  button.addEventListener('pointerdown', event => {
    if (!battle || countdownLeft > 0 || battle.result !== null) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, button.dataset.key);
    button.dataset.pressionado = '';
    queue(button.dataset.key);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(event, ({ pointerId }) => {
      touches.delete(pointerId);
      if (![...touches.values()].includes(button.dataset.key)) delete button.dataset.pressionado;
    });
  }
}

function reportArtStatus() {
  const status = $('status-artes');
  if (!status) return;
  const pacotesCarregados = elenco.filter(perfil => perfil.arte).length;
  if (pacotesCarregados === elenco.length) {
    status.hidden = false;
    status.textContent = 'Artes atualizadas: ' + pacotesCarregados + ' personagens carregados.';
    status.dataset.state = 'ready';
    return;
  }
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

function abrirMenu(id) {
  unlockAudio();
  for (const menu of menusIniciais) $(menu).hidden = menu !== id;
  $('selecao').hidden = id !== 'selecao';
  if (id === 'selecao') showSelection(0);
  else $('titulo-' + id).focus();
}

for (const button of document.querySelectorAll('[data-menu]')) {
  button.addEventListener('click', () => abrirMenu(button.dataset.menu));
}
$('iniciar').addEventListener('click', () => abrirMenu('selecao'));
configurarIndicacoes($('form-indicacao'), $('enviar-indicacao'), $('status-indicacao'), $('pix-indicacao'));
for (const option of document.querySelectorAll('input[name="apoio"]')) {
  option.addEventListener('change', () => {
    $('valor-apoio-pix').textContent = option.value === 'livre' ? 'qualquer valor' : 'R$ ' + option.value;
  });
}
for (const button of musicButtons) {
  button.hidden = !window.AudioContext;
  button.addEventListener('click', () => {
    unlockAudio();
    musicaLigada = !musicaLigada;
    for (const control of musicButtons) {
      control.setAttribute('aria-pressed', String(musicaLigada));
      control.querySelector('span').textContent = musicaLigada ? ' ligada' : ' desligada';
    }
    musica?.silenciar(!musicaLigada);
  });
}
window.addEventListener('click', unlockAudio, { once: true });
if (navigator.getAutoplayPolicy?.('audiocontext') !== 'disallowed') unlockAudio();

await Promise.all(elenco.filter(perfil => perfil.pacoteArte).map(carregarArteLutador));
window.addEventListener('pancadaria:arte-carregada', refreshCards);
makeCards($('elenco'));
makeArenaCards($('escolhas-arenas'));
showSelection(0, false);
reportArtStatus();
$('avancar').addEventListener('click', () => {
  if (selectionStep === 2) return showVersus();
  if (!selection[selectionStep] || confirmUntil !== null) return;
  unlockAudio();
  playSound('confirm');
  vozes?.tocar(selection[selectionStep], 'selecao', CONFIRM_VOICE_DELAY);
  confirmUntil = performance.now() + VICTORY_MS;
  updateSelection();
});
$('voltar-etapa').addEventListener('click', () => showSelection(selectionStep - 1));
$('cancelar-versus').addEventListener('click', returnToArena);
$('revanche').addEventListener('click', () => start(false));
function voltarParaSelecao() {
  vozes?.parar();
  musica?.tocar(TEMA_DO_JOGO);
  battle = null;
  resetInput();
  $('duelo').hidden = true;
  $('selecao').hidden = false;
  showSelection(0);
}
$('voltar').addEventListener('click', voltarParaSelecao);
$('novo-confronto').addEventListener('click', voltarParaSelecao);
// Ao encerrar o duelo, abrir a mesma tela de apoio Pix da capa.
$('apoiar-apos-duelo').addEventListener('click', () => {
  vozes?.parar();
  musica?.tocar(TEMA_DO_JOGO);
  battle = null;
  resetInput();
  $('duelo').hidden = true;
  abrirMenu('apoio');
});
requestAnimationFrame(frame);
