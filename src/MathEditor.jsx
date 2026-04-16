import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function MathEditor({ value, setValue }) {

  const insert = (text) => {
    setValue(prev => prev + text);
  };

  return (
    <div style={{ width: "100%" }}>

      <input
        className="input full"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribí texto o usá los botones 👇"
      />

      {/* BOTONES */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginTop: "8px",
        flexWrap: "wrap"
      }}>

        <button onClick={() => insert("$\\sqrt{}$")}>√</button>
        <button onClick={() => insert("$\\frac{}{}$")}>a/b</button>
        <button onClick={() => insert("$^{}$")}>x²</button>
        <button onClick={() => insert("$_{}$")}>xₙ</button>
        <button onClick={() => insert("$\\pi$")}>π</button>

      </div>

      {/* PREVIEW 🔥 */}
      <div style={{ marginTop: "10px" }}>
        {value && (
          <InlineMath math={value.replace(/\$/g, "")} />
        )}
      </div>

    </div>
  );
}

export default MathEditor;