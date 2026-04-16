import { useState } from "react";
import AdminQuestions from "./AdminQuestions";
import Ranking from "./Ranking";
import AdminStudents from "./AdminStudents";

function AdminPanel() {
  const [view, setView] = useState("students");

  return (
    <div className="container">
      <h1 className="title">Panel de Administración</h1>

      <div className="tabs">
        <button
          className={`tab ${view === "students" ? "active" : ""}`}
          onClick={() => setView("students")}
        >Agregar Estudiante
        </button>

        <button
          className={`tab ${view === "ranking" ? "active" : ""}`}
          onClick={() => setView("ranking")}
        >Ver Ranking
        </button>

        <button
          className={`tab ${view === "questions" ? "active" : ""}`}
          onClick={() => setView("questions")}
        >Agregar Pregunta
        </button>
      </div>

      <div className="tabContent">
        {view === "students" && <AdminStudents />}
        {view === "ranking" && <Ranking />}
        {view === "questions" && <AdminQuestions />}
      </div>
    </div>
  );
}

export default AdminPanel;