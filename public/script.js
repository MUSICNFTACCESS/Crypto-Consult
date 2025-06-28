let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;

const TIME_PER_QUESTION = 20;

async function loadQuestions() {
  try {
    const res = await fetch("questions.json");
    questions = await res.json();
    shuffle(questions);
  } catch (err) {
    console.error("Failed to load questions:", err);
    alert("❌ Failed to load quiz questions. Please try again.");
  }
}

function startQuiz() {
  document.getElementById("splash-screen").classList.add("hidden");
  document.getElementById("quiz-container").classList.remove("hidden");
  currentQuestionIndex = 0;
  score = 0;
  loadQuestions().then(() => showQuestion());
}

function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    return endQuiz();
  }

  const question = questions[currentQuestionIndex];
  document.getElementById("question").textContent = question.question;

  const optionsList = document.getElementById("options");
  optionsList.innerHTML = "";

  question.options.forEach((opt, index) => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.onclick = () => selectOption(index);
    optionsList.appendChild(li);
  });

  updateProgress();
  startTimer();
}

function selectOption(index) {
  resetTimer();
  const correct = questions[currentQuestionIndex].correct;
  const optionsList = document.getElementById("options").children;

  for (let i = 0; i < optionsList.length; i++) {
    optionsList[i].classList.add(i === correct ? "correct" : "incorrect");
  }

  if (index === correct) score++;

  setTimeout(() => {
    currentQuestionIndex++;
    showQuestion();
  }, 1000);
}

function endQuiz() {
  document.getElementById("quiz-container").classList.add("hidden");
  document.getElementById("score-container").classList.remove("hidden");

  document.getElementById("score").textContent = score;

  const prev = parseInt(localStorage.getItem("cryptokids_points") || "0");
  localStorage.setItem("cryptokids_points", prev + score);

  const wallet = localStorage.getItem("walletAddress");
  if (wallet) {
    fetch("/save-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, points: score })
    })
      .then(res => res.json())
      .then(data => {
        console.log("Points saved:", data);
      });
  }
}

function updateProgress() {
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const progressBar = document.getElementById("progress");
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}

function startTimer() {
  let timeLeft = TIME_PER_QUESTION;
  document.getElementById("time-left")?.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time-left")?.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      currentQuestionIndex++;
      showQuestion();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

async function connectWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect({ onlyIfTrusted: false });
      const walletAddress = resp.publicKey.toString();
      localStorage.setItem("walletAddress", walletAddress);

      const status = document.getElementById("wallet-status");
      if (status) {
        status.innerText = `✅ Points saved to wallet: ${walletAddress}`;
        status.style.color = "#00ff00";
      }
    } catch (err) {
      alert("Wallet connection failed.");
      console.error("Phantom connection error:", err);
    }
  } else {
    alert("Phantom Wallet not detected. Please open this page in the Phantom browser.");
  }
}
