import { useEffect, useState, useRef } from "react";
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
    const [showMoreMath, setShowMoreMath] = useState(false);
    const [previewMath, setPreviewMath] = useState("");
    const [view, setView] = useState(null);

    const inputRef = useRef(null);

    // 🔥 INSERTAR EN CURSOR
    const insertAtCursor = (syntax) => {
        const input = inputRef.current;

        const clean = syntax.replace(/\$/g, "");

        if (!input) {
            setQuestion(prev => prev + clean);
            return;
        }

        const start = input.selectionStart;
        const end = input.selectionEnd;

        const newText =
            question.substring(0, start) +
            clean +
            question.substring(end);

        setQuestion(newText);

        setTimeout(() => {
            input.focus();
            const pos = start + clean.length;
            input.setSelectionRange(pos, pos);
        }, 0);
    };

    // 🔧 TOOLS
    const mathTools = [
        { label: "$+$", syntax: "$+$" },
        { label: "$-$", syntax: "$-$" },
        { label: "$\\times$", syntax: "$\\times$" },
        { label: "$\\div$", syntax: "$\\div$" },
        { label: "$\\mathbb{N}$", syntax: "$\\mathbb{N}$" },
        { label: "$\\mathbb{Z}$", syntax: "$\\mathbb{Z}$" },
        { label: "$\\mathbb{Q}$", syntax: "$\\mathbb{Q}$" },
        { label: "$\\mathbb{R}$", syntax: "$\\mathbb{R}$" },
        { label: "$\\frac{a}{b}$", syntax: "$\\frac{a}{b}$" },
        { label: "$\\sqrt{a}$", syntax: "$\\sqrt{a}$" },
        { label: "$a^{2}$", syntax: "$a^{2}$" },
        { label: "$\\pi$", syntax: "$\\pi$" },
        { label: "Más Funciones" }
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
            toast.error("Completá todo");
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
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const archiveQuestions = async () => {
        if (questions.length === 0) return;

        const name = prompt("Nombre del archivo:");
        if (!name) return;

        await addDoc(collection(db, "archives"), {
            name,
            questions
        });

        const batch = writeBatch(db);
        questions.forEach(q => {
            batch.delete(doc(db, "questions", q.id));
        });

        await batch.commit();

        setQuestions([]);
        loadArchives();
    };

    const restoreArchive = async (archive) => {
        const batch = writeBatch(db);

        archive.questions.forEach(q => {
            const ref = doc(collection(db, "questions"));
            batch.set(ref, q);
        });

        await batch.commit();
        loadQuestions();
    };

    const deleteArchive = async (id) => {
        await deleteDoc(doc(db, "archives", id));
        setArchives(prev => prev.filter(a => a.id !== id));
    };

    // 📄 PDF PRO
    const generatePDF = async (archive) => {
        const pdf = new jsPDF("p", "mm", "a4");

        let y = 20;

        for (let i = 0; i < archive.questions.length; i++) {
            const q = archive.questions[i];

            const div = document.createElement("div");
            div.style.width = "700px";
            div.innerHTML = `
                <p><b>${i + 1}) ${q.question}</b></p>
                ${q.options.map((opt, idx) =>
                `<p style="color:${idx === q.correct ? "green" : "black"}">- ${opt}</p>`
            ).join("")}
            `;

            document.body.appendChild(div);

            if (window.MathJax) {
                await window.MathJax.typesetPromise([div]);
            }

            const canvas = await html2canvas(div);
            const img = canvas.toDataURL("image/png");

            const height = (canvas.height * 180) / canvas.width;

            if (y + height > 280) {
                pdf.addPage();
                y = 20;
            }

            pdf.addImage(img, "PNG", 15, y, 180, height);
            y += height + 5;

            document.body.removeChild(div);
        }

        pdf.save(`${archive.name}.pdf`);
    };

    return (
        <MathJaxContext config={config}>
            <div className="container">

                <div className="card">
                    <h2>Crear Preguntas</h2>

                    <div className="mathTools">
                        {mathTools.map((tool, i) => (
                            <button
                                key={i}
                                className="mathBtn"
                                onClick={() => {
                                    if (tool.label === "Más Funciones") {
                                        setShowMoreMath(true);
                                    } else {
                                        insertAtCursor(tool.syntax);
                                    }
                                }}
                            >
                                {tool.label}
                            </button>
                        ))}
                    </div>

                    <input
                        ref={inputRef}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="input"
                    />

                    {/* PREVIEW */}
                    <div className="card">
                        <MathJax dynamic>{question || "Vista previa..."}</MathJax>
                        <ul>
                            {options.map((opt, i) => (
                                <li key={i} style={{ color: i === correct ? "green" : "white" }}>
                                    <MathJax>{opt || `Opción ${i + 1}`}</MathJax>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {options.map((opt, i) => (
                        <div key={i}>
                            <input
                                value={opt}
                                onChange={(e) => {
                                    const newOpts = [...options];
                                    newOpts[i] = e.target.value;
                                    setOptions(newOpts);
                                }}
                            />
                            <button onClick={() => setCorrect(i)}>✔</button>
                        </div>
                    ))}

                    <button onClick={addQuestion}>Agregar</button>
                    <button onClick={archiveQuestions}>Archivar</button>

                    <div>
                        <button onClick={() => setView("questions")}>Preguntas</button>
                        <button onClick={() => setView("archives")}>Archivos</button>
                    </div>
                </div>

                {view === "questions" && (
                    <div className="card">
                        {questions.map(q => (
                            <div key={q.id}>
                                <MathJax>{q.question}</MathJax>
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

                {/* POPUP */}
                {showMoreMath && (
                    <div className="modalOverlay">
                        <div className="modalContent">
                            <h3>Funciones</h3>

                            {[
                                { label: "sin", syntax: "$\\sin(x)$" },
                                { label: "cos", syntax: "$\\cos(x)$" },
                                { label: "log", syntax: "$\\log(x)$" }
                            ].map((tool, i) => (
                                <button key={i} onClick={() => setPreviewMath(tool.syntax)}>
                                    {tool.label}
                                </button>
                            ))}

                            <div>
                                <MathJax dynamic>{previewMath}</MathJax>
                            </div>

                            <button onClick={() => insertAtCursor(previewMath)}>Insertar</button>
                            <button onClick={() => setShowMoreMath(false)}>Cerrar</button>
                        </div>
                    </div>
                )}

            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;