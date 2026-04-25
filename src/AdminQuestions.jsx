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

    const [view, setView] = useState(null); // 👈 controla qué mostrar

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

    const insertSyntax = (syntax) => {
        setQuestion(prev => prev + syntax);
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

    const archiveQuestions = async () => {
        if (questions.length === 0) return;

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
        toast.success("Archivo creado");
    };

    const restoreArchive = async (archive) => {
        const batch = writeBatch(db);

        archive.questions.forEach(q => {
            const ref = doc(collection(db, "questions"));
            batch.set(ref, q);
        });

        await batch.commit();

        loadQuestions();
        toast.success("Restaurado");
    };

    const deleteArchive = async (id) => {
        await deleteDoc(doc(db, "archives", id));
        setArchives(prev => prev.filter(a => a.id !== id));
    };

    const generatePDF = async (archive) => {
        const container = document.createElement("div");

        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = "800px";
        container.style.background = "white";
        container.style.color = "black";
        container.style.padding = "20px";

        let html = `<h2>${archive.name}</h2>`;

        archive.questions.forEach((q, i) => {
            html += `<p><b>${i + 1}) ${q.question}</b></p>`;

            q.options.forEach((opt, j) => {
                const color = j === q.correct ? "green" : "black";
                html += `<p style="color:${color}; margin-left:10px;">- ${opt}</p>`;
            });
        });

        container.innerHTML = html;
        document.body.appendChild(container);

        if (window.MathJax) {
            await window.MathJax.typesetPromise([container]);
        }

        const canvas = await html2canvas(container, { scale: 2 });
        document.body.removeChild(container);

        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 190;
        const marginTop = 20;
        const marginBottom = 20;
        const pageHeight = 297 - marginTop - marginBottom;

        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let y = 0;

        while (y < imgHeight) {
            if (y > 0) pdf.addPage();

            pdf.addImage(
                canvas,
                "PNG",
                10,
                marginTop - y,
                imgWidth,
                imgHeight
            );

            y += pageHeight;
        }

        pdf.save(`${archive.name}.pdf`);
    };

    return (
        <MathJaxContext config={config}>
            <div className="container">

                {/* 🔥 CREAR PREGUNTA (SIEMPRE VISIBLE) */}
                <div className="card">
                    <h2>Crear Pregunta</h2>

                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {mathTools.map((t, i) => (
                            <button key={i} onClick={() => insertSyntax(t.syntax)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <input
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Pregunta"
                    />

                    {options.map((opt, i) => (
                        <div key={i}>
                            <input
                                value={opt}
                                onChange={e => {
                                    const newOpts = [...options];
                                    newOpts[i] = e.target.value;
                                    setOptions(newOpts);
                                }}
                                placeholder={`Opción ${i + 1}`}
                            />
                            <button onClick={() => setCorrect(i)}>✔</button>
                        </div>
                    ))}

                    {/* 👀 PREVIEW COMPLETA */}
                    <div>
                        <MathJax>{question}</MathJax>
                        <ul>
                            {options.map((opt, i) => (
                                <li key={i} style={{ color: i === correct ? "green" : "white" }}>
                                    <MathJax>{opt}</MathJax>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={addQuestion}>Agregar</button>
                    <button onClick={archiveQuestions}>
                        Archivar {questions.length}
                    </button>
                </div>

                {/* 🔘 BOTONES */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setView("questions")}>
                        Preguntas
                    </button>

                    <button onClick={() => setView("archives")}>
                        Archivos
                    </button>
                </div>

                {/* 👇 CONTENIDO */}
                {view === "questions" && (
                    <div className="card">
                        {questions.map(q => (
                            <div key={q.id}>
                                <MathJax>{q.question}</MathJax>
                                <ul>
                                    {q.options.map((opt, i) => (
                                        <li key={i}>{opt}</li>
                                    ))}
                                </ul>
                                <button onClick={() => deleteQuestion(q.id)}>Eliminar</button>
                            </div>
                        ))}
                    </div>
                )}

                {view === "archives" && (
                    <div className="card">
                        {archives.map(a => (
                            <div key={a.id}>
                                <h4>{a.name}</h4>
                                <button onClick={() => restoreArchive(a)}>Restaurar</button>
                                <button onClick={() => generatePDF(a)}>PDF</button>
                                <button onClick={() => deleteArchive(a.id)}>Eliminar</button>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;