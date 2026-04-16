import { useEffect } from "react";

function Welcome({ onStart }) {
  useEffect(() => {
    createParticles();
  }, []);

  const createParticles = () => {
    const container = document.getElementById("particles");

    for (let i = 0; i < 40; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";

      particle.style.left = Math.random() * 100 + "%";
      particle.style.animationDuration = 3 + Math.random() * 5 + "s";
      particle.style.opacity = Math.random();

      container.appendChild(particle);
    }
  };

  return (
    <div className="welcome">
      <div id="particles"></div>

      <div className="welcomeContent">
        <h1 className="welcomeTitle">Matemática V</h1>
        <p className="welcomeSubtitle">
          Colegio Thomas Jefferson
        </p>

        <button className="btn primary big" onClick={onStart}>
          Comenzar
        </button>
      </div>
    </div>
  );
}

export default Welcome;