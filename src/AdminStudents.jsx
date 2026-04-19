import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch // 🔥 Agregamos batch para actualizar muchos a la vez
} from "firebase/firestore";
import { db } from "./firebase";

function AdminStudents() {
  const [name, setName] = useState("");
  const [students, setStudents] = useState([]);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

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
      coins: 0,
      date: null
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

  // 🔥 NUEVA FUNCIÓN: Deshabilitar a todos
  const disableAllStudents = async () => {
    const confirmDisable = window.confirm(
      "¿Seguro que querés deshabilitar a TODOS los estudiantes?"
    );
    if (!confirmDisable) return;

    try {
      const batch = writeBatch(db); // Usamos Batch para que sea una sola operación rápida
      students.forEach((student) => {
        const studentRef = doc(db, "students", student.id);
        batch.update(studentRef, { enabled: false });
      });

      await batch.commit(); // Ejecuta todos los cambios juntos
      loadStudents(); // Recarga la lista
      alert("Todos los estudiantes han sido deshabilitados.");
    } catch (error) {
      console.error("Error al deshabilitar:", error);
      alert("Hubo un error al procesar la solicitud.");
    }
  };

  const resetStudent = async (student) => {
    const confirmReset = window.confirm(
      `¿Seguro que querés resetear a ${student.name}?`
    );
    if (!confirmReset) return;

    await updateDoc(doc(db, "students", student.id), {
      completed: false,
      score: 0,
      total: 0,
      coins: 0,
      date: null
    });
    loadStudents();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Sin realizar";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const filteredStudents = onlyCompleted
    ? students.filter((s) => s.completed)
    : students;

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Gestión de Estudiantes</h2>

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

        {/* 🔥 SECCIÓN DE FILTRO Y BOTÓN MASIVO */}
        <div style={{ 
          marginTop: "15px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={onlyCompleted}
              onChange={() => setOnlyCompleted(!onlyCompleted)}
            />
            Mostrar solo completados ✅
          </label>

          <button 
            className="btn danger" 
            onClick={disableAllStudents}
            style={{ padding: "8px 15px", fontSize: "14px" }}
          >
            Deshabilitar a todos 🚫
          </button>
        </div>

        <h3 style={{ marginTop: "20px" }}>Lista de estudiantes</h3>

        {filteredStudents.length === 0 ? (
          <p>No hay estudiantes</p>
        ) : (
          filteredStudents.map((s) => (
            <div key={s.id} className="studentRow">
              <div>
                <h4>
                  {s.name} {s.enabled ? "🟢" : "🔴"}
                </h4>
                <div className="studentInfo">
                  <p>📊 Puntaje: {s.score || 0} / {s.total || 0}</p>
                  <p>🪙 Monedas: {s.coins || 0}</p>
                  <p>✔️ Estado: {s.completed ? "✅ Completado" : "⏳ Pendiente"}</p>
                  <p>📅 Fecha: {formatDate(s.date)}</p>
                </div>
              </div>

              <div className="studentActions">
                <button className="btn secondary" onClick={() => toggleStudent(s)}>
                  {s.enabled ? "Deshabilitar 🚫" : "Habilitar ✅"}
                </button>
                <button className="btn warning" onClick={() => resetStudent(s)}>
                  Resetear 🔄
                </button>
                <button className="btn danger" onClick={() => deleteStudent(s.id)}>
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