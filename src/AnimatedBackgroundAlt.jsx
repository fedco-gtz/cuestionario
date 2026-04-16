function AnimatedBackgroundAlt({ children }) {
  return (
    <div className="waveBackground">
      <div className="waves">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="screenContent">
        {children}
      </div>
    </div>
  );
}

export default AnimatedBackgroundAlt;