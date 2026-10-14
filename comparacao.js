// comparacao.js - Tela de Comparação de Algoritmos (Pessoa 3)
// Batalha dos quatro algoritmos (FCFS, SJF, Prioridade e Round Robin) lado a lado no mesmo cenário.
// Conecta cenarios.js, algoritmos.js, metricas.js e o desenhador de Gantt da Pessoa 2.

(function () {
  "use strict";

  const CORES_PEDIDOS = {
    P1: "#c2410c", 
    P2: "#1d4ed8", 
    P3: "#059669", 
    P4: "#d97706", 
    P5: "#7c3aed", 
    P6: "#db2777", 
    P7: "#0891b2", 
    P8: "#4b5563", 
  };

  function obterCorPedido(id) {
    return CORES_PEDIDOS[id] || "#64748b";
  }

  // Se desenharGantt não foi carregado pelo gantt.js da Pessoa 2,
  // provemos a implementação padrão compatível com a especificação do contrato.
  if (typeof window.desenharGantt !== "function") {
    window.desenharGantt = function (elemento, linhaDoTempo, ateInstante, tempoTotalMaximo) {
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
        bloco.style.backgroundColor = obterCorPedido(trecho.pedido);
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
    };
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
  const seletorCenario = document.getElementById("seletor-cenario");
  const inputQuantum = document.getElementById("quantum");
  const rotuloQuantumRR = document.getElementById("rotulo-quantum-rr");
  const cenarioDescricao = document.getElementById("cenario-descricao");
  const cenarioConclusao = document.getElementById("cenario-conclusao");
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

  // Inicializa o seletor com os cenários disponíveis
  function inicializarCenarios() {
    const lista = typeof CENARIOS !== "undefined" ? CENARIOS : [];
    seletorCenario.innerHTML = "";

    lista.forEach((cenario) => {
      const opcao = document.createElement("option");
      opcao.value = cenario.id;
      opcao.textContent = cenario.nome;
      seletorCenario.appendChild(opcao);
    });

    if (lista.length > 0) {
      seletorCenario.value = lista[0].id;
    }
  }

  // Retorna o cenário ativo atualmente selecionado
  function obterCenarioAtual() {
    const lista = typeof CENARIOS !== "undefined" ? CENARIOS : [];
    const id = seletorCenario.value;
    const encontrado = lista.find((c) => c.id === id);
    if (encontrado) return encontrado;

    // Fallback caso a lista ainda não esteja carregada
    if (typeof cenarioExemplo !== "undefined") {
      return {
        id: "exemplo",
        nome: "Exemplo do contrato",
        descricao: "Cenário de exemplo do contrato",
        conclusao: "O SJF teve a menor espera média e o Round Robin a melhor resposta, mas a pior espera.",
        pedidos: cenarioExemplo,
      };
    }

    return { id: "vazio", nome: "Vazio", descricao: "", conclusao: "", pedidos: [] };
  }

  // Atualiza a tabela com a lista de pedidos do cenário selecionado
  function renderizarTabelaPedidos(pedidos) {
    corpoTabelaPedidos.innerHTML = "";
    legendaPedidos.innerHTML = "";

    pedidos.forEach((p) => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-pedido", p.id);
      tr.addEventListener("mouseenter", () => destacarPedido(p.id));
      tr.addEventListener("mouseleave", () => limparDestaques());

      tr.innerHTML = `
        <td><span class="tag-pedido" style="background-color: ${obterCorPedido(p.id)}">${p.id}</span></td>
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
        <span class="bolinha-legenda" style="background-color: ${obterCorPedido(p.id)}"></span>
        <span>${p.id} · ${p.prato}</span>
      `;
      itemLegenda.addEventListener("mouseenter", () => destacarPedido(p.id));
      itemLegenda.addEventListener("mouseleave", () => limparDestaques());
      legendaPedidos.appendChild(itemLegenda);
    });
  }

  // Renderiza a régua de tempo sincronizada na parte inferior dos quatro Gantts
  function renderizarReguaTempo(tempoTotal) {
    reguaTempo.innerHTML = "";
    if (tempoTotal <= 0) return;

    // Define o passo dos marcadores para evitar sobreposição em cenários longos
    const passo = tempoTotal > 30 ? 5 : tempoTotal > 15 ? 2 : 1;

    for (let t = 0; t <= tempoTotal; t++) {
      if (t % passo !== 0 && t !== tempoTotal) continue;

      const ponto = document.createElement("div");
      ponto.className = "regua-ponto";
      ponto.style.left = `${(t / tempoTotal) * 100}%`;

      const ehDestaque = t % (passo * 2) === 0 || t === 0 || t === tempoTotal;

      ponto.innerHTML = `
        <span class="regua-traco ${ehDestaque ? "marcador-principal" : ""}"></span>
        <span class="regua-numero">${t}</span>
      `;
      reguaTempo.appendChild(ponto);
    }
  }

  // Função principal de atualização e renderização
  function atualizarComparacao() {
    const cenario = obterCenarioAtual();
    const pedidos = cenario.pedidos || [];

    // Lê e sanitiza o quantum (padrão do contrato = 2)
    let quantum = parseInt(inputQuantum ? inputQuantum.value : "2", 10);
    if (isNaN(quantum) || quantum < 1) {
      quantum = 2;
    }
    if (rotuloQuantumRR) rotuloQuantumRR.textContent = `Quantum = ${quantum}`;

    // Atualiza descrições textuais do cenário
    cenarioDescricao.textContent = cenario.descricao || "";
    cenarioConclusao.textContent = cenario.conclusao || "";

    // 1. Renderiza pedidos de entrada
    renderizarTabelaPedidos(pedidos);

    // 2. Executa os 4 algoritmos
    const linhas = {
      fcfs: typeof fcfs === "function" ? fcfs(pedidos) : [],
      sjf: typeof sjf === "function" ? sjf(pedidos) : [],
      prioridade: typeof prioridade === "function" ? prioridade(pedidos) : [],
      rr: typeof roundRobin === "function" ? roundRobin(pedidos, quantum) : [],
    };

    // 3. Calcula as métricas para cada algoritmo
    const metricas = {};
    for (const [chave, linha] of Object.entries(linhas)) {
      if (typeof calcularMetricas === "function" && pedidos.length > 0 && linha.length > 0) {
        metricas[chave] = calcularMetricas(pedidos, linha);
      } else {
        metricas[chave] = { mediaEspera: 0, mediaTurnaround: 0, mediaResposta: 0 };
      }
    }

    // 4. Determina a escala de tempo compartilhada (tempoTotalMaximo)
    // Garante que todos os 4 Gantts tenham rigorosamente a mesma proporção visual
    let tempoTotalMaximo = 0;
    Object.values(linhas).forEach((linha) => {
      linha.forEach((t) => {
        if (t.fim > tempoTotalMaximo) tempoTotalMaximo = t.fim;
      });
    });
    if (tempoTotalMaximo === 0) tempoTotalMaximo = 1;

    // 5. Desenha os 4 Gantts empilhados e preenche a ordem no fogão
    const listaAlgoritmos = [
      { chave: "fcfs", nome: "FCFS" },
      { chave: "sjf", nome: "SJF" },
      { chave: "prioridade", nome: "Prioridade" },
      { chave: "rr", nome: `Round Robin (q=${quantum})` },
    ];

    listaAlgoritmos.forEach(({ chave }) => {
      const linha = linhas[chave];
      const elGantt = elementosGantt[chave];
      const elOrdem = elementosOrdem[chave];

      // Desenha usando o desenharGantt (seja da Pessoa 2 ou fallback compatível)
      if (typeof window.desenharGantt === "function" && elGantt) {
        window.desenharGantt(elGantt, linha, undefined, tempoTotalMaximo);
      }

      // Atualiza texto com a ordem dos pedidos no fogão
      if (elOrdem) {
        const ordemTexto = linha.map((t) => t.pedido).join(", ");
        elOrdem.textContent = ordemTexto ? `Ordem: ${ordemTexto}` : "Fogão livre";
      }
    });

    // 6. Atualiza a régua de tempo inferior
    renderizarReguaTempo(tempoTotalMaximo);

    // 7. Encontra o menor valor (melhor desempenho) em cada coluna de métricas
    const valoresEspera = listaAlgoritmos.map((a) => metricas[a.chave].mediaEspera);
    const valoresTurnaround = listaAlgoritmos.map((a) => metricas[a.chave].mediaTurnaround);
    const valoresResposta = listaAlgoritmos.map((a) => metricas[a.chave].mediaResposta);

    const minEspera = Math.min(...valoresEspera);
    const minTurnaround = Math.min(...valoresTurnaround);
    const minResposta = Math.min(...valoresResposta);

    const quaseIgual = (a, b) => Math.abs(a - b) < 0.001;

    // 8. Renderiza a tabela comparativa de métricas com destaque no melhor valor
    corpoTabelaMetricas.innerHTML = "";

    listaAlgoritmos.forEach(({ chave, nome }) => {
      const m = metricas[chave];
      const ehMelhorEspera = quaseIgual(m.mediaEspera, minEspera);
      const ehMelhorTurnaround = quaseIgual(m.mediaTurnaround, minTurnaround);
      const ehMelhorResposta = quaseIgual(m.mediaResposta, minResposta);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-algoritmo">${nome}</td>
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

  // Eventos de interação: troca dinâmica sem recarregar a página
  seletorCenario.addEventListener("change", atualizarComparacao);

  inputQuantum.addEventListener("input", () => {
    // Evita quantum menor que 1
    const v = parseInt(inputQuantum.value, 10);
    if (v < 1) inputQuantum.value = 1;
    atualizarComparacao();
  });

  inputQuantum.addEventListener("change", () => {
    const v = parseInt(inputQuantum.value, 10);
    if (isNaN(v) || v < 1) inputQuantum.value = 2;
    atualizarComparacao();
  });

  // Inicialização quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      inicializarCenarios();
      atualizarComparacao();
    });
  } else {
    inicializarCenarios();
    atualizarComparacao();
  }
})();
