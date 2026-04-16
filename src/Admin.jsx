import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "firebase/firestore";
import { db } from "./firebase";
import AdminQuestions from "./AdminQuestions";
import Ranking from "./Ranking";

function Admin({ admin }) {
    const [name, setName] = useState("");
    const [students, setStudents] = useState([]);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        const querySnapshot = await getDocs(collection(db, "students"));
        let data = [];

        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });

        data.sort((a, b) => (b.score || 0) - (a.score || 0));

        setStudents(data);
    };

    const addStudent = async () => {
        if (!name) return;

        await addDoc(collection(db, "students"), {
            name: name,
            enabled: true,
            completed: false
        });

        setName("");
        loadStudents();
    };

    const deleteStudent = async (id) => {
        await deleteDoc(doc(db, "students", id));
        loadStudents();
    };

    const resetStudent = async (id) => {
        await updateDoc(doc(db, "students", id), {
            completed: false,
            score: 0,
            total: 0,
            date: ""
        });
        loadStudents();
    };

    const toggleEnabled = async (id, current) => {
        await updateDoc(doc(db, "students", id), {
            enabled: !current
        });
        loadStudents();
    };

    return (
        <div className="container">
            <h1 className="title">Panel de Administrador</h1>
            <p className="subtitle">Bienvenido: {admin?.email}</p>

            <div className="card">
                <h3>Agregar estudiante</h3>
                <div className="row">
                    <input
                        className="input"
                        placeholder="Nombre del estudiante"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button className="btn primary" onClick={addStudent}>
                        Agregar
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Lista de estudiantes</h3>

                {students.length === 0 ? (
                    <p>No hay estudiantes</p>
                ) : (
                    students.map((s) => (
                        <div key={s.id} className="studentCard">
                            <div>
                                <strong>{s.name}</strong>
                                <p>
                                    {s.completed ? "✅ Completado" : "❌ Pendiente"} |{" "}
                                    {s.enabled ? "🟢 Habilitado" : "🔴 Bloqueado"}
                                </p>

                                {s.completed && (
                                    <p>
                                        📊 {s.score}/{s.total} | 📅 {s.date}
                                    </p>
                                )}
                            </div>

                            <div className="actions">
                                <button className="btn danger" onClick={() => deleteStudent(s.id)}>
                                    Eliminar
                                </button>
                                <button className="btn" onClick={() => resetStudent(s.id)}>
                                    Reset
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => toggleEnabled(s.id, s.enabled)}
                                >
                                    {s.enabled ? "Bloquear" : "Habilitar"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <hr />
            <Ranking />
            <hr />
            <AdminQuestions />
        </div>
    );
}

export default Admin;