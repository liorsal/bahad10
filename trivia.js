/* מאגר שאלות מוטמע ב-HTML */
let allQuestions = [];

let questions = [];
let current=0, score=0;
const qEl=document.getElementById("question");
const optEl=document.getElementById("options");
const nextBtn=document.getElementById("next");
const board=document.getElementById("scoreBoard");
let readingMode = false;

function initQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        setCategoryTheme(category);
        showReadingScreen(category);
        return;
    } else {
        questions = allQuestions;
    }

    if(questions.length === 0) {
        document.getElementById("quiz").innerHTML = "<h2>לא נמצאו שאלות בקטגוריה זו.</h2>";
        return;
    }
    current = 0;
    score = 0;
    loadQuestion();
}

function loadQuestion(){
  const {q,a}=questions[current];
  qEl.textContent=q;
  optEl.innerHTML="";
  a.forEach((txt,i)=>{
    const btn=document.createElement("button");
    btn.className="option"; btn.textContent=txt;
    btn.onclick=()=>select(i,btn);
    optEl.appendChild(btn);
  });
  nextBtn.style.display="none";
  updateProgressBar();
}

function select(idx,btn){
  [...optEl.children].forEach(b=>b.disabled=true);
  const correct=questions[current].c;
  if(idx===correct){
    btn.classList.add("correct");
    score++;
  }else{
    if(idx>-1)btn.classList.add("wrong");
    optEl.children[correct].classList.add("correct");
  }
  nextBtn.style.display="inline-block";
}

nextBtn.onclick=()=>{
  current++;
  current<questions.length?loadQuestion():showScore();
};

function showScore(){
  document.getElementById("quiz").style.display="none";
  board.style.display="block";
  board.innerHTML=`סיימת!<br>צברת <b>${score}</b> מתוך <b>${questions.length}</b> נקודות 🎉`;
  const restart=document.createElement("button");
  restart.id="next"; restart.textContent="שחק שוב"; restart.onclick=()=>location.reload();
  board.appendChild(document.createElement("br")); board.appendChild(restart);
}

// Load questions from external JSON file (works on GitHub Pages)
function loadQuestionsFromJSON() {
  fetch('data/quizzes.json')
    .then(response => response.json())
    .then(data => {
      allQuestions = data;
      initQuiz();
    })
    .catch(error => {
      document.getElementById('quiz').innerHTML = '<h2>Error loading questions.</h2>';
    });
}

loadQuestionsFromJSON();

function showReadingScreen(category) {
  setCategoryTheme(category);
  readingMode = true;
  document.getElementById("quiz").style.display = "none";
  board.style.display = "none";
  let intro = document.getElementById("reading");
  if (!intro) {
    intro = document.createElement("div");
    intro.id = "reading";
    intro.className = "reading-section";
    document.getElementById("app").insertBefore(intro, document.getElementById("quiz"));
  }
  let catName = categoryName(category);
  intro.innerHTML = `<h2>קטע קריאה: ${catName}</h2><p>לפני שמתחילים את המבחן, קרא בעיון את ההסבר הבא על נושא הקטגוריה.</p><div class='reading-text'>[כאן יופיע טקסט הסבר קצר על הקטגוריה]</div><button id='startQuizBtn'>התחל מבחן</button>`;
  intro.style.display = "block";
  document.getElementById("startQuizBtn").onclick = function() {
    intro.style.display = "none";
    document.getElementById("quiz").style.display = "block";
    readingMode = false;
    startQuizForCategory(category);
  };
}

function categoryName(cat) {
  const names = {
    1: "שגרה", 2: "אנטומיה", 3: "טראומה", 4: "פגיעות אקלים", 5: "החייאה", 6: "עבודה בצוות", 7: "רפואה", 8: "אב\"ך", 9: "אנמנזה", 10: "ברה\"ץ"
  };
  return names[cat] || "קטגוריה";
}

function startQuizForCategory(category) {
  let filtered = allQuestions.filter(q => q.category == category);
  let N = filtered.length;
  if(N > 10) {
    for(let i=N-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [filtered[i],filtered[j]]=[filtered[j],filtered[i]];
    }
    questions = filtered.slice(0,10);
  } else {
    questions = filtered;
  }
  current = 0;
  score = 0;
  loadQuestion();
  // Show progress bar (if not already)
  let prog = document.querySelector('.progress-bar');
  if (!prog) {
    prog = document.createElement('div');
    prog.className = 'progress-bar';
    prog.innerHTML = '<div class="progress-bar__fill"></div>';
    document.getElementById("app").appendChild(prog);
  }
  updateProgressBar();
}

function updateProgressBar() {
  let prog = document.querySelector('.progress-bar__fill');
  if (prog) {
    let pct = ((current+1)/questions.length)*100;
    prog.style.width = pct + '%';
  }
}

function setCategoryTheme(category) {
  // pastel colors for each category
  const colors = {
    1: '#e3f0ff', // שגרה - כחול פסטל
    2: '#e3f0ff', // אנטומיה - כחול פסטל
    3: '#e6f9ed', // טראומה - ירוק פסטל
    4: '#fffbe3', // פגיעות אקלים - צהוב פסטל
    5: '#ffe9d6', // החייאה - כתום פסטל
    6: '#fffbe3', // עבודה בצוות - צהוב פסטל
    7: '#e6f9ed', // רפואה - ירוק פסטל
    8: '#f3e6ff', // אב"ך - סגול לילך פסטל
    9: '#ffe3e3', // אנמנזה - אדום פסטל
    10: '#e3f0ff' // ברה"ץ - כחול פסטל
  };
  document.body.style.background = colors[category] || '#fff';
  // Update h1 title
  const h1 = document.querySelector('#app h1');
  if (h1) {
    h1.textContent = categoryName(category);
  }
}
