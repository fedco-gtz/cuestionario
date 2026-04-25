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

    // 🔥 MATH TOOLS
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

    // 📦 ARCHIVAR + BORRAR
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

    // 📄 PDF con margen superior 2cm
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

    // 🔥 Renderizar MathJax
    if (window.MathJax) {
        await window.MathJax.typesetPromise([container]);
    }

    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;

    const marginX = 10;
    const marginTop = 20;     // ✅ 2 cm
    const marginBottom = 20;  // ✅ 2 cm

    const usableHeight = pageHeight - marginTop - marginBottom;

    const imgWidth = pageWidth - marginX * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let positionY = marginTop;
    let heightLeft = imgHeight;

    let pageCanvasPosition = 0;

    while (heightLeft > 0) {
        pdf.addImage(
            imgData,
            "PNG",
            marginX,
            positionY,
            imgWidth,
            imgHeight,
            undefined,
            "FAST",
            0,
            pageCanvasPosition
        );

        heightLeft -= usableHeight;

        if (heightLeft > 0) {
            pdf.addPage();
            pageCanvasPosition += usableHeight;
        }
    }

    pdf.save(`${archive.name}.pdf`);
    document.body.removeChild(container);
};

    return (
        <MathJaxContext config={config}>
            <div className="container">

                <div className="card">
                    <h2 className="title">Crear Preguntas</h2>

                    {/* 🔥 BOTONES MATEMÁTICOS */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
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

                    {/* 👀 VISTA PREVIA */}
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

                {/* 📁 ARCHIVOS */}
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

            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;