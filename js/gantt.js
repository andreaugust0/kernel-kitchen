// gantt.js - componente compartilhado (Aula e Comparação).
// desenharGantt(elemento, linhaDoTempo, ateInstante?)
// linhaDoTempo = [{ id, inicio, fim }, ...]  (um item por trecho no fogão)
const PALETA_PEDIDOS = ['#e76f51', '#2a9d8f', '#e9c46a', '#457b9d', '#9b5de5',
  '#f28482', '#6a994e', '#f4a261', '#118ab2', '#b5838d'];

// Mesma cor para o mesmo pedido em qualquer tela (usa o número do id: P1, P2...)
function corDoPedido(id) {
  const n = parseInt(String(id).replace(/\D/g, ''), 10);
  if (!isNaN(n)) return PALETA_PEDIDOS[(n - 1 + PALETA_PEDIDOS.length * 100) % PALETA_PEDIDOS.length];
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA_PEDIDOS[h % PALETA_PEDIDOS.length];
}

function desenharGantt(elemento, linhaDoTempo, ateInstante) {
  const trechos = (linhaDoTempo || []).map(t => ({
    id: t.id ?? t.pedido, inicio: t.inicio, fim: t.fim }));
  const total = trechos.reduce((m, t) => Math.max(m, t.fim), 0);
  const limite = ateInstante === undefined ? Infinity : ateInstante;
  elemento.innerHTML = '';
  elemento.classList.add('gantt');
  if (total === 0) return;

  const barra = document.createElement('div');
  barra.className = 'gantt-barra';
  for (const t of trechos) {
    if (t.inicio >= limite) continue;
    const fim = Math.min(t.fim, limite);          // corta o trecho em andamentoo
    const bloco = document.createElement('div');
    bloco.className = 'gantt-bloco';
    bloco.style.left = (t.inicio / total * 100) + '%';
    bloco.style.width = ((fim - t.inicio) / total * 100) + '%';
    bloco.style.background = corDoPedido(t.id);
    bloco.title = `${t.id}: ${t.inicio} → ${fim}`;
    bloco.textContent = t.id;
    barra.appendChild(bloco);
  }

  const regua = document.createElement('div');
  regua.className = 'gantt-regua';
  const passo = total > 30 ? Math.ceil(total / 30) : 1;
  for (let i = 0; i <= total; i += passo) {
    const marca = document.createElement('span');
    marca.style.left = (i / total * 100) + '%';
    marca.textContent = i;
    regua.appendChild(marca);
  }
  elemento.append(barra, regua);
}