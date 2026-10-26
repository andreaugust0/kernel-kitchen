// comparacao.js - Tela de Comparação de Algoritmos (Pessoa 3)
// Batalha dos quatro algoritmos (FCFS, SJF, Prioridade e Round Robin) lado a lado, com pedidos feitos na hora.
// Conecta algoritmos.js e metricas.js; os Gantts usam um desenho próprio (ver desenharGanttComparacao).

(function () {
  "use strict";

  // Paleta categórica de estilo.css, em ordem fixa: P1 usa a cor 1, P2 a cor 2...
  // Do 9º pedido em diante as cores se repetem com hachura, para nenhum pedido
  // ficar igual a outro. O nome do pedido vai sempre escrito no bloco.
  const CORES_PEDIDOS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
  // Laranja, verde-água, amarelo e rosa são claros demais para texto branco
  const CORES_COM_TEXTO_ESCURO = new Set([1, 2, 3, 4]);
  const HACHURAS = [
    "",
    "repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.4) 0 3px, transparent 3px 7px)",
    "repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0 3px, transparent 3px 7px)",
  ];

  function indicePedido(id) {
    const numero = parseInt(String(id).slice(1), 10);
    return isNaN(numero) || numero < 1 ? 0 : numero - 1;
  }

  function obterCorPedido(id) {
    return CORES_PEDIDOS[indicePedido(id) % CORES_PEDIDOS.length];
  }

  function obterTextoPedido(id) {
    return CORES_COM_TEXTO_ESCURO.has(indicePedido(id) % CORES_PEDIDOS.length) ? "#0a0a0a" : "#ffffff";
  }

  // Fundo completo (hachura + cor), para usar em style.background
  function obterFundoPedido(id) {
    const volta = Math.floor(indicePedido(id) / CORES_PEDIDOS.length) % HACHURAS.length;
    const cor = obterCorPedido(id);
    return HACHURAS[volta] ? `${HACHURAS[volta]}, ${cor}` : cor;
  }

  // Desenho próprio da Comparação, no lugar do desenharGantt do gantt.js: o modo
  // ao vivo precisa de uma escala fixa (tempoTotalMaximo) igual nos quatro Gantts,
  // da régua única embaixo deles e das cores com hachura da paleta acima.
  function desenharGanttComparacao(elemento, linhaDoTempo, ateInstante, tempoTotalMaximo) {
    const container = typeof elemento === "string" ? document.getElementById(elemento) : elemento;
    if (!container) return;

    container.innerHTML = "";

    // Filtra até o instante se especificado (usado no passo a passo do Modo Aula)
    let trechos = linhaDoTempo || [];
    if (typeof ateInstante === "number") {
      trechos = trechos
        .filter((t) => t.inicio < ateInstante)
        .map((t) => ({
          ...t,
          fim: Math.min(t.fim, ateInstante),
        }));
    }

    // Se nenhum tempo total foi passado, usa o término do último trecho da própria linha
    const tempoTotal =
      typeof tempoTotalMaximo === "number" && tempoTotalMaximo > 0
        ? tempoTotalMaximo
        : Math.max(...trechos.map((t) => t.fim), 1);

    // Renderiza cada trecho do pedido
    trechos.forEach((trecho) => {
      const duracao = trecho.fim - trecho.inicio;
      if (duracao <= 0) return;

      const leftPercent = (trecho.inicio / tempoTotal) * 100;
      const widthPercent = (duracao / tempoTotal) * 100;

      const bloco = document.createElement("div");
      bloco.className = "gantt-bloco";
      bloco.style.left = `${leftPercent}%`;
      bloco.style.width = `${widthPercent}%`;
      bloco.style.background = obterFundoPedido(trecho.pedido);
      bloco.style.color = obterTextoPedido(trecho.pedido);
      bloco.setAttribute("data-pedido", trecho.pedido);

      // Tooltip nativo acessível com detalhes da execução
      bloco.title = `${trecho.pedido} | Instante ${trecho.inicio} até ${trecho.fim} (Duração: ${duracao})`;

      const texto = document.createElement("span");
      texto.className = "gantt-bloco-texto";
      texto.textContent = trecho.pedido;
      bloco.appendChild(texto);

      // Efeito de destaque coordenado ao passar o mouse
      bloco.addEventListener("mouseenter", () => destacarPedido(trecho.pedido));
      bloco.addEventListener("mouseleave", () => limparDestaques());

      container.appendChild(bloco);
    });
  }

  // Destaque visual unificado entre tabelas, legendas e blocos de Gantt
  function destacarPedido(idPedido) {
    document.querySelectorAll(`[data-pedido="${idPedido}"]`).forEach((el) => {
      el.classList.add("destaque-pedido");
    });
  }

  function limparDestaques() {
    document.querySelectorAll(".destaque-pedido").forEach((el) => {
      el.classList.remove("destaque-pedido");
    });
  }

  // Elementos do DOM
  const inputQuantum = document.getElementById("quantum");
  const rotuloQuantumRR = document.getElementById("rotulo-quantum-rr");
  const corpoTabelaPedidos = document.getElementById("corpo-tabela-pedidos");
  const legendaPedidos = document.getElementById("legenda-pedidos");
  const corpoTabelaMetricas = document.getElementById("corpo-tabela-metricas");
  const reguaTempo = document.getElementById("regua-tempo");

  const elementosGantt = {
    fcfs: document.getElementById("gantt-fcfs"),
    sjf: document.getElementById("gantt-sjf"),
    prioridade: document.getElementById("gantt-prioridade"),
    rr: document.getElementById("gantt-rr"),
  };

  const elementosOrdem = {
    fcfs: document.getElementById("ordem-fcfs"),
    sjf: document.getElementById("ordem-sjf"),
    prioridade: document.getElementById("ordem-prioridade"),
    rr: document.getElementById("ordem-rr"),
  };

  // Formatação de números em padrão brasileiro com 2 casas decimais
  function formatarNumero(num) {
    if (typeof num !== "number" || isNaN(num)) return "0,00";
    return num.toFixed(2).replace(".", ",");
  }

  // Formatação amigável de prioridade
  function formatarPrioridade(prio) {
    if (prio === 1) return '<span class="badge-prioridade prio-vip">1 (VIP)</span>';
    if (prio === 2) return '<span class="badge-prioridade prio-comum">2 (Comum)</span>';
    if (prio === 3) return '<span class="badge-prioridade prio-delivery">3 (Delivery)</span>';
    return `<span class="badge-prioridade">${prio}</span>`;
  }

  // Atualiza a tabela com a lista de pedidos feitos até agora
  function renderizarTabelaPedidos(pedidos) {
    corpoTabelaPedidos.innerHTML = "";
    legendaPedidos.innerHTML = "";

    pedidos.forEach((p) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-pedido", p.id);
      tr.addEventListener("mouseenter", () => destacarPedido(p.id));
      tr.addEventListener("mouseleave", () => limparDestaques());

      tr.innerHTML = `
        <td><span class="tag-pedido" style="background: ${obterFundoPedido(p.id)}; color: ${obterTextoPedido(p.id)}">${p.id}</span></td>
        <td><strong>${p.prato}</strong></td>
        <td>${p.chegada}</td>
        <td>${p.preparo} instantes</td>
        <td>${formatarPrioridade(p.prioridade)}</td>
      `;
      corpoTabelaPedidos.appendChild(tr);

      // Item na legenda
      const itemLegenda = document.createElement("span");
      itemLegenda.className = "item-legenda";
      itemLegenda.setAttribute("data-pedido", p.id);
      itemLegenda.innerHTML = `
        <span class="bolinha-legenda" style="background: ${obterFundoPedido(p.id)}"></span>
        <span>${p.id} · ${p.prato}</span>
      `;
      itemLegenda.addEventListener("mouseenter", () => destacarPedido(p.id));
      itemLegenda.addEventListener("mouseleave", () => limparDestaques());
      legendaPedidos.appendChild(itemLegenda);
    });
  }

  // Renderiza a régua de tempo sincronizada na parte inferior dos quatro Gantts.
  // "inicio" desloca a régua quando os Gantts mostram só uma janela do tempo.
  function renderizarReguaTempo(tempoTotal, inicio = 0) {
    reguaTempo.innerHTML = "";
    if (tempoTotal <= 0) return;

    // Define o passo dos marcadores para evitar sobreposição em cenários longos
    const passo = tempoTotal > 30 ? 5 : tempoTotal > 15 ? 2 : 1;
    const fim = inicio + tempoTotal;

    for (let t = Math.ceil(inicio); t <= fim; t++) {
      if (t % passo !== 0 && t !== fim) continue;

      const ponto = document.createElement("div");
      ponto.className = "regua-ponto";
      ponto.style.left = `${((t - inicio) / tempoTotal) * 100}%`;

      const ehDestaque = t % (passo * 2) === 0 || t === 0 || t === fim;

      ponto.innerHTML = `
        <span class="regua-traco ${ehDestaque ? "marcador-principal" : ""}"></span>
        <span class="regua-numero">${t}</span>
      `;
      reguaTempo.appendChild(ponto);
    }
  }

  // Lê e sanitiza o quantum (padrão do contrato = 2)
  function lerQuantum() {
    let quantum = parseInt(inputQuantum ? inputQuantum.value : "2", 10);
    if (isNaN(quantum) || quantum < 1) {
      quantum = 2;
    }
    if (rotuloQuantumRR) rotuloQuantumRR.textContent = `Quantum = ${quantum}`;
    return quantum;
  }

  function executarAlgoritmos(pedidos, quantum) {
    return {
      fcfs: typeof fcfs === "function" ? fcfs(pedidos) : [],
      sjf: typeof sjf === "function" ? sjf(pedidos) : [],
      prioridade: typeof prioridade === "function" ? prioridade(pedidos) : [],
      rr: typeof roundRobin === "function" ? roundRobin(pedidos, quantum) : [],
    };
  }

  function calcularTodasMetricas(pedidos, linhas) {
    const metricas = {};
    for (const [chave, linha] of Object.entries(linhas)) {
      if (typeof calcularMetricas === "function" && pedidos.length > 0 && linha.length > 0) {
        metricas[chave] = calcularMetricas(pedidos, linha);
      } else {
        metricas[chave] = { mediaEspera: 0, mediaTurnaround: 0, mediaResposta: 0 };
      }
    }
    return metricas;
  }

  function listarAlgoritmos(quantum) {
    return [
      { chave: "fcfs", nome: "FCFS" },
      { chave: "sjf", nome: "SJF" },
      { chave: "prioridade", nome: "Prioridade" },
      { chave: "rr", nome: `Round Robin (q=${quantum})` },
    ];
  }

  // Tabela comparativa de métricas com destaque no menor valor (melhor) de cada coluna.
  // "complemento" acrescenta um texto ao nome do algoritmo.
  function renderizarTabelaMetricas(listaAlgoritmos, metricas, complemento = () => "") {
    const valoresEspera = listaAlgoritmos.map((a) => metricas[a.chave].mediaEspera);
    const valoresTurnaround = listaAlgoritmos.map((a) => metricas[a.chave].mediaTurnaround);
    const valoresResposta = listaAlgoritmos.map((a) => metricas[a.chave].mediaResposta);

    const minEspera = Math.min(...valoresEspera);
    const minTurnaround = Math.min(...valoresTurnaround);
    const minResposta = Math.min(...valoresResposta);

    const quaseIgual = (a, b) => Math.abs(a - b) < 0.001;

    corpoTabelaMetricas.innerHTML = "";

    listaAlgoritmos.forEach(({ chave, nome }) => {
      const m = metricas[chave];
      const ehMelhorEspera = quaseIgual(m.mediaEspera, minEspera);
      const ehMelhorTurnaround = quaseIgual(m.mediaTurnaround, minTurnaround);
      const ehMelhorResposta = quaseIgual(m.mediaResposta, minResposta);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-algoritmo">${nome}${complemento(chave)}</td>
        <td class="${ehMelhorEspera ? "melhor-valor" : ""}">
          ${formatarNumero(m.mediaEspera)}
          ${ehMelhorEspera ? '<span class="badge-melhor" title="Menor tempo de espera médio">⭐ Melhor</span>' : ""}
        </td>
        <td class="${ehMelhorTurnaround ? "melhor-valor" : ""}">
          ${formatarNumero(m.mediaTurnaround)}
          ${ehMelhorTurnaround ? '<span class="badge-melhor" title="Menor turnaround médio">⭐ Melhor</span>' : ""}
        </td>
        <td class="${ehMelhorResposta ? "melhor-valor" : ""}">
          ${formatarNumero(m.mediaResposta)}
          ${ehMelhorResposta ? '<span class="badge-melhor" title="Menor tempo de resposta médio">⭐ Melhor</span>' : ""}
        </td>
      `;
      corpoTabelaMetricas.appendChild(tr);
    });
  }

  // ==================== Cozinha ao vivo ====================
  // O relógio anda sozinho e a turma faz pedidos na hora. A cada pedido novo
  // os quatro algoritmos são recalculados com tudo o que chegou até agora.
  // Como nenhum deles olha para pedidos que ainda não chegaram, o trecho já
  // desenhado do Gantt nunca muda: a tela só revela a linha do tempo até o
  // instante atual.

  const CARDAPIO = [
    { prato: "Café", preparo: 1 },
    { prato: "Suco", preparo: 1 },
    { prato: "Torrada", preparo: 2 },
    { prato: "Salada", preparo: 2 },
    { prato: "Omelete", preparo: 3 },
    { prato: "Bolo", preparo: 3 },
    { prato: "Pizza", preparo: 4 },
    { prato: "Hambúrguer", preparo: 4 },
    { prato: "Lasanha", preparo: 5 },
    { prato: "Risoto", preparo: 5 },
    { prato: "Feijoada", preparo: 8 },
  ];

  // Instantes visíveis nos Gantts; depois disso a janela acompanha o relógio
  const JANELA_AOVIVO = 30;
  // Espaço livre deixado à direita do instante atual quando a janela anda
  const MARGEM_FUTURO = 8;
  // Limita o salto do relógio quando a aba fica em segundo plano
  const MAIOR_PASSO_MS = 250;

  const btnPlay = document.getElementById("btn-play");
  const btnReiniciarAoVivo = document.getElementById("btn-reiniciar-aovivo");
  const btnRush = document.getElementById("btn-rush");
  const botoesPedido = document.querySelectorAll("[data-prioridade]");
  const seletorPrato = document.getElementById("seletor-prato");
  const seletorVelocidade = document.getElementById("velocidade");
  const relogio = document.getElementById("relogio");

  const aoVivo = {
    pedidos: [],
    linhas: null,
    metricas: null,
    fins: null, // instante em que cada pedido termina, por algoritmo
    agora: 0, // instante atual, fracionário para o Gantt crescer suavemente
    rodando: false,
    ultimoQuadro: null,
    assinaturaMetricas: "",
  };

  function sortear(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function inicializarCardapio() {
    seletorPrato.innerHTML = '<option value="">Prato aleatório</option>';
    CARDAPIO.forEach((item, i) => {
      const opcao = document.createElement("option");
      opcao.value = String(i);
      opcao.textContent = `${item.prato} (preparo ${item.preparo})`;
      seletorPrato.appendChild(opcao);
    });
  }

  function recalcularAoVivo() {
    const pedidos = aoVivo.pedidos;
    aoVivo.linhas = executarAlgoritmos(pedidos, lerQuantum());
    aoVivo.metricas = calcularTodasMetricas(pedidos, aoVivo.linhas);
    aoVivo.fins = {};
    for (const [chave, linha] of Object.entries(aoVivo.linhas)) {
      const fins = {};
      linha.forEach((t) => {
        fins[t.pedido] = Math.max(fins[t.pedido] || 0, t.fim);
      });
      aoVivo.fins[chave] = fins;
    }
    aoVivo.assinaturaMetricas = ""; // força redesenhar a tabela de métricas

    if (pedidos.length === 0) {
      legendaPedidos.innerHTML = "";
      corpoTabelaPedidos.innerHTML =
        '<tr><td colspan="5" class="tabela-vazia">Nenhum pedido ainda. Use + VIP, + Comum ou + Delivery.</td></tr>';
    } else {
      renderizarTabelaPedidos(pedidos);
      const container = corpoTabelaPedidos.closest(".tabela-container");
      if (container) container.scrollTop = container.scrollHeight;
    }
    atualizarTravaQuantum();
  }

  // Trocar o quantum no meio do serviço reescreveria o passado do Round Robin
  function atualizarTravaQuantum() {
    const travar = aoVivo.pedidos.length > 0;
    inputQuantum.disabled = travar;
    inputQuantum.title = travar ? "Reinicie para trocar o quantum" : "";
  }

  function fazerPedido(prioridadePedido, item) {
    const escolhido =
      item || (seletorPrato.value === "" ? sortear(CARDAPIO) : CARDAPIO[Number(seletorPrato.value)]);
    aoVivo.pedidos.push({
      id: `P${aoVivo.pedidos.length + 1}`,
      prato: escolhido.prato,
      // Chega no próximo instante inteiro, então nada do que já foi desenhado muda
      chegada: Math.ceil(aoVivo.agora),
      preparo: escolhido.preparo,
      prioridade: prioridadePedido,
    });
  }

  function novoPedido(prioridadePedido) {
    fazerPedido(prioridadePedido);
    recalcularAoVivo();
    renderizarAoVivo();
  }

  // Vários pedidos de uma vez, a maioria de clientes comuns
  function horaDoRush() {
    for (let i = 0; i < 4; i++) {
      fazerPedido(sortear([1, 2, 2, 3]), sortear(CARDAPIO));
    }
    recalcularAoVivo();
    renderizarAoVivo();
  }

  // Recorta a linha do tempo para a janela visível e até o instante atual,
  // deslocada para começar em zero (formato que o desenharGantt espera)
  function recortarJanela(linha, inicio, agora) {
    return linha
      .filter((t) => t.inicio < agora && t.fim > inicio)
      .map((t) => ({
        pedido: t.pedido,
        inicio: Math.max(t.inicio, inicio) - inicio,
        fim: Math.min(t.fim, agora) - inicio,
        original: t,
      }));
  }

  // O que o fogão de um algoritmo está fazendo agora e quem espera no balcão
  function descreverFogao(chave, agora) {
    const atual = aoVivo.linhas[chave].find((t) => t.inicio <= agora && agora < t.fim);
    const fins = aoVivo.fins[chave];
    const esperando = aoVivo.pedidos
      .filter((p) => p.chegada <= agora && fins[p.id] > agora && (!atual || atual.pedido !== p.id))
      .map((p) => p.id);
    const fogao = atual ? `No fogão: ${atual.pedido}` : "Fogão livre";
    return esperando.length ? `${fogao} · Balcão: ${esperando.join(", ")}` : fogao;
  }

  // As médias são a previsão com todos os pedidos já feitos; a contagem de
  // prontos mostra o andamento. Só redesenha quando a contagem muda.
  function renderizarMetricasAoVivo(listaAlgoritmos, agora) {
    const prontos = {};
    listaAlgoritmos.forEach(({ chave }) => {
      prontos[chave] = Object.values(aoVivo.fins[chave]).filter((fim) => fim <= agora).length;
    });
    const assinatura = JSON.stringify(prontos);
    if (assinatura === aoVivo.assinaturaMetricas) return;
    aoVivo.assinaturaMetricas = assinatura;

    if (aoVivo.pedidos.length === 0) {
      corpoTabelaMetricas.innerHTML =
        '<tr><td colspan="4" class="tabela-vazia">As métricas aparecem com o primeiro pedido.</td></tr>';
      return;
    }
    const total = aoVivo.pedidos.length;
    renderizarTabelaMetricas(listaAlgoritmos, aoVivo.metricas, (chave) =>
      ` <small class="prontos-aovivo">${prontos[chave]}/${total} prontos</small>`
    );
  }

  function renderizarAoVivo() {
    const agora = aoVivo.agora;
    const inicio = Math.max(0, agora - (JANELA_AOVIVO - MARGEM_FUTURO));
    relogio.textContent = Math.floor(agora);

    const listaAlgoritmos = listarAlgoritmos(lerQuantum());
    listaAlgoritmos.forEach(({ chave }) => {
      const elGantt = elementosGantt[chave];
      const trechos = recortarJanela(aoVivo.linhas[chave], inicio, agora);
      desenharGanttComparacao(elGantt, trechos, undefined, JANELA_AOVIVO);

      // O desenho usa a janela deslocada; o tooltip mostra os instantes reais
      const blocos = elGantt.querySelectorAll(".gantt-bloco");
      if (blocos.length === trechos.length) {
        blocos.forEach((bloco, i) => {
          const { pedido, inicio: ini, fim } = trechos[i].original;
          bloco.title = `${pedido} | Instante ${ini} até ${fim} (Duração: ${fim - ini})`;
        });
      }

      const marcador = document.createElement("div");
      marcador.className = "gantt-agora";
      marcador.style.left = `${((agora - inicio) / JANELA_AOVIVO) * 100}%`;
      elGantt.appendChild(marcador);

      elementosOrdem[chave].textContent = descreverFogao(chave, agora);
    });

    renderizarReguaTempo(JANELA_AOVIVO, inicio);
    renderizarMetricasAoVivo(listaAlgoritmos, agora);
    atualizarBotaoPlay();
  }

  function quadroAoVivo(instante) {
    if (!aoVivo.rodando) return;
    if (aoVivo.ultimoQuadro !== null) {
      const passoMs = Math.min(instante - aoVivo.ultimoQuadro, MAIOR_PASSO_MS);
      aoVivo.agora += (passoMs / 1000) * (Number(seletorVelocidade.value) || 1);
    }
    aoVivo.ultimoQuadro = instante;
    renderizarAoVivo();
    requestAnimationFrame(quadroAoVivo);
  }

  function iniciarAoVivo() {
    if (aoVivo.rodando) return;
    aoVivo.rodando = true;
    aoVivo.ultimoQuadro = null;
    document.body.classList.add("aovivo-rodando");
    atualizarBotaoPlay();
    requestAnimationFrame(quadroAoVivo);
  }

  function pausarAoVivo() {
    aoVivo.rodando = false;
    document.body.classList.remove("aovivo-rodando");
    atualizarBotaoPlay();
  }

  function alternarAoVivo() {
    if (aoVivo.rodando) pausarAoVivo();
    else iniciarAoVivo();
  }

  function atualizarBotaoPlay() {
    if (aoVivo.rodando) btnPlay.textContent = "⏸ Pausar";
    else btnPlay.textContent = aoVivo.agora === 0 ? "▶ Abrir restaurante" : "▶ Continuar";
  }

  function reiniciarAoVivo() {
    pausarAoVivo();
    aoVivo.pedidos = [];
    aoVivo.agora = 0;
    recalcularAoVivo();
    renderizarAoVivo();
  }

  // Eventos de interação
  function atualizarTela() {
    recalcularAoVivo();
    renderizarAoVivo();
  }

  inputQuantum.addEventListener("input", () => {
    // Evita quantum menor que 1
    const v = parseInt(inputQuantum.value, 10);
    if (v < 1) inputQuantum.value = 1;
    atualizarTela();
  });

  inputQuantum.addEventListener("change", () => {
    const v = parseInt(inputQuantum.value, 10);
    if (isNaN(v) || v < 1) inputQuantum.value = 2;
    atualizarTela();
  });

  // Os botões perdem o foco depois do clique para o Espaço sempre pausar,
  // em vez de clicar de novo no último botão usado
  function aoClicar(botao, acao) {
    botao.addEventListener("click", () => {
      botao.blur();
      acao();
    });
  }

  // Pelo mesmo motivo, os seletores perdem o foco depois de escolher, senão
  // os atalhos do teclado param de funcionar enquanto o seletor está focado
  [seletorPrato, seletorVelocidade].forEach((seletor) => {
    seletor.addEventListener("change", () => seletor.blur());
  });

  aoClicar(btnPlay, alternarAoVivo);
  aoClicar(btnReiniciarAoVivo, reiniciarAoVivo);
  aoClicar(btnRush, horaDoRush);
  botoesPedido.forEach((b) => aoClicar(b, () => novoPedido(Number(b.dataset.prioridade))));

  // Atalhos para fazer pedidos durante a apresentação sem usar o mouse
  document.addEventListener("keydown", (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (evento.target.closest && evento.target.closest("input, select, textarea")) return;

    if (evento.key === "1" || evento.key === "2" || evento.key === "3") {
      novoPedido(Number(evento.key));
    } else if (evento.key === "r" || evento.key === "R") {
      horaDoRush();
    } else if (evento.key === " ") {
      evento.preventDefault();
      alternarAoVivo();
    }
  });

  function iniciarTela() {
    inicializarCardapio();
    atualizarTela();
  }

  // Inicialização quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarTela);
  } else {
    iniciarTela();
  }
})();
