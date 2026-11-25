/* ==========================================================================
   MATH BATTLE — MOTOR DO JOGO, FILA COMPARTILHADA JUSTA E CONTROLE MULTI-TOUCH
   ========================================================================== */

(() => {
  'use strict';

  const WINNING_SCORE = 10;
  const FEEDBACK_DELAY_MS = 260;

  const LEVEL_LABELS = {
    0: 'Nível 0 • Muito Fácil',
    1: 'Nível 1 • Fácil',
    2: 'Nível 2 • Normal',
    3: 'Nível 3 • Intermediário',
    4: 'Nível 4 • Difícil',
    5: 'Nível 5 • Muito Difícil',
  };

  // Estado global da aplicação
  const state = {
    level: 2,
    selectedOps: new Set(['add', 'sub', 'mul']),
    isPlaying: false,
    exitConfirmTimer: null,
    questionDeck: [], // Fila compartilhada: garante a mesma sequência para ambos os jogadores
    players: {
      1: {
        id: 1,
        name: 'JOGADOR 1',
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        questionIndex: 0,
        currentQuestion: null,
        isLocked: false,
        nextQuestionTimer: null,
        feedbackTimer: null,
      },
      2: {
        id: 2,
        name: 'JOGADOR 2',
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        questionIndex: 0,
        currentQuestion: null,
        isLocked: false,
        nextQuestionTimer: null,
        feedbackTimer: null,
      },
    },
  };

  // Referências de DOM
  const screens = {
    difficulty: document.getElementById('screen-difficulty'),
    operations: document.getElementById('screen-operations'),
    battle: document.getElementById('screen-battle'),
    victory: document.getElementById('screen-victory'),
  };

  const dom = {
    inputP1Name: document.getElementById('input-p1-name'),
    inputP2Name: document.getElementById('input-p2-name'),
    diffCards: document.querySelectorAll('.diff-card'),
    btnToOperations: document.getElementById('btn-to-operations'),
    btnBackDifficulty: document.getElementById('btn-back-difficulty'),
    selectedLevelBadge: document.getElementById('selected-level-badge'),
    btnSelectAllOps: document.getElementById('btn-select-all-ops'),
    btnClearOps: document.getElementById('btn-clear-ops'),
    opCards: document.querySelectorAll('.op-card'),
    opsValidationMsg: document.getElementById('ops-validation-msg'),
    btnStartBattle: document.getElementById('btn-start-battle'),
    btnAbortMatch: document.getElementById('btn-abort-match'),
    countdownOverlay: document.getElementById('countdown-overlay'),
    countdownTop: document.getElementById('countdown-top'),
    countdownBottom: document.getElementById('countdown-bottom'),
    winnerTitle: document.getElementById('winner-title'),
    victorySubtitle: document.getElementById('victory-subtitle'),
    finalCardP1: document.getElementById('final-card-p1'),
    finalCardP2: document.getElementById('final-card-p2'),
    finalNameP1: document.getElementById('final-name-p1'),
    finalNameP2: document.getElementById('final-name-p2'),
    finalScoreP1: document.getElementById('final-score-p1'),
    finalScoreP2: document.getElementById('final-score-p2'),
    finalStatsP1: document.getElementById('final-stats-p1'),
    finalStatsP2: document.getElementById('final-stats-p2'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnBackConfig: document.getElementById('btn-back-config'),
    confettiContainer: document.getElementById('confetti-container'),
  };

  const playerDom = {
    1: {
      hudName: document.getElementById('hud-name-p1'),
      score: document.getElementById('score-p1'),
      pips: document.getElementById('pips-p1'),
      question: document.getElementById('question-p1'),
      delta: document.getElementById('delta-p1'),
      feedback: document.getElementById('feedback-p1'),
      buttons: Array.from(document.querySelectorAll('#options-p1 .answer-btn')),
    },
    2: {
      hudName: document.getElementById('hud-name-p2'),
      score: document.getElementById('score-p2'),
      pips: document.getElementById('pips-p2'),
      question: document.getElementById('question-p2'),
      delta: document.getElementById('delta-p2'),
      feedback: document.getElementById('feedback-p2'),
      buttons: Array.from(document.querySelectorAll('#options-p2 .answer-btn')),
    },
  };

  /* ========================================================================
     UTILITÁRIOS MATEMÁTICOS
     ======================================================================== */

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /* ========================================================================
     GERADOR DE QUESTÕES POR DIFICULDADE (NÍVEIS 0 A 5) E OPERAÇÃO
     ======================================================================== */

  function generateAddition(level) {
    switch (level) {
      case 0: {
        const a = randInt(1, 9);
        const b = randInt(1, 9);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      case 1: {
        const a = randInt(6, 25);
        const b = randInt(4, 24);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      case 2: {
        const a = randInt(18, 89);
        const b = randInt(15, 79);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      case 3: {
        const a = randInt(85, 340);
        const b = randInt(65, 295);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      case 4: {
        if (Math.random() < 0.4) {
          const a = randInt(110, 290);
          const b = randInt(80, 220);
          const c = randInt(45, 160);
          return { text: `${a} + ${b} + ${c}`, answer: a + b + c };
        }
        const a = randInt(320, 890);
        const b = randInt(245, 780);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      case 5:
      default: {
        const mode = randInt(1, 3);
        if (mode === 1) {
          const a = randInt(240, 560);
          const b = randInt(180, 490);
          const c = randInt(120, 350);
          return { text: `${a} + ${b} + ${c}`, answer: a + b + c };
        }
        if (mode === 2) {
          const a = randInt(750, 1850);
          const b = randInt(640, 1690);
          return { text: `${a} + ${b}`, answer: a + b };
        }
        const neg = randInt(25, 95);
        const pos = randInt(110, 280);
        return { text: `−${neg} + ${pos}`, answer: -neg + pos };
      }
    }
  }

  function generateSubtraction(level) {
    switch (level) {
      case 0: {
        const a = randInt(2, 10);
        const b = randInt(1, a - 1);
        return { text: `${a} − ${b}`, answer: a - b };
      }
      case 1: {
        const a = randInt(12, 30);
        const b = randInt(3, a - 2);
        return { text: `${a} − ${b}`, answer: a - b };
      }
      case 2: {
        const a = randInt(35, 99);
        const b = randInt(12, a - 6);
        return { text: `${a} − ${b}`, answer: a - b };
      }
      case 3: {
        const a = randInt(140, 480);
        const b = randInt(45, a - 18);
        return { text: `${a} − ${b}`, answer: a - b };
      }
      case 4: {
        const a = randInt(450, 995);
        const b = randInt(135, a - 45);
        return { text: `${a} − ${b}`, answer: a - b };
      }
      case 5:
      default: {
        if (Math.random() < 0.35) {
          const a = randInt(35, 95);
          const b = randInt(a + 18, a + 115);
          return { text: `${a} − ${b}`, answer: a - b };
        }
        const a = randInt(1100, 2650);
        const b = randInt(480, a - 120);
        return { text: `${a} − ${b}`, answer: a - b };
      }
    }
  }

  function generateMultiplication(level) {
    switch (level) {
      case 0: {
        const a = randInt(1, 5);
        const b = randInt(1, 5);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      case 1: {
        const a = randInt(2, 9);
        const b = randInt(2, 9);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      case 2: {
        const a = randInt(6, 15);
        const b = randInt(4, 12);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      case 3: {
        const a = randInt(11, 22);
        const b = randInt(8, 18);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      case 4: {
        if (Math.random() < 0.5) {
          const a = randInt(115, 260);
          const b = randInt(11, 16);
          return { text: `${a} × ${b}`, answer: a * b };
        }
        const a = randInt(22, 45);
        const b = randInt(16, 32);
        return { text: `${a} × ${b}`, answer: a * b };
      }
      case 5:
      default: {
        if (Math.random() < 0.45) {
          const a = randInt(12, 24);
          const b = randInt(6, 12);
          const c = randInt(15, 65);
          return { text: `(${a} × ${b}) + ${c}`, answer: a * b + c };
        }
        const a = randInt(32, 68);
        const b = randInt(21, 45);
        return { text: `${a} × ${b}`, answer: a * b };
      }
    }
  }

  function generateDivision(level) {
    switch (level) {
      case 0: {
        const divisor = randInt(2, 5);
        const quotient = randInt(1, 5);
        return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
      }
      case 1: {
        const divisor = randInt(2, 9);
        const quotient = randInt(2, 9);
        return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
      }
      case 2: {
        const divisor = randInt(4, 12);
        const quotient = randInt(5, 15);
        return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
      }
      case 3: {
        const divisor = randInt(7, 16);
        const quotient = randInt(8, 20);
        return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
      }
      case 4: {
        const divisor = randInt(12, 28);
        const quotient = randInt(12, 30);
        return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
      }
      case 5:
      default: {
        if (Math.random() < 0.45) {
          const divisor = randInt(11, 18);
          const quotient = randInt(9, 18);
          const mult = randInt(4, 9);
          return {
            text: `(${divisor * quotient} ÷ ${divisor}) × ${mult}`,
            answer: quotient * mult,
          };
        }
        const divisor = randInt(22, 45);
        const quotient = randInt(18, 42);
        return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
      }
    }
  }

  function generatePower(level) {
    switch (level) {
      case 0: {
        const base = randInt(1, 5);
        return { text: `${base}²`, answer: base ** 2 };
      }
      case 1: {
        const base = randInt(2, 9);
        return { text: `${base}²`, answer: base ** 2 };
      }
      case 2: {
        if (Math.random() < 0.35) {
          const base = randInt(2, 5);
          return { text: `${base}³`, answer: base ** 3 };
        }
        const base = randInt(6, 12);
        return { text: `${base}²`, answer: base ** 2 };
      }
      case 3: {
        const type = randInt(1, 3);
        if (type === 1) {
          const base = randInt(11, 16);
          return { text: `${base}²`, answer: base ** 2 };
        }
        if (type === 2) {
          const base = randInt(4, 7);
          return { text: `${base}³`, answer: base ** 3 };
        }
        const exp = randInt(5, 7);
        return { text: `2${toSuperscript(exp)}`, answer: 2 ** exp };
      }
      case 4: {
        const type = randInt(1, 3);
        if (type === 1) {
          const base = randInt(15, 25);
          return { text: `${base}²`, answer: base ** 2 };
        }
        if (type === 2) {
          const base = randInt(6, 10);
          return { text: `${base}³`, answer: base ** 3 };
        }
        const pairs = [
          [3, 4],
          [4, 4],
          [5, 4],
          [2, 8],
        ];
        const [b, e] = pickRandom(pairs);
        return { text: `${b}${toSuperscript(e)}`, answer: b ** e };
      }
      case 5:
      default: {
        const type = randInt(1, 3);
        if (type === 1) {
          const a = randInt(8, 15);
          const b = randInt(3, 9);
          return { text: `${a}² + ${b}²`, answer: a ** 2 + b ** 2 };
        }
        if (type === 2) {
          const a = randInt(12, 20);
          const b = randInt(5, a - 3);
          return { text: `${a}² − ${b}²`, answer: a ** 2 - b ** 2 };
        }
        const choices = [
          [26, 2],
          [28, 2],
          [30, 2],
          [11, 3],
          [12, 3],
          [2, 9],
          [2, 10],
          [6, 4],
        ];
        const [b, e] = pickRandom(choices);
        return { text: `${b}${toSuperscript(e)}`, answer: b ** e };
      }
    }
  }

  function generateRoot(level) {
    switch (level) {
      case 0: {
        const root = randInt(1, 5);
        return { text: `√${root ** 2}`, answer: root };
      }
      case 1: {
        const root = randInt(2, 9);
        return { text: `√${root ** 2}`, answer: root };
      }
      case 2: {
        if (Math.random() < 0.35) {
          const root = randInt(2, 5);
          return { text: `∛${root ** 3}`, answer: root };
        }
        const root = randInt(7, 12);
        return { text: `√${root ** 2}`, answer: root };
      }
      case 3: {
        if (Math.random() < 0.4) {
          const root = randInt(4, 7);
          return { text: `∛${root ** 3}`, answer: root };
        }
        const root = randInt(11, 16);
        return { text: `√${root ** 2}`, answer: root };
      }
      case 4: {
        const type = randInt(1, 3);
        if (type === 1) {
          const root = randInt(15, 25);
          return { text: `√${root ** 2}`, answer: root };
        }
        if (type === 2) {
          const root = randInt(6, 10);
          return { text: `∛${root ** 3}`, answer: root };
        }
        const root = randInt(2, 5);
        return { text: `∜${root ** 4}`, answer: root };
      }
      case 5:
      default: {
        const type = randInt(1, 3);
        if (type === 1) {
          const r1 = randInt(8, 16);
          const r2 = randInt(5, 13);
          return { text: `√${r1 ** 2} + √${r2 ** 2}`, answer: r1 + r2 };
        }
        if (type === 2) {
          const r1 = randInt(9, 18);
          const r2 = randInt(2, 5);
          return { text: `√${r1 ** 2} × ∛${r2 ** 3}`, answer: r1 * r2 };
        }
        if (Math.random() < 0.5) {
          const root = randInt(25, 35);
          return { text: `√${root ** 2}`, answer: root };
        }
        const cubeRoot = randInt(10, 14);
        return { text: `∛${cubeRoot ** 3}`, answer: cubeRoot };
      }
    }
  }

  function toSuperscript(num) {
    const map = {
      '0': '⁰',
      '1': '¹',
      '2': '²',
      '3': '³',
      '4': '⁴',
      '5': '⁵',
      '6': '⁶',
      '7': '⁷',
      '8': '⁸',
      '9': '⁹',
    };
    return String(num)
      .split('')
      .map((ch) => map[ch] || ch)
      .join('');
  }

  function generateDistractors(correctAnswer, level, op) {
    const options = new Set([correctAnswer]);
    const allowNegative = level === 5 && correctAnswer < 0;
    const minAllowed = allowNegative ? -Infinity : (correctAnswer === 0 ? 0 : 1);

    const offsets =
      op === 'root' || op === 'div'
        ? [-3, -2, -1, 1, 2, 3, 4, 5]
        : [-12, -10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10, 12];

    let guard = 0;
    while (options.size < 4 && guard < 60) {
      guard++;
      const delta = pickRandom(offsets);
      const candidate = correctAnswer + delta;
      if (candidate >= minAllowed && candidate !== correctAnswer) {
        options.add(candidate);
      }
    }

    // Garantia determinística de 4 alternativas distintas
    let fallbackStep = 1;
    while (options.size < 4) {
      const candidate = correctAnswer + fallbackStep;
      if (candidate >= minAllowed) {
        options.add(candidate);
      }
      fallbackStep++;
    }

    return shuffleArray(Array.from(options));
  }

  function createQuestion() {
    const availableOps = Array.from(state.selectedOps);
    const chosenOp = pickRandom(availableOps);
    let base;

    switch (chosenOp) {
      case 'add':
        base = generateAddition(state.level);
        break;
      case 'sub':
        base = generateSubtraction(state.level);
        break;
      case 'mul':
        base = generateMultiplication(state.level);
        break;
      case 'div':
        base = generateDivision(state.level);
        break;
      case 'pow':
        base = generatePower(state.level);
        break;
      case 'root':
        base = generateRoot(state.level);
        break;
      default:
        base = generateAddition(state.level);
    }

    return {
      text: base.text,
      answer: base.answer,
      options: generateDistractors(base.answer, state.level, chosenOp),
    };
  }

  // Retorna sempre a mesma questão para o índice informado, garantindo equilíbrio justo
  function getQuestionAt(index) {
    while (state.questionDeck.length <= index) {
      state.questionDeck.push(createQuestion());
    }
    return state.questionDeck[index];
  }

  /* ========================================================================
     NAVEGAÇÃO ENTRE TELAS E CONFIGURAÇÕES
     ======================================================================== */

  function showScreen(targetKey) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === targetKey);
    });
  }

  function updateOperationsUI() {
    dom.opCards.forEach((card) => {
      const op = card.dataset.op;
      const isSelected = state.selectedOps.has(op);
      card.classList.toggle('active', isSelected);
      card.setAttribute('aria-pressed', String(isSelected));
    });

    const hasOps = state.selectedOps.size > 0;
    dom.btnStartBattle.disabled = !hasOps;
    dom.opsValidationMsg.classList.toggle('visible', !hasOps);
  }

  function buildScorePips() {
    [1, 2].forEach((id) => {
      const container = playerDom[id].pips;
      container.innerHTML = '';
      for (let i = 1; i <= WINNING_SCORE; i++) {
        const pip = document.createElement('span');
        pip.className = 'pip';
        container.appendChild(pip);
      }
    });
  }

  /* ========================================================================
     LÓGICA DA PARTIDA (INDEPENDENTE POR JOGADOR, COM SEQUÊNCIA IDÊNTICA)
     ======================================================================== */

  function renderPlayerQuestion(playerId) {
    const player = state.players[playerId];
    const ui = playerDom[playerId];
    const q = getQuestionAt(player.questionIndex);

    player.currentQuestion = q;
    player.isLocked = false;

    ui.question.textContent = q.text;
    ui.question.classList.toggle('compact', q.text.length >= 11);

    ui.buttons.forEach((btn, idx) => {
      const val = q.options[idx];
      btn.textContent = val;
      btn.dataset.value = String(val);
      btn.classList.remove('btn-correct', 'btn-wrong');
    });
  }

  function updatePlayerHUD(playerId) {
    const player = state.players[playerId];
    const ui = playerDom[playerId];

    ui.score.textContent = String(player.score);
    const pipNodes = ui.pips.children;
    for (let i = 0; i < pipNodes.length; i++) {
      pipNodes[i].classList.toggle('filled', i < player.score);
    }
  }

  function triggerPlayerFeedback(playerId, isCorrect) {
    const player = state.players[playerId];
    const ui = playerDom[playerId];

    clearTimeout(player.feedbackTimer);

    ui.feedback.classList.remove('flash-correct', 'flash-wrong');
    ui.delta.classList.remove('show-plus', 'show-minus');

    // Force reflow para reiniciar animação mesmo em respostas ultrarrápidas
    void ui.feedback.offsetWidth;

    if (isCorrect) {
      ui.feedback.classList.add('flash-correct');
      ui.delta.textContent = '+1';
      ui.delta.classList.add('show-plus');
    } else {
      ui.feedback.classList.add('flash-wrong');
      ui.delta.textContent = '−1';
      ui.delta.classList.add('show-minus');
    }

    player.feedbackTimer = setTimeout(() => {
      ui.feedback.classList.remove('flash-correct', 'flash-wrong');
    }, FEEDBACK_DELAY_MS);
  }

  function handlePlayerAnswer(playerId, buttonEl) {
    if (!state.isPlaying) return;

    const player = state.players[playerId];
    if (player.isLocked || !player.currentQuestion) return;

    // Bloqueia imediatamente este jogador para evitar duplo toque na mesma questão
    player.isLocked = true;

    const selectedValue = Number(buttonEl.dataset.value);
    const isCorrect = selectedValue === player.currentQuestion.answer;

    if (isCorrect) {
      player.score += 1;
      player.correctCount += 1;
      buttonEl.classList.add('btn-correct');
    } else {
      player.score = Math.max(0, player.score - 1);
      player.wrongCount += 1;
      buttonEl.classList.add('btn-wrong');
    }

    updatePlayerHUD(playerId);
    triggerPlayerFeedback(playerId, isCorrect);

    // Verifica vitória imediatamente ao atingir 10 pontos
    if (player.score >= WINNING_SCORE) {
      player.score = WINNING_SCORE;
      updatePlayerHUD(playerId);
      endMatch(playerId);
      return;
    }

    // Avança para a próxima posição da sequência compartilhada sem interromper o adversário
    player.questionIndex += 1;
    clearTimeout(player.nextQuestionTimer);
    player.nextQuestionTimer = setTimeout(() => {
      if (state.isPlaying) {
        renderPlayerQuestion(playerId);
      }
    }, FEEDBACK_DELAY_MS);
  }

  function clearAllTimers() {
    [1, 2].forEach((id) => {
      clearTimeout(state.players[id].nextQuestionTimer);
      clearTimeout(state.players[id].feedbackTimer);
    });
    clearTimeout(state.exitConfirmTimer);
  }

  function runCountdown(onComplete) {
    const steps = ['3', '2', '1', 'JÁ!'];
    let idx = 0;

    dom.countdownOverlay.classList.remove('hidden');

    function showStep() {
      if (idx >= steps.length) {
        dom.countdownOverlay.classList.add('hidden');
        onComplete();
        return;
      }
      const label = steps[idx];
      dom.countdownTop.textContent = label;
      dom.countdownBottom.textContent = label;
      idx++;
      setTimeout(showStep, idx === steps.length ? 350 : 480);
    }

    showStep();
  }

  function startMatch() {
    if (state.selectedOps.size === 0) return;

    clearAllTimers();
    state.isPlaying = false;
    state.questionDeck = []; // Reinicia a fila compartilhada para a nova partida

    // Lê os nomes personalizados ou aplica padrão
    const name1 = dom.inputP1Name.value.trim().toUpperCase() || 'JOGADOR 1';
    const name2 = dom.inputP2Name.value.trim().toUpperCase() || 'JOGADOR 2';

    state.players[1].name = name1;
    state.players[2].name = name2;
    playerDom[1].hudName.textContent = name1;
    playerDom[2].hudName.textContent = name2;

    // Reseta pontuação e coloca ambos na questão 0 da sequência
    [1, 2].forEach((id) => {
      const p = state.players[id];
      p.score = 0;
      p.correctCount = 0;
      p.wrongCount = 0;
      p.questionIndex = 0;
      p.isLocked = true;
      playerDom[id].feedback.classList.remove('flash-correct', 'flash-wrong');
      updatePlayerHUD(id);
      renderPlayerQuestion(id);
      p.isLocked = true;
    });

    dom.btnAbortMatch.classList.remove('confirm-exit');
    dom.btnAbortMatch.textContent = '✕';

    showScreen('battle');

    runCountdown(() => {
      state.isPlaying = true;
      state.players[1].isLocked = false;
      state.players[2].isLocked = false;
    });
  }

  function endMatch(winnerId) {
    state.isPlaying = false;
    clearAllTimers();
    state.players[1].isLocked = true;
    state.players[2].isLocked = true;

    const p1 = state.players[1];
    const p2 = state.players[2];
    const winner = state.players[winnerId];

    dom.winnerTitle.textContent = `${winner.name} VENCEU!`;
    dom.victorySubtitle.textContent = `Alcançou ${WINNING_SCORE} pontos no ${LEVEL_LABELS[state.level]}`;

    dom.finalNameP1.textContent = p1.name;
    dom.finalNameP2.textContent = p2.name;
    dom.finalScoreP1.textContent = String(p1.score);
    dom.finalScoreP2.textContent = String(p2.score);
    dom.finalStatsP1.textContent = `${p1.correctCount} acertos • ${p1.wrongCount} erros`;
    dom.finalStatsP2.textContent = `${p2.correctCount} acertos • ${p2.wrongCount} erros`;

    dom.finalCardP1.classList.toggle('winner-highlight', winnerId === 1);
    dom.finalCardP2.classList.toggle('winner-highlight', winnerId === 2);

    spawnConfetti();

    setTimeout(() => {
      showScreen('victory');
    }, 280);
  }

  function spawnConfetti() {
    dom.confettiContainer.innerHTML = '';
    const colors = ['#38bdf8', '#fb7185', '#fbbf24', '#10b981', '#a78bfa'];

    for (let i = 0; i < 42; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      dom.confettiContainer.appendChild(piece);
    }
  }

  /* ========================================================================
     EVENT LISTENERS
     ======================================================================== */

  function bindEvents() {
    // Seleção de Dificuldade
    dom.diffCards.forEach((card) => {
      card.addEventListener('click', () => {
        dom.diffCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        state.level = Number(card.dataset.level);
      });
    });

    // Avançar para Operações
    dom.btnToOperations.addEventListener('click', () => {
      dom.selectedLevelBadge.textContent = LEVEL_LABELS[state.level];
      updateOperationsUI();
      showScreen('operations');
    });

    // Voltar para Dificuldade
    dom.btnBackDifficulty.addEventListener('click', () => {
      showScreen('difficulty');
    });

    // Alternar Operações Individuais
    dom.opCards.forEach((card) => {
      card.addEventListener('click', () => {
        const op = card.dataset.op;
        if (state.selectedOps.has(op)) {
          state.selectedOps.delete(op);
        } else {
          state.selectedOps.add(op);
        }
        updateOperationsUI();
      });
    });

    // Selecionar Todas / Limpar Seleção
    dom.btnSelectAllOps.addEventListener('click', () => {
      state.selectedOps = new Set(['add', 'sub', 'mul', 'div', 'pow', 'root']);
      updateOperationsUI();
    });

    dom.btnClearOps.addEventListener('click', () => {
      state.selectedOps.clear();
      updateOperationsUI();
    });

    // Iniciar Batalha
    dom.btnStartBattle.addEventListener('click', startMatch);

    // Respostas Multi-Touch Simultâneas (pointerdown para latência zero)
    [1, 2].forEach((playerId) => {
      playerDom[playerId].buttons.forEach((btn) => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          handlePlayerAnswer(playerId, btn);
        });
      });
    });

    // Botão central de saída segura (exige 2 toques rápidos para evitar saída acidental)
    dom.btnAbortMatch.addEventListener('click', () => {
      if (!dom.btnAbortMatch.classList.contains('confirm-exit')) {
        dom.btnAbortMatch.classList.add('confirm-exit');
        dom.btnAbortMatch.textContent = 'Sair?';
        clearTimeout(state.exitConfirmTimer);
        state.exitConfirmTimer = setTimeout(() => {
          dom.btnAbortMatch.classList.remove('confirm-exit');
          dom.btnAbortMatch.textContent = '✕';
        }, 2200);
        return;
      }

      state.isPlaying = false;
      clearAllTimers();
      showScreen('difficulty');
    });

    // Tela de Vitória: Jogar Novamente e Configurar Partida
    dom.btnPlayAgain.addEventListener('click', startMatch);
    dom.btnBackConfig.addEventListener('click', () => {
      showScreen('difficulty');
    });
  }

  // Inicialização
  buildScorePips();
  updateOperationsUI();
  bindEvents();
})();