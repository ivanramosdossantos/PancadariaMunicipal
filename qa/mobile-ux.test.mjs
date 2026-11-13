import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync('index.html','utf8');
const css=readFileSync('estilo.css','utf8');
const js=readFileSync('src/municipal.js','utf8');
test('layout de controles mobile simplificado e sem tutorial',()=>{
  for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyZ','KeyX']){
    assert.match(html,new RegExp('data-key="'+key+'"'),'faltando '+key);
  }
  assert.doesNotMatch(html,/data-key="Sweep"/);
  assert.match(html,/id="mobile-fullscreen"/);
  assert.match(html,/comandos-toque/);
});
test('botões dimensionados para os polegares e modo paisagem',()=>{
  assert.match(css,/min-height:clamp\(58px/);
  assert.match(css,/orientation:landscape/);
  assert.match(css,/orientation:portrait/);
  assert.match(css,/touch-action:none/);
});
test('respeita o motor existente e o contato simultâneo',()=>{
  assert.match(js,/setPointerCapture/);
  assert.match(js,/touches\.set\(event\.pointerId/);
  assert.match(js,/resetInput\(\)/);
  assert.match(js,/if \(code === 'KeyZ' && \(keyboard\.has\('ArrowDown'\)/);
});
test('mantém apoios e recursos de produção',()=>{
  assert.match(html,/id="apoio"/);
  assert.match(html,/id="pix-indicacao"/);
  assert.match(html,/id="apoiar-apos-duelo"/);
});
