import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { toast } from "react-toastify";

const config = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]]
  }
};

function AdminArchive() {
  const [archives, setArchives] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    const snapshot = await getDocs(collection(db, "archive"));
    let data = [];

    snapshot.forEach((docu) => {
      data.push({ id: docu.id, ...docu.data() });
    });

    setArchives(data);
  };

  // 📅 FORMATO FECHA
  const formatDate = (date) => {
    if (!date) return "Sin fecha";

    const d = new Date(date.seconds * 1000);
    return d.toLocaleDateString("es-AR");
  };

  // 🔄 RESTAURAR
  const restoreArchive = async (archive) => {
    if (!window.confirm(`Restaurar "${archive.name}"?`)) return;

    try {
      const batch = writeBatch(db);

      archive.questions.forEach((q) => {
        const ref = doc(collection(db, "questions"));
        batch.set(ref, {
          question: q.question,
          options: q.options,
          correct: q.correct
        });
      });

      await batch.commit();

      toast.success("Preguntas restauradas");

    } catch (error) {
      console.error(error);
      toast.error("Error al restaurar");
    }
  };

  // ❌ ELIMINAR ARCHIVO
  const deleteArchive = async (id) => {
    if (!window.confirm("¿Eliminar este archivo?")) return;

    try {
      await deleteDoc(doc(db, "archive", id));
      loadArchives();
      toast.success("Archivo eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <MathJaxContext config={config}>
      <div className="container">
        <div className="card">
          <h2 className="title">📁 Archivos guardados</h2>

          {archives.length === 0 ? (
            <p>No hay archivos</p>
          ) : (
            archives.map((a) => (
              <div key={a.id} className="archiveCard">

                {/* HEADER */}
                <div
                  className="archiveHeader"
                  onClick={() => setOpenId(openId === a.id ? null : a.id)}
                >
                  <div>
                    <h3>📄 {a.name}</h3>
                    <p>
                      {a.questions?.length || 0} preguntas • {formatDate(a.createdAt)}
                    </p>
                  </div>

                  <span>{openId === a.id ? "⬆️" : "⬇️"}</span>
                </div>

                {/* CONTENIDO */}
                {openId === a.id && (
                  <div className="archiveContent">

                    {a.questions.map((q, i) => (
                      <div key={i} className="questionCard">
                        <MathJax>
                          <h4>{q.question}</h4>
                        </MathJax>

                        <ul>
                          {q.options.map((opt, j) => (
                            <li
                              key={j}
                              style={{
                                color: j === q.correct ? "#22c55e" : "white"
                              }}
                            >
                              <MathJax>
                                <span>
                                  {opt} {j === q.correct && "✔"}
                                </span>
                              </MathJax>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* ACCIONES */}
                    <div className="archiveActions">
                      <button
                        className="btn primary"
                        onClick={() => restoreArchive(a)}
                      >
                        Restaurar 🔄
                      </button>

                      <button
                        className="btn danger"
                        onClick={() => deleteArchive(a.id)}
                      >
                        Eliminar ❌
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MathJaxContext>
  );
}

export default AdminArchive;