import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { db } from "./firebase";

function AdminQuestions() {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [correct, setCorrect] = useState(0);
    const [questions, setQuestions] = useState([]);

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

    // Función reutilizable para renderizar texto con LaTeX mezclado
    const renderMathText = (text) => {
        if (!text) return null;
        
        // Dividimos por el delimitador $
        const parts = text.split("$");

        return parts.map((part, i) => {
            // Los índices impares son los que estaban entre $...$
            if (i % 2 === 1) {
                return (
                    <InlineMath 
                        key={i} 
                        math={part} 
                        renderError={(error) => <span>[Error de sintaxis]</span>}
                    />
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="container">
            <h1 className="title">Crear Preguntas</h1>
            <p className="subtitle">Armá tu cuestionario (Usa $ para fórmulas, ej: $\frac{1}{2}$)</p>

            <div className="card">
                <h3>Nueva pregunta</h3>
                <input
                    className="input"
                    placeholder="Ej: ¿Cuánto es $\frac{x}{2}$?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />

                <div className="previewBox">
                    <p className="previewTitle">👀 Vista previa:</p>
                    <div className="previewContent">
                        {renderMathText(question)}
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
                    Agregar pregunta ➕
                </button>
            </div>

            <div className="card">
                <h3>Preguntas cargadas</h3>
                {questions.length === 0 ? (
                    <p>No hay preguntas</p>
                ) : (
                    questions.map((q) => (
                        <div key={q.id} className="questionCard">
                            {/* Ahora la pregunta renderiza LaTeX si lo tiene */}
                            <h4>{renderMathText(q.question)}</h4>

                            <ul>
                                {q.options?.map((opt, i) => (
                                    <li key={i} style={{ color: i === q.correct ? "#22c55e" : "white", marginBottom: '8px' }}>
                                        {/* También renderizamos LaTeX en las opciones */}
                                        {renderMathText(opt)} {i === q.correct && " (Correcta)"}
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
    );
}

export default AdminQuestions;