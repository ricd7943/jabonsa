import './Landing.css';

function Landing() {
  const irATienda = () => {
    window.location.href = '/tienda';
  };

  return (
    <div className="landing-wrap">
      
      {/* FONDO CON IMAGEN */}
      <div className="landing-hero" style={{
        backgroundImage: `url(https://res.cloudinary.com/df9bqf9tn/image/upload/q_auto/f_auto/v1777407969/WhatsApp_Image_2026-04-26_at_7.44.36_PM_a87lpd.jpg)`
      }}>
        <div className="landing-overlay"></div>
        
        <div className="landing-content">
          <div className="landing-badge">✦ Colección Exclusiva 2026 ✦</div>
          <h1>
            Savon d'Art
            <em>Maison Artisanale</em>
          </h1>
          <p>Jabones artesanales de lujo elaborados a mano con ingredientes naturales premium. Una experiencia sensorial única para el cuidado de tu piel.</p>
          
          <div className="landing-stats">
            <div className="landing-stat">
              <strong>100%</strong>
              <span>Natural</span>
            </div>
            <div className="landing-stat-divider"></div>
            <div className="landing-stat">
              <strong>Artesanal</strong>
              <span>Hecho a mano</span>
            </div>
            <div className="landing-stat-divider"></div>
            <div className="landing-stat">
              <strong>Premium</strong>
              <span>Calidad Luxe</span>
            </div>
          </div>

          <button className="landing-btn" onClick={irATienda}>
            Descubrir la Colección →
          </button>

          <p className="landing-sub">Jabones de corazón · Sets de regalo · Edición limitada</p>
        </div>

        {/* SCROLL INDICATOR */}
        <div className="landing-scroll" onClick={irATienda}>
          <div className="scroll-dot"></div>
        </div>
      </div>

    </div>
  );
}

export default Landing;