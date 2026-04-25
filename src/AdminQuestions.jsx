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

    // 👇 ESTADO PARA MOSTRAR/OCULTAR
    const [view, setView] = useState(null);

    const mathTools = [
        { label: "Fracción", syntax: "$\\frac{ }{ }$" },
        { label: "Raíz", syntax: "$\\sqrt{ }$" },
        { label: "Potencia", syntax: "$x^{ }$" },
        { label: "Punto (·)", syntax: "$\\cdot$" },
        { label: "Multiplicar (x)", syntax: "$\\times$" },
        { label: "Pi (π)", syntax: "$\\pi$" },
        { label: "N", syntax: "$\\mathbb{N}$" },
        { label: "Z", syntax: "$\\mathbb{Z}$" },
        { label: "Q", syntax: "$\\mathbb{Q}$" },
        { label: "R", syntax: "$\\mathbb{R}$" }
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
        if (questions.length === 0) {
            toast.error("No hay preguntas");
            return;
        }

        if (!window.confirm("Se archivarán y eliminarán todas las preguntas")) return;

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
        toast.success("Archivo creado y preguntas eliminadas");
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
        toast.success("Preguntas restauradas");
    };

    const deleteArchive = async (id) => {
        await deleteDoc(doc(db, "archives", id));
        setArchives(prev => prev.filter(a => a.id !== id));
        toast.success("Archivo eliminado");
    };

    // PDF (no tocamos nada tuyo)
    const generatePDF = async (archive) => {
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = "800px";
        container.style.background = "white";
        container.style.color = "black";
        container.style.padding = "20px";

        let html = `<h2>${archive.name}</h2>`;

        archive.questions.forEach((q, index) => {
            html += `<div style="margin-bottom:20px;">
                <p><b>${index + 1}) ${q.question}</b></p>`;

            q.options.forEach((opt, i) => {
                const color = i === q.correct ? "green" : "black";
                html += `<p style="color:${color}; margin-left:15px;">- ${opt}</p>`;
            });

            html += `</div>`;
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
        const pageHeight = 297;
        const marginTop = 20;
        const marginBottom = 20;

        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const usableHeight = pageHeight - marginTop - marginBottom;

        let y = 0;

        while (y < imgHeight) {
            const pageCanvas = document.createElement("canvas");
            const ctx = pageCanvas.getContext("2d");

            const sliceHeight = Math.min(
                canvas.height,
                (usableHeight * canvas.width) / imgWidth
            );

            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;

            ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

            const imgData = pageCanvas.toDataURL("image/png");

            if (y > 0) pdf.addPage();

            const finalHeight = (sliceHeight * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 10, marginTop, imgWidth, finalHeight);

            y += sliceHeight;
        }

        pdf.save(`${archive.name}.pdf`);
    };

    return (
        <MathJaxContext config={config}>
            <div className="container">

                {/* BOTONES */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                    <button className="btn status3" style={{ flex: 1 }} onClick={() => setView("questions")}>
                        Preguntas Cargadas
                    </button>

                    <button className="btn status2" style={{ flex: 1 }} onClick={() => setView("archives")}>
                        Archivos Guardados
                    </button>
                </div>

                {/* 👇 NADA POR DEFECTO */}
                {view === null && (
                    <div className="card" style={{ textAlign: "center" }}>
                        <p>Seleccioná una opción para comenzar 👆</p>
                    </div>
                )}

                {/* PREGUNTAS */}
                {view === "questions" && (
                    <div className="card">
                        <h3>Preguntas Cargadas</h3>

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
                )}

                {/* ARCHIVOS */}
                {view === "archives" && (
                    <div className="card">
                        <h3>Archivos guardados</h3>

                        {archives.map(a => (
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
                        ))}
                    </div>
                )}

            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;