/*
Bernardo, Josh Andrei R.
BSIT 2A
*/

"use strict";

/* -------------------- Questions (10 total) -------------------- */
const QUESTIONS = [
  {
    q: "Which HTML tag is semantic for the main content of a page?",
    choices: ["<div>", "<main>", "<span>", "<b>"],
    answerIndex: 1
  },
  {
    q: "Which CSS layout is best for two-dimensional grids (rows AND columns)?",
    choices: ["Flexbox", "Grid", "Float", "Position: absolute"],
    answerIndex: 1
  },
  {
    q: "Which attribute provides alternative text for an image (accessibility)?",
    choices: ["title", "href", "alt", "srcset"],
    answerIndex: 2
  },
  {
    q: "In responsive design, what does a media query do?",
    choices: [
      "Adds a database to the website",
      "Changes styles based on screen/device conditions",
      "Uploads images automatically",
      "Encrypts user passwords"
    ],
    answerIndex: 1
  },
  {
    q: "Which tag is best for site navigation links?",
    choices: ["<header>", "<nav>", "<section>", "<article>"],
    answerIndex: 1
  },

  /* +5 more (total 10) */
  {
    q: "What does CSS stand for?",
    choices: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Styling Scripts"],
    answerIndex: 1
  },
  {
    q: "Which HTTP method is commonly used to retrieve data from a server?",
    choices: ["POST", "GET", "PUT", "DELETE"],
    answerIndex: 1
  },
  {
    q: "Which JavaScript keyword declares a block-scoped variable?",
    choices: ["var", "let", "static", "define"],
    answerIndex: 1
  },
  {
    q: "Which is the correct way to link an external CSS file in HTML?",
    choices: [
      "<style src='style.css'></style>",
      "<link rel='stylesheet' href='style.css'>",
      "<css href='style.css'>",
      "<script href='style.css'></script>"
    ],
    answerIndex: 1
  },
  {
    q: "Which of these improves accessibility for keyboard users?",
    choices: [
      "Removing focus outlines",
      "Using only images for buttons",
      "Adding a 'Skip to content' link",
      "Disabling tab navigation"
    ],
    answerIndex: 2
  }
];

/* -------------------- Elements -------------------- */
const elStartOverlay = document.getElementById("startOverlay");
const elStartQuizBtn = document.getElementById("startQuizBtn");

const elTimerText = document.getElementById("timerText");
const elQCountText = document.getElementById("qCountText");

const elQTitle = document.getElementById("qTitle");
const elChoices = document.getElementById("choices");

const elPrevBtn = document.getElementById("prevBtn");
const elNextBtn = document.getElementById("nextBtn");
const elRestartBtn = document.getElementById("restartBtn");

const elResultBox = document.getElementById("resultBox");

/* -------------------- State -------------------- */
const state = {
  started: false,
  idx: 0,
  // store selected answer index per question (null = unanswered)
  picks: Array(QUESTIONS.length).fill(null),
  // 1 minute per question
  secondsLeft: 60,
  timerId: null,
  finished: false
};

/* -------------------- Helpers -------------------- */
function pad2(n){ return String(n).padStart(2, "0"); }

function setTimerText(seconds){
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  elTimerText.textContent = `${pad2(mm)}:${pad2(ss)}`;
}

function stopTimer(){
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

function startTimer(){
  stopTimer();
  state.secondsLeft = 60;
  setTimerText(state.secondsLeft);

  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;
    if (state.secondsLeft < 0) state.secondsLeft = 0;
    setTimerText(state.secondsLeft);

    if (state.secondsLeft === 0){
      // Auto-advance when time is up
      stopTimer();
      if (state.idx < QUESTIONS.length - 1){
        goTo(state.idx + 1, true);
      } else {
        finishQuiz();
      }
    }
  }, 1000);
}

function updateCounter(){
  elQCountText.textContent = `${state.idx + 1} / ${QUESTIONS.length}`;
}

/* -------------------- Render -------------------- */
function renderQuestion(){
  const item = QUESTIONS[state.idx];
  updateCounter();

  elQTitle.textContent = `Q${state.idx + 1}: ${item.q}`;

  // Build choices
  elChoices.innerHTML = "";
  const picked = state.picks[state.idx];

  item.choices.forEach((label, i) => {
    const row = document.createElement("label");
    row.className = "choice" + (picked === i ? " selected" : "");
    row.setAttribute("role", "radio");
    row.setAttribute("aria-checked", String(picked === i));
    row.tabIndex = 0;

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "choice";
    input.value = String(i);
    input.checked = picked === i;

    const text = document.createElement("span");
    text.textContent = label;

    row.appendChild(input);
    row.appendChild(text);

    function choose(){
      if (state.finished) return;
      state.picks[state.idx] = i;
      renderQuestion(); // refresh highlight
    }

    row.addEventListener("click", choose);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        choose();
      }
    });

    elChoices.appendChild(row);
  });

  // Buttons
  elPrevBtn.disabled = state.idx === 0;
  elNextBtn.textContent = (state.idx === QUESTIONS.length - 1) ? "Finish" : "Next";
}

/* -------------------- Navigation -------------------- */
function goTo(newIdx, fromTimeout = false){
  if (state.finished) return;

  const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, newIdx));
  state.idx = clamped;

  renderQuestion();

  // Reset timer per question (ONLY after quiz started)
  if (state.started && !state.finished){
    startTimer();
  }

  // If user reached last question via timeout and time ran out, this function already handled finish in timer
  if (fromTimeout){
    // no-op (kept for clarity)
  }
}

function finishQuiz(){
  state.finished = true;
  stopTimer();
  setTimerText(0);

  // Score
  let correct = 0;
  for (let i = 0; i < QUESTIONS.length; i++){
    if (state.picks[i] === QUESTIONS[i].answerIndex) correct++;
  }

  // Result message
  const msg = `You got ${correct} correct answers out of ${QUESTIONS.length}.`;

  elResultBox.innerHTML = "";
  const p = document.createElement("p");
  p.className = correct >= Math.ceil(QUESTIONS.length * 0.7) ? "result-good" : "result-bad";
  p.textContent = msg;
  elResultBox.appendChild(p);

  // Lock choices + buttons
  elPrevBtn.disabled = false;
  elNextBtn.textContent = "Finished";
  elNextBtn.disabled = true;

  // Also visually lock choices
  document.querySelectorAll(".choice").forEach((c) => {
    c.style.pointerEvents = "none";
    c.style.opacity = "0.92";
  });
}

function restartQuiz(showStartScreen = false){
  stopTimer();
  state.started = false;
  state.idx = 0;
  state.picks = Array(QUESTIONS.length).fill(null);
  state.secondsLeft = 60;
  state.finished = false;

  setTimerText(60);
  updateCounter();
  renderQuestion();

  elNextBtn.disabled = false;
  elResultBox.innerHTML = `<p class="result-muted">Start the quiz to see your score.</p>`;

  if (showStartScreen){
    elStartOverlay.classList.remove("hidden");
  }
}

/* -------------------- Events -------------------- */
elStartQuizBtn.addEventListener("click", () => {
  state.started = true;
  elStartOverlay.classList.add("hidden");
  renderQuestion();
  startTimer();
});

elPrevBtn.addEventListener("click", () => {
  if (!state.started || state.finished) return;
  goTo(state.idx - 1);
});

elNextBtn.addEventListener("click", () => {
  if (!state.started || state.finished) return;

  if (state.idx === QUESTIONS.length - 1){
    finishQuiz();
  } else {
    goTo(state.idx + 1);
  }
});

elRestartBtn.addEventListener("click", () => {
  restartQuiz(true);
});

/* -------------------- Init -------------------- */
setTimerText(60);
elQCountText.textContent = `1 / ${QUESTIONS.length}`;
elResultBox.innerHTML = `<p class="result-muted">Start the quiz to see your score.</p>`;
renderQuestion();
// show start overlay by default
elStartOverlay.classList.remove("hidden");
