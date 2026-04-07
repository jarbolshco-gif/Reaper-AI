/*
Bernardo, Josh Andrei R.
BSIT 2A
*/

"use strict";

const AUDIO = {
  hello: "Hello3.mp3",
  defaultReply: ".mp3",
  tuition: "tuition.mp3",
  enrollment: "enrollment.mp3",
  installment: "installment.mp3",
  tor: "tor.mp3",
  calendar: "calendar.mp3",
  conflict: "conflict.mp3",
  welcome: "welcome.mp3",
  bye: "bye.mp3"
};

const DATA = {
  fees: [
    {
      id: "fees-1",
      question: "How much is the tuition fee per semester excluding other fees?",
      answer: "₱20,000.00 per semester (Tuition only). Other fees may apply depending on course and units.",
      audio: AUDIO.tuition
    },
    {
      id: "fees-2",
      question: "When is the usual deadline for enrollment payment?",
      answer: "Usually within the enrollment period set by the Registrar/Cashier. Check your school calendar or announcements for exact dates.",
      audio: AUDIO.enrollment
    },
    {
      id: "fees-3",
      question: "Do you accept installment payments?",
      answer: "Some schools allow installment plans with conditions (downpayment + scheduled dues). Ask the Cashier/Accounting office for the official policy.",
      audio: AUDIO.installment
    }
  ],
  academics: [
    {
      id: "acad-1",
      question: "How do I request a copy of my grades (TOR/Report of Grades)?",
      answer: "Submit a request form at the Registrar, provide valid ID, and pay the required processing fee if applicable.",
      audio: AUDIO.tor
    },
    {
      id: "acad-2",
      question: "What should I do if I have a schedule conflict?",
      answer: "Coordinate with your adviser/department for possible section change or approved adjustments before finalizing enrollment.",
      audio: AUDIO.conflict
    },
    {
      id: "acad-3",
      question: "Where can I see the official academic calendar?",
      answer: "Check the school website, official page, or campus bulletin. The Registrar usually posts the academic calendar.",
      audio: AUDIO.calendar
    }
  ],
  services: [
    {
      id: "serv-1",
      question: "How can I contact the Guidance Office?",
      answer: "You can visit during office hours or use the official email/phone listed on the school’s contact page.",
      audio: null
    },
    {
      id: "serv-2",
      question: "How do I apply for a school ID?",
      answer: "Apply for a school ID at the Student Affairs/ID unit with your registration form and valid identification.",
      audio: null
    },
    {
      id: "serv-3",
      question: "Where do I report lost-and-found items?",
      answer: "Report to the Security Office or Student Affairs. Provide details (item description, date/time, location).",
      audio: null
    }
  ]
};

const state = {
  category: "fees",
  answered: new Set(),
  voiceEnabled: true,
  isTyping: false,
  hasStarted: false
};

const elQuestionList = document.getElementById("questionList");
const elChat = document.getElementById("chat");
const elInputForm = document.getElementById("inputForm");
const elUserInput = document.getElementById("userInput");
const elVoiceToggleBtn = document.getElementById("voiceToggleBtn");
const elLogoWrap = document.getElementById("logoWrap");

/* ----------- Start prompt ----------- */
function hideStartPrompt() {
  const p = document.getElementById("startPrompt");
  if (!p) return;
  p.classList.add("hidden");
  setTimeout(() => {
    if (p && p.parentNode) p.parentNode.removeChild(p);
  }, 250);
}

/* ----------- Utilities ----------- */
function clearNode(node){ while(node.firstChild) node.removeChild(node.firstChild); }
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function nowTimeString(){ return new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }

function setInputEnabled(enabled){
  elUserInput.disabled = !enabled;
  elInputForm.querySelector('button[type="submit"]').disabled = !enabled;
  elVoiceToggleBtn.disabled = !enabled;
}

/* ----------- Chat ----------- */
function appendUserMessage(text){
  const wrap = document.createElement("div");
  wrap.className = "msg-wrap";

  const msg = document.createElement("div");
  msg.className = "msg user";
  msg.textContent = text;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `You • ${nowTimeString()}`;

  wrap.append(msg, meta);
  elChat.appendChild(wrap);
  elChat.scrollTop = elChat.scrollHeight;
}

function createBotMessageShell(){
  const wrap = document.createElement("div");
  wrap.className = "msg-wrap";

  const msg = document.createElement("div");
  msg.className = "msg bot";
  msg.textContent = "";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `Reaper • ${nowTimeString()}`;

  wrap.append(msg, meta);
  elChat.appendChild(wrap);
  elChat.scrollTop = elChat.scrollHeight;

  return msg;
}

async function typeBotMessage(fullText){
  state.isTyping = true;
  setInputEnabled(false);

  const msgEl = createBotMessageShell();
  let out = "";

  for(let i=0;i<fullText.length;i++){
    out += fullText[i];
    msgEl.textContent = out;
    elChat.scrollTop = elChat.scrollHeight;

    const ch = fullText[i];
    let delay = 14;
    if(ch==="."||ch==="!"||ch==="?") delay = 120;
    if(ch===","||ch===":"||ch===";") delay = 70;

    await sleep(delay);
  }

  state.isTyping = false;
  setInputEnabled(true);
}

/* ----------- Audio ----------- */
let audioEl = new Audio();
audioEl.preload = "auto";

let glowTimer = null;

function startFakeGlow(){
  stopGlow();
  if (!elLogoWrap) return;
  elLogoWrap.classList.add("speaking");
  let t = 0;
  glowTimer = setInterval(() => {
    t += 0.12;
    const pulse = (Math.sin(t) + 1) / 2;
    const shaped = Math.pow(pulse, 1.2);
    elLogoWrap.style.setProperty("--glow", String(0.25 + shaped * 0.75));
  }, 30);
}

function stopGlow(){
  if (glowTimer) clearInterval(glowTimer);
  glowTimer = null;
  if (!elLogoWrap) return;
  elLogoWrap.classList.remove("speaking");
  elLogoWrap.style.setProperty("--glow", "0");
}

async function playVoiceLine(src){
  if (!state.voiceEnabled) return;
  if (!src) src = AUDIO.defaultReply;

  try{
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.src = src;

    startFakeGlow();

    audioEl.onended = () => stopGlow();
    audioEl.onerror = () => stopGlow();

    await audioEl.play();
  }catch(e){
    stopGlow();
    console.warn("Audio play blocked/failed:", e?.name || e);
  }
}

/* ----------- Scripted replies ----------- */
function scriptedReply(userText){
  const t = userText.toLowerCase().trim();

  if(["hello","hi","hey","yo"].includes(t)){
    return {
      text: "Hello. I'm Reaper. Click Ask on a predefined question, and I will respond via a matching predefined answer.",
      audio: AUDIO.hello
    };
  }

  if(t.includes("tuition")){
    return {
      text: "₱20,000.00 per semester (tuition only). Other fees may apply depending on the course and units.",
      audio: AUDIO.tuition
    };
  }

  if(t.includes("deadline") || t.includes("payment")){
    return {
      text: "Usually within the enrollment period set by the Registrar/Cashier. Check your school calendar or announcements for exact dates.",
      audio: AUDIO.enrollment
    };
  }

  if(["thanks","tnx","thank you","ty"].includes(t)){
    return {
      text: "You're Welcome",
      audio: AUDIO.welcome
    };
  }

   if(["bye","good bye","see ya later","later"].includes(t)){
    return {
      text: "Get outta here.",
      audio: AUDIO.bye
    };
  }

  if(t.includes("installment")){
    return {
      text: "Some schools allow installment plans with conditions (downpayment + scheduled dues). Ask the Cashier/Accounting office for the official policy.",
      audio: AUDIO.installment
    };
  }

  return {
    text: "I can only answer predefined topics. Please click Ask on the questions, or type: hello, tuition, deadline, installment.",
    audio: AUDIO.defaultReply
  };
}

/* ----------- Categories + Questions ----------- */
function setCategory(category){
  state.category = category;
  renderCategoryChips();
  renderQuestions();
}

function renderCategoryChips(){
  document.querySelectorAll(".chip").forEach((btn)=>{
    if (btn.tagName.toLowerCase() !== "button") return;
    const isActive = btn.dataset.category === state.category;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
}

function renderQuestions(){
  clearNode(elQuestionList);

  const items = DATA[state.category] || [];
  items.forEach((item, idx)=>{
    const card = document.createElement("div");
    card.className = "q-card";

    const top = document.createElement("div");
    top.className = "q-top";

    const p = document.createElement("p");
    p.className = "q-text";
    p.textContent = `Q${idx+1}: ${item.question}`;

    const badge = document.createElement("span");
    const done = state.answered.has(item.id);
    badge.className = `badge${done ? " answered" : ""}`;
    badge.textContent = done ? "Answered" : "Not answered";

    top.append(p, badge);

    const actions = document.createElement("div");
    actions.className = "q-actions";

    const askBtn = document.createElement("button");
    askBtn.className = "btn white";
    askBtn.type = "button";
    askBtn.textContent = "Ask";

    askBtn.addEventListener("click", async ()=>{
      if(state.isTyping) return;

      if(!state.hasStarted){
        state.hasStarted = true;
        hideStartPrompt();
      }

      appendUserMessage(item.question);
      await sleep(120);

      await playVoiceLine(item.audio || AUDIO.defaultReply);
      await typeBotMessage(item.answer);

      state.answered.add(item.id);
      renderQuestions();
    });

    actions.appendChild(askBtn);
    card.append(top, actions);
    elQuestionList.appendChild(card);
  });
}

/* ----------- Events ----------- */
document.querySelectorAll(".chip").forEach((btn)=>{
  if (btn.tagName.toLowerCase() !== "button") return;
  btn.addEventListener("click", ()=>{
    if(state.isTyping) return;
    setCategory(btn.dataset.category);
  });
});

elInputForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(state.isTyping) return;

  const text = elUserInput.value.trim();
  if(!text) return;

  if(!state.hasStarted){
    state.hasStarted = true;
    hideStartPrompt();
  }

  appendUserMessage(text);
  await sleep(90);

  const reply = scriptedReply(text);
  await playVoiceLine(reply.audio);
  await typeBotMessage(reply.text);

  elUserInput.value = "";
  elUserInput.focus();
});

elVoiceToggleBtn.addEventListener("click", ()=>{
  state.voiceEnabled = !state.voiceEnabled;
  elVoiceToggleBtn.textContent = state.voiceEnabled ? "Voice: On" : "Voice: Off";
  elVoiceToggleBtn.setAttribute("aria-pressed", String(state.voiceEnabled));
  if(!state.voiceEnabled){
    audioEl.pause();
    stopGlow();
  }
});

/* ----------- Initial ----------- */
renderCategoryChips();
renderQuestions();
