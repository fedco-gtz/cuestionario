import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";
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

    return (
        <div className="container">
            <h1 className="title">❓ Crear Preguntas</h1>
            <p className="subtitle">Armá tu cuestionario</p>

            {/* FORM */}
            <div className="card">
                <h3>Nueva pregunta</h3>

                <input
                    className="input"
                    placeholder="Escribí la pregunta"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />

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
                            <h4>{q.question}</h4>

                            <ul>
                                {q.options?.map((opt, i) => (
                                    <li key={i}>
                                        <li key={i} style={{ color: i === q.correct ? "#22c55e" : "white" }}>{opt} {i === q.correct}</li>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="btn danger"
                                onClick={() => deleteQuestion(q.id)}
                            >
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