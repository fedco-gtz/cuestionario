import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "firebase/firestore";

import { MathJaxContext, MathJax } from "better-react-mathjax";
import { db } from "./firebase";
import { toast } from "react-toastify";

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

    // 🔥 filtro
    const [showReviewed, setShowReviewed] = useState(false);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {

        const snap = await getDocs(collection(db, "reviews"));

        const data = snap.docs.map(docItem => ({
            id: docItem.id,
            ...docItem.data()
        }));

        setReviews(data);
    };

    // 🔥 marcar como revisado
    const markAsReviewed = async (reviewId) => {

        try {

            const reviewRef = doc(db, "reviews", reviewId);

            await updateDoc(reviewRef, {
                reviewed: true
            });

            toast.success("Cuestionario revisado");

            // 🔥 actualizar estado local
            setReviews(prev =>
                prev.map(r =>
                    r.id === reviewId
                        ? { ...r, reviewed: true }
                        : r
                )
            );

            // 🔥 cerrar modal
            setSelectedReview(null);

        } catch (error) {

            console.error(error);
            toast.error("Error al marcar revisión");
        }
    };

    // 🔥 filtro visual
    const filteredReviews = reviews.filter(r =>
        showReviewed
            ? r.reviewed === true
            : r.reviewed !== true
    );

    return (
        <MathJaxContext config={config}>

            <div className="container">

                <div className="card">

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "20px",
                            flexWrap: "wrap",
                            gap: "10px"
                        }}
                    >
                        <h2>Revisiones de Cuestionarios</h2>

                        <button
                            className="btn status3"
                            onClick={() =>
                                setShowReviewed(!showReviewed)
                            }
                        >
                            {showReviewed
                                ? "Ver Pendientes"
                                : "Cuestionarios Revisados"}
                        </button>
                    </div>

                    {filteredReviews.length === 0 ? (

                        <p>
                            {showReviewed
                                ? "No hay cuestionarios revisados."
                                : "No hay revisiones pendientes."}
                        </p>

                    ) : (

                        filteredReviews.map((review) => (

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
                                        {new Date(
                                            review.createdAt
                                        ).toLocaleString()}
                                    </p>

                                    {review.reviewed && (
                                        <p
                                            style={{
                                                color: "#22c55e",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            ✅ Revisado
                                        </p>
                                    )}
                                </div>

                                <button
                                    className="btn primary"
                                    onClick={() =>
                                        setSelectedReview(review)
                                    }
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
                                marginBottom: "20px",
                                flexWrap: "wrap",
                                gap: "10px"
                            }}
                        >

                            <h2>
                                {selectedReview.student}
                            </h2>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px"
                                }}
                            >

                                {/* 🔥 REVISADO */}
                                {!selectedReview.reviewed && (
                                    <button
                                        className="btn primary"
                                        onClick={() =>
                                            markAsReviewed(
                                                selectedReview.id
                                            )
                                        }
                                    >
                                        Revisado
                                    </button>
                                )}

                                {/* 🔥 CERRAR */}
                                <button
                                    className="btn danger"
                                    onClick={() =>
                                        setSelectedReview(null)
                                    }
                                >
                                    Cerrar
                                </button>

                            </div>
                        </div>

                        <h3>
                            ✅ {selectedReview.score} correctas de{" "}
                            {selectedReview.total} preguntas
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

                                            const isCorrect =
                                                i === answer.correct;

                                            const isSelected =
                                                i === answer.selected;

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
                                                            isCorrect ||
                                                                isSelected
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