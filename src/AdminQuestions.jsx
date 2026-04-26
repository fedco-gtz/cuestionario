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

    const mathTools = [
        { label: "$+$", syntax: "$+$" },
        { label: "$-$", syntax: "$-$" },
        { label: "$\\times$", syntax: "$\\times$" },
        { label: "$\\div$", syntax: "$\\div$" },
        { label: "$\\mathbb{N}$", syntax: "$\\mathbb{N}$" },
        { label: "$\\mathbb{N}$", syntax: "$\\mathbb{Z}$" },
        { label: "$\\mathbb{Q}$", syntax: "$\\mathbb{Q}$" },
        { label: "$\\mathbb{I}$", syntax: "$\\mathbb{I}$" },
        { label: "$\\mathbb{R}$", syntax: "$\\mathbb{R}$" },
        { label: "$\\mathbb{C}$", syntax: "$\\mathbb{C}$" },
        { label: "$\\mathbb{Im}$", syntax: "$\z=a+bi$" },
        { label: "$\\frac{a}{b}$", syntax: "$\\frac{a}{b}$" },
        { label: "$\\sqrt{a}$", syntax: "$\\sqrt{a}$" },
        { label: "$\\sqrt[3]{a}$", syntax: "$\\sqrt[3]{a}$" },
        { label: "$\\sqrt[b]{a}$", syntax: "$\\sqrt[b]{a}$" },
        { label: "$a^{2}$", syntax: "$a^{2}$" },
        { label: "$a^{3}$", syntax: "$a^{3}$" },
        { label: "$a^{b}$", syntax: "$a^{b}$" },
        { label: "$\\pi$", syntax: "$\\pi$" },
        { label: "Más Funciones" },
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
            batch.set(ref, {
                question: q.question,
                options: q.options,
                correct: q.correct
            });
        });

        await batch.commit();
        loadQuestions();
    };

    const deleteArchive = async (id) => {
        await deleteDoc(doc(db, "archives", id));
        setArchives(prev => prev.filter(a => a.id !== id));
    };

    // 📄 PDF CON TODAS LAS PREGUNTAS + MÁRGENES
    const generatePDF = async (archive) => {

        const pdf = new jsPDF("p", "mm", "a4");

        let y = 20; // margen superior
        const marginBottom = 20;

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

            if (y + height > 297 - marginBottom) {
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
                    <h2 className="title">Crear Preguntas</h2>

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
                        className="input input-full"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />

                    {/* PREVIEW */}
                    <div className="card" style={{ marginTop: 10 }}>
                        <MathJax dynamic>{question || "Vista previa..."}</MathJax>

                        <ul>
                            {options.map((opt, i) => (
                                <li key={i} style={{ color: i === correct ? "#22c55e" : "white" }}>
                                    <MathJax>{opt || `Opción ${i + 1}`}</MathJax>
                                </li>
                            ))}
                        </ul>
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
                            <button className="btn" onClick={() => setCorrect(i)}>✔</button>
                        </div>
                    ))}

                    <button className="btn primary full" onClick={addQuestion}>
                        Agregar pregunta
                    </button>

                    <button className="btn warning full" onClick={archiveQuestions}>
                        Archivar {questions.length} preguntas
                    </button>

                    <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                        <button className="btn status3" style={{ flex: 1 }} onClick={() => setView("questions")}>
                            Preguntas Cargadas
                        </button>

                        <button className="btn status2" style={{ flex: 1 }} onClick={() => setView("archives")}>
                            Archivos Guardados
                        </button>
                    </div>
                </div>

                {view === "questions" && (
                    <div className="card">
                        <h3>Preguntas Cargadas</h3>

                        {questions.map(q => (
                            <div key={q.id} className="questionCard">
                                <MathJax><h4>{q.question}</h4></MathJax>
                            </div>
                        ))}
                    </div>
                )}

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

                {/* POPUP */}
                {showMoreMath && (
                    <div className="modalOverlay">
                        <div className="modalContent">

                            <h3>Funciones Matemáticas</h3>

                            <div className="mathTools">
                                {[
                                    { label: "∞", syntax: "$\\infty$" },
                                    { label: "∅", syntax: "$\\varnothing$" },
                                    { label: "±", syntax: "$\\pm$" },
                                    { label: "⋅", syntax: "$\\cdot$" },
                                    { label: ":", syntax: "$:$" },
                                    { label: "=", syntax: "$=$" },
                                    { label: "≠", syntax: "$\\neq$" },
                                    { label: "∩", syntax: "$\\cap$" },
                                    { label: "∪", syntax: "$\\cup$" },
                                    { label: "⊂", syntax: "$\\subset$" },
                                    { label: "⊃", syntax: "$\\supset$" },
                                    { label: "∨", syntax: "$\\vee$" },
                                    { label: "∧", syntax: "$\\wedge$" },
                                    { label: "⊻", syntax: "$\\veebar$" },
                                    { label: "⊼", syntax: "$\\barwedge$" },
                                    { label: "<", syntax: "$<$" },
                                    { label: ">", syntax: "$>$" },
                                    { label: "≤", syntax: "$\\leq$" },
                                    { label: "≥", syntax: "$\\geq$" },
                                    { label: "≈", syntax: "$\\approx$" },
                                    { label: "⟶", syntax: "$\\longrightarrow$" },
                                    { label: "⟹", syntax: "$\\Longrightarrow$" },
                                    { label: "⟺", syntax: "$\\Longleftrightarrow$" },
                                    { label: "∈", syntax: "$\\in$" },
                                    { label: "∋", syntax: "$\\ni$" },
                                    { label: "∉", syntax: "$\\notin$" },
                                    { label: "∃", syntax: "$\\exists$" },
                                    { label: "∄", syntax: "$\\nexists$" },
                                    { label: "∀", syntax: "$\\forall$" },
                                    { label: "(", syntax: "$($" },
                                    { label: ")", syntax: "$)$" },
                                    { label: "(a,b)", syntax: "$(a,b)$" },
                                    { label: "[", syntax: "$[$" },
                                    { label: "]", syntax: "$]$" },
                                    { label: "[a,b]", syntax: "$[a,b]$" },
                                    { label: "{", syntax: "$\\{$" },
                                    { label: "}", syntax: "$\\}$" },
                                    { label: "{a,b}", syntax: "$\{ a,b \}$" },
                                    { label: "sen(a)", syntax: "$\\sin(a)$" },
                                    { label: "cos(a)", syntax: "$\\cos(a)$" },
                                    { label: "tan(a)", syntax: "$\\tan(a)$" },
                                    { label: "arcsen(a)", syntax: "$\\arcsin(a)$" },
                                    { label: "arccos(a)", syntax: "$\\arccos(a)$" },
                                    { label: "arctan(a)", syntax: "$\\arctan(a)$" },
                                    { label: "senh(a)", syntax: "$\\sinh(a)$" },
                                    { label: "cosh(a)", syntax: "$\\cosh(a)$" },
                                    { label: "tanh(a)", syntax: "$\\tanh(a)$" },
                                    { label: "Logaritmo base 10", syntax: "$\\log(a)$" },
                                    { label: "Logaritmo otra base", syntax: "$\\log_b(a)$" },
                                    { label: "Logaritmo natural", syntax: "$\\ln(x)$" },
                                    { label: "Exponencial", syntax: "$e^{x}$" },
                                    { label: "Límite", syntax: "$\\lim_{x →a} f(x)$" },
                                    { label: "Límite infinito", syntax: "$\\lim_{x → \\infty} f(x)$" },
                                    { label: "Derivada", syntax: "$\\frac{d}{dx} f(x)$" },
                                    { label: "Integral Indefinida", syntax: "$\\int f(x) dx$" },
                                    { label: "Integral Definida", syntax: "$\\int_{a}^{b} f(x) dx$" },
                                    { label: "Resolvente", syntax: "$x_0 = \\frac{-b \\pm \\sqrt{b^2-4 \\cdot a \\cdot c}}{2 \\cdot a}$ " },
                                ].map((tool, i) => (
                                    <button key={i} className="mathBtn" onClick={() => setPreviewMath(tool.syntax)}>
                                        {tool.label}
                                    </button>
                                ))}
                            </div>

                            <div className="previewBox">
                                <MathJax dynamic>{previewMath || "Vista previa..."}</MathJax>
                            </div>

                            <button className="btn primary" onClick={() => {
                                insertAtCursor(previewMath);
                                setShowMoreMath(false);
                            }}>
                                Insertar
                            </button>

                            <button className="btn danger" onClick={() => setShowMoreMath(false)}>
                                Cerrar
                            </button>

                        </div>
                    </div>
                )}

            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;