import { FighterState } from './constants/fighter.js';
import { Ken, Ryu } from './entitites/fighters/index.js';
import { GroundVehicle, LungeSpecial, WaveSpecial } from './especiais.js';

export const elenco = [
  {
    id: 'periquito', nome: 'Periquito do Estar', normal: 'Tapão do Talão',
    estadoNormal: FighterState.MEDIUM_PUNCH, especial: 'Multa',
    descricao: 'Apita e chama o carrinho da fiscalização. Pule para escapar.',
    base: Ryu, efeito: GroundVehicle, recarga: 3200, veiculo: 'fiscalizacao',
    color: '#74b9e8', deep: '#334d70', shine: '#bde7ff', skin: '#b97958',
  },
  {
    id: 'pagodeiro', nome: 'Pagodeiro Maluco', normal: 'Chute do Compasso',
    estadoNormal: FighterState.LIGHT_KICK, especial: 'Cavaco da Morte',
    descricao: 'Três batidas de cavaco lançam três ondas que acertam separadamente.',
    base: Ken, efeito: WaveSpecial, recarga: 2900,
    color: '#47988a', deep: '#27545c', shine: '#8cd6ae', skin: '#ba764e',
    alternativa: { color: '#a65e8b', deep: '#663c63', shine: '#e9a8bf' },
  },
  {
    id: 'prefeito', nome: 'Prefeito', normal: 'Soco de Gabinete',
    estadoNormal: FighterState.LIGHT_PUNCH, especial: 'Asfaltadora da Morte',
    descricao: 'Uma máquina de asfalto buzina e avança devagar, causando dano alto.',
    base: Ryu, efeito: GroundVehicle, recarga: 3700, veiculo: 'asfalto',
    color: '#d79750', deep: '#784848', shine: '#ffd48a', skin: '#dd966b',
    alternativa: { color: '#708eb0', deep: '#344761', shine: '#bdd9e3' },
  },
  {
    id: 'gladiador', nome: 'Gladiador da Avenida', normal: 'Escudada da Avenida',
    estadoNormal: FighterState.MEDIUM_PUNCH, especial: 'Vodka Shot',
    descricao: 'Vira um gole e investe de escudo. Se errar, fica exposto.',
    base: Ryu, efeito: LungeSpecial, recarga: 3300,
    investida: { delay: 0.12, speed: 305, duration: 0.28, damage: 29, tint: '#ffb376' },
    color: '#ad6048', deep: '#67363b', shine: '#ecaa64', skin: '#ba7954',
  },
  {
    id: 'oaa', nome: 'OAA', normal: 'Soco Ignorante',
    estadoNormal: FighterState.HEAVY_PUNCH, especial: 'Grito OAA',
    descricao: 'Um soco curto e forte e um grito de perto que interrompe golpes.',
    base: Ryu, efeito: WaveSpecial, recarga: 3100,
    onda: { delays: [0], damage: 22, speed: 160, duration: 0.28, height: 58, tint: '#ffd376', forte: true },
    color: '#8b668e', deep: '#4b3658', shine: '#ceabd0', skin: '#c18b64',
  },
  {
    id: 'patinho', nome: 'Patinho Futsal', normal: 'Chute de Bico',
    estadoNormal: FighterState.LIGHT_KICK, especial: 'Bicada Mortal',
    descricao: 'Finge que vai chutar e avança de bico. A finta avisa a hora de defender.',
    base: Ken, efeito: LungeSpecial, recarga: 3000,
    investida: { delay: 0.08, speed: 275, duration: 0.26, damage: 26, tint: '#b8dfff' },
    color: '#427ecb', deep: '#28467a', shine: '#8ec6ff', skin: '#f5be53',
  },
];
