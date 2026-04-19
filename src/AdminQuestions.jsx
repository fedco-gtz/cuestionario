import React, { useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const EditorPregunta = () => {
  const [formula, setFormula] = useState("\\frac{1}{2}");

  // Función para limpiar los $ si el usuario los escribe por costumbre
  const cleanFormula = (text) => {
    return text.replace(/\$/g, "");
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Nueva pregunta</h2>
      
      <input 
        type="text"
        value={formula}
        onChange={(e) => setFormula(e.target.value)}
        className="w-full p-2 bg-slate-800 rounded border border-slate-700 mb-4 font-mono"
        placeholder="Ej: \frac{a}{b}"
      />

      <div className="mt-4">
        <h3 className="text-sm text-slate-400 mb-2">👀 Vista previa:</h3>
        <div className="p-4 bg-slate-800 rounded-md min-h-[50px] flex items-center justify-center">
          {/* Usamos un try-catch silencioso o validación para evitar el [Error de sintaxis] */}
          {formula ? (
            <InlineMath 
              math={cleanFormula(formula)} 
              renderError={(error) => {
                return <span className="text-red-400 text-sm">[Error de sintaxis en LaTeX]</span>
              }}
            />
          ) : (
            <span className="text-slate-500 italic">Escribe una fórmula...</span>
          )}
        </div>
      </div>
    </div>
  );
};