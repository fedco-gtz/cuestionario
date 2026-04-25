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

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    { label: "Fracción", syntax: "$\\frac{ }{ }$" },
    { label: "Raíz", syntax: "$\\sqrt{ }$" },
    { label: "Potencia", syntax: "$x^{ }$" },
    { label: "π", syntax: "$\\pi$" },
    { label: "ℝ", syntax: "$\\mathbb{R}$" }
  ];

  useEffect(() => {
    loadQuestions();
    loadArchives();
  }, []);

  const loadQuestions = async () => {
    const snap = await getDocs(collection(db, "questions"));
    setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadArchives = async () => {
    const snap = await getDocs(collection(db, "archives"));
    setArchives(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

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

  const deleteQuestion = async (id) => {
    await deleteDoc(doc(db, "questions", id));
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success("Pregunta eliminada");
  };

  const insertSyntax = (syntax) => {
    setQuestion(prev => prev + syntax);
  };

  // 📦 ARCHIVAR + BORRAR
  const archiveQuestions = async () => {
    if (questions.length === 0) {
      toast.error("No hay preguntas");
      return;
    }

    const name = prompt("Nombre del archivo:");
    if (!name) return;

    await addDoc(collection(db, "archives"), {
      name,
      questions,
      createdAt: new Date().toISOString()
    });

    const batch = writeBatch(db);
    questions.forEach(q => {
      batch.delete(doc(db, "questions", q.id));
    });

    await batch.commit();

    setQuestions([]);
    loadArchives();
    toast.success("Archivado correctamente");
  };

  const restoreArchive = async (archive) => {
    const batch = writeBatch(db);

    archive.questions.forEach(q => {
      const ref = doc(collection(db, "questions"));
      batch.set(ref, {
        question: q.question,
        options: q.options,
        correct: q.correct
      });
    });

    await batch.commit();
    loadQuestions();
    toast.success("Restaurado");
  };

  const deleteArchive = async (id) => {
    await deleteDoc(doc(db, "archives", id));
    setArchives(prev => prev.filter(a => a.id !== id));
    toast.success("Archivo eliminado");
  };

  // 🧾 GENERAR PDF (FIX REAL)
  const generatePDF = async (archive) => {
    const container = document.createElement("div");

    container.style.width = "800px";
    container.style.padding = "40px"; // ≈ 2cm
    container.style.background = "white";
    container.style.color = "black";

    archive.questions.forEach((q, index) => {
      const div = document.createElement("div");
      div.style.marginBottom = "20px";

      let html = `<h3>${index + 1}) ${q.question}</h3><ul>`;

      q.options.forEach((opt, i) => {
        html += `<li style="color:${i === q.correct ? "green" : "black"}">${opt}</li>`;
      });

      html += "</ul>";
      div.innerHTML = html;

      container.appendChild(div);
    });

    document.body.appendChild(container);

    // esperar render completo
    await new Promise(res => setTimeout(res, 1500));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 297;
    const marginTop = 20;

    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = marginTop;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - marginTop);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + marginTop;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - marginTop);
    }

    pdf.save(`${archive.name}.pdf`);

    document.body.removeChild(container);
  };

  return (
    <MathJaxContext config={config}>
      <div className="container">

        {/* CREAR */}
        <div className="card">
          <h2>Crear Pregunta</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {mathTools.map((t, i) => (
              <button key={i} className="mathBtn" onClick={() => insertSyntax(t.syntax)}>
                {t.label}
              </button>
            ))}
          </div>

          <input
            className="input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          {/* 👀 VISTA PREVIA (NO SE TOCA) */}
          <div className="card">
            <MathJax dynamic>
              {question || "Vista previa..."}
            </MathJax>
          </div>

          {options.map((opt, i) => (
            <div key={i} className="optionRow">
              <input
                className="input"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
              />
              <button onClick={() => setCorrect(i)}>
                {correct === i ? "✔" : ""}
              </button>
            </div>
          ))}

          <button className="btn primary full" onClick={addQuestion}>
            Agregar
          </button>

          <button className="btn warning full" onClick={archiveQuestions}>
            Archivar {questions.length}
          </button>
        </div>

        {/* ARCHIVOS */}
        <div className="card">
          <h3>Archivos</h3>

          {archives.map(a => (
            <div key={a.id} className="studentRow">
              <div>
                <h4>{a.name}</h4>
                <p>{a.questions.length} preguntas</p>
              </div>

              <div className="studentActions">
                <button className="btn primary" onClick={() => restoreArchive(a)}>
                  Restaurar
                </button>

                <button className="btn" onClick={() => generatePDF(a)}>
                  PDF
                </button>

                <button className="btn danger" onClick={() => deleteArchive(a.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </MathJaxContext>
  );
}

export default AdminQuestions;