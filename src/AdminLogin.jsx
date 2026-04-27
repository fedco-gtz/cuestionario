import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import AnimatedBackgroundAlt from "./AnimatedBackgroundAlt";

function AdminLogin({ setAdmin, setView }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setAdmin(userCredential.user);
    } catch (error) {
      alert("Error de login");
      console.error(error);
    }
  };

  return (
    <div>
      <div style={{ margin: "10px" }}>
        <button className="tab2" onClick={() => setView("login")}>
          Volver al inicio
        </button>
      </div>
      <AnimatedBackgroundAlt>
        <div className="card loginCard">
          <h1 className="title">Acceso de Profesores</h1>
          <p className="subtitle">Acceso restringido</p>

          <input
            className="input input-full input-full4"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input input-full"
            type="password"
            placeholder="Contraseña"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn primary full" onClick={handleLogin}>
            Ingresar
          </button>
        </div>
      </AnimatedBackgroundAlt>
    </div>
  );
}

export default AdminLogin;