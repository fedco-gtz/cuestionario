import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { db } from "./firebase";

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

    // Lista de funciones rápidas para los botones
    const mathTools = [
        { label: "Fracción", syntax: "$\\frac{ }{ }$" },
        { label: "Raíz", syntax: "$\\sqrt{ }$" },
        { label: "Potencia", syntax: "$x^{ }$" },
        { label: "Punto (·)", syntax: "$\\cdot$" },
        { label: "Multiplicar (x)", syntax: "$\\times$" },
        { label: "Pi (π)", syntax: "$\\pi$" },
        { label: "N (Naturales)", syntax: "$\\mathbb{N}$" },
        { label: "Z (Enteros)", syntax: "$\\mathbb{Z}$" },
        { label: "Q (Racionales)", syntax: "$\\mathbb{Q}$" },
        { label: "I (Irracionales)", syntax: "$\\mathbb{I}$" },
        { label: "R (Reales)", syntax: "$\\mathbb{R}$" },
        { label: "C (Complejos)", syntax: "$\\mathbb{C}$" },
        { label: "Límite", syntax: "$\\lim_{x → }( )$" },
        { label: "Derivada", syntax: "$\\frac{d}{dx}( )$" },
        { label: "Integral Indef.", syntax: "$\\int ( ) dx$" },
        { label: "Integral Def.", syntax: "$\\int_{a}^{b} ( ) dx$" },
        { label: "Valor Absoluto", syntax: "$| |$" },
        { label: "Más Funciones", syntax: "$| |$" },
    ];

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        const querySnapshot = await getDocs(collection(db, "questions"));
        let data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        setQuestions(data);
    };

    const insertSyntax = (syntax) => {
        setQuestion(prev => prev + syntax);
    };

    const handleOptionChange = (value, index) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addQuestion = async () => {
        if (!question || options.some(opt => opt === "")) {
            alert("Completá todos los campos");
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
        loadQuestions();
    };

    return (
        <MathJaxContext config={config}>
            <div className="container">
                <h1 className="title">Crear Preguntas</h1>
                <p className="subtitle">Armá tu cuestionario</p>

                <div className="card">
                    <h3>Nueva pregunta</h3>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {mathTools.map((tool, index) => (
                            <button
                                key={index}
                                onClick={() => insertSyntax(tool.syntax)}
                                style={{
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    backgroundColor: '#334155',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {tool.label}
                            </button>
                        ))}
                    </div>

                    <input
                        className="input input-full"
                        placeholder="Escribí acá la pregunta..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />

                    <div className="previewBox">
                        <p className="previewTitle">Vista previa:</p>
                        <div className="previewContent" style={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
                            <MathJax dynamic>{question || "Escribí algo para previsualizar..."}</MathJax>
                        </div>
                    </div>

                    <div className="options">
                        {options.map((opt, i) => (
                            <div key={i} className="optionRow">
                                <input
                                    className="input"
                                    placeholder={`Opción ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(e.target.value, i)}
                                />
                                <button
                                    className={`selectBtn ${correct === i ? "selected" : ""}`}
                                    onClick={() => setCorrect(i)}
                                >
                                    {correct === i ? "✔" : "Seleccionar"}
                                </button>
                            </div>
                        ))}
                    </div>

                    <button className="btn primary full" onClick={addQuestion}>
                        Agregar pregunta
                    </button>
                </div>

                <div className="card">
                    <h3>Preguntas cargadas</h3>
                    {questions.length === 0 ? (
                        <p>No hay preguntas</p>
                    ) : (
                        questions.map((q) => (
                            <div key={q.id} className="questionCard">
                                <MathJax>
                                    <h4>{q.question}</h4>
                                </MathJax>

                                <ul>
                                    {q.options?.map((opt, i) => (
                                        <li key={i} style={{ color: i === q.correct ? "#22c55e" : "white", marginBottom: '8px' }}>
                                            <MathJax>
                                                <span>{opt} {i === q.correct && " (Correcta)"}</span>
                                            </MathJax>
                                        </li>
                                    ))}
                                </ul>

                                <button className="btn danger" onClick={() => deleteQuestion(q.id)}>
                                    Eliminar
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </MathJaxContext>
    );
}

export default AdminQuestions;