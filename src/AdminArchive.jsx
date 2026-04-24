import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
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

  // 📥 PREGUNTAS
  const loadQuestions = async () => {
    try {
      const snap = await getDocs(collection(db, "questions"));
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Error cargando preguntas");
    }
  };

  // 📥 ARCHIVOS
  const loadArchives = async () => {
    try {
      const snap = await getDocs(collection(db, "archives")); // ✅ consistente
      setArchives(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Error cargando archivos");
    }
  };

  // ➕ AGREGAR
  const addQuestion = async () => {
    if (!question || options.some(o => o === "")) {
      toast.error("Completá todos los campos");
      return;
    }

    try {
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
    } catch (error) {
      toast.error("Error al agregar pregunta");
    }
  };

  // ❌ ELIMINAR
  const deleteQuestion = async (id) => {
    try {
      await deleteDoc(doc(db, "questions", id));
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success("Pregunta eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  // 🧠 INSERTAR
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

    try {
      await addDoc(collection(db, "archives"), {
        name,
        questions,
        createdAt: new Date().toISOString()
      });

      toast.success("Archivo creado");
      loadArchives();
    } catch {
      toast.error("Error al archivar");
    }
  };

  // 🔄 RESTAURAR (🔥 usando batch)
  const restoreArchive = async (archive) => {
    try {
      const batch = writeBatch(db);

      archive.questions.forEach((q) => {
        const ref = doc(collection(db, "questions"));
        batch.set(ref, {
          question: q.question,
          options: q.options,
          correct: q.correct
        });
      });

      await batch.commit();

      toast.success("Preguntas restauradas");
      loadQuestions();
    } catch {
      toast.error("Error al restaurar");
    }
  };

  // ❌ BORRAR ARCHIVO
  const deleteArchive = async (id) => {
    try {
      await deleteDoc(doc(db, "archives", id));
      setArchives(prev => prev.filter(a => a.id !== id));
      toast.success("Archivo eliminado");
    } catch {
      toast.error("Error al eliminar archivo");
    }
  };

  return (
    <MathJaxContext config={config}>
      <div className="container">

        {/* CREAR */}
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

          <div className="card" style={{ marginTop: 10 }}>
            <MathJax dynamic>
              {question || "Vista previa..."}
            </MathJax>
          </div>

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

        {/* LISTA */}
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

        {/* ARCHIVOS */}
        <div className="card">
          <h3>Archivos guardados</h3>

          {archives.length === 0 ? (
            <p>No hay archivos</p>
          ) : (
            archives.map(a => (
              <div key={a.id} className="studentRow">
                <div>
                  <h4>📁 {a.name}</h4>
                  <p>{a.questions?.length || 0} preguntas</p>
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