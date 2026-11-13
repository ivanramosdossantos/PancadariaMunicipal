import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/mobile-combate.css', 'utf8');
const js = readFileSync('src/municipal.js', 'utf8');

test('mobile combat stylesheet is loaded after the existing stylesheet', () => {
  assert.match(html, /estilo\.css[^"]*"[\s\S]*mobile-combate\.css/);
  assert.equal((html.match(/mobile-combate\.css/g) || []).length, 1);
});

test('portrait screen has rotation prompt and return action', () => {
  assert.match(html, /class="orientacao-mobile"/);
  assert.match(html, /id="voltar-orientacao"/);
  assert.match(html, /Gire o celular para jogar/);
  assert.match(js, /\$\('voltar-orientacao'\)\.addEventListener\('click', voltarParaSelecao\)/);
  assert.match(js, /retratoTouch && !\$\('duelo'\)\.hidden/);
});

test('landscape UI retains the original engine controls and HUD', () => {
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyZ', 'KeyX', 'Sweep']) {
    assert.ok(html.includes('data-key="' + key + '"'), 'Missing control ' + key);
  }
  for (const id of ['nome0','nome1','vida0','vida1','tempo','especial0','especial1']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing HUD element ' + id);
  }
  assert.match(css, /orientation:landscape/);
  assert.match(css, /pointer:coarse/);
  assert.match(css, /#duelo \.placar/);
  assert.match(css, /#duelo \.comandos-toque/);
});

test('desktop layout remains untouched by mobile selectors', () => {
  assert.match(css, /@media \(pointer:coarse\) and \(orientation:portrait\)/);
  assert.match(css, /@media \(pointer:coarse\) and \(orientation:landscape\)/);
  assert.doesNotMatch(css, /@media\s*\(min-width: *901px\)/);
});
