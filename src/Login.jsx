import { useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"; 
import { db } from "./firebase";
import AnimatedBackgroundAlt from "./AnimatedBackgroundAlt";

function Login({ setStudent }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    // Limpiamos espacios al inicio, al final y pasamos a mayúsculas para comparar
    const cleanInputName = name.trim().toUpperCase();

    if (!cleanInputName) return;

    const querySnapshot = await getDocs(collection(db, "students"));
    let found = null;

    querySnapshot.forEach((doc) => {
      const dbName = doc.data().name ? doc.data().name.trim().toUpperCase() : "";
      
      // Comparación exacta en mayúsculas y sin espacios extras
      if (dbName === cleanInputName) {
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

    // 4. Validar si ya hay una sesión activa
    if (found.status === true) {
      setError("Ya iniciaste sesión con este nombre");
      return;
    }

    try {
      // 5. REGISTRAR INGRESO: Cambiamos status a true en Firebase antes de entrar
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

  // Función para normalizar el texto mientras escriben
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Reemplaza múltiples espacios seguidos por uno solo y pasa a mayúsculas
    // Evita que el input rebote si intentan poner un espacio al final para escribir el apellido
    const formattedValue = inputValue.replace(/\s+/g, " ").toUpperCase();
    
    setName(formattedValue);
    setError("");
  };

  return (
    <AnimatedBackgroundAlt>
      <div className="card loginCard">
        <h1 className="title">CUESTIONARIO</h1>
        <p className="subtitle">Ingresá para comenzar</p>

        <input 
          className="input input-full"
          placeholder="TU NOMBRE Y APELLIDO"
          value={name}
          onChange={handleInputChange}
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