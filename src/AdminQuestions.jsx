import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "./firebase";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";


// 🔥 COMPONENTE EDITOR MATEMÁTICO
function MathEditor({ value, setValue }) {

  const insert = (text) => {
    setValue(prev => prev + text);
  };

  return (
    <div style={{ width: "100%" }}>

      <input
        className="input full"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribí o usá los botones 👇"
      />

      {/* BOTONES */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginTop: "8px",
        flexWrap: "wrap"
      }}>
        <button onClick={() => insert("$\\sqrt{}$")}>√</button>
        <button onClick={() => insert("$\\frac{}{}$")}>a/b</button>
        <button onClick={() => insert("$^{}$")}>x²</button>
        <button onClick={() => insert("$_{}$")}>xₙ</button>
        <button onClick={() => insert("$\\pi$")}>π</button>
      </div>

      {/* PREVIEW */}
      <div style={{ marginTop: "10px" }}>
        {value && (
          <InlineMath math={value.replace(/\$/g, "")} />
        )}
      </div>

    </div>
  );
}


// 🧠 COMPONENTE PRINCIPAL
function AdminQuestions() {

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const querySnapshot = await getDocs(collection(db, "questions"));
    let data = [];

    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    setQuestions(data);
  };

  const handleOptionChange = (value, index) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addQuestion = async () => {
    if (!question || options.some(opt => opt === "")) {
      alert("Completá todos los campos");
      return;
    }

    await addDoc(collection(db, "questions"), {
      question,
      options,
      correct
    });

    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    loadQuestions();
  };

  const deleteQuestion = async (id) => {
    await deleteDoc(doc(db, "questions", id));
    loadQuestions();
  };

  return (
    <div className="container">
      <h1 className="title">❓ Crear Preguntas</h1>
      <p className="subtitle">Armá tu cuestionario</p>

      {/* FORM */}
      <div className="card">
        <h3>Nueva pregunta</h3>

        <MathEditor value={question} setValue={setQuestion} />

        <div className="options">
          {options.map((opt, i) => (
            <div key={i} className="optionRow">

              <MathEditor
                value={opt}
                setValue={(val) => handleOptionChange(val, i)}
              />

              <button
                className={`selectBtn ${correct === i ? "selected" : ""}`}
                onClick={() => setCorrect(i)}
              >
                {correct === i ? "✔" : "Seleccionar"}
              </button>

            </div>
          ))}
        </div>

        <button className="btn primary full" onClick={addQuestion}>
          Agregar pregunta ➕
        </button>
      </div>

      {/* LISTA */}
      <div className="card">
        <h3>Preguntas cargadas</h3>

        {questions.length === 0 ? (
          <p>No hay preguntas</p>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="questionCard">

              <h4>
                <InlineMath math={q.question.replace(/\$/g, "")} />
              </h4>

              <ul>
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    style={{
                      color: i === q.correct ? "#22c55e" : "white"
                    }}
                  >
                    <InlineMath math={opt.replace(/\$/g, "")} />
                  </li>
                ))}
              </ul>

              <button
                className="btn danger"
                onClick={() => deleteQuestion(q.id)}
              >
                Eliminar
              </button>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminQuestions;