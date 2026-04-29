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
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [newsletter, setNewsletter] = useState('');
  const [newsletterOk, setNewsletterOk] = useState(false);

  const API = "https://jabonsa.onrender.com";

  const categorias = [
    { id: 'todos', nombre: 'Todos', emoji: '✨' },
    { id: 'rosa', nombre: 'Rosa', emoji: '🌹' },
    { id: 'uva', nombre: 'Uva', emoji: '🍇' },
    { id: 'floral', nombre: 'Floral', emoji: '🌸' },
    { id: 'regalo', nombre: 'Regalo', emoji: '🎁' },
  ];

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

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === 'todos' ||
      p.nombre.toLowerCase().includes(categoriaActiva) ||
      p.descripcion.toLowerCase().includes(categoriaActiva);
    return coincideBusqueda && coincideCategoria;
  });

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (newsletter.includes('@')) {
      setNewsletterOk(true);
      setNewsletter('');
    }
  };

  const blogPosts = [
    { id: 1, emoji: '🌿', titulo: '5 beneficios de los jabones naturales para tu piel', fecha: 'Abril 2026', desc: 'Descubre por qué los jabones artesanales son superiores a los industriales y cómo transforman el cuidado de tu piel.', tag: 'Bienestar' },
    { id: 2, emoji: '🌹', titulo: 'Rosa mosqueta: el secreto de la piel radiante', fecha: 'Marzo 2026', desc: 'Conoce las propiedades extraordinarias de la rosa mosqueta y cómo nuestros jabones aprovechan todo su potencial.', tag: 'Ingredientes' },
    { id: 3, emoji: '🎁', titulo: 'Ideas de regalo perfectas para bodas y eventos', fecha: 'Marzo 2026', desc: 'Los jabones artesanales son el regalo más original y memorable para bodas, baby showers y eventos corporativos.', tag: 'Regalos' },
  ];

  return (
    <div className="sd-wrap">

      {/* MODAL PRODUCTO */}
      {productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProductoSeleccionado(null)}>✕</button>
            <div className="modal-img-wrap">
              {productoSeleccionado.imagen ? (
                <img src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} className="modal-img" />
              ) : (
                <div className="modal-emoji">{productoSeleccionado.emoji}</div>
              )}
            </div>
            <div className="modal-info">
              <span className="modal-tag">Artesanal · Natural</span>
              <h2>{productoSeleccionado.nombre}</h2>
              <div className="modal-stars">★★★★★</div>
              <p className="modal-desc">{productoSeleccionado.descripcion}</p>
              <div className="modal-badges">
                <span>🌿 100% Natural</span>
                <span>✋ Hecho a mano</span>
                <span>💎 Premium</span>
              </div>
              <p className="modal-precio">{productoSeleccionado.precio}</p>
              <button className="btn-primary modal-btn" onClick={() => { agregarAlCarrito(productoSeleccionado); setProductoSeleccionado(null); }}>
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO */}
      {carritoAbierto && <div className="carrito-overlay" onClick={() => { setCarritoAbierto(false); setPagando(false); }} />}
      <div className={`carrito-panel ${carritoAbierto ? 'abierto' : ''}`}>
        <div className="carrito-header">
          <h2>🛒 Mon Panier <span className="carrito-count">({totalItems})</span></h2>
          <button onClick={() => { setCarritoAbierto(false); setPagando(false); }}>✕</button>
        </div>
        {carrito.length === 0 ? (
          <div className="carrito-vacio">
            <div style={{ fontSize: '48px', opacity: 0.2 }}>🛒</div>
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
                <button className="btn-primary carrito-confirmar" onClick={() => setPagando(true)}>
                  Proceder al Pago →
                </button>
              ) : (
                <div className="paypal-wrap">
                  <p className="paypal-label">🔒 PAGO SEGURO CON PAYPAL</p>
                  <PayPalButton total={totalCarrito} onSuccess={onPagoExitoso} />
                  <button className="btn-outline" onClick={() => setPagando(false)}>← Volver al carrito</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* TOP BAR */}
      <div className="top-bar">
        <span>🌸 Envío gratis en pedidos sobre $30</span>
        <span>✦</span>
        <span>Jabones artesanales 100% naturales</span>
        <span>✦</span>
        <span>💌 Pedidos especiales por WhatsApp</span>
      </div>

      {/* HEADER */}
      <header className="sd-header">
        <div className="sd-logo">
          <span className="logo-icon">🌸</span>
          <div>
            Savon d'Art
            <span>Maison Artisanale</span>
          </div>
        </div>
        <div className="header-search">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <nav className="sd-nav">
          <a href="#collection">Tienda</a>
          <a href="#categorias">Categorías</a>
          <a href="#blog">Blog</a>
          <a href="#contacto">Contacto</a>
          <button className="carrito-btn" onClick={() => setCarritoAbierto(true)}>
            🛒 {totalItems > 0 && <span className="carrito-badge">{totalItems}</span>}
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="sd-hero">
        <div className="hero-content">
          <span className="hero-tag">✦ Colección Exclusiva 2026 ✦</span>
          <h1>Jabones Artesanales<br /><em>de Lujo Natural</em></h1>
          <p>Elaborados a mano con ingredientes naturales premium. Cuida tu piel con lo mejor de la naturaleza.</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => document.getElementById('collection').scrollIntoView({ behavior: 'smooth' })}>
              Ver Colección →
            </button>
            <button className="btn-outline-light" onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}>
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
        <div className="hero-img-wrap">
          <div className="hero-img-circle">
            <span style={{ fontSize: '120px' }}>🌸</span>
          </div>
          <div className="hero-badge-1">🌿 Natural</div>
          <div className="hero-badge-2">✋ Artesanal</div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="categorias-section" id="categorias">
        <div className="categorias-grid">
          <div className="categoria-card" onClick={() => setCategoriaActiva('todos')}>
            <div className="categoria-icon">✨</div>
            <h3>Todos</h3>
            <p>Ver todo</p>
          </div>
          <div className="categoria-card" onClick={() => setCategoriaActiva('rosa')}>
            <div className="categoria-icon">🌹</div>
            <h3>Jabones de Rosa</h3>
            <p>Hidratación profunda</p>
          </div>
          <div className="categoria-card" onClick={() => setCategoriaActiva('uva')}>
            <div className="categoria-icon">🍇</div>
            <h3>Jabones de Uva</h3>
            <p>Antioxidante natural</p>
          </div>
          <div className="categoria-card" onClick={() => setCategoriaActiva('floral')}>
            <div className="categoria-icon">🌸</div>
            <h3>Jabones Florales</h3>
            <p>Aroma delicado</p>
          </div>
          <div className="categoria-card" onClick={() => setCategoriaActiva('regalo')}>
            <div className="categoria-icon">🎁</div>
            <h3>Sets de Regalo</h3>
            <p>Para ocasiones especiales</p>
          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="sd-section" id="collection">
        <div className="sd-section-title">
          <span className="section-tag">Notre Collection</span>
          <h2>Nuestros Productos</h2>
          <div className="sd-divider"></div>
          <p className="section-subtitle">Cada jabón es una obra de arte elaborada con los mejores ingredientes naturales</p>
        </div>

        {/* FILTROS */}
        <div className="filtros-wrap">
          {categorias.map(cat => (
            <button
              key={cat.id}
              className={`filtro-btn ${categoriaActiva === cat.id ? 'activo' : ''}`}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              {cat.emoji} {cat.nombre}
            </button>
          ))}
        </div>

        <div className="sd-cards">
          {productosFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8a7f72', fontSize: '14px', gridColumn: '1/-1', padding: '3rem' }}>
              {busqueda ? 'No se encontraron productos' : 'Cargando productos...'}
            </p>
          ) : (
            productosFiltrados.map(prod => (
              <div className="sd-card" key={prod._id}>
                <div className="sd-card-img-wrap" onClick={() => setProductoSeleccionado(prod)}>
                  {prod.imagen ? (
                    <img src={prod.imagen} alt={prod.nombre} className="sd-card-img" />
                  ) : (
                    <div className="sd-card-icon">{prod.emoji}</div>
                  )}
                  <div className="sd-card-overlay"><span>Ver detalle</span></div>
                  <div className="sd-card-badge">Natural</div>
                </div>
                <div className="sd-card-body">
                  <div className="sd-card-stars">★★★★★</div>
                  <h3>{prod.nombre}</h3>
                  <p>{prod.descripcion}</p>
                  <div className="sd-card-footer">
                    <p className="sd-card-price">{prod.precio}</p>
                    <button className="btn-primary sd-card-btn" onClick={() => agregarAlCarrito(prod)}>
                      + Carrito
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* BANNER PROMO */}
      <section className="banner-promo">
        <div className="banner-promo-content">
          <div>
            <span className="banner-promo-tag">Oferta Especial</span>
            <h2>Sets de Regalo Artesanales</h2>
            <p>Bandejas decoradas con moños dorados y jabones premium — perfectas para bodas, spas y eventos corporativos</p>
            <button className="btn-primary-light" onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}>
              Solicitar Cotización →
            </button>
          </div>
          <div className="banner-promo-deco">
            <span style={{ fontSize: '80px' }}>🎁</span>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="sd-section sd-dark" id="esencia">
        <div className="sd-section-title">
          <span className="section-tag">¿Por qué elegirnos?</span>
          <h2>Savon d'Art — Nuestra Promesa</h2>
          <div className="sd-divider"></div>
        </div>
        <div className="beneficios-grid">
          <div className="beneficio-card">
            <div className="beneficio-icon">🌿</div>
            <h3>100% Natural</h3>
            <p>Sin químicos dañinos. Solo ingredientes naturales seleccionados para el cuidado de tu piel.</p>
          </div>
          <div className="beneficio-card">
            <div className="beneficio-icon">✋</div>
            <h3>Hecho a Mano</h3>
            <p>Cada jabón es elaborado artesanalmente con dedicación y amor en cada detalle.</p>
          </div>
          <div className="beneficio-card">
            <div className="beneficio-icon">💎</div>
            <h3>Calidad Premium</h3>
            <p>Colecciones exclusivas que convierten cada jabón en una pieza única e irrepetible.</p>
          </div>
          <div className="beneficio-card">
            <div className="beneficio-icon">🚚</div>
            <h3>Envío Rápido</h3>
            <p>Enviamos a todo el Ecuador. Gratis en pedidos sobre $30.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="sd-section testimonios-section">
        <div className="sd-section-title">
          <span className="section-tag">Clientes Felices</span>
          <h2>Lo que dicen nuestros clientes</h2>
          <div className="sd-divider"></div>
        </div>
        <div className="testimonios-grid">
          <div className="testimonio-card">
            <div className="testimonio-stars">★★★★★</div>
            <p>"Los jabones son increíbles, el aroma dura todo el día y mi piel se siente suavísima. ¡Los mejores que he probado!"</p>
            <div className="testimonio-autor">
              <div className="testimonio-avatar">M</div>
              <div><strong>María García</strong><span>Quito, Ecuador</span></div>
            </div>
          </div>
          <div className="testimonio-card">
            <div className="testimonio-stars">★★★★★</div>
            <p>"Pedí una bandeja de regalo para mi boda y quedó perfecta. Todos los invitados preguntaron dónde los conseguí."</p>
            <div className="testimonio-autor">
              <div className="testimonio-avatar">A</div>
              <div><strong>Andrea López</strong><span>Guayaquil, Ecuador</span></div>
            </div>
          </div>
          <div className="testimonio-card">
            <div className="testimonio-stars">★★★★★</div>
            <p>"Excelente calidad artesanal. Se nota que están hechos con amor y los mejores ingredientes naturales."</p>
            <div className="testimonio-autor">
              <div className="testimonio-avatar">C</div>
              <div><strong>Carlos Mora</strong><span>Cuenca, Ecuador</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="sd-section blog-section" id="blog">
        <div className="sd-section-title">
          <span className="section-tag">Tips & Bienestar</span>
          <h2>Nuestro Blog</h2>
          <div className="sd-divider"></div>
          <p className="section-subtitle">Consejos de bienestar, ingredientes naturales y más</p>
        </div>
        <div className="blog-grid">
          {blogPosts.map(post => (
            <div className="blog-card" key={post.id}>
              <div className="blog-card-img">
                <span style={{ fontSize: '48px' }}>{post.emoji}</span>
              </div>
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <span className="blog-tag">{post.tag}</span>
                  <span className="blog-fecha">{post.fecha}</span>
                </div>
                <h3>{post.titulo}</h3>
                <p>{post.desc}</p>
                <button className="blog-leer" onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}>
                  Leer más →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <div className="newsletter-texto">
            <span className="section-tag">¡Únete a nuestra comunidad!</span>
            <h2>Suscríbete al Newsletter</h2>
            <p>Recibe tips de bienestar, descuentos exclusivos y novedades de Savon d'Art directamente en tu correo.</p>
          </div>
          {newsletterOk ? (
            <div className="newsletter-ok">
              <span style={{ fontSize: '32px' }}>🎉</span>
              <p>¡Gracias por suscribirte! Pronto recibirás novedades.</p>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={newsletter}
                onChange={e => setNewsletter(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">Suscribirme →</button>
            </form>
          )}
        </div>
      </section>

      {/* PEDIDOS */}
      <section className="sd-section sd-dark" id="pedidos">
        <div className="sd-section-title">
          <span className="section-tag">Historique</span>
          <h2>Últimos Pedidos</h2>
          <div className="sd-divider"></div>
        </div>
        {compras.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8a7f72', fontSize: '14px' }}>No hay pedidos aún.</p>
        ) : (
          <ul className="sd-pedidos">
            {compras.slice(0, 8).map(c => (
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
        <div className="footer-top">
          <div className="footer-marca">
            <h3>🌸 Savon d'Art</h3>
            <p className="footer-tagline">Maison Artisanale</p>
            <p className="footer-desc">Jabones artesanales de lujo elaborados con ingredientes naturales premium para el cuidado de tu piel.</p>
            <div className="footer-social">
              <a href="#contacto">📱 WhatsApp</a>
              <a href="#contacto">📸 Instagram</a>
              <a href="#contacto">📧 Email</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Tienda</h4>
            <a href="#collection">Todos los productos</a>
            <a href="#categorias">Categorías</a>
            <a href="#pedidos">Mis pedidos</a>
            <a href="#contacto">Pedidos especiales</a>
          </div>
          <div className="footer-col">
            <h4>Información</h4>
            <a href="#esencia">Sobre nosotros</a>
            <a href="#blog">Blog</a>
            <a href="#esencia">Ingredientes</a>
            <a href="#contacto">Envíos y devoluciones</a>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <p>📍 Ecuador</p>
            <p>📱 WhatsApp disponible</p>
            <p>📸 @savondart</p>
            <p>⏰ Lun-Sáb 9am-6pm</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Savon d'Art — Maison Artisanale. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ en Ecuador</p>
        </div>
      </footer>
    </div>
  );
}

export default App;