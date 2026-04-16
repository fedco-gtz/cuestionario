import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

function Quiz({ student }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, []);

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

    const today = new Date().toISOString().split("T")[0];

    await updateDoc(doc(db, "students", student.id), {
      completed: true,
      score: result,
      total: questions.length,
      date: today
    });

    setScore(result);
    setFinished(true);
  };

  const progress = questions.length
    ? ((current + 1) / questions.length) * 100
    : 0;

  const renderTextWithMath = (text) => {
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

    return parts.map((part, i) => {
      // bloque $$...$$
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return (
          <BlockMath key={i} math={part.slice(2, -2)} />
        );
      }

      // inline $...$
      if (part.startsWith("$") && part.endsWith("$")) {
        return (
          <InlineMath key={i} math={part.slice(1, -1)} />
        );
      }

      // texto normal
      return <span key={i}>{part}</span>;
    });
  };

  if (finished) {
    return (
      <div className="container">
        <div className="card center">
          <h2>🎉 Cuestionario finalizado</h2>
          <h1>{score}/{questions.length}</h1>
          <p>Excelente trabajo 💪</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <p>Cargando...</p>;

  const q = questions[current];

  return (
    <div className="container">
      <h1 className="title">🧠 Cuestionario</h1>
      <p className="subtitle">Estudiante: {student.name}</p>

      <div className="progressContainer">
        <div className="progressInfo">
          <span>Pregunta {current + 1} de {questions.length}</span>
        </div>

        <div className="progressBar">
          <div
            className="progressFill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="card">

        <h2 className="questionText">
          {renderTextWithMath(q.question)}
        </h2>

        <div className="options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`option ${
                answers[current] === i ? "selected" : ""
              }`}
              onClick={() => handleAnswer(i)}
            >
              {renderTextWithMath(opt)}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn primary full"
        onClick={nextQuestion}
        disabled={answers[current] === undefined}
      >
        {current === questions.length - 1
          ? "Finalizar 🚀"
          : "Siguiente ➡️"}
      </button>
    </div>
  );
}

export default Quiz;