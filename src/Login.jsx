import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import AnimatedBackgroundAlt from "./AnimatedBackgroundAlt";

function Login({ setStudent }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const querySnapshot = await getDocs(collection(db, "students"));
    let found = null;

    querySnapshot.forEach((doc) => {
      if (doc.data().name === name) {
        found = { id: doc.id, ...doc.data() };
      }
    });

    if (!found) {
      setError("No estás habilitado");
      return;
    }

    if (!found.enabled) {
      setError("No estás habilitado");
      return;
    }

    if (found.completed) {
      setError("Ya realizaste el cuestionario");
      return;
    }

    setStudent(found);
  };

  return (
    <AnimatedBackgroundAlt>
      <div className="card loginCard">
        <h1 className="title">CUESTIONARIO</h1>
        <p className="subtitle">Ingresá para comenzar</p>

        <input 
          className="input input-full"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
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