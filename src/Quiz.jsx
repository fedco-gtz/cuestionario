import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { MathJaxContext, MathJax } from "better-react-mathjax";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]]
  }
};

function Quiz({ student, onFinish }) { // Asumo que usas una prop para volver
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [countdown, setCountdown] = useState(5); // Estado para el reloj

  useEffect(() => {
    loadQuestions();
  }, []);

  // Lógica del temporizador de redirección
  useEffect(() => {
    if (finished && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (finished && countdown === 0) {
      // Cuando llega a 0 (o podés poner 0 para que sea exacto) vuelve al Welcome
      window.location.reload(); // O usar onFinish() si manejas estado de navegación
    }
  }, [finished, countdown]);

  const loadQuestions = async () => {
    const querySnapshot = await getDocs(collection(db, "questions"));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    setQuestions(data);
  };

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [current]: optionIndex });
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    let result = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct) result++;
    });

    const earnedCoins = result * 2;
    const optionsDate = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateBA = new Date().toLocaleDateString('en-CA', optionsDate);

    const studentRef = doc(db, "students", student.id);
    const studentSnap = await getDoc(studentRef);

    let currentCoins = 0;
    if (studentSnap.exists()) {
      currentCoins = studentSnap.data().coins || 0;
    }

    const totalCoins = currentCoins + earnedCoins;

    await updateDoc(studentRef, {
      completed: true,
      score: result,
      total: questions.length,
      date: dateBA,
      coins: totalCoins
    });

    setScore(result);
    setCoins(earnedCoins);
    setFinished(true);
  };

  const progress = questions.length
    ? ((current + 1) / questions.length) * 100
    : 0;

  // Pantalla final con temporizador
  if (finished) {
    return (
      <div className="container">
        <div className="card center">
          <h2>🎉 Cuestionario finalizado</h2>
          <h1>{score}/{questions.length}</h1>
          <p>Ganaste 🪙 {coins} Chiqui Coins</p>
          <p>Excelente trabajo 💪</p>
          
          <div style={{ marginTop: '20px', color: '#94a3b8' }}>
            <p>Redirigiendo en {countdown}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <p>Cargando...</p>;

  const q = questions[current];

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="container">
        <h1 className="title">Cuestionario</h1>
        <p className="subtitle">Estudiante: {student.name}</p>

        <div className="progressContainer">
          <div className="progressInfo">
            <span>Pregunta {current + 1} de {questions.length}</span>
          </div>
          <div className="progressBar">
            <div className="progressFill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="card">
          <h2 className="questionText">
            <MathJax key={`q-${current}`} dynamic>{q.question}</MathJax>
          </h2>

          <div className="options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`option ${answers[current] === i ? "selected" : ""}`}
                onClick={() => handleAnswer(i)}
              >
                <MathJax key={`opt-${current}-${i}`} dynamic>
                  <span>{opt}</span>
                </MathJax>
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn primary full"
          onClick={nextQuestion}
          disabled={answers[current] === undefined}
        >
          {current === questions.length - 1 ? "Finalizar Cuestionario" : "Siguiente Pregunta"}
        </button>
      </div>
    </MathJaxContext>
  );
}

export default Quiz;