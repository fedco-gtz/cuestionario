import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

function Ranking() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), async (snapshot) => {
      let data = [];

      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });

      // solo los que terminaron
      data = data.filter((s) => s.completed);

      // ordenar por puntaje
      data.sort((a, b) => (b.score || 0) - (a.score || 0));

      // asignar coins automáticamente
      for (let i = 0; i < data.length; i++) {
        let coins = 2;

        if (i === 0) coins = 10;
        else if (i === 1) coins = 7;
        else if (i === 2) coins = 5;

        // actualizar en Firebase
        await updateDoc(doc(db, "students", data[i].id), {
          coins: coins
        });
      }

      setStudents(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container">
      <h1 className="title">🏆 Ranking en Vivo</h1>

      {students.map((s, index) => (
        <div
          key={s.id}
          className={`rankingCard ${
            index === 0 ? "gold" :
            index === 1 ? "silver" :
            index === 2 ? "bronze" : ""
          }`}
        >
          <h2>{index + 1}° - {s.name}</h2>

          <p>📊 {s.score}/{s.total}</p>
          <p>🪙 {s.coins || 0} coins</p>
        </div>
      ))}
    </div>
  );
}

export default Ranking;