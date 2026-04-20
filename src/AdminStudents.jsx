import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { toast } from "react-toastify";

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

  // --- FUNCIONES MASIVAS (BATCH) ---

  const updateAllStudents = async (newData, message) => {
    const confirmAction = window.confirm(message);
    if (!confirmAction) return;

    try {
      const batch = writeBatch(db);
      students.forEach((student) => {
        const studentRef = doc(db, "students", student.id);
        batch.update(studentRef, newData);
      });
      await batch.commit();
      loadStudents();
      alert("Operación completada con éxito.");
    } catch (error) {
      console.error("Error en operación masiva:", error);
      alert("Hubo un error al procesar la solicitud.");
    }
  };

  const handleEnableAll = () => updateAllStudents({ enabled: true }, "¿Habilitar a TODOS los estudiantes?");
  const handleDisableAll = () => updateAllStudents({ enabled: false }, "¿Deshabilitar a TODOS los estudiantes?");
  const handleResetAll = () => updateAllStudents({
    completed: false,
    score: 0,
    total: 0,
    coins: 0,
    date: null,
    status: false
  }, "¿Estás seguro de que querés RESETEAR a todos? Se borrarán sus puntajes y monedas.");

   const addStudent = async () => {
    if (!name) return;
    await addDoc(collection(db, "students"), {
      name, enabled: true, completed: false, score: 0, total: 0, coins: 0, date: null
    });
    setName("");
    loadStudents();
  };

  const deleteStudent = async (id) => {
    const confirmDelete = window.confirm("¿Eliminar este estudiante?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "students", id));

      setStudents((prev) => prev.filter((s) => s.id !== id));

      toast.success("Estudiante eliminado");

    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar");
    }
  };

  const toggleStudent = async (student) => {
    await updateDoc(doc(db, "students", student.id), { enabled: !student.enabled });
    loadStudents();
  };

  const resetStudent = async (student) => {
    if (!window.confirm(`¿Resetear a ${student.name}?`)) return;
    await updateDoc(doc(db, "students", student.id), {
      completed: false, score: 0, total: 0, coins: 0, date: null, status: false
    });
    loadStudents();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Sin realizar";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const filteredStudents = onlyCompleted ? students.filter((s) => s.completed) : students;

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Gestión de Estudiantes</h2>

        <h3>Agregar estudiante</h3>
        <input
          className="input input-full"
          placeholder="Nombre del estudiantes"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn primary full" onClick={addStudent}>Agregar</button>

        {/* FILTRO Y ACCIONES MASIVAS */}
        <div style={{ marginTop: "20px", borderTop: "1px solid #334155", paddingTop: "15px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
            <input
              type="checkbox"
              checked={onlyCompleted}
              onChange={() => setOnlyCompleted(!onlyCompleted)}
            />
            Mostrar solo completados
          </label>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button className="btn status3" style={{ flex: 1 }} onClick={handleEnableAll}>
              Habilitar todos
            </button>
            <button className="btn status2" style={{ flex: 1 }} onClick={handleDisableAll}>
              Deshabilitar todos
            </button>
            <button className="btn warning" style={{ flex: 1 }} onClick={handleResetAll}>
              Resetear todos
            </button>
          </div>
        </div>

        <h3 style={{ marginTop: "25px" }}>Lista de estudiantes</h3>

        {filteredStudents.length === 0 ? (
          <p>No hay estudiantes</p>
        ) : (
          filteredStudents.map((s) => (
            <div key={s.id} className="studentRow">
              <div>
                <h4>
                  {s.name}{" "}
                  <span className={s.enabled ? "status enabled" : "status disabled"}>
                    {s.enabled ? "Habilitado" : "Deshabilitado"}
                  </span>
                </h4>
                <div className="studentInfo">
                  <p>📊 Puntaje: {s.score || 0} / {s.total || 0}</p>
                  <p>🪙 Monedas: {s.coins || 0}</p>
                  <p>📅 Fecha: {formatDate(s.date)}</p>
                </div>
              </div>

              <div className="studentActions">
                <button
                  className={`btn ${s.enabled ? "status2" : "status3"}`}
                  onClick={() => toggleStudent(s)}
                >
                  {s.enabled ? "Deshabilitar" : "Habilitar"}
                </button>
                <button className="btn warning" onClick={() => resetStudent(s)}>Resetear</button>
                <button className="btn danger" onClick={() => deleteStudent(s.id)}>Eliminar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminStudents;