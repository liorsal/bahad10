// --- Dynamic question loading & randomization ---
let questions = [];
let totalQuestions = 0;
let current = 0;
let correctCount = 0;
let attempts = [];
let flashReview = false;
let wrongQuestions = [];
let difficulty = 1;
let selectedIdx = null;
let checkBtn = null;
let nextBtn = null;

const step = document.querySelector('.step');
const bar = document.querySelector('.fill');
const barBottom = document.querySelector('.fill-bottom');
const fixedBarFill = document.querySelector('.progress-fixed__fill');
const fixedBarPercent = document.querySelector('.progress-fixed__percent');
const qText = document.querySelector('.q-text');
const answersList = document.querySelector('.answers');
const explanationEl = document.querySelector('.explanation');
const privacySplash = document.querySelector('.privacy-splash');

// --- Privacy splash (S key) ---
document.addEventListener('keydown', e => {
  if(e.key.toLowerCase() === 's') {
    privacySplash.classList.toggle('hidden');
  }
});

// --- Keyboard navigation ---
let focusedIdx = 0;
function focusAnswer(idx) {
  const btns = answersList.querySelectorAll('button');
  if(btns[idx]) btns[idx].focus();
}
answersList.addEventListener('keydown', e => {
  const btns = answersList.querySelectorAll('button');
  if(['ArrowDown','ArrowRight'].includes(e.key)) {
    focusedIdx = (focusedIdx+1)%btns.length;
    focusAnswer(focusedIdx); e.preventDefault();
  } else if(['ArrowUp','ArrowLeft'].includes(e.key)) {
    focusedIdx = (focusedIdx-1+btns.length)%btns.length;
    focusAnswer(focusedIdx); e.preventDefault();
  } else if(e.key === 'Enter') {
    btns[focusedIdx].click();
  }
});

// --- Load questions from quizzes.json ---
function shuffle(arr) {
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

function getCategoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get('category'));
}

const category = getCategoryFromURL();
const key = `medic-progress-${category}`;
const save = obj => localStorage.setItem(key, JSON.stringify(obj));
const load = () => JSON.parse(localStorage.getItem(key) || '{}');

function setCategoryBg(category) {
  const colors = {
    1: '#b3d8fd', // שגרה - כחול פסטל
    2: '#b3e0ff', // אנטומיה - כחול בהיר פסטל
    3: '#b6f5c9', // טראומה - ירוק בהיר פסטל
    4: '#fff9c4', // אקלים - צהוב בהיר פסטל
    5: '#ffe0b2', // החייאה - כתום בהיר פסטל
    6: '#fff9c4', // עבודת צוות - צהוב בהיר פסטל
    7: '#b6f5c9', // רפואה - ירוק בהיר פסטל
    8: '#e1bee7', // אב"כ - סגול לילך בהיר פסטל
    9: '#ffcdd2', // אנמנזה - אדום בהיר
    10: '#b3d8fd' // ברה"ץ - כחול בהיר
  };
  document.body.style.background = colors[category] || '#e3eaf2';
}

function loadQuestions(cb) {
  fetch('data/quizzes.json')
    .then(r=>r.json())
    .then(data=>{
      const category = getCategoryFromURL();
      let filtered = data.filter(q=>q.category === category);
      shuffle(filtered);
      if(filtered.length === 0) {
        document.querySelector('.card').innerHTML = '<h2>לא נמצאו שאלות בקטגוריה זו.</h2>';
        return;
      }
      if(filtered.length > 10) filtered = filtered.slice(0,10);
      questions = filtered;
      totalQuestions = questions.length;
      setCategoryBg(category);
      cb();
    })
    .catch(()=>{
      document.querySelector('.card').innerHTML = '<h2>שגיאה בטעינת השאלות.</h2>';
    });
}

function renderQuestion(idx) {
  const q = flashReview ? wrongQuestions[idx] : questions[idx];
  step.textContent = `${idx+1} / ${flashReview ? wrongQuestions.length : totalQuestions}`;
  const pct = (idx+1)/(flashReview ? wrongQuestions.length : totalQuestions)*100 + "%";
  bar.style.width = pct;
  if (barBottom) barBottom.style.width = pct;
  if (fixedBarFill) {
    fixedBarFill.style.width = pct;
    fixedBarFill.style.background = 'red';
  }
  if (fixedBarPercent) fixedBarPercent.textContent = Math.round((idx+1)/(flashReview ? wrongQuestions.length : totalQuestions)*100) + "%";
  qText.textContent = q.q;
  answersList.innerHTML = '';
  selectedIdx = null;
  explanationEl.classList.add('hidden');
  explanationEl.textContent = '';
  // Remove old buttons if exist
  if (checkBtn) checkBtn.remove();
  if (nextBtn) nextBtn.remove();

  q.a.forEach((txt, i) => {
    const btn = document.createElement('button');
    btn.textContent = txt;
    btn.tabIndex = 0;
    btn.onfocus = () => { focusedIdx = i; };
    btn.onclick = () => {
      if (selectedIdx !== null) return;
      selectedIdx = i;
      answersList.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      checkBtn.disabled = false;
    };
    const li = document.createElement('li');
    li.appendChild(btn);
    answersList.appendChild(li);
  });

  // Add check answer button
  checkBtn = document.createElement('button');
  checkBtn.textContent = 'בדוק תשובה';
  checkBtn.className = 'btn-next';
  checkBtn.disabled = true;
  checkBtn.onclick = () => checkAnswer(q, idx);
  answersList.parentNode.appendChild(checkBtn);
}

function checkAnswer(q, idx) {
  const btns = answersList.querySelectorAll('button');
  btns.forEach((b, i) => {
    b.disabled = true;
    if(i === q.c) b.classList.add('correct');
    if(selectedIdx === i && i !== q.c) b.classList.add('wrong');
  });
  explanationEl.textContent = q.explanation;
  explanationEl.classList.remove('hidden');
  checkBtn.disabled = true;
  // Add next button
  nextBtn = document.createElement('button');
  nextBtn.textContent = 'הבא';
  nextBtn.className = 'btn-next';
  nextBtn.onclick = gotoNext;
  answersList.parentNode.appendChild(nextBtn);
  // שמירה
  attempts.push({q: q.q, answer: q.a[selectedIdx], correct: selectedIdx === q.c, difficulty: q.difficulty||1});
  save({current, correctCount, attempts, difficulty, flashReview, wrongQuestions});
  if(selectedIdx === q.c) correctCount++;
}

gotoNext = function() {
  current++;
  if (checkBtn) checkBtn.remove();
  if (nextBtn) nextBtn.remove();
  if(flashReview) {
    if(current < wrongQuestions.length) {
      renderQuestion(current);
      save({current, correctCount, attempts, difficulty, flashReview, wrongQuestions});
    } else {
      showSummary();
    }
  } else {
    if(current < totalQuestions) {
      renderQuestion(current);
      save({current, correctCount, attempts, difficulty, flashReview, wrongQuestions});
    } else {
      // Flash review mode
      wrongQuestions = attempts.filter(a=>!a.correct).map(a=>{
        return questions.find(q=>q.q===a.q);
      });
      if(wrongQuestions.length > 0) {
        flashReview = true;
        current = 0;
        attempts = [];
        renderQuestion(current);
        save({current, correctCount, attempts, difficulty, flashReview, wrongQuestions});
      } else {
        showSummary();
      }
    }
  }
}

function showSummary() {
  document.querySelector('.card').innerHTML = `
    <h2>סיימת!</h2>
    <p>ענית נכון על <b>${correctCount}</b> מתוך <b>${totalQuestions}</b> שאלות.</p>
    <button onclick="downloadCSV()">הורד דוח CSV</button>
    <button onclick="restart()">נסה שוב</button>
  `;
}

function downloadCSV() {
  const csv = attempts.map((a,i) => `${i+1},"${a.q}","${a.answer}",${a.correct?'נכון':'לא נכון'},${a.difficulty}`).join("\n");
  const blob = new Blob([csv], {type:'text/csv'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'quiz_results.csv';
  link.click();
}

function restart() {
  current = 0;
  correctCount = 0;
  attempts = [];
  flashReview = false;
  wrongQuestions = [];
  difficulty = 1;
  save({current, correctCount, attempts, difficulty, flashReview, wrongQuestions});
  loadQuestions(()=>renderQuestion(current));
}

function playSound(type) {
  // Optional: add your own mp3 files named correct.mp3 and wrong.mp3 in the project root
  // Uncomment below if you add the files
  // const audio = new Audio(type + '.mp3');
  // audio.play();
}

// Restore progress if exists
const saved = load();
if(saved.current !== undefined) current = saved.current;
if(saved.correctCount !== undefined) correctCount = saved.correctCount;
if(saved.attempts) attempts = saved.attempts;
if(saved.difficulty) difficulty = saved.difficulty;
if(saved.flashReview) flashReview = saved.flashReview;
if(saved.wrongQuestions) wrongQuestions = saved.wrongQuestions;

console.log('--- Progress Bar Debug ---');
console.log('fixedBarFill:', fixedBarFill);
console.log('fixedBarPercent:', fixedBarPercent);
if (fixedBarFill) {
  fixedBarFill.style.width = '50%';
  fixedBarFill.style.background = 'red';
}
if (fixedBarPercent) fixedBarPercent.textContent = '50%';

// הפעלת הצבע בטעינה
(function(){
  const cat = (new URLSearchParams(window.location.search)).get('category');
  if(cat) setCategoryBg(Number(cat));
})();

loadQuestions(()=>{
  if(current >= (flashReview ? (wrongQuestions.length||1) : totalQuestions)) current = 0;
  renderQuestion(current);
});

// הסרת כפתור נגישות אם קיים
window.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.accessibility-toggle').forEach(el=>el.remove());
}); 