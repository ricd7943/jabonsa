import './App.css';
import { useState, useEffect } from 'react';
import Contacto from './Contacto';

function App() {
  const [mensaje, setMensaje] = useState('');
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);

  const API = "https://jabonsa.onrender.com";

  const comprar = async (producto) => {
    try {
      const res = await fetch(`${API}/comprar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto })
      });
      const data = await res.json();
      setMensaje(`✅ ${data.producto} - ${data.mensaje}`);
      fetchCompras();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error(err);
      setMensaje('❌ Error al comprar');
    }
  };

  const fetchCompras = async () => {
    try {
      const res = await fetch(`${API}/compras`);
      const data = await res.json();
      setCompras(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch(`${API}/productos`);
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompras();
    fetchProductos();
  }, []);

  return (
    <div className="sd-wrap">
      <header className="sd-header">
        <div className="sd-logo">
          Savon d'Art
          <span>Maison Artisanale</span>
        </div>
        <nav className="sd-nav">
          <a href="#collection">Collection</a>
          <a href="#esencia">L'Essence</a>
          <a href="#pedidos">Pedidos</a>
          <a href="#contacto">Contact</a>
        </nav>
      </header>

      <section className="sd-hero">
        <p className="sd-hero-pre">Collection Exclusive 2026</p>
        <h1>L'art du soin,<br /><em>fait à la main</em></h1>
        <p>Jabones artesanales de lujo para espacios únicos</p>
        <button className="sd-btn" onClick={() => document.getElementById('collection').scrollIntoView({ behavior: 'smooth' })}>
          Découvrir la Collection
        </button>
      </section>

      <section className="sd-section" id="collection">
        <div className="sd-section-title">
          <p>Notre Collection</p>
          <h2>Piezas Artesanales</h2>
          <div className="sd-divider"></div>
        </div>
        <div className="sd-cards">
          {productos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8a7f72', fontSize: '14px', gridColumn: '1/-1' }}>
              Cargando productos...
            </p>
          ) : (
            productos.map(prod => (
              <div className="sd-card" key={prod._id}>
                {prod.imagen ? (
                  <img
                    src={prod.imagen}
                    alt={prod.nombre}
                    style={{ width: '100%', height: '180px', objectFit: 'cover', marginBottom: '1rem', borderBottom: '0.5px solid #d4c9b8' }}
                  />
                ) : (
                  <div className="sd-card-icon">{prod.emoji}</div>
                )}
                <h3>{prod.nombre}</h3>
                <p>{prod.descripcion}</p>
                <p className="sd-card-price">{prod.precio}</p>
                <button className="sd-card-btn" onClick={() => comprar(prod.nombre)}>
                  Añadir al pedido
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="sd-section sd-dark" id="esencia">
        <div className="sd-section-title">
          <p>L'Essence</p>
          <h2>Por qué Savon d'Art</h2>
          <div className="sd-divider"></div>
        </div>
        <div className="sd-features">
          <div className="sd-feature">
            <div className="sd-feature-icon">✦</div>
            <p>100% Natural</p>
          </div>
          <div className="sd-feature">
            <div className="sd-feature-icon">✦</div>
            <p>Hecho a mano</p>
          </div>
          <div className="sd-feature">
            <div className="sd-feature-icon">✦</div>
            <p>Edición limitada</p>
          </div>
        </div>
      </section>

      <section className="sd-section" id="pedidos">
        <div className="sd-section-title">
          <p>Historique</p>
          <h2>Últimos Pedidos</h2>
          <div className="sd-divider"></div>
        </div>
        {compras.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8a7f72', fontSize: '14px' }}>No hay pedidos aún.</p>
        ) : (
          <ul className="sd-pedidos">
            {compras.map(c => (
              <li key={c._id}>
                <span>{c.producto}</span>
                <span>{new Date(c.fecha).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Contacto />

      {mensaje && <div className="sd-mensaje">{mensaje}</div>}

      <footer className="sd-footer">
        <p>© 2026 Savon d'Art — Maison Artisanale</p>
      </footer>
    </div>
  );
}

export default App;