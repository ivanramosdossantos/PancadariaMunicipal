import { arenas } from './arenas.js?v=desastroso-v1';

const cidade = arenas[0].cidade;
const email = 'pancadariamunicipal@gmail.com';
const dialogo = document.getElementById('patrocinar');
const plano = document.getElementById('plano-patrocinio');
const planos = {
  local: { nome: 'Banner local', valor: 300 },
  destaque: { nome: 'Destaque local', valor: 500 },
};
let origem;

for (const legenda of document.querySelectorAll('[data-cidade-patrocinio]')) {
  legenda.textContent = cidade;
}
document.getElementById('titulo-patrocinio').textContent = 'Anuncie em ' + cidade;

function atualizarProposta() {
  const escolhido = planos[plano.value];
  const assunto = 'Patrocínio em ' + cidade + ' · ' + escolhido.nome;
  const mensagem = 'Olá! Tenho interesse em patrocinar a edição de ' + cidade + '.\n\n'
    + 'Plano: ' + escolhido.nome + ' · R$ ' + escolhido.valor + ' por 30 dias.\n\n'
    + 'Empresa: \nNome para contato: \nMensagem: ';
  const parametros = 'subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(mensagem);
  document.getElementById('email-patrocinio').href = 'mailto:' + email + '?' + parametros;
  const gmail = new URL('https://mail.google.com/mail/');
  gmail.search = new URLSearchParams({ view: 'cm', fs: '1', to: email, su: assunto, body: mensagem });
  document.getElementById('gmail-patrocinio').href = gmail.href;
}

for (const botao of document.querySelectorAll('[data-patrocinar]')) {
  botao.addEventListener('click', () => {
    origem = botao;
    atualizarProposta();
    dialogo.showModal();
  });
}
document.getElementById('fechar-patrocinio').addEventListener('click', () => dialogo.close());
dialogo.addEventListener('close', () => origem?.focus({ preventScroll: true }));
plano.addEventListener('change', atualizarProposta);
atualizarProposta();
