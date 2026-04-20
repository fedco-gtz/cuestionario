import { useState } from "react";
import Login from "./Login";
import Quiz from "./Quiz";
import AdminLogin from "./AdminLogin";
import Welcome from "./Welcome";
import AdminPanel from "./AdminPanel";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [started, setStarted] = useState(false);
  const [view, setView] = useState("login");
  const [student, setStudent] = useState(null);
  const [admin, setAdmin] = useState(null);

  let content;

  // 🎬 Pantalla inicial
  if (!started) {
    content = <Welcome onStart={() => setStarted(true)} />;
  }
  // 👨‍🏫 Panel admin
  else if (view === "admin") {
    if (!admin) {
      content = <AdminLogin setAdmin={setAdmin} setView={setView} />;
    } else {
      content = <AdminPanel />;
    }
  }
  // 🎓 Flujo estudiante
  else {
    content = (
      <div>
        <div style={{ margin: "10px" }}>
          <button className="tab2" onClick={() => setView("admin")}>
            Ingreso de Profesores
          </button>
        </div>

        {!student ? (
          <Login setStudent={setStudent} />
        ) : (
          <Quiz student={student} />
        )}
      </div>
    );
  }

  return (
    <>
      {content}

      {/* 🔥 Toast GLOBAL (una sola vez, como debe ser) */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        theme="dark"
        pauseOnHover
      />
    </>
  );
}

export default App;