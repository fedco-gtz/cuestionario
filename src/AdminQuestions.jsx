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
    const optionRefs = useRef([]);
    const [activeInput, setActiveInput] = useState("question");

    const mathTools = [
        { label: "$+$", syntax: "$+$" },
        { label: "$-$", syntax: "$-$" },
        { label: "$\\times$", syntax: "$\\times$" },
        { label: "$\\div$", syntax: "$\\div$" },
        { label: "$\\frac{a}{b}$", syntax: "$\\frac{a}{b}$" },
        { label: "$\\sqrt{a}$", syntax: "$\\sqrt{a}$" },
        { label: "$a^{b}$", syntax: "$a^{b}$" },
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

    // 🚀 INSERTAR EN POSICIÓN DEL CURSOR (pregunta u opción)
    const insertSyntax = (syntax) => {
        if (activeInput === "question") {
            const input = inputRef.current;
            const start = input.selectionStart;
            const end = input.selectionEnd;

            const newText =
                question.substring(0, start) +
                syntax +
                question.substring(end);

            setQuestion(newText);

            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + syntax.length, start + syntax.length);
            }, 0);
        } else {
            const input = optionRefs.current[activeInput];
            if (!input) return;

            const start = input.selectionStart;
            const end = input.selectionEnd;

            const newOptions = [...options];
            newOptions[activeInput] =
                newOptions[activeInput].substring(0, start) +
                syntax +
                newOptions[activeInput].substring(end);

            setOptions(newOptions);

            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + syntax.length, start + syntax.length);
            }, 0);
        }
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
        questions.forEach(q => batch.delete(doc(db, "questions", q.id)));
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

    return (
        <MathJaxContext config={config}>
            <div className="container">

                <div className="card">
                    <h2 className="title">Crear Preguntas</h2>

                    <div className="mathTools">
                        {mathTools.map((tool, i) => (
                            <button
                                key={i}
                                className="mathBtn"
                                onClick={() =>
                                    tool.label === "Más Funciones"
                                        ? setShowMoreMath(true)
                                        : insertSyntax(tool.syntax)
                                }
                            >
                                {tool.label}
                            </button>
                        ))}
                    </div>

                    <input
                        ref={inputRef}
                        className="input input-full"
                        value={question}
                        onFocus={() => setActiveInput("question")}
                        onChange={(e) => setQuestion(e.target.value)}
                    />

                    {options.map((opt, i) => (
                        <div key={i} className="optionRow">
                            <input
                                ref={(el) => (optionRefs.current[i] = el)}
                                className="input"
                                value={opt}
                                onFocus={() => setActiveInput(i)}
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

                    <div className="card">
                        <MathJax dynamic>{question || "Vista previa..."}</MathJax>
                        <ul>
                            {options.map((opt, i) => (
                                <li key={i} style={{ color: i === correct ? "#22c55e" : "white" }}>
                                    <MathJax>{opt}</MathJax>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button className="btn primary full" onClick={addQuestion}>
                        Agregar pregunta
                    </button>

                    <button className="btn warning full" onClick={archiveQuestions}>
                        Archivar {questions.length}
                    </button>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn status3" onClick={() => setView("questions")}>
                            Preguntas
                        </button>
                        <button className="btn status2" onClick={() => setView("archives")}>
                            Archivos
                        </button>
                    </div>
                </div>

                {view === "questions" && (
                    <div className="card">
                        {questions.map(q => (
                            <div key={q.id}>
                                <MathJax>{q.question}</MathJax>
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
                                <button onClick={() => deleteArchive(a.id)}>Eliminar</button>
                            </div>
                        ))}
                    </div>
                )}

                {showMoreMath && (
                    <div className="modalOverlay">
                        <div className="modalContent">

                            <h3>Funciones</h3>

                            {[
                                { label: "sen", syntax: "$\\sin(x)$" },
                                { label: "cos", syntax: "$\\cos(x)$" },
                                { label: "tan", syntax: "$\\tan(x)$" },
                                { label: "log", syntax: "$\\log(x)$" },
                                { label: "ln", syntax: "$\\ln(x)$" }
                            ].map((tool, i) => (
                                <button
                                    key={i}
                                    className="mathBtn"
                                    onClick={() => setPreviewMath(tool.syntax)}
                                >
                                    {tool.label}
                                </button>
                            ))}

                            <div className="previewBox">
                                <MathJax dynamic>{previewMath}</MathJax>
                            </div>

                            <button
                                className="btn primary"
                                onClick={() => {
                                    insertSyntax(previewMath);
                                    setShowMoreMath(false);
                                }}
                            >
                                Insertar
                            </button>

                        </div>
                    </div>
                )}
            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;