import './Landing.css';

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', textAlign: 'center', padding: '2rem', fontFamily: 'Georgia, serif' }}>
      <div style={{ fontSize: '80px', marginBottom: '1rem' }}>🌸</div>
      <h1 style={{ fontSize: '80px', fontWeight: '400', color: '#c97a8a', marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#1a1a1a', marginBottom: '1rem' }}>Página no encontrada</h2>
      <p style={{ fontSize: '15px', color: '#8a7f72', marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.8' }}>
        Parece que esta página se perdió entre los pétalos de rosa. No te preocupes, regresa a nuestra tienda.
      </p>
      <button
        onClick={() => window.location.href = '/'}
        style={{ padding: '0.9rem 2.5rem', background: '#c97a8a', color: 'white', border: 'none', borderRadius: '25px', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
      >
        Volver al inicio →
      </button>
    </div>
  );
}

export default NotFound;