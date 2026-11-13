import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const elenco = read('src/elenco.js');
const ficha = JSON.parse(read('src/lutadores/patomilgrau/ficha.json'));
const html = read('index.html');
const dir = 'src/lutadores/patomilgrau/';

test('Pato Mil Grau entra no elenco; Patinho e Desastroso seguem disponíveis no código, mas ocultos', () => {
  assert.match(elenco, /id: 'patomilgrau', nome: 'Pato Mil Grau'/);
  assert.match(elenco, /id: 'patinho', oculto: true, nome:/);
  assert.match(elenco, /id: 'desastroso', oculto: true, nome:/);
  assert.match(elenco, /especial: 'Bicada Mil Grau'/);
  assert.match(elenco, /id: 'patomilgrau'[\s\S]*?efeito: LungeSpecial/);
  assert.ok(existsSync('src/lutadores/patinho/ficha.json'));
  assert.ok(existsSync('src/lutadores/patinho/sprites.png'));
});

test('Atlas e retratos são PNGs reais fornecidos pelo novo pacote', () => {
  for (const name of ['sprites.png','retrato.png','pose.png']) {
    const png = readFileSync(dir + name);
    assert.equal(png.subarray(0,8).toString('hex'), '89504e470d0a1a0a', name);
    assert.ok(png.length > 500, name);
  }
});

test('Animações respeitam limites de 320x304 e contatos de ataque', () => {
  assert.equal(ficha.id, 'patomilgrau');
  assert.equal(ficha.especial.nome, 'Bicada Mil Grau');
  for (const estado of ['parado','andar','pular','defender','normal','especial','atingido','queda','nocaute','vitoria','rasteira','aereo']) {
    const quadros = ficha.animacoes[estado];
    assert.ok(quadros?.length, estado);
    for(const q of quadros){
      assert.ok(q.x>=0 && q.y>=0 && q.x+q.largura<=320 && q.y+q.altura<=304, estado);
      assert.ok(q.pivoX>=0 && q.pivoX<=q.largura && q.pivoY>=0 && q.pivoY<=q.altura, estado);
    }
  }
  for (const estado of ['normal','especial','rasteira','aereo']) {
    assert.ok(ficha.animacoes[estado].some(q=>q.contato===true), estado);
  }
});

test('Capa, Pix, doações e controles mobile preservados', () => {
  assert.match(html,/id="apoio"/);
  assert.match(html,/data-copiar-pix/);
  assert.match(html,/id="apoiar-apos-duelo"/);
  assert.match(html,/data-key="ArrowLeft"/);
  assert.match(html,/data-key="KeyX"/);
  assert.match(html,/src\/municipal.js\?v=pato-mil-grau-v1/);
});
