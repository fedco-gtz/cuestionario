import { useEffect, useState } from "react";
import {
    collection,
    getDocs
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

function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        const snap = await getDocs(collection(db, "reviews"));

        const data = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setReviews(data);
    };

    return (
        <MathJaxContext config={config}>
            <div className="container">

                <div className="card">
                    <h2>Revisiones de Cuestionarios</h2>

                    {reviews.length === 0 ? (
                        <p>No hay revisiones todavía.</p>
                    ) : (
                        reviews.map((review) => (
                            <div
                                key={review.id}
                                className="studentRow"
                                style={{ marginBottom: "15px" }}
                            >
                                <div>
                                    <h4>{review.student}</h4>
                                    <p>
                                        Puntaje: {review.score}/{review.total}
                                    </p>
                                    <p>
                                        {new Date(review.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    className="btn primary"
                                    onClick={() => setSelectedReview(review)}
                                >
                                    Ver cuestionario
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {selectedReview && (
                    <div className="card">

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px"
                            }}
                        >
                            <h2>
                                {selectedReview.student}
                            </h2>

                            <button
                                className="btn danger"
                                onClick={() => setSelectedReview(null)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <h3>
                            ✅ {selectedReview.score} correctas de {selectedReview.total} preguntas
                        </h3>

                        <div style={{ marginTop: "20px" }}>
                            {selectedReview.answers?.map((answer, index) => (
                                <div
                                    key={index}
                                    className="questionCard"
                                    style={{ marginBottom: "20px" }}
                                >
                                    <MathJax dynamic>
                                        <h4>
                                            {index + 1}) {answer.question}
                                        </h4>
                                    </MathJax>

                                    <ul>
                                        {answer.options.map((opt, i) => {
                                            const isCorrect = i === answer.correct;
                                            const isSelected = i === answer.selected;

                                            return (
                                                <li
                                                    key={i}
                                                    style={{
                                                        color: isCorrect
                                                            ? "#22c55e"
                                                            : isSelected
                                                                ? "#ef4444"
                                                                : "white",
                                                        fontWeight:
                                                            isCorrect || isSelected
                                                                ? "bold"
                                                                : "normal",
                                                        marginBottom: "6px"
                                                    }}
                                                >
                                                    <MathJax dynamic>
                                                        {opt}
                                                    </MathJax>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </MathJaxContext>
    );
}

export default AdminReviews;