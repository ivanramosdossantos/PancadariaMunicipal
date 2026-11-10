const ORIGENS = ['https://ivanramosdossantos.github.io', 'http://127.0.0.1:18765'];
const CABECALHO = ['Protocolo', 'Recebida em', 'Lutador', 'Cidade', 'Golpe especial', 'Curadoria', 'Pix', 'Número da indicação'];
const COLUNA_NUMERO = CABECALHO.length;

function doPost(evento) {
  const dados = evento.parameter || {};
  const origem = dados.origem;
  const protocolo = String(dados.protocolo || '');
  if (!ORIGENS.includes(origem) || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(protocolo)) {
    return HtmlService.createHtmlOutput('Solicitação inválida.');
  }

  const valores = [dados.lutador, dados.cidade, dados.golpe].map(valor => String(valor || '').trim());
  const limites = [80, 80, 600];
  if (dados.site || valores.some((valor, index) => !valor || valor.length > limites[index])) {
    return responder(origem, protocolo, false);
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return responder(origem, protocolo, false);
  try {
    const propriedades = PropertiesService.getScriptProperties();
    const id = propriedades.getProperty('PLANILHA_ID');
    const planilha = SpreadsheetApp.openById(id);
    const aba = planilha.getSheetByName('Indicações') || planilha.insertSheet('Indicações');
    if (aba.getLastRow() === 0) {
      aba.appendRow(CABECALHO);
      aba.setFrozenRows(1);
    } else if (!aba.getRange(1, COLUNA_NUMERO).getValue()) {
      aba.getRange(1, COLUNA_NUMERO).setValue(CABECALHO[COLUNA_NUMERO - 1]);
    }
    const linhas = aba.getLastRow() - 1;
    const existe = linhas > 0 && aba.getRange(2, 1, linhas, 1).createTextFinder(protocolo).matchEntireCell(true).findNext();
    const celulaNumero = existe && aba.getRange(existe.getRow(), COLUNA_NUMERO);
    let numero = celulaNumero && celulaNumero.getValue();
    if (!numero) {
      numero = Number(propriedades.getProperty('ULTIMA_INDICACAO') || 1000) + 1;
      propriedades.setProperty('ULTIMA_INDICACAO', String(numero));
      if (celulaNumero) celulaNumero.setValue(numero);
      else aba.appendRow([protocolo, new Date(), ...valores.map(textoLiteral), 'Nova', 'Não conferido', numero]);
    }
    SpreadsheetApp.flush();
    return responder(origem, protocolo, true, numero);
  } catch (erro) {
    console.error('Falha ao gravar indicação: ' + erro.name);
    return responder(origem, protocolo, false);
  } finally {
    lock.releaseLock();
  }
}

function textoLiteral(valor) {
  return /^[-=+@]/.test(valor) ? "'" + valor : valor;
}

function responder(origem, protocolo, ok, numero) {
  const mensagem = JSON.stringify({ tipo: 'pancadaria:indicacao', protocolo, ok, numero });
  return HtmlService.createHtmlOutput('<script>window.top.postMessage(' + mensagem + ',' + JSON.stringify(origem) + ');</script>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
