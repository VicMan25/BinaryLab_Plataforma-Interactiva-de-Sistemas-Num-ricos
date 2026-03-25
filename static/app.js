/**
 * BinEdu — Sistema de Numeración Binaria
 * Lógica JavaScript principal
 * Cubre: navegación, conversores, ejercicios, quiz, juego, IPv4
 */

/* ══════════════════════════════════════════
   ESTADO GLOBAL
══════════════════════════════════════════ */
const state = {
  completedModules: new Set(),
  totalModules: 10,
  moduleOrder: ['teoria', 'posicion', 'bin2dec', 'dec2bin', 'practica_b2d', 'practica_d2b', 'quiz', 'juego', 'ipv4', 'hex'],
  currentModule: 'teoria',

  // Práctica B→D
  b2d: { score: 0, attempts: 0, correct: 0, answer: null, difficulty: 'easy' },
  // Práctica D→B
  d2b: { score: 0, attempts: 0, correct: 0, answer: null, difficulty: 'easy' },
  // Quiz
  quiz: { questions: [], currentQ: 0, score: 0, answered: [] },
  // Juego
  game: {
    active: false, score: 0, correct: 0, wrong: 0,
    timer: 30, timerInterval: null, mode: 'bin2dec', difficulty: 'easy',
    currentAnswer: null
  }
};

/* ══════════════════════════════════════════
   NAVEGACIÓN
══════════════════════════════════════════ */

/**
 * Muestra el módulo especificado y actualiza UI de navegación.
 */
function showModule(moduleId) {
  // Ocultar todos los módulos
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Mostrar el módulo objetivo
  const mod = document.getElementById('mod-' + moduleId);
  if (mod) mod.classList.add('active');

  const navBtn = document.querySelector(`[data-module="${moduleId}"]`);
  if (navBtn) navBtn.classList.add('active');

  state.currentModule = moduleId;

  // Actualizar título topbar
  const titles = {
    teoria: 'Teoría del Sistema Binario',
    posicion: 'Notación Posicional',
    bin2dec: 'Conversor Binario → Decimal',
    dec2bin: 'Conversor Decimal → Binario',
    practica_b2d: 'Práctica: Binario → Decimal',
    practica_d2b: 'Práctica: Decimal → Binario',
    quiz: 'Verificar Comprensión',
    juego: 'Juego Binario',
    ipv4: 'Direcciones IPv4',
    hex: 'Sistema Hexadecimal',
    final: '¡Módulo Completado!'
  };
  const idx = state.moduleOrder.indexOf(moduleId);
  document.getElementById('topbarTitle').textContent = titles[moduleId] || 'BinEdu';
  document.getElementById('topbarBadge').textContent = idx >= 0 ? `Módulo ${idx+1}/${state.totalModules}` : '';

  // Acciones al entrar en ciertos módulos
  if (moduleId === 'ipv4') renderIPExamples();

  // Cerrar sidebar en móvil
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo(0, 0);
}

/** Marca el módulo actual como completado y navega al siguiente. */
function completeAndNext(current, next) {
  state.completedModules.add(current);
  updateProgress();
  showModule(next);
  showToast('✓ Módulo completado', 'success');
}

/** Marca el último módulo y muestra la pantalla final. */
function finishModule() {
  state.completedModules.add('ipv4');
  state.completedModules.add(state.currentModule);
  updateProgress();
  showModule('final');
}

/** Actualiza la barra de progreso. */
function updateProgress() {
  const pct = Math.round((state.completedModules.size / state.totalModules) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressPercent').textContent = pct + '%';
  document.getElementById('progressModules').textContent = `${state.completedModules.size} / ${state.totalModules} módulos`;
}

/* Sidebar móvil */
function openSidebar() { document.getElementById('sidebar').classList.add('open'); }
document.getElementById('sidebarToggle').onclick = () => document.getElementById('sidebar').classList.remove('open');

/* ══════════════════════════════════════════
   MODO OSCURO
══════════════════════════════════════════ */
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Restaurar preferencia guardada
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  document.getElementById('darkModeToggle').checked = true;
}

/* ══════════════════════════════════════════
   MÓDULO 2: EXPLORADOR DE POSICIÓN
══════════════════════════════════════════ */

/**
 * Muestra el valor posicional de cada bit ingresado.
 */
function explorePosicion() {
  const input = document.getElementById('posInput').value.trim();
  const container = document.getElementById('posResult');

  if (!input) { container.innerHTML = ''; return; }
  if (!/^[01]+$/.test(input)) {
    container.innerHTML = '<p style="color:var(--red);font-size:.85rem">Solo se permiten 0 y 1.</p>';
    return;
  }

  let total = 0;
  const cells = input.split('').map((bit, i) => {
    const power = input.length - 1 - i;
    const val = parseInt(bit) * Math.pow(2, power);
    total += val;
    return `
      <div class="pos-bit-cell ${bit === '1' ? 'active-bit' : ''}">
        <div class="pos-bit-digit">${bit}</div>
        <div class="pos-bit-power">2<sup>${power}</sup>=${Math.pow(2, power)}</div>
        <div class="pos-bit-value">${bit === '1' ? val : 0}</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="b2d-steps-row">${cells}</div>
    <div class="pos-total">Total = <span style="color:var(--accent)">${total}</span> en decimal</div>`;
}

/* ══════════════════════════════════════════
   MÓDULO 3: CONVERSOR BINARIO → DECIMAL
══════════════════════════════════════════ */

async function convertB2D() {
  const input = document.getElementById('b2dInput').value.trim();
  const errorEl = document.getElementById('b2dError');
  const stepsEl = document.getElementById('b2dSteps');
  const resultEl = document.getElementById('b2dResult');

  errorEl.textContent = '';
  stepsEl.innerHTML = '';
  resultEl.innerHTML = '';

  if (!input) { errorEl.textContent = 'Ingresa un número binario.'; return; }

  try {
    const res = await fetch('/api/binary_to_decimal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ binary: input })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error; return; }

    // Renderizar pasos
    const cellsHTML = data.steps.map(s => `
      <div class="b2d-step-cell">
        <div class="b2d-step-bit">${s.bit}</div>
        <div class="b2d-step-formula">${s.bit}×2<sup>${s.position}</sup><br/>${s.bit}×${s.power_of_2}</div>
        <div class="b2d-step-value">= ${s.value}</div>
      </div>`).join('');

    const sum = data.steps.map(s => s.value).join(' + ');

    stepsEl.innerHTML = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:.75rem"><strong>Pasos:</strong></p>
      <div class="b2d-steps-row">${cellsHTML}</div>
      <p style="margin-top:.75rem;font-size:.88rem;color:var(--text-muted)">${sum} = <strong>${data.decimal}</strong></p>`;

    resultEl.innerHTML = `${data.binary}<sub>2</sub> = <strong>${data.decimal}</strong><sub>10</sub>`;
    state.completedModules.add('bin2dec');
    updateProgress();
  } catch (e) {
    errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
  }
}

/* ══════════════════════════════════════════
   MÓDULO 4: CONVERSOR DECIMAL → BINARIO
══════════════════════════════════════════ */

async function convertD2B() {
  const input = document.getElementById('d2bInput').value;
  const errorEl = document.getElementById('d2bError');
  const stepsEl = document.getElementById('d2bSteps');
  const resultEl = document.getElementById('d2bResult');

  errorEl.textContent = '';
  stepsEl.innerHTML = '';
  resultEl.innerHTML = '';

  if (input === '') { errorEl.textContent = 'Ingresa un número decimal.'; return; }

  try {
    const res = await fetch('/api/decimal_to_binary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decimal: parseInt(input) })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error; return; }

    // Tabla de divisiones
    const rows = data.steps.map(s => `
      <tr>
        <td class="mono">${s.dividend}</td>
        <td class="mono">${s.dividend} ÷ 2</td>
        <td class="mono">${s.quotient}</td>
        <td><span class="residuo-badge">${s.remainder}</span></td>
      </tr>`).join('');

    stepsEl.innerHTML = `
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:.75rem">
        <strong>Divisiones sucesivas:</strong> leer residuos de abajo hacia arriba ↑
      </p>
      <table class="d2b-table">
        <thead><tr><th>Dividendo</th><th>Operación</th><th>Cociente</th><th>Residuo</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    resultEl.innerHTML = `${data.decimal}<sub>10</sub> = <strong>${data.binary}</strong><sub>2</sub>`;
    state.completedModules.add('dec2bin');
    updateProgress();
  } catch (e) {
    errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
  }
}

/* ══════════════════════════════════════════
   MÓDULO 5: PRÁCTICA B→D
══════════════════════════════════════════ */

async function loadB2DExercise() {
  const diff = state.b2d.difficulty;
  const res = await fetch(`/api/exercise/bin_to_dec?difficulty=${diff}`);
  const data = await res.json();
  state.b2d.answer = data.answer;
  document.getElementById('b2dExNum').textContent = data.binary;
  document.getElementById('b2dExInput').value = '';
  document.getElementById('b2dFeedback').textContent = '';
  document.getElementById('b2dFeedback').className = 'feedback-msg';
  document.getElementById('b2dExInput').focus();
}

function checkB2D() {
  const input = document.getElementById('b2dExInput').value.trim();
  const feedback = document.getElementById('b2dFeedback');
  if (!input) return;

  state.b2d.attempts++;
  if (parseInt(input) === state.b2d.answer) {
    state.b2d.correct++;
    state.b2d.score += 10;
    feedback.textContent = `✅ ¡Correcto! ${state.b2d.answer}`;
    feedback.className = 'feedback-msg correct';
    showToast('¡Respuesta correcta! +10', 'success');
    setTimeout(loadB2DExercise, 1200);
  } else {
    feedback.textContent = `❌ Incorrecto. La respuesta es ${state.b2d.answer}`;
    feedback.className = 'feedback-msg incorrect';
    state.b2d.score = Math.max(0, state.b2d.score - 2);
  }
  updateB2DScores();
  state.completedModules.add('practica_b2d');
  updateProgress();
}

function updateB2DScores() {
  document.getElementById('b2dScore').textContent = state.b2d.score;
  document.getElementById('b2dAttempts').textContent = state.b2d.attempts;
  document.getElementById('b2dCorrect').textContent = state.b2d.correct;
}

function setDiff(module, diff, btn) {
  // Actualizar botones activos
  btn.parentElement.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (module === 'practica_b2d') { state.b2d.difficulty = diff; loadB2DExercise(); }
  else { state.d2b.difficulty = diff; loadD2BExercise(); }
}

/* ══════════════════════════════════════════
   MÓDULO 6: PRÁCTICA D→B
══════════════════════════════════════════ */

async function loadD2BExercise() {
  const diff = state.d2b.difficulty;
  const res = await fetch(`/api/exercise/dec_to_bin?difficulty=${diff}`);
  const data = await res.json();
  state.d2b.answer = data.answer;
  document.getElementById('d2bExNum').textContent = data.decimal;
  document.getElementById('d2bExInput').value = '';
  document.getElementById('d2bFeedback').textContent = '';
  document.getElementById('d2bFeedback').className = 'feedback-msg';
  document.getElementById('d2bExInput').focus();
}

async function checkD2B() {
  const input = document.getElementById('d2bExInput').value.trim();
  const feedback = document.getElementById('d2bFeedback');
  if (!input) return;

  // Normalizar: quitar ceros a la izquierda
  const normalized = input.replace(/^0+/, '') || '0';
  const correct = state.d2b.answer.replace(/^0+/, '') || '0';

  state.d2b.attempts++;
  if (normalized === correct) {
    state.d2b.correct++;
    state.d2b.score += 10;
    feedback.textContent = `✅ ¡Correcto! ${state.d2b.answer}`;
    feedback.className = 'feedback-msg correct';
    showToast('¡Respuesta correcta! +10', 'success');
    setTimeout(loadD2BExercise, 1200);
  } else {
    // Obtener explicación de la API
    feedback.textContent = `❌ Incorrecto. La respuesta es ${state.d2b.answer}`;
    feedback.className = 'feedback-msg incorrect';
    state.d2b.score = Math.max(0, state.d2b.score - 2);
  }
  updateD2BScores();
  state.completedModules.add('practica_d2b');
  updateProgress();
}

function updateD2BScores() {
  document.getElementById('d2bScore').textContent = state.d2b.score;
  document.getElementById('d2bAttempts').textContent = state.d2b.attempts;
  document.getElementById('d2bCorrect').textContent = state.d2b.correct;
}

/* ══════════════════════════════════════════
   MÓDULO 7: QUIZ
══════════════════════════════════════════ */

async function startQuiz() {
  document.getElementById('quizStart').style.display = 'none';
  document.getElementById('quizQuestions').style.display = 'block';

  const res = await fetch('/api/quiz/questions');
  state.quiz.questions = await res.json();
  state.quiz.answered = new Array(state.quiz.questions.length).fill(null);
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById('quizQuestions');
  const q = state.quiz.questions;

  const questionsHTML = q.map((question, idx) => `
    <div class="quiz-question-card" id="qcard-${idx}">
      <div class="quiz-question-num">Pregunta ${idx + 1} de ${q.length}</div>
      <div class="quiz-question-text">${question.question}</div>
      <div class="quiz-options">
        ${question.options.map(opt => `
          <div class="quiz-option" onclick="selectQuizOption(${idx}, '${opt.replace(/'/g, "\\'")}', this)">
            ${opt}
          </div>`).join('')}
      </div>
      <div id="qexpl-${idx}" class="quiz-explanation" style="display:none"></div>
    </div>`).join('');

  container.innerHTML = questionsHTML + `
    <div class="quiz-submit-row">
      <button class="btn btn-primary" onclick="submitQuiz()">Ver resultados</button>
    </div>`;
}

function selectQuizOption(qIdx, option, el) {
  if (state.quiz.answered[qIdx] !== null) return; // ya respondida
  state.quiz.answered[qIdx] = option;

  const card = document.getElementById('qcard-' + qIdx);
  const opts = card.querySelectorAll('.quiz-option');
  const question = state.quiz.questions[qIdx];

  opts.forEach(o => {
    o.style.pointerEvents = 'none';
    if (o.textContent.trim() === question.correct) o.classList.add('correct-opt');
  });

  if (option === question.correct) {
    el.classList.add('correct-opt');
  } else {
    el.classList.add('wrong-opt');
  }

  // Mostrar explicación
  const expl = document.getElementById('qexpl-' + qIdx);
  expl.textContent = '💡 ' + question.explanation;
  expl.style.display = 'block';
}

function submitQuiz() {
  let score = 0;
  state.quiz.questions.forEach((q, i) => {
    if (state.quiz.answered[i] === q.correct) score++;
  });

  const pct = Math.round((score / state.quiz.questions.length) * 100);
  const msgs = [
    [0, 39, '📚 Sigue practicando, ¡puedes mejorar!'],
    [40, 59, '🙂 Buen intento, repasa los conceptos.'],
    [60, 79, '👍 ¡Bien hecho! Estás en buen camino.'],
    [80, 99, '🌟 ¡Excelente! Dominas el tema.'],
    [100, 100, '🏆 ¡Perfecto! ¡10 de 10!']
  ];
  const msg = msgs.find(([min, max]) => pct >= min && pct <= max)?.[2] || '';

  document.getElementById('quizQuestions').style.display = 'none';
  document.getElementById('quizResults').style.display = 'block';
  document.getElementById('quizResults').innerHTML = `
    <div class="quiz-result-box">
      <div style="font-size:.85rem;color:var(--text-muted);font-weight:700">RESULTADO FINAL</div>
      <div class="quiz-score-big">${score}/${state.quiz.questions.length}</div>
      <div class="quiz-message">${msg}</div>
      <div style="font-size:.9rem;color:var(--text-muted);margin-bottom:1.5rem">${pct}% de respuestas correctas</div>
      <button class="btn btn-primary" onclick="resetQuiz()">Repetir cuestionario</button>
    </div>`;

  state.completedModules.add('quiz');
  updateProgress();
}

function resetQuiz() {
  document.getElementById('quizResults').style.display = 'none';
  document.getElementById('quizStart').style.display = 'block';
}

/* ══════════════════════════════════════════
   MÓDULO 8: JUEGO BINARIO
══════════════════════════════════════════ */

function startGame() {
  const mode = document.querySelector('input[name="gameMode"]:checked').value;
  const diff = document.querySelector('input[name="gameDiff"]:checked').value;
  state.game = {
    active: true, score: 0, correct: 0, wrong: 0,
    timer: 30, mode, difficulty: diff,
    timerInterval: null, currentAnswer: null
  };

  document.getElementById('gameSetup').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('gamePlay').style.display = 'block';

  const modeLabel = mode === 'bin2dec' ? '¿Cuál es el equivalente decimal?' : '¿Cuál es el equivalente binario?';
  document.getElementById('gameModeLabel').textContent = modeLabel;

  loadGameQuestion();
  startGameTimer();
}

async function loadGameQuestion() {
  const { mode, difficulty } = state.game;
  const res = await fetch(`/api/game/question?mode=${mode}&difficulty=${difficulty}`);
  const data = await res.json();

  state.game.currentAnswer = data.correct;
  document.getElementById('gameQuestion').textContent = data.question;
  document.getElementById('gameFeedback').textContent = '';

  const opts = document.getElementById('gameOptions');
  opts.innerHTML = data.options.map(opt => `
    <button class="game-option" onclick="answerGame('${opt}')">${opt}</button>
  `).join('');
}

function answerGame(selected) {
  if (!state.game.active) return;
  const correct = state.game.currentAnswer;
  const opts = document.querySelectorAll('.game-option');
  opts.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
    else if (b.textContent === selected && selected !== correct) b.classList.add('wrong');
  });

  const fb = document.getElementById('gameFeedback');
  if (selected === correct) {
    state.game.correct++;
    state.game.score += 10;
    fb.textContent = '✅ ¡Correcto!';
    fb.style.color = 'var(--green)';
  } else {
    state.game.wrong++;
    fb.textContent = `❌ Era: ${correct}`;
    fb.style.color = 'var(--red)';
  }

  updateGameUI();
  setTimeout(loadGameQuestion, 900);
}

function startGameTimer() {
  state.game.timer = 30;
  document.getElementById('timerBar').style.transition = 'none';
  document.getElementById('timerBar').style.width = '100%';

  setTimeout(() => {
    document.getElementById('timerBar').style.transition = 'width 30s linear';
    document.getElementById('timerBar').style.width = '0%';
  }, 50);

  state.game.timerInterval = setInterval(() => {
    state.game.timer--;
    document.getElementById('gameTimer').textContent = state.game.timer;
    if (state.game.timer <= 0) endGame();
  }, 1000);
}

function endGame() {
  clearInterval(state.game.timerInterval);
  state.game.active = false;

  document.getElementById('gamePlay').style.display = 'none';
  document.getElementById('gameOver').style.display = 'block';
  document.getElementById('finalScore').textContent = state.game.score;
  document.getElementById('finalCorrect').textContent = state.game.correct;
  document.getElementById('finalWrong').textContent = state.game.wrong;

  const pct = state.game.correct + state.game.wrong > 0
    ? Math.round(state.game.correct / (state.game.correct + state.game.wrong) * 100) : 0;

  let rank, rankColor;
  if (pct >= 90) { rank = '🥇 Nivel: Experto'; rankColor = 'var(--green)'; }
  else if (pct >= 70) { rank = '🥈 Nivel: Avanzado'; rankColor = 'var(--accent)'; }
  else if (pct >= 50) { rank = '🥉 Nivel: Intermedio'; rankColor = 'var(--yellow)'; }
  else { rank = '📚 Nivel: Principiante'; rankColor = 'var(--red)'; }

  const rankEl = document.getElementById('gameRank');
  rankEl.textContent = rank;
  rankEl.style.cssText = `background:${rankColor}22;color:${rankColor};border:1.5px solid ${rankColor}`;

  state.completedModules.add('juego');
  updateProgress();
}

function resetGame() {
  clearInterval(state.game.timerInterval);
  document.getElementById('gamePlay').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('gameSetup').style.display = 'block';
}

function updateGameUI() {
  document.getElementById('gameScore').textContent = state.game.score;
  document.getElementById('gameCorrect').textContent = state.game.correct;
}

/* ══════════════════════════════════════════
   MÓDULO 9: IPv4
══════════════════════════════════════════ */

function switchIpTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (tab === 'dec2bin') {
    document.getElementById('ipDec2Bin').style.display = 'block';
    document.getElementById('ipBin2Dec').style.display = 'none';
    document.querySelectorAll('.tab')[0].classList.add('active');
  } else {
    document.getElementById('ipDec2Bin').style.display = 'none';
    document.getElementById('ipBin2Dec').style.display = 'block';
    document.querySelectorAll('.tab')[1].classList.add('active');
  }
}

async function convertIPDec() {
  const ip = document.getElementById('ipDecInput').value.trim();
  const errorEl = document.getElementById('ipDecError');
  const resultEl = document.getElementById('ipDecResult');
  errorEl.textContent = ''; resultEl.innerHTML = '';

  try {
    const res = await fetch('/api/ipv4/to_binary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error; return; }

    resultEl.innerHTML = data.octets.map((o, i) => `
      <div class="ip-result-octet">
        <div class="ip-result-dec">${o.decimal}</div>
        <div class="ip-result-bin">${o.binary}</div>
        <div style="font-size:.65rem;color:var(--text-muted);margin-top:.25rem">Octeto ${i + 1}</div>
      </div>
      ${i < 3 ? '<div style="font-size:1.5rem;font-weight:800;color:var(--text-muted);align-self:center">.</div>' : ''}`
    ).join('');

    state.completedModules.add('ipv4');
    updateProgress();
  } catch (e) {
    errorEl.textContent = 'Error de conexión.';
  }
}

async function convertIPBin() {
  const ip = document.getElementById('ipBinInput').value.trim();
  const errorEl = document.getElementById('ipBinError');
  const resultEl = document.getElementById('ipBinResult');
  errorEl.textContent = ''; resultEl.innerHTML = '';

  try {
    const res = await fetch('/api/ipv4/to_decimal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error; return; }

    resultEl.innerHTML = data.octets.map((o, i) => `
      <div class="ip-result-octet">
        <div class="ip-result-dec">${o.decimal}</div>
        <div class="ip-result-bin">${o.binary}</div>
        <div style="font-size:.65rem;color:var(--text-muted);margin-top:.25rem">Octeto ${i + 1}</div>
      </div>
      ${i < 3 ? '<div style="font-size:1.5rem;font-weight:800;color:var(--text-muted);align-self:center">.</div>' : ''}`
    ).join('');
  } catch (e) {
    errorEl.textContent = 'Error de conexión.';
  }
}

/** Renderiza ejemplos de IPs comunes precargados. */
function renderIPExamples() {
  const examples = [
    { name: 'Loopback (localhost)', dec: '127.0.0.1', bin: '01111111.00000000.00000000.00000001' },
    { name: 'Red local común', dec: '192.168.1.1', bin: '11000000.10101000.00000001.00000001' },
    { name: 'Red local alternativa', dec: '10.0.0.1', bin: '00001010.00000000.00000000.00000001' },
    { name: 'DNS público Google', dec: '8.8.8.8', bin: '00001000.00001000.00001000.00001000' },
    { name: 'Broadcast máximo', dec: '255.255.255.255', bin: '11111111.11111111.11111111.11111111' },
    { name: 'Dirección nula', dec: '0.0.0.0', bin: '00000000.00000000.00000000.00000000' },
  ];

  document.getElementById('ipExamplesGrid').innerHTML = examples.map(e => `
    <div class="ip-example-card">
      <div class="ip-example-name">${e.name}</div>
      <div class="ip-example-dec">${e.dec}</div>
      <div class="ip-example-bin">${e.bin}</div>
    </div>`).join('');
}

/* ══════════════════════════════════════════
   TOAST NOTIFICACIONES
══════════════════════════════════════════ */

/**
 * Muestra una notificación temporal tipo toast.
 * @param {string} msg - Mensaje a mostrar
 * @param {'success'|'error'|'info'} type - Tipo de notificación
 */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// HEXADECIMAL

async function convertDecToHex() {
  let val = document.getElementById("decToHexInput").value;

  let res = await fetch('/api/decimal_to_hex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decimal: val })
  });

  let data = await res.json();
  document.getElementById("hexResult").innerHTML =
    data.hex ? `HEX: ${data.hex}` : data.error;
}

async function convertHexToDec() {
  let val = document.getElementById("hexToDecInput").value;

  let res = await fetch('/api/hex_to_decimal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hex: val })
  });

  let data = await res.json();
  document.getElementById("hexResult").innerHTML =
    data.decimal ? `DEC: ${data.decimal}` : data.error;
}

async function convertBinToHex() {
  let val = document.getElementById("binToHexInput").value;

  let res = await fetch('/api/binary_to_hex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ binary: val })
  });

  let data = await res.json();
  document.getElementById("hexResult").innerHTML =
    data.hex ? `HEX: ${data.hex}` : data.error;
}

async function convertHexToBin() {
  let val = document.getElementById("hexToBinInput").value;

  let res = await fetch('/api/hex_to_binary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hex: val })
  });

  let data = await res.json();
  document.getElementById("hexResult").innerHTML =
    data.binary ? `BIN: ${data.binary}` : data.error;
}

/* ══════════════════════════════════════════
   INICIALIZACIÓN
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  showModule('teoria');
  loadB2DExercise();
  loadD2BExercise();
  renderIPExamples();
});
