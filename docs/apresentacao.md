# Roteiro da apresentação: Chef Escalonador

Duração sugerida: 10 a 12 minutos, com cada integrante apresentando a sua parte. As capturas de tela entram depois da integração (dia 5).

## Slides

| # | Título | Conteúdo | Quem fala | Tempo |
| --- | --- | --- | --- | --- |
| 1 | Chef Escalonador | Nome do jogo, disciplina, integrantes | Pessoa 4 | 0:30 |
| 2 | O problema | O escalonador decide quem usa a CPU; processos que dividem recursos precisam de sincronismo | Pessoa 4 | 1:00 |
| 3 | A analogia | Pedido = processo, fogão = CPU, balcão = fila de pronto, preparo = burst, cliente = prioridade, forno = recurso compartilhado | Pessoa 4 | 1:00 |
| 4 | Estados do pedido | Novo → pronto → executando → terminado, e bloqueado ao esperar o forno | Pessoa 2 | 0:45 |
| 5 | Os quatro algoritmos | Uma linha para cada: FCFS, SJF, Prioridade, Round Robin | Pessoa 1 | 1:30 |
| 6 | Como funciona por dentro | Cada algoritmo devolve a linha do tempo `{ pedido, inicio, fim }` e as telas só desenham | Pessoa 1 | 0:45 |
| 7 | Demo: Modo Aula | Ao vivo (roteiro abaixo) | Pessoa 2 | 2:00 |
| 8 | Demo: Comparação | Ao vivo (roteiro abaixo) | Pessoa 3 | 1:30 |
| 9 | Demo: Sincronismo | Ao vivo (roteiro abaixo) | Pessoa 4 | 1:30 |
| 10 | Resultados | Tabela do cenário de exemplo: SJF com menor espera, Round Robin com menor resposta | Pessoa 3 | 0:45 |
| 11 | Conclusão | Não há algoritmo melhor em tudo; verificar e usar em dois passos não é seguro, o mutex resolve | Pessoa 4 | 0:45 |
| 12 | Perguntas | | Todos | |

## Roteiro das demos

Abrir o projeto antes de começar, já na página inicial, com o zoom do navegador em 125% para ficar legível no projetor.

### Modo Aula (Pessoa 2)

1. Escolher **SJF** e o cenário **Efeito comboio**.
2. Avançar alguns passos mostrando o balcão, o fogão e o Gantt crescendo.
3. Parar no momento em que o fogão libera e ler a explicação: por que o SJF escolheu aquele pedido.
4. Trocar para **Round Robin** e mostrar um pedido voltando do fogão para o balcão ao fim do quantum.

### Comparação (Pessoa 3)

1. Abrir o cenário **Efeito comboio** e mostrar os quatro Gantts.
2. Apontar o FCFS com a maior espera e o SJF com a menor.
3. Trocar para **Cliente VIP** e mostrar o pedido VIP passando na frente só no algoritmo de Prioridade.
4. Mudar o quantum do Round Robin e mostrar a tabela mudando.

### Sincronismo (Pessoa 4)

1. Com o **mutex desligado**, avançar os 4 passos devagar:
    - Passo 1: Ana olha o forno, está livre.
    - Passo 2: Beto olha o forno, ainda está livre. Perguntar para a turma: "o que vai acontecer?"
    - Passos 3 e 4: os dois colocam o prato e os dois estragam. "Isso é uma condição de corrida."
2. **Ligar o mutex** (a tela reinicia sozinha).
    - Passo 1: Ana faz `lock`.
    - Passo 2: Beto tenta `lock` e fica **bloqueado**. Mostrar a fila do forno.
    - Clicar em **Reproduzir** até Ana fazer `unlock` e Beto assumir o forno.
3. Fechar com o placar: 2 prontos, 0 estragados.

## Plano B

Se o projetor ou o navegador falhar, ter as capturas de tela de cada demo nos slides 7, 8 e 9, e o projeto salvo num pendrive, além do link do GitHub.
