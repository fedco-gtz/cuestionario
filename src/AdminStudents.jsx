import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
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

    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    setStudents(data);
  };

  const addStudent = async () => {
    if (!name) return;

    await addDoc(collection(db, "students"), {
      name,
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

  return (
    
    <div className="card">
      <h3>Agregar estudiante</h3>

      <input
        className="input input-full"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button className="btn primary full" onClick={addStudent}>
        Agregar
      </button>

      <h3 style={{ marginTop: "20px" }}>Lista</h3>

      {students.map((s) => (
        <div key={s.id}>
          {s.name}
          <button onClick={() => deleteStudent(s.id)}>❌</button>
        </div>
      ))}
    </div>
  );
}

export default AdminStudents;