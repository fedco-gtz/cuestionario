import { useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"; // 🔥 Importamos updateDoc y doc
import { db } from "./firebase";
import AnimatedBackgroundAlt from "./AnimatedBackgroundAlt";

function Login({ setStudent }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!name.trim()) return;

    const querySnapshot = await getDocs(collection(db, "students"));
    let found = null;

    querySnapshot.forEach((doc) => {
      // Normalizamos a minúsculas para evitar errores de tipeo
      if (doc.data().name.toLowerCase() === name.toLowerCase()) {
        found = { id: doc.id, ...doc.data() };
      }
    });

    // 1. Validar si existe
    if (!found) {
      setError("No estás en la lista");
      return;
    }

    // 2. Validar si el profe lo habilitó individualmente
    if (!found.enabled) {
      setError("No estás habilitado por el profesor");
      return;
    }

    // 3. Validar si ya terminó el examen antes
    if (found.completed) {
      setError("Ya realizaste el cuestionario");
      return;
    }

    if (found.status === true) {
      setError("Ya hay una sesión activa con este nombre");
      return;
    }

    try {
      // 5. 🔥 REGISTRAR INGRESO: Cambiamos status a true en Firebase antes de entrar
      const studentRef = doc(db, "students", found.id);
      await updateDoc(studentRef, {
        status: true
      });

      // 6. Pasamos el estudiante al componente principal
      setStudent({ ...found, status: true });
      
    } catch (e) {
      console.error("Error al iniciar sesión:", e);
      setError("Error de conexión");
    }
  };

  return (
    <AnimatedBackgroundAlt>
      <div className="card loginCard">
        <h1 className="title">CUESTIONARIO</h1>
        <p className="subtitle">Ingresá para comenzar</p>

        <input 
          className="input input-full"
          placeholder="Tu nombre exacto"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(""); // Limpia el error al escribir
          }}
        />

        {error && <p className="error">{error}</p>}

        <button className="btn primary full" onClick={handleLogin}>
          Entrar
        </button>
      </div>
    </AnimatedBackgroundAlt>
  );
}

export default Login;