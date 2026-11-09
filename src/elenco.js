import { FighterState } from './constants/fighter.js';
import { Ken, Ryu } from './entitites/fighters/index.js';

import { AsphaltRoller, WaveSpecial } from './especiais.js';

export const elenco = [
  {
    id: 'prefeito', nome: 'Prefeito da Maquete', normal: 'Soco de gabinete',
    estadoNormal: FighterState.LIGHT_PUNCH, especial: 'Asfalto Superfaturado',
    descricao: 'Uma compactadora atravessa a praça.', base: Ryu, efeito: AsphaltRoller, recarga: 3700,
    color: '#d79750', deep: '#784848', shine: '#ffd48a', skin: '#dd966b',
    alternativa: { color: '#708eb0', deep: '#344761', shine: '#bdd9e3' },
  },
  {
    id: 'pagodeiro', nome: 'Pagodeiro Maluco', normal: 'Chute do compasso',
    estadoNormal: FighterState.LIGHT_KICK, especial: 'Pagode de Choque',
    descricao: 'O cavaco dispara três ondas sonoras.', base: Ken, efeito: WaveSpecial, recarga: 2900,
    color: '#47988a', deep: '#27545c', shine: '#8cd6ae', skin: '#ba764e',
    alternativa: { color: '#a65e8b', deep: '#663c63', shine: '#e9a8bf' },
  },
  {
    id: 'feirante', nome: 'Rainha da Feira', normal: 'Tapão da banca', estadoNormal: FighterState.MEDIUM_PUNCH,
    especial: 'Xepa Relâmpago', descricao: 'Uma rajada curta e forte atravessa a banca.',
    base: Ryu, efeito: WaveSpecial, recarga: 3300, onda: { delays: [0], damage: 27, speed: 195, tint: '#ffdc75' },
    color: '#b94860', deep: '#65314c', shine: '#f38791', skin: '#c78863', acessorio: 'lenco',
  },
  {
    id: 'motoboy', nome: 'Motoboy do Grau', normal: 'Chute da entrega', estadoNormal: FighterState.LIGHT_KICK,
    especial: 'Entrega Expressa', descricao: 'Dois impulsos rápidos acertam de longe.',
    base: Ken, efeito: WaveSpecial, recarga: 3100, onda: { delays: [0, 0.13], damage: 12, speed: 300, tint: '#b6dcff' },
    color: '#537cb7', deep: '#313d69', shine: '#9fc8ff', skin: '#e2a078', acessorio: 'capacete',
  },
  {
    id: 'radialista', nome: 'Radialista do Plantão', normal: 'Soco da notícia', estadoNormal: FighterState.LIGHT_PUNCH,
    especial: 'Plantão Urgente', descricao: 'Uma onda de rádio cobre boa parte da arena.',
    base: Ryu, efeito: WaveSpecial, recarga: 3400, onda: { delays: [0], damage: 24, speed: 270, tint: '#d1aeff' },
    color: '#8960aa', deep: '#4f355f', shine: '#d5a9e8', skin: '#b97954', acessorio: 'fone',
  },
  {
    id: 'boleiro', nome: 'Craque da Várzea', normal: 'Chute de bico', estadoNormal: FighterState.MEDIUM_KICK,
    especial: 'Bicuda no Ângulo', descricao: 'Um disparo veloz pega quem estiver na trajetória.',
    base: Ken, efeito: WaveSpecial, recarga: 3200, onda: { delays: [0], damage: 25, speed: 320, tint: '#c8ff8e' },
    color: '#738e40', deep: '#404f36', shine: '#c4d977', skin: '#a96a4d', acessorio: 'faixa',
  },
  {
    id: 'fiscal', nome: 'Fiscal da Calçada', normal: 'Soco da multa', estadoNormal: FighterState.LIGHT_PUNCH,
    especial: 'Auto de Infração', descricao: 'Duas ondas avançam em sequência e pressionam o rival.',
    base: Ryu, efeito: WaveSpecial, recarga: 3000, onda: { delays: [0, 0.19], damage: 12, speed: 235, tint: '#ffbd9d' },
    color: '#b16742', deep: '#683d36', shine: '#f4bc76', skin: '#d5976e', acessorio: 'oculos',
  },
];
