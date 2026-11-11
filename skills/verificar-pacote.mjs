import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const states = ['parado', 'andar', 'pular', 'defender', 'normal', 'especial', 'atingido', 'nocaute', 'vitoria'];
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isText = value => typeof value === 'string' && value.trim().length > 0;
const isInteger = (value, min, max = Infinity) => Number.isInteger(value) && value >= min && value <= max;

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function readPng(folder, filename) {
  requireValue(typeof filename === 'string' && /^[a-z0-9]+(?:[-_][a-z0-9]+)*\.png$/.test(filename),
    'Use nomes simples para os PNGs do pacote.');
  const data = readFileSync(resolve(folder, filename));
  requireValue(data.length >= 33 && data.subarray(0, 8).equals(pngSignature) &&
    data.readUInt32BE(8) === 13 && data.toString('ascii', 12, 16) === 'IHDR', filename + ' não é um PNG válido.');
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  requireValue(width > 0 && height > 0, filename + ' tem dimensões inválidas.');
  const colorType = data[25];
  let transparent = colorType === 4 || colorType === 6;
  let offset = 8;
  let foundData = false;
  let foundEnd = false;
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    requireValue(offset + length + 12 <= data.length, filename + ' está truncado.');
    if (type === 'tRNS') transparent = true;
    if (type === 'IDAT') foundData = true;
    if (type === 'IEND') {
      foundEnd = true;
      break;
    }
    offset += length + 12;
  }
  requireValue(foundData && foundEnd, filename + ' está incompleto.');
  return { width, height, transparent };
}

function verifyFighter(folder, info) {
  requireValue(isText(info.descricao), 'Informe a descrição do lutador.');
  for (const type of ['normal', 'especial']) {
    requireValue(isText(info[type]?.nome) && isText(info[type]?.efeito), 'Informe nome e efeito de ' + type + '.');
  }
  requireValue(isText(info.especial.contraJogo), 'Descreva como o rival pode reagir ao especial.');
  readPng(folder, 'retrato.png');
  const pose = readPng(folder, 'pose.png');
  const atlas = readPng(folder, 'sprites.png');
  const atlases = new Map([['sprites.png', atlas]]);
  requireValue(pose.transparent && atlas.transparent, 'Pose e atlas devem oferecer transparência.');
  const animations = info.animacoes;
  requireValue(animations && typeof animations === 'object' && !Array.isArray(animations), 'Informe as animações do lutador.');
  for (const state of new Set([...states, ...Object.keys(animations)])) {
    const frames = animations[state];
    requireValue(Array.isArray(frames) && frames.length > 0, 'Faltam quadros em ' + state + '.');
    for (const [index, frame] of frames.entries()) {
      const label = state + ', quadro ' + (index + 1);
      const arquivo = frame?.arquivo ?? 'sprites.png';
      if (!atlases.has(arquivo)) atlases.set(arquivo, readPng(folder, arquivo));
      const atlasDoQuadro = atlases.get(arquivo);
      requireValue(atlasDoQuadro.transparent, label + ' deve usar atlas transparente.');
      requireValue(frame?.escala === undefined || Number.isFinite(frame.escala) && frame.escala > 0,
        label + ' tem escala inválida.');
      requireValue(frame && isInteger(frame.x, 0) && isInteger(frame.y, 0) &&
        isInteger(frame.largura, 1) && isInteger(frame.altura, 1) &&
        frame.x + frame.largura <= atlasDoQuadro.width && frame.y + frame.altura <= atlasDoQuadro.height,
      label + ' está fora do atlas ou tem dimensões inválidas.');
      requireValue(isInteger(frame.pivoX, 0, frame.largura) && isInteger(frame.pivoY, 0, frame.altura),
        label + ' tem pivô inválido.');
      requireValue(isInteger(frame.duracaoMs, 1), label + ' deve ter duração positiva em milissegundos.');
    }
    if (['normal', 'especial', 'rasteira', 'aereo'].includes(state)) {
      requireValue(frames.some(frame => frame.contato === true), state + ' precisa de um quadro de contato.');
    }
  }
  return { id: info.id, tipo: 'lutador', atlas: [atlas.width, atlas.height], estados: states.length };
}

function verifyArena(folder, info) {
  requireValue(isText(info.marcoVisual), 'Informe o marco visual da arena.');
  const panorama = readPng(folder, 'panorama.png');
  requireValue(info.largura === panorama.width && info.altura === panorama.height,
    'As dimensões do panorama diferem da ficha.');
  requireValue(isInteger(info.linhaChao, 1, panorama.height - 1), 'A linha do chão deve estar dentro do panorama.');
  const layers = info.camadas ?? [];
  requireValue(Array.isArray(layers), 'camadas deve ser uma lista.');
  const used = new Set(['panorama.png']);
  for (const layer of layers) {
    requireValue(layer && !used.has(layer.arquivo), 'Use um arquivo distinto por camada.');
    requireValue(Number.isFinite(layer.parallax) && layer.parallax >= 0 && layer.parallax <= 1,
      'O parallax de ' + layer.arquivo + ' deve estar entre 0 e 1.');
    const image = readPng(folder, layer.arquivo);
    requireValue(image.width === panorama.width && image.height === panorama.height,
      'A camada ' + layer.arquivo + ' deve ter as dimensões do panorama.');
    used.add(layer.arquivo);
  }
  return { id: info.id, tipo: 'arena', panorama: [panorama.width, panorama.height],
    linhaChao: info.linhaChao, camadas: layers.length };
}

export function verifyPackage(type, folder) {
  requireValue(['lutador', 'arena'].includes(type) && isText(folder),
    'Uso: node skills/verificar-pacote.mjs <lutador|arena> <pasta>');
  const filename = type === 'lutador' ? 'ficha.json' : 'arena.json';
  const info = JSON.parse(readFileSync(resolve(folder, filename), 'utf8').replace(/^\uFEFF/, ''));
  requireValue(info?.versao === 1 && typeof info.id === 'string' && slug.test(info.id) &&
    isText(info.nome) && isText(info.cidade), filename + ' deve ter versão 1, ID válido, nome e cidade.');
  return type === 'lutador' ? verifyFighter(folder, info) : verifyArena(folder, info);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(verifyPackage(process.argv[2], process.argv[3]), null, 2));
  } catch (error) {
    console.error('Pacote inválido. ' + (error.code === 'ENOENT' ? 'Arquivo ausente: ' + basename(error.path) : error.message));
    process.exitCode = 1;
  }
}
