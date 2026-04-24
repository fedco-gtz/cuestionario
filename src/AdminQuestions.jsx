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
import { toast } from "react-toastify";

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

  // 🔢 BOTONES MATEMÁTICOS
  const mathTools = [
    { label: "Raíz", syntax: "$\\sqrt{ }$" },
    { label: "Fracción", syntax: "$\\frac{ }{ }$" },
    { label: "Potencia", syntax: "$x^{ }$" },
    { label: "π", syntax: "$\\pi$" },
    { label: "ℝ", syntax: "$\\mathbb{R}$" }
  ];

  useEffect(() => {
    loadQuestions();
    loadArchives();
  }, []);

  // 📥 CARGAR PREGUNTAS
  const loadQuestions = async () => {
    const snap = await getDocs(collection(db, "questions"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setQuestions(data);
  };

  // 📥 CARGAR ARCHIVOS
  const loadArchives = async () => {
    const snap = await getDocs(collection(db, "archives"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setArchives(data);
  };

  // ➕ AGREGAR PREGUNTA
  const addQuestion = async () => {
    if (!question || options.some(o => o === "")) {
      toast.error("Completá todos los campos");
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
    toast.success("Pregunta agregada");
  };

  // ❌ ELIMINAR PREGUNTA
  const deleteQuestion = async (id) => {
    await deleteDoc(doc(db, "questions", id));
    loadQuestions();
    toast.success("Pregunta eliminada");
  };

  // 🧠 INSERTAR SINTAXIS
  const insertSyntax = (syntax) => {
    setQuestion(prev => prev + syntax);
  };

  // 📦 ARCHIVAR
  const archiveQuestions = async () => {
    if (questions.length === 0) {
      toast.error("No hay preguntas para archivar");
      return;
    }

    const name = prompt("Nombre del archivo:");
    if (!name) return;

    await addDoc(collection(db, "archives"), {
      name,
      questions,
      createdAt: new Date().toISOString()
    });

    toast.success("Archivo creado");
    loadArchives();
  };

  // 🔄 RESTAURAR
  const restoreArchive = async (archive) => {
    for (let q of archive.questions) {
      await addDoc(collection(db, "questions"), {
        question: q.question,
        options: q.options,
        correct: q.correct
      });
    }

    toast.success("Preguntas restauradas");
    loadQuestions();
  };

  // ❌ ELIMINAR ARCHIVO
  const deleteArchive = async (id) => {
    await deleteDoc(doc(db, "archives", id));
    loadArchives();
    toast.success("Archivo eliminado");
  };

  return (
    <MathJaxContext config={config}>
      <div className="container">

        {/* 🔹 CREAR */}
        <div className="card">
          <h2 className="title">Crear Preguntas</h2>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {mathTools.map((tool, i) => (
              <button key={i} className="btn" onClick={() => insertSyntax(tool.syntax)}>
                {tool.label}
              </button>
            ))}
          </div>

          <input
            className="input input-full"
            placeholder="Escribí la pregunta"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          {/* 👀 PREVIEW */}
          <div className="card" style={{ marginTop: 10 }}>
            <MathJax dynamic>
              {question || "Vista previa..."}
            </MathJax>
          </div>

          {/* OPCIONES */}
          {options.map((opt, i) => (
            <div key={i} className="optionRow">
              <input
                className="input"
                placeholder={`Opción ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
              />
              <button
                className={`btn ${correct === i ? "primary" : ""}`}
                onClick={() => setCorrect(i)}
              >
                ✔
              </button>
            </div>
          ))}

          <button className="btn primary full" onClick={addQuestion}>
            Agregar pregunta
          </button>
        </div>

        {/* 🔹 LISTA */}
        <div className="card">
          <h3>Preguntas ({questions.length})</h3>

          <button className="btn warning full" onClick={archiveQuestions}>
            Archivar ({questions.length}) preguntas
          </button>

          {questions.map(q => (
            <div key={q.id} className="questionCard">
              <MathJax>
                <h4>{q.question}</h4>
              </MathJax>

              <ul>
                {q.options.map((opt, i) => (
                  <li key={i} style={{ color: i === q.correct ? "#22c55e" : "white" }}>
                    <MathJax>{opt}</MathJax>
                  </li>
                ))}
              </ul>

              <button className="btn danger" onClick={() => deleteQuestion(q.id)}>
                Eliminar
              </button>
            </div>
          ))}
        </div>

        {/* 📁 ARCHIVOS (tipo Drive) */}
        <div className="card">
          <h3>Archivos guardados</h3>

          {archives.length === 0 ? (
            <p>No hay archivos</p>
          ) : (
            archives.map(a => (
              <div key={a.id} className="studentRow">
                <div>
                  <h4>📁 {a.name}</h4>
                  <p>{a.questions.length} preguntas</p>
                </div>

                <div className="studentActions">
                  <button className="btn primary" onClick={() => restoreArchive(a)}>
                    Restaurar
                  </button>
                  <button className="btn danger" onClick={() => deleteArchive(a.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </MathJaxContext>
  );
}

export default AdminQuestions;