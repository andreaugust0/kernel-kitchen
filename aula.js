// aula.js - Modo Aula. Não simula nada: lê a linha do tempo pronta e aplica a regra de estados.

/* ========== ADAPTADOR: ajuste aqui se o contrato for diferente ========== */
// Pedido esperado: { id, prato, chegada, preparo, prioridade }
// Trecho esperado: { id, inicio, fim }
const ROTULOS_ALG = { fcfs: 'FCFS', sjf: 'SJF', prioridade: 'Prioridade', rr: 'Round Robin' };

function listaAlgoritmos() {                       // ALGORITMOS = { fcfs: fn(pedidos, quantum), ... }
  return typeof ALGORITMOS !== 'undefined' ? Object.keys(ALGORITMOS) : [];
}
function listaCenarios() {                          // CENARIOS = { chave: [pedidos] } ou { chave: {nome, pedidos} }
  const c = typeof CENARIOS !== 'undefined' ? CENARIOS : {};
  const pares = Array.isArray(c) ? c.map((x, i) => [x.chave ?? x.nome ?? i, x]) : Object.entries(c);
  return pares.map(([chave, v]) => ({
    chave, nome: (v && v.nome) || chave,
    pedidos: (Array.isArray(v) ? v : v.pedidos).map(p => ({
      id: p.id, prato: p.prato ?? p.nome ?? p.id, chegada: p.chegada,
      preparo: p.preparo ?? p.duracao, prioridade: p.prioridade })) }));
}
function ehRR(alg) { return /rr|round/i.test(alg); }
function tipoAlg(alg) {
  return /rr|round/i.test(alg) ? 'rr' : /sjf|menor/i.test(alg) ? 'sjf'
    : /prio/i.test(alg) ? 'prioridade' : 'fcfs';
}
function gerarLinha(alg, pedidos, quantum) {
  const r = ALGORITMOS[alg](pedidos.map(p => ({ ...p })), quantum);
  return (Array.isArray(r) ? r : r.linhaDoTempo).map(t => ({ id: t.id ?? t.pedido, inicio: t.inicio, fim: t.fim }));
}
/* ======================================================================= */

function fimTotal(linha) { return linha.reduce((m, t) => Math.max(m, t.fim), 0); }
function trechoEm(linha, t) { return linha.find(x => x.inicio <= t && t < x.fim); }
function cozinhado(linha, id, t) {
  return linha.filter(x => x.id === id && x.inicio < t)
    .reduce((s, x) => s + Math.min(x.fim, t) - x.inicio, 0);
}
// Regra do enunciado: Novo / Executando / Terminado / Pronto
function estadoEm(linha, p, t) {
  if (t < p.chegada) return 'novo';
  const cobre = trechoEm(linha, t);
  if (cobre && cobre.id === p.id) return 'executando';
  const meus = linha.filter(x => x.id === p.id);
  if (meus.length && t >= Math.max(...meus.map(x => x.fim))) return 'terminado';
  return 'pronto';
}

function explicar(alg, linha, pedidos, t, quantum) {
  const nome = ROTULOS_ALG[tipoAlg(alg)] || alg;
  const por = id => pedidos.find(p => p.id === id);
  const atual = trechoEm(linha, t), ant = trechoEm(linha, t - 1);
  const partes = [];
  if (t === 0 && !atual) return 't = 0: a cozinha abriu, ainda sem pedidos.';
  pedidos.filter(p => p.chegada === t && t > 0).forEach(p => partes.push(`${p.prato} chegou`));
  if (t >= fimTotal(linha)) return `t = ${t}: ` + (partes.concat('todos os pedidos foram entregues.').join('. ') );
  const mudou = !atual || !ant || atual.id !== ant.id;
  if (t > 0 && ant && (!atual || atual.id !== ant.id)) {
    const a = por(ant.id), feito = cozinhado(linha, ant.id, t) >= a.preparo;
    partes.push(feito ? `${a.prato} terminou`
      : `${a.prato} usou sua fatia (quantum ${quantum}) e voltou ao balcão com ${a.preparo - cozinhado(linha, ant.id, t)} restante(s)`);
  }
  if (!atual) { partes.push('o fogão ficou ocioso, esperando pedidos'); return `t = ${t}: ` + partes.join('. ') + '.'; }
  const e = por(atual.id);
  if (mudou || t === 0) {
    const cand = pedidos.filter(p => p.chegada <= t && cozinhado(linha, p.id, t) < p.preparo);
    const so = cand.length <= 1;
    const motivo = so ? 'o único pedido no balcão' : {
      fcfs: 'o que chegou primeiro ao balcão',
      sjf: 'o menor preparo no balcão',
      prioridade: 'a maior prioridade no balcão',
      rr: 'o próximo da fila (cada um cozinha uma fatia)' }[tipoAlg(alg)];
    partes.push(`${nome} escolheu ${e.prato}, ${motivo}`);
  } else partes.push(`${e.prato} continua no fogão`);
  return `t = ${t}: ` + partes.join('. ') + '.';
}

function cartaoHTML(p, restante) {
  const pct = Math.round(restante / p.preparo * 100);
  return `<div class="cartao" style="--cor:${corDoPedido(p.id)}"><strong>${p.id} · ${p.prato}</strong>` +
    `<small>Preparo restante: ${restante}/${p.preparo}</small><small>Prioridade: ${p.prioridade ?? '-'}</small>` +
    `<div class="barra-resto"><i style="width:${pct}%"></i></div></div>`;
}

// ---------------- Tela ----------------
if (typeof document !== 'undefined' && document.getElementById('sel-alg')) {
  const $ = id => document.getElementById(id);
  const cenarios = listaCenarios();
  let linha = [], pedidos = [], t = 0, timer = null;

  listaAlgoritmos().forEach(a => $('sel-alg').add(new Option(ROTULOS_ALG[a] || a, a)));
  cenarios.forEach(c => $('sel-cen').add(new Option(c.nome, c.chave)));

  function quantum() { return Math.max(1, parseInt($('quantum').value, 10) || 1); }

  function carregar() {
    parar();
    const alg = $('sel-alg').value, cen = cenarios.find(c => String(c.chave) === $('sel-cen').value);
    $('campo-quantum').hidden = !ehRR(alg);
    if (!alg || !cen) { $('mensagem').textContent = 'Nenhum algoritmo/cenário encontrado (confira algoritmos.js e cenarios.js).'; return; }
    pedidos = cen.pedidos;
    linha = gerarLinha(alg, pedidos, quantum());
    t = 0; desenhar();
  }

  function desenhar() {
    const total = fimTotal(linha), alg = $('sel-alg').value;
    const col = { pronto: [], executando: [], terminado: [] };
    pedidos.forEach(p => {
      const e = estadoEm(linha, p, t);
      if (e !== 'novo') col[e].push(cartaoHTML(p, p.preparo - cozinhado(linha, p.id, t)));
    });
    $('balcao').innerHTML = col.pronto.join(''); $('fogao').innerHTML = col.executando.join('');
    $('entregues').innerHTML = col.terminado.join('');
    $('relogio').textContent = t;
    desenharGantt($('gantt'), linha, t);
    $('mensagem').textContent = explicar(alg, linha, pedidos, t, quantum());
    $('btn-voltar').disabled = t === 0;
    $('btn-proximo').disabled = t >= total;
    if (t >= total) { parar(); mostrarMedias(); } else $('medias').hidden = true;
  }

  function mostrarMedias() {
    let esp = 0, ta = 0;
    pedidos.forEach(p => {
      const fim = Math.max(...linha.filter(x => x.id === p.id).map(x => x.fim));
      ta += fim - p.chegada; esp += fim - p.chegada - p.preparo;
    });
    const n = pedidos.length;
    $('medias').hidden = false;
    $('medias').innerHTML = `<strong>Fim!</strong> Espera média: <b>${(esp / n).toFixed(2)}</b> · Turnaround médio: <b>${(ta / n).toFixed(2)}</b>`;
  }

  function parar() { clearInterval(timer); timer = null; $('btn-auto').textContent = 'Reproduzir'; }
  function proximo() { if (t < fimTotal(linha)) { t++; desenhar(); } }
  function voltar() { if (t > 0) { t--; desenhar(); } }

  $('btn-proximo').onclick = () => { parar(); proximo(); };
  $('btn-voltar').onclick = () => { parar(); voltar(); };
  $('btn-reiniciar').onclick = () => { parar(); t = 0; desenhar(); };
  $('btn-auto').onclick = () => {
    if (timer) return parar();
    if (t >= fimTotal(linha)) t = 0;
    $('btn-auto').textContent = 'Pausar';
    timer = setInterval(proximo, 900); proximo();
  };
  ['sel-alg', 'sel-cen', 'quantum'].forEach(id => $(id).addEventListener('change', carregar));
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight') { parar(); proximo(); } if (e.key === 'ArrowLeft') { parar(); voltar(); }
  });
  carregar();
}
if (typeof module !== 'undefined') module.exports = { estadoEm, cozinhado, explicar, fimTotal };
// teste