import './App.css';
import { useState, useEffect } from 'react';
import Contacto from './Contacto';
import PayPalButton from './PayPalButton';

function App() {
  const [mensaje, setMensaje] = useState('');
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [pagando, setPagando] = useState(false);

  const API = "https://jabonsa.onrender.com";

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(i => i._id === prod._id);
      if (existe) {
        return prev.map(i => i._id === prod._id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { ...prod, cantidad: 1 }];
    });
    setMensaje(`✅ ${prod.nombre} agregado al carrito`);
    setTimeout(() => setMensaje(''), 2000);
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => {
      return prev.map(i => i._id === id ? { ...i, cantidad: i.cantidad + delta } : i)
                 .filter(i => i.cantidad > 0);
    });
  };

  const totalCarrito = carrito.reduce((acc, i) => {
    const precio = parseFloat(i.precio.replace(/[^0-9.]/g, ''));
    return acc + (precio * i.cantidad);
  }, 0);

  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  const guardarPedidoEnDB = async () => {
    for (const item of carrito) {
      for (let i = 0; i < item.cantidad; i++) {
        await fetch(`${API}/comprar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ producto: item.nombre })
        });
      }
    }
  };

  const onPagoExitoso = async (details) => {
    try {
      await guardarPedidoEnDB();
      setMensaje(`🎉 ¡Pago exitoso! Gracias ${details.payer.name.given_name} por tu compra.`);
      setCarrito([]);
      setCarritoAbierto(false);
      setPagando(false);
      fetchCompras();
      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      console.error(err);
      setMensaje('❌ Error al guardar pedido');
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

      {carritoAbierto && (
        <div className="carrito-overlay" onClick={() => { setCarritoAbierto(false); setPagando(false); }} />
      )}
      <div className={`carrito-panel ${carritoAbierto ? 'abierto' : ''}`}>
        <div className="carrito-header">
          <h2>Mon Panier</h2>
          <button onClick={() => { setCarritoAbierto(false); setPagando(false); }}>✕</button>
        </div>
        {carrito.length === 0 ? (
          <p className="carrito-vacio">Tu carrito está vacío</p>
        ) : (
          <>
            <div className="carrito-items">
              {carrito.map(item => (
                <div className="carrito-item" key={item._id}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} />
                  ) : (
                    <span style={{ fontSize: '24px' }}>{item.emoji}</span>
                  )}
                  <div className="carrito-item-info">
                    <strong>{item.nombre}</strong>
                    <span>{item.precio}</span>
                  </div>
                  <div className="carrito-item-qty">
                    <button onClick={() => cambiarCantidad(item._id, -1)}>−</button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item._id, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="carrito-footer">
              <div className="carrito-total">
                <span>Total</span>
                <span>${totalCarrito.toFixed(2)} USD</span>
              </div>
              {!pagando ? (
                <button className="sd-btn carrito-confirmar" onClick={() => setPagando(true)}>
                  Proceder al Pago
                </button>
              ) : (
                <div className="paypal-wrap">
                  <p style={{ fontSize: '12px', color: '#8a7f72', textAlign: 'center', marginBottom: '1rem', letterSpacing: '1px' }}>
                    PAGO SEGURO CON PAYPAL
                  </p>
                  <PayPalButton total={totalCarrito} onSuccess={onPagoExitoso} />
                  <button className="btn-cancelar-pago" onClick={() => setPagando(false)}>
                    ← Volver al carrito
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

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
          <button className="carrito-btn" onClick={() => setCarritoAbierto(true)}>
            🛒 {totalItems > 0 && <span className="carrito-badge">{totalItems}</span>}
          </button>
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
                <button className="sd-card-btn" onClick={() => agregarAlCarrito(prod)}>
                  🛒 Añadir al carrito
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