import React, { useState } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

const EditorPregunta = () => {
  // Nota: Si el usuario escribe \frac{1}{2} en el input, MathJax lo renderiza.
  // Para que MathJax lo detecte automáticamente, es mejor rodearlo con $ si es texto mixto.
  const [formula, setFormula] = useState("\\frac{1}{2}");

  return (
    <MathJaxContext>
      <div className="p-4 bg-slate-900 text-white rounded-lg">
        <h2 className="text-xl font-bold mb-4">Nueva pregunta</h2>
        
        <input 
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          className="w-full p-2 bg-slate-800 rounded border border-slate-700 mb-4 font-mono text-white"
          placeholder="Ej: \frac{a}{b} o \sqrt{x}"
        />

        <div className="mt-4">
          <h3 className="text-sm text-slate-400 mb-2">👀 Vista previa:</h3>
          <div className="p-4 bg-slate-800 rounded-md min-h-[80px] flex items-center justify-center text-xl">
            {formula ? (
              <MathJax hideUntilTypeset={"always"}>
                {/* Envolvemos la fórmula con signos de pesos para que MathJax 
                   sepa que debe procesarlo como LaTeX matemático 
                */}
                {`$${formula}$`}
              </MathJax>
            ) : (
              <span className="text-slate-500 italic">Escribe una fórmula...</span>
            )}
          </div>
        </div>
        
        <p className="mt-2 text-xs text-slate-500">
          Tip: No hace falta que escribas los signos $, la vista previa los agrega por vos.
        </p>
      </div>
    </MathJaxContext>
  );
};

export default EditorPregunta;