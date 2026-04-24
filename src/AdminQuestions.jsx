import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { db } from "./firebase";

const config = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]]
  }
};

function AdminQuestions() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [archives, setArchives] = useState([]);
  const [view, setView] = useState("questions");

  useEffect(() => {
    loadQuestions();
    loadArchives();
  }, []);

  // 📥 Cargar preguntas
  const loadQuestions = async () => {
    const querySnapshot = await getDocs(collection(db, "questions"));
    let data = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    setQuestions(data);
  };

  // 📥 Cargar archivos
  const loadArchives = async () => {
    const querySnapshot = await getDocs(collection(db, "Archive"));
    let data = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    setArchives(data);
  };

  // ➕ Agregar pregunta
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

  // ❌ Eliminar pregunta
  const deleteQuestion = async (id) => {
    await deleteDoc(doc(db, "questions", id));
    loadQuestions();
  };

  // 📦 ARCHIVAR PREGUNTAS
  const archiveQuestions = async () => {
    if (questions.length === 0) {
      alert("No hay preguntas para archivar");
      return;
    }

    const name = prompt("Nombre del archivo:");
    if (!name) return;

    await addDoc(collection(db, "Archive"), {
      name,
      createdAt: new Date().toISOString(),
      questions
    });

    alert("Preguntas archivadas ✅");
    loadArchives();
  };

  // ♻️ RESTAURAR
  const restoreArchive = async (archive) => {
    if (!window.confirm(`¿Restaurar "${archive.name}"?`)) return;

    for (let q of archive.questions) {
      await addDoc(collection(db, "questions"), {
        question: q.question,
        options: q.options,
        correct: q.correct
      });
    }

    alert("Preguntas restauradas ✅");
    loadQuestions();
  };

  // 🗑️ ELIMINAR ARCHIVO
  const deleteArchive = async (id) => {
    if (!window.confirm("¿Eliminar archivo?")) return;
    await deleteDoc(doc(db, "Archive", id));
    loadArchives();
  };

  // 🎯 CAMBIO OPCIONES
  const handleOptionChange = (value, index) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <MathJaxContext config={config}>
      <div className="container">

        {/* 🔀 TABS */}
        <div className="tabs">
          <button className="tab" onClick={() => setView("questions")}>
            Preguntas
          </button>
          <button className="tab" onClick={() => setView("archives")}>
            Archivos
          </button>
        </div>

        {/* ================== PREGUNTAS ================== */}
        {view === "questions" && (
          <>
            <div className="card">
              <h2>Crear Pregunta</h2>

              <input
                className="input input-full"
                placeholder="Pregunta"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <div className="previewBox">
                <MathJax dynamic>
                  {question || "Vista previa..."}
                </MathJax>
              </div>

              <div className="options">
                {options.map((opt, i) => (
                  <div key={i} className="optionRow">
                    <input
                      className="input"
                      placeholder={`Opción ${i + 1}`}
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(e.target.value, i)
                      }
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
                Agregar
              </button>

              {/* 📦 ARCHIVAR */}
              <button
                className="btn warning full"
                onClick={archiveQuestions}
              >
                Archivar ({questions.length}) preguntas
              </button>
            </div>

            <div className="card">
              <h3>Preguntas</h3>

              {questions.map((q) => (
                <div key={q.id} className="questionCard">
                  <MathJax>
                    <h4>{q.question}</h4>
                  </MathJax>

                  <ul>
                    {q.options.map((opt, i) => (
                      <li key={i}
                        style={{
                          color: i === q.correct ? "#22c55e" : "white"
                        }}>
                        <MathJax>{opt}</MathJax>
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
              ))}
            </div>
          </>
        )}

        {/* ================== ARCHIVOS ================== */}
        {view === "archives" && (
          <div className="card">
            <h2>📁 Archivos guardados</h2>

            {archives.length === 0 ? (
              <p>No hay archivos</p>
            ) : (
              archives.map((file) => (
                <div key={file.id} className="studentRow">
                  <div>
                    <h4>📄 {file.name}</h4>
                    <p>{file.questions.length} preguntas</p>
                  </div>

                  <div className="studentActions">
                    <button
                      className="btn primary"
                      onClick={() => restoreArchive(file)}
                    >
                      Restaurar
                    </button>

                    <button
                      className="btn danger"
                      onClick={() => deleteArchive(file.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MathJaxContext>
  );
}

export default AdminQuestions;