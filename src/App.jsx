import { useState } from "react";
import Login from "./Login";
import Quiz from "./Quiz";
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";
import Welcome from "./Welcome";
import AdminPanel from "./AdminPanel";

function App() {
  const [started, setStarted] = useState(false);
  const [view, setView] = useState("login");
  const [student, setStudent] = useState(null);
  const [admin, setAdmin] = useState(null);

  if (!started) {
    return <Welcome onStart={() => setStarted(true)} />;
  }

  if (view === "admin") {
    if (!admin) return <AdminLogin setAdmin={setAdmin} setView={setView} />;

    return <AdminPanel />;
  }

  return (
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

export default App;