import { FighterState } from './constants/fighter.js';
import { Ken, Ryu } from './entitites/fighters/index.js';
import { GroundVehicle, LungeSpecial, WaveSpecial, GravelCandySpecial } from './especiais.js?v=brita-v1';

export const elenco = [
  {
    id: 'periquito', nome: 'Periquito do Estar', normal: 'Tapão do Talão',
    estadoNormal: FighterState.MEDIUM_PUNCH, especial: 'Multa',
    descricao: 'Apita e chama o carrinho da fiscalização. Pule para escapar.',
    base: Ryu, efeito: GroundVehicle, recarga: 3200, veiculo: 'fiscalizacao', pacoteArte: true, voz: true,
    color: '#74b9e8', deep: '#334d70', shine: '#bde7ff', skin: '#b97958',
  },
  {
    id: 'pagodeiro', nome: 'Pagodeiro Maluco', normal: 'Chute do Compasso',
    estadoNormal: FighterState.LIGHT_KICK, especial: 'Cavaco da Morte',
    descricao: 'Três batidas de cavaco lançam três ondas que acertam separadamente.',
    base: Ken, efeito: WaveSpecial, recarga: 2900, pacoteArte: true, voz: true,
    color: '#47988a', deep: '#27545c', shine: '#8cd6ae', skin: '#ba764e',
    alternativa: { color: '#a65e8b', deep: '#663c63', shine: '#e9a8bf' },
  },
  {
    id: 'prefeito', nome: 'Prefeito', normal: 'Soco de Gabinete',
    estadoNormal: FighterState.LIGHT_PUNCH, especial: 'Asfaltadora da Morte',
    descricao: 'Uma máquina de asfalto buzina e avança devagar, causando dano alto.',
    base: Ryu, efeito: GroundVehicle, recarga: 3700, veiculo: 'asfalto', pacoteArte: true, voz: true,
    color: '#d79750', deep: '#784848', shine: '#ffd48a', skin: '#dd966b',
    alternativa: { color: '#708eb0', deep: '#344761', shine: '#bdd9e3' },
  },
  {
    id: 'gladiador', nome: 'Gladiador da Avenida', normal: 'Escudada da Avenida',
    estadoNormal: FighterState.MEDIUM_PUNCH, especial: 'Vodka Shot',
    descricao: 'Vira um gole e investe de escudo. Se errar, fica exposto.',
    base: Ryu, efeito: LungeSpecial, recarga: 3300, pacoteArte: true, voz: true,
    investida: { delay: 0.12, speed: 305, duration: 0.28, damage: 29, tint: '#ffb376' },
    color: '#ad6048', deep: '#67363b', shine: '#ecaa64', skin: '#ba7954',
  },
  {
    id: 'oaa', nome: 'OAA', normal: 'Soco Ignorante',
    estadoNormal: FighterState.HEAVY_PUNCH, especial: 'Grito OAA',
    descricao: 'Um soco curto e forte e um grito de perto que interrompe golpes.',
    base: Ryu, efeito: WaveSpecial, recarga: 3100, pacoteArte: true, voz: true,
    onda: { delays: [0], damage: 22, speed: 160, duration: 0.28, height: 58, tint: '#ffd376', forte: true },
    color: '#8b668e', deep: '#4b3658', shine: '#ceabd0', skin: '#c18b64',
  },
  {
    id: 'patinho', oculto: true, nome: 'Patinho Futsal', normal: 'Chute de Bico',
    estadoNormal: FighterState.LIGHT_KICK, especial: 'Bicada Mortal',
    descricao: 'Finge que vai chutar e avança de bico. A finta avisa a hora de defender.',
    base: Ken, efeito: LungeSpecial, recarga: 3000, pacoteArte: true, voz: true,
    investida: { delay: 0.08, speed: 275, duration: 0.26, damage: 26, tint: '#b8dfff' },
    color: '#427ecb', deep: '#28467a', shine: '#8ec6ff', skin: '#f5be53',
  },
  {
    id: 'patomilgrau', nome: 'Pato Mil Grau', normal: 'Tapão de Asa',
    estadoNormal: FighterState.MEDIUM_PUNCH, especial: 'Bicada Mil Grau',
    descricao: 'Ajeita o terno, ameaça o rival e dispara uma bicada em alta velocidade. Defenda ou recue.',
    base: Ken, efeito: LungeSpecial, recarga: 3200, pacoteArte: true, voz: false,
    investida: { delay: 0.12, speed: 310, duration: 0.29, damage: 27, tint: '#ffc94c' },
    color: '#24232c', deep: '#101015', shine: '#e9b950', skin: '#f9e9d4',
    alternativa: { color: '#5a4d63', deep: '#22202c', shine: '#ffd178' },
  },
  {
    id: 'desastroso', oculto: true, nome: 'O Desastroso', normal: 'Tapão Sem Querer',
    estadoNormal: FighterState.MEDIUM_PUNCH, especial: 'Balinha de Brita',
    descricao: 'Arremessa três balinhas de brita em arco na direção da cabeça do rival. Defenda ou pule para escapar.',
    base: Ryu, efeito: GravelCandySpecial, recarga: 3400, pacoteArte: true, voz: false,
    arremesso: { delays: [0, 0.09, 0.18], damage: 9, speed: 270, gravity: 420, duration: 0.8 },
    color: '#706c88', deep: '#484459', shine: '#c7d2d4', skin: '#e4aeb5',
    alternativa: { color: '#8f9dba', deep: '#414d6b', shine: '#e8edff' },
  },
].filter(perfil => !perfil.oculto);
