import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [mensaje, setMensaje] = useState('');
  const [compras, setCompras] = useState([]);

  // Función para comprar
  const comprar = async (producto) => {
    try {
      const res = await fetch("http://localhost:3000/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto })
      });
      const data = await res.json();
      setMensaje(`✅ ${data.producto} - ${data.mensaje}`);
      fetchCompras(); // actualizar lista
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error(err);
      setMensaje('❌ Error al comprar');
    }
  };

  // Función para obtener la lista de compras
  const fetchCompras = async () => {
    try {
      const res = await fetch("http://localhost:3000/compras");
      const data = await res.json();
      setCompras(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar compras al inicio
  useEffect(() => {
    fetchCompras();
  }, []);

  return (
    <div className="App">
      {/* HEADER */}
      <header className="header">
        <div className="logo">🧼 Jabonsa</div>
        <nav>
          <a href="#productos">Productos</a>
          <a href="#beneficios">Beneficios</a>
          <a href="#compras">Compras</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <h1>Jabones Naturales Premium</h1>
        <p>Cuida tu piel con productos orgánicos hechos a mano</p>
        <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}>
          Ver productos
        </button>
      </section>

      {/* PRODUCTOS */}
      <section className="section" id="productos">
        <h2>Productos destacados</h2>
        <div className="cards">
          {['Lavanda', 'Coco', 'Aloe Vera'].map(prod => (
            <div className="card" key={prod}>
              <h3>{prod}</h3>
              <p>{prod === 'Lavanda' ? 'Relajante y aromático' : prod === 'Coco' ? 'Hidratación profunda' : 'Regeneración natural'}</p>
              <button onClick={() => comprar(prod)}>Comprar</button>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="section dark" id="beneficios">
        <h2>¿Por qué Jabonsa?</h2>
        <div className="cards">
          <div className="card">🌿 100% Natural</div>
          <div className="card">🚫 Sin químicos</div>
          <div className="card">🧴 Hecho a mano</div>
        </div>
      </section>

      {/* LISTA DE COMPRAS */}
      <section className="section" id="compras">
        <h2>Últimas compras</h2>
        {compras.length === 0 ? (
          <p>No hay compras aún.</p>
        ) : (
          <ul>
            {compras.map(c => (
              <li key={c._id}>{c.producto} - {new Date(c.fecha).toLocaleString()}</li>
            ))}
          </ul>
        )}
      </section>

      {/* MENSAJE */}
      {mensaje && <div className="mensaje">{mensaje}</div>}

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2026 Jabonsa - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default App;