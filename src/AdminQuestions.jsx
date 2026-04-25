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
        try {
            const snap = await getDocs(collection(db, "questions"));
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
            toast.error("Error cargando preguntas");
        }
    };

    const loadArchives = async () => {
        try {
            const snap = await getDocs(collection(db, "archives"));
            setArchives(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
            toast.error("Error cargando archivos");
        }
    };

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
        } catch {
            toast.error("Error al agregar");
        }
    };

    const deleteQuestion = async (id) => {
        try {
            await deleteDoc(doc(db, "questions", id));
            setQuestions(prev => prev.filter(q => q.id !== id));
            toast.success("Pregunta eliminada");
        } catch {
            toast.error("Error al eliminar");
        }
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

        if (!window.confirm("Se archivarán y eliminarán todas las preguntas")) return;

        const name = prompt("Nombre del archivo:");
        if (!name) return;

        try {
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

            toast.success("Archivo creado y preguntas eliminadas");

        } catch (error) {
            console.error(error);
            toast.error("Error al archivar");
        }
    };

    // 🔄 RESTAURAR
    const restoreArchive = async (archive) => {
        try {
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
            toast.success("Preguntas restauradas");

        } catch {
            toast.error("Error al restaurar");
        }
    };

    const deleteArchive = async (id) => {
        try {
            await deleteDoc(doc(db, "archives", id));
            setArchives(prev => prev.filter(a => a.id !== id));
            toast.success("Archivo eliminado");
        } catch {
            toast.error("Error al eliminar archivo");
        }
    };

    // 📄 GENERAR PDF
    const generatePDF = (archive) => {
        const docPDF = new jsPDF();
        let y = 10;

        docPDF.setFont("Times", "Bold");
        docPDF.setFontSize(16);
        docPDF.text(`Archivo: ${archive.name}`, 10, y);

        y += 10;

        docPDF.setFont("Times", "Normal");
        docPDF.setFontSize(12);

        archive.questions.forEach((q, index) => {
            docPDF.setTextColor(0, 0, 0);

            const questionText = `${index + 1}) ${q.question.replace(/\$/g, "")}`;
            const splitQ = docPDF.splitTextToSize(questionText, 180);

            docPDF.text(splitQ, 10, y);
            y += splitQ.length * 6;

            q.options.forEach((opt, i) => {
                if (i === q.correct) {
                    docPDF.setTextColor(0, 150, 0); // verde
                } else {
                    docPDF.setTextColor(0, 0, 0);
                }

                const optionText = `- ${opt.replace(/\$/g, "")}`;
                const splitOpt = docPDF.splitTextToSize(optionText, 170);

                docPDF.text(splitOpt, 15, y);
                y += splitOpt.length * 6;
            });

            y += 5;

            if (y > 270) {
                docPDF.addPage();
                y = 10;
            }
        });

        docPDF.save(`${archive.name}.pdf`);
    };

    return (
        <MathJaxContext config={config}>
            <div className="container">

                {/* CREAR */}
                <div className="card">
                    <h2 className="title">Crear Preguntas</h2>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {mathTools.map((tool, i) => (
                            <button key={i} className="mathBtn" onClick={() => insertSyntax(tool.syntax)}>
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

                    <button className="btn warning full" onClick={archiveQuestions}>
                        Archivar {questions.length} preguntas
                    </button>
                </div>

                {/* LISTA */}
                <div className="card">
                    <h3>Preguntas</h3>

                    {questions.map(q => (
                        <div key={q.id} className="questionCard">
                            <MathJax><h4>{q.question}</h4></MathJax>

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

                                    <button className="btn status3" onClick={() => generatePDF(a)}>
                                        PDF
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