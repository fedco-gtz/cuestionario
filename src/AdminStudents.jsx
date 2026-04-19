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

function AdminStudents() {
  const [name, setName] = useState("");
  const [students, setStudents] = useState([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const querySnapshot = await getDocs(collection(db, "students"));
    let data = [];

    querySnapshot.forEach((docu) => {
      data.push({ id: docu.id, ...docu.data() });
    });

    setStudents(data);
  };

  const addStudent = async () => {
    if (!name) return;

    await addDoc(collection(db, "students"), {
      name,
      enabled: true,
      completed: false,
      score: 0,
      total: 0,
      coins: 0
    });

    setName("");
    loadStudents();
  };

  const deleteStudent = async (id) => {
    await deleteDoc(doc(db, "students", id));
    loadStudents();
  };

  const toggleStudent = async (student) => {
    await updateDoc(doc(db, "students", student.id), {
      enabled: !student.enabled
    });

    loadStudents();
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">👨‍🎓 Gestión de Estudiantes</h2>

        {/* AGREGAR */}
        <h3>Agregar estudiante</h3>

        <input
          className="input input-full"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="btn primary full" onClick={addStudent}>
          Agregar ➕
        </button>

        {/* LISTA */}
        <h3 style={{ marginTop: "20px" }}>Lista de estudiantes</h3>

        {students.length === 0 ? (
          <p>No hay estudiantes</p>
        ) : (
          students.map((s) => (
            <div key={s.id} className="studentRow">
              <div>
                <h4>
                  {s.name} {s.enabled ? "🟢" : "🔴"}
                </h4>

                <div className="studentInfo">
                  <p>
                    📊 Puntaje: {s.score || 0} / {s.total || 0}
                  </p>
                  <p>🪙 Monedas: {s.coins || 0}</p>
                  <p>
                    Estado:{" "}
                    {s.completed ? "✅ Completado" : "⏳ Pendiente"}
                  </p>
                </div>
              </div>

              <div className="studentActions">
                <button
                  className="btn secondary"
                  onClick={() => toggleStudent(s)}
                >
                  {s.enabled ? "Deshabilitar 🚫" : "Habilitar ✅"}
                </button>

                <button
                  className="btn danger"
                  onClick={() => deleteStudent(s.id)}
                >
                  Eliminar ❌
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminStudents;