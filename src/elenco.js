import { FighterState } from './constants/fighter.js';
import { Ken, Ryu } from './entitites/fighters/index.js';

import { AsphaltRoller, CavacoWaves } from './especiais.js';

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
    descricao: 'O cavaco dispara três ondas sonoras.', base: Ken, efeito: CavacoWaves, recarga: 2900,
    color: '#47988a', deep: '#27545c', shine: '#8cd6ae', skin: '#ba764e',
    alternativa: { color: '#a65e8b', deep: '#663c63', shine: '#e9a8bf' },
  },
];
