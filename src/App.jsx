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
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const API = "https://jabonsa.onrender.com";

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(i => i._id === prod._id);
      if (existe) return prev.map(i => i._id === prod._id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...prod, cantidad: 1 }];
    });
    setMensaje(`✅ ${prod.nombre} agregado al carrito`);
    setTimeout(() => setMensaje(''), 2000);
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev.map(i => i._id === id ? { ...i, cantidad: i.cantidad + delta } : i).filter(i => i.cantidad > 0));
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
      setMensaje(`🎉 ¡Pago exitoso! Gracias por tu compra.`);
      setCarrito([]);
      setCarritoAbierto(false);
      setPagando(false);
      fetchCompras();
      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      setMensaje('❌ Error al guardar pedido');
    }
  };

  const fetchCompras = async () => {
    try {
      const res = await fetch(`${API}/compras`);
      const data = await res.json();
      setCompras(data);
    } catch (err) { console.error(err); }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch(`${API}/productos`);
      const data = await res.json();
      setProductos(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCompras();
    fetchProductos();
  }, []);

  return (
    <div className="sd-wrap">

      {/* MODAL PRODUCTO */}
      {productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProductoSeleccionado(null)}>✕</button>
            {productoSeleccionado.imagen ? (
              <img src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} className="modal-img" />
            ) : (
              <div className="modal-emoji">{productoSeleccionado.emoji}</div>
            )}
            <div className="modal-info">
              <p className="modal-pre">Savon d'Art — Artisanal</p>
              <h2>{productoSeleccionado.nombre}</h2>
              <p className="modal-desc">{productoSeleccionado.descripcion}</p>
              <p className="modal-precio">{productoSeleccionado.precio}</p>
              <button className="sd-btn modal-btn" onClick={() => { agregarAlCarrito(productoSeleccionado); setProductoSeleccionado(null); }}>
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO PANEL */}
      {carritoAbierto && <div className="carrito-overlay" onClick={() => { setCarritoAbierto(false); setPagando(false); }} />}
      <div className={`carrito-panel ${carritoAbierto ? 'abierto' : ''}`}>
        <div className="carrito-header">
          <h2>Mon Panier <span className="carrito-count">({totalItems})</span></h2>
          <button onClick={() => { setCarritoAbierto(false); setPagando(false); }}>✕</button>
        </div>
        {carrito.length === 0 ? (
          <div className="carrito-vacio">
            <div className="carrito-vacio-icon">🛒</div>
            <p>Tu carrito está vacío</p>
            <span>Agrega productos para comenzar</span>
          </div>
        ) : (
          <>
            <div className="carrito-items">
              {carrito.map(item => (
                <div className="carrito-item" key={item._id}>
                  {item.imagen ? <img src={item.imagen} alt={item.nombre} /> : <span style={{ fontSize: '28px' }}>{item.emoji}</span>}
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
                <span className="carrito-total-precio">${totalCarrito.toFixed(2)} USD</span>
              </div>
              {!pagando ? (
                <button className="sd-btn carrito-confirmar" onClick={() => setPagando(true)}>
                  Proceder al Pago
                </button>
              ) : (
                <div className="paypal-wrap">
                  <p className="paypal-label">PAGO SEGURO CON PAYPAL</p>
                  <PayPalButton total={totalCarrito} onSuccess={onPagoExitoso} />
                  <button className="btn-cancelar-pago" onClick={() => setPagando(false)}>← Volver al carrito</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* HEADER */}
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

      {/* HERO */}
      <section className="sd-hero">
        <div className="hero-content">
          <p className="sd-hero-pre">✦ Collection Exclusive 2026 ✦</p>
          <h1>L'art du soin,<br /><em>fait à la main</em></h1>
          <p>Jabones artesanales de lujo elaborados con ingredientes naturales premium</p>
          <div className="hero-btns">
            <button className="sd-btn" onClick={() => document.getElementById('collection').scrollIntoView({ behavior: 'smooth' })}>
              Découvrir la Collection
            </button>
            <button className="sd-btn-ghost" onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}>
              Pedidos Especiales
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>100%</strong><span>Natural</span></div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat"><strong>Artesanal</strong><span>Hecho a mano</span></div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat"><strong>Premium</strong><span>Calidad Luxe</span></div>
          </div>
        </div>
        <div className="hero-decoracion">
          <div className="hero-circle c1"></div>
          <div className="hero-circle c2"></div>
          <div className="hero-circle c3"></div>
        </div>
      </section>

      {/* BANNER DESTACADO */}
      <section className="banner-destacado">
        <div className="banner-texto">
          <p>✦ ENVÍO GRATIS EN PEDIDOS SOBRE $30 ✦ JABONES ARTESANALES ✦ EDICIÓN LIMITADA ✦ REGALOS PERFECTOS ✦</p>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="sd-section" id="collection">
        <div className="sd-section-title">
          <p>Notre Collection</p>
          <h2>Piezas Artesanales</h2>
          <div className="sd-divider"></div>
          <p className="section-subtitle">Cada jabón es una obra de arte elaborada con amor y los mejores ingredientes naturales</p>
        </div>
        <div className="sd-cards">
          {productos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8a7f72', fontSize: '14px', gridColumn: '1/-1', padding: '3rem' }}>
              Cargando productos...
            </p>
          ) : (
            productos.map(prod => (
              <div className="sd-card" key={prod._id} onClick={() => setProductoSeleccionado(prod)}>
                <div className="sd-card-img-wrap">
                  {prod.imagen ? (
                    <img src={prod.imagen} alt={prod.nombre} className="sd-card-img" />
                  ) : (
                    <div className="sd-card-icon">{prod.emoji}</div>
                  )}
                  <div className="sd-card-overlay">
                    <span>Ver detalle</span>
                  </div>
                </div>
                <div className="sd-card-body">
                  <h3>{prod.nombre}</h3>
                  <p>{prod.descripcion}</p>
                  <div className="sd-card-footer">
                    <p className="sd-card-price">{prod.precio}</p>
                    <button className="sd-card-btn" onClick={e => { e.stopPropagation(); agregarAlCarrito(prod); }}>
                      + Carrito
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="sd-section sd-dark" id="esencia">
        <div className="sd-section-title">
          <p>L'Essence</p>
          <h2>Por qué Savon d'Art</h2>
          <div className="sd-divider"></div>
        </div>
        <div className="beneficios-grid">
          <div className="beneficio-card">
            <div className="beneficio-icon">🌿</div>
            <h3>100% Natural</h3>
            <p>Ingredientes seleccionados de la más alta calidad, sin químicos dañinos para tu piel</p>
          </div>
          <div className="beneficio-card">
            <div className="beneficio-icon">✋</div>
            <h3>Hecho a Mano</h3>
            <p>Cada jabón es elaborado artesanalmente con dedicación y amor en cada detalle</p>
          </div>
          <div className="beneficio-card">
            <div className="beneficio-icon">💎</div>
            <h3>Edición Limitada</h3>
            <p>Colecciones exclusivas que convierten cada jabón en una pieza única e irrepetible</p>
          </div>
          <div className="beneficio-card">
            <div className="beneficio-icon">🎁</div>
            <h3>Regalo Perfecto</h3>
            <p>Presentaciones elegantes ideales para bodas, eventos corporativos y ocasiones especiales</p>
          </div>
        </div>
      </section>

      {/* BANNER REGALO */}
      <section className="banner-regalo">
        <div className="banner-regalo-content">
          <div className="banner-regalo-texto">
            <p className="banner-regalo-pre">✦ Pedidos Especiales</p>
            <h2>¿Buscas un regalo único?</h2>
            <p>Creamos presentaciones personalizadas para bodas, eventos corporativos, spas y hoteles de lujo. Bandeja de regalo con moños dorados y jabones artesanales a tu medida.</p>
            <button className="sd-btn" onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}>
              Solicitar Cotización
            </button>
          </div>
          <div className="banner-regalo-deco">
            <div className="deco-circulo">🎁</div>
          </div>
        </div>
      </section>

      {/* PEDIDOS */}
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
            {compras.slice(0, 10).map(c => (
              <li key={c._id}>
                <span className="pedido-nombre">✓ {c.producto}</span>
                <span className="pedido-fecha">{new Date(c.fecha).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Contacto />

      {mensaje && <div className="sd-mensaje">{mensaje}</div>}

      {/* FOOTER */}
      <footer className="sd-footer">
        <div className="footer-content">
          <div className="footer-marca">
            <h3>Savon d'Art</h3>
            <p>Maison Artisanale</p>
            <p className="footer-desc">Jabones artesanales de lujo elaborados con ingredientes naturales premium para cuidar tu piel.</p>
          </div>
          <div className="footer-links">
            <h4>Navegación</h4>
            <a href="#collection">Collection</a>
            <a href="#esencia">L'Essence</a>
            <a href="#pedidos">Pedidos</a>
            <a href="#contacto">Contact</a>
          </div>
          <div className="footer-contacto">
            <h4>Contacto</h4>
            <p>📱 WhatsApp</p>
            <p>📸 Instagram</p>
            <p>📧 Email</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Savon d'Art — Maison Artisanale. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;