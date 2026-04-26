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
    const [showMoreMath, setShowMoreMath] = useState(false);
    const [previewMath, setPreviewMath] = useState("");

    const [view, setView] = useState(null);

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
        { label: "$\\mathbb{Im}$", syntax: "$\\z=a+bi$" },
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
    };

    const generatePDF = async (archive) => {
        const container = document.createElement("div");

        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.width = "800px";
        container.style.padding = "20px";
        container.style.background = "white";
        container.style.color = "black";

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

        const pageWidth = 210;
        const pageHeight = 297;
        const marginX = 10;
        const marginTop = 20;
        const marginBottom = 20;

        const usableHeight = pageHeight - marginTop - marginBottom;
        const imgWidth = pageWidth - marginX * 2;

        const pxFullHeight = canvas.height;
        const pxPageHeight = Math.floor((usableHeight * canvas.width) / imgWidth);

        let position = 0;
        let page = 0;

        while (position < pxFullHeight) {
            const pageCanvas = document.createElement("canvas");
            const context = pageCanvas.getContext("2d");

            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(pxPageHeight, pxFullHeight - position);

            context.drawImage(
                canvas,
                0,
                position,
                canvas.width,
                pageCanvas.height,
                0,
                0,
                canvas.width,
                pageCanvas.height
            );

            const imgData = pageCanvas.toDataURL("image/png");

            if (page > 0) pdf.addPage();

            const finalHeight = (pageCanvas.height * imgWidth) / canvas.width;

            pdf.addImage(
                imgData,
                "PNG",
                marginX,
                marginTop,
                imgWidth,
                finalHeight
            );

            position += pxPageHeight;
            page++;
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
                                        setPreviewMath("");
                                    } else {
                                        insertSyntax(tool.syntax);
                                    }
                                }}
                            >
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
                                    { label: "Log(a)", syntax: "$\\log(a)$" },
                                    { label: "$Log_b(a)$", syntax: "$\\log_b(a)$" },
                                    { label: "Ln", syntax: "$\\ln(x)$" },
                                    { label: "Exponencial", syntax: "$e^{x}$" },
                                    { label: "Sumatoria", syntax: "$\\sum_{i=1}^{n} x_i$" },
                                    { label: "Productoria", syntax: "$\\prod_{i=1}^{n} x_i$" },
                                    { label: "Límite → ∞", syntax: "$\\lim_{x \\to \\infty} f(x)$" },

                                    { label: "Límite", syntax: "$\\lim_{x →a}(f)$" },
                                    { label: "Derivada", syntax: "$\\frac{d}{dx}(f)$" },
                                    { label: "Integral Indef.", syntax: "$\\int (f) dx$" },
                                    { label: "Integral Def.", syntax: "$\\int_{a}^{b} (f) dx$" },
                                    { label: "Valor Absoluto", syntax: "$|f|$" },
                                ].map((tool, i) => (
                                    <button
                                        key={i}
                                        className="mathBtn"
                                        onClick={() => setPreviewMath(tool.syntax)}
                                    >
                                        {tool.label}
                                    </button>
                                ))}
                            </div>

                            {/* 👀 PREVIEW EN VIVO */}
                            <div className="previewBox" style={{ marginTop: "15px" }}>
                                <MathJax dynamic>
                                    {previewMath || "Seleccioná una función..."}
                                </MathJax>
                            </div>

                            {/* 🔘 ACCIONES */}
                            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                <button
                                    className="btn primary"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        if (!previewMath) return;
                                        insertSyntax(previewMath);
                                        setShowMoreMath(false);
                                        setPreviewMath("");
                                    }}
                                >
                                    Insertar
                                </button>

                                <button
                                    className="btn danger"
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        setShowMoreMath(false);
                                        setPreviewMath("");
                                    }}
                                >
                                    Cerrar
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;