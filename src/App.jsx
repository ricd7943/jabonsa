import './App.css';
import { useState, useEffect } from 'react';
import Contacto from './Contacto';
import PayPalButton from './PayPalButton';

function useScrollAnimation(deps = []) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, deps);
}

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
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cargando, setCargando] = useState(true);

  useScrollAnimation([productos]);

  const API = "https://jabonsa.onrender.com";
  const HERO_IMG = "https://res.cloudinary.com/df9bqf9tn/image/upload/q_auto/f_auto/v1777407969/WhatsApp_Image_2026-04-26_at_7.44.36_PM_a87lpd.jpg";
  const WHATSAPP = "https://wa.me/593983444105?text=Hola!%20Me%20interesa%20hacer%20un%20pedido%20de%20Sarielle%20Botanics%20🌸";
  const INSTAGRAM = "https://www.instagram.com/sarita_aesthetic_treatments";
  const EMAIL = "mailto:sarayaelnaranjo5@gmail.com";

  const categorias = [
    { id: 'todos', nombre: 'Todos', emoji: '✨', palabrasClave: [] },
    { id: 'rosa', nombre: 'Rosa', emoji: '🌹', palabrasClave: ['rosa', 'rosas', 'rose'] },
    { id: 'uva', nombre: 'Uva', emoji: '🍇', palabrasClave: ['uva', 'uvas', 'grape'] },
    { id: 'floral', nombre: 'Floral', emoji: '🌸', palabrasClave: ['floral', 'jazmin', 'jazmín', 'lavanda', 'flores', 'coco'] },
    { id: 'regalo', nombre: 'Regalo', emoji: '🎁', palabrasClave: ['regalo', 'set', 'kit', 'bandeja', 'pack'] },
  ];

  useEffect(() => {
    const move = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  // Forzar re-render cuando cambia la categoría o búsqueda (SOLUCIÓN PANTALLA BLANCA)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const productosGrid = document.querySelector('.sd-cards');
      if (productosGrid) {
        productosGrid.style.opacity = '0.99';
        setTimeout(() => {
          if (productosGrid) productosGrid.style.opacity = '1';
        }, 10);
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [categoriaActiva, busqueda]);

  // Feedback visual al cambiar de categoría
  useEffect(() => {
    if (categoriaActiva !== 'todos') {
      const catNombre = categorias.find(c => c.id === categoriaActiva)?.nombre;
      const cantidad = productosFiltrados.length;
      setMensaje(`✨ Mostrando ${cantidad} productos de ${catNombre} ✨`);
      setTimeout(() => setMensaje(''), 2000);
    }
  }, [categoriaActiva]);

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
    const precio = parseFloat(i.precio?.replace(/[^0-9.]/g, '') || '0');
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

  const onPagoExitoso = async () => {
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
      setCargando(true);
      const res = await fetch(`${API}/productos`);
      let data = await res.json();
      
      console.log("📦 Productos desde API:", data);
      
      // Asignar categorías según palabras clave
      data = data.map(prod => {
        const nombreLower = (prod.nombre || '').toLowerCase();
        const descLower = (prod.descripcion || '').toLowerCase();
        
        // Buscar en qué categoría cae
        let categoriaAsignada = 'todos';
        
        for (const cat of categorias) {
          if (cat.id === 'todos') continue;
          
          for (const palabra of cat.palabrasClave) {
            if (nombreLower.includes(palabra) || descLower.includes(palabra)) {
              categoriaAsignada = cat.id;
              break;
            }
          }
          if (categoriaAsignada !== 'todos') break;
        }
        
        console.log(`Producto: "${prod.nombre}" → Categoría: ${categoriaAsignada}`);
        
        return { 
          ...prod, 
          categoria: categoriaAsignada,
          emoji: prod.emoji || '🧼',
          descripcion: prod.descripcion || 'Jabón artesanal 100% natural'
        };
      });
      
      setProductos(data);
      console.log("✅ Productos procesados:", data.length);
    } catch (err) { 
      console.error("❌ Error fetchProductos:", err); 
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { 
    fetchCompras(); 
    fetchProductos(); 
  }, []);

  // Filtro de productos por búsqueda y categoría
  const productosFiltrados = productos.filter(p => {
    // Filtro por búsqueda
    const coincideBusqueda = busqueda === '' ||
      (p.nombre && p.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    
    // Filtro por categoría
    let coincideCategoria = true;
    if (categoriaActiva !== 'todos') {
      coincideCategoria = p.categoria === categoriaActiva;
    }
    
    return coincideBusqueda && coincideCategoria;
  });

  console.log(`🔍 Filtro activo: categoría=${categoriaActiva}, productos encontrados=${productosFiltrados.length}`);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (newsletter.includes('@')) { setNewsletterOk(true); setNewsletter(''); }
  };

  const blogPosts = [
    { id: 1, emoji: '🌿', titulo: '5 beneficios de los jabones naturales para tu piel', fecha: 'Abril 2026', desc: 'Descubre por qué los jabones artesanales son superiores a los industriales y cómo transforman el cuidado de tu piel.', tag: 'Bienestar' },
    { id: 2, emoji: '🌹', titulo: 'Rosa mosqueta: el secreto de la piel radiante', fecha: 'Marzo 2026', desc: 'Conoce las propiedades extraordinarias de la rosa mosqueta y cómo nuestros jabones aprovechan todo su potencial.', tag: 'Ingredientes' },
    { id: 3, emoji: '🎁', titulo: 'Ideas de regalo perfectas para bodas y eventos', fecha: 'Marzo 2026', desc: 'Los jabones artesanales son el regalo más original y memorable para bodas, baby showers y eventos corporativos.', tag: 'Regalos' },
  ];

  return (
    <div className="sd-wrap">

      {/* CURSOR */}
      <div className="cursor-custom" style={{ left: cursorPos.x, top: cursorPos.y }}>🌸</div>

      {/* MODAL PRODUCTO */}
      {productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProductoSeleccionado(null)}>✕</button>
            <div className="modal-img-wrap">
              {productoSeleccionado.imagen ? (
                <img src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} className="modal-img" />
              ) : (
                <div className="modal-emoji">{productoSeleccionado.emoji || '🧼'}</div>
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
              <div className="modal-stock">🔥 ¡Solo quedan pocas unidades!</div>
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
          <h2>🛒 Mi Carrito <span className="carrito-count">({totalItems})</span></h2>
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
                  {item.imagen ? <img src={item.imagen} alt={item.nombre} /> : <span style={{ fontSize: '28px' }}>{item.emoji || '🧼'}</span>}
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

      {/* WHATSAPP FLOTANTE */}
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
        <span className="whatsapp-icon">💬</span>
        <span className="whatsapp-texto">Pedir por WhatsApp</span>
      </a>

      {/* TOP BAR */}
      <div className="top-bar">
        <span>🌸 Envío gratis en pedidos sobre $30</span>
        <span>✦</span>
        <span>Jabones botánicos 100% naturales</span>
        <span>✦</span>
        <span>💌 Pedidos especiales por WhatsApp</span>
      </div>

      {/* HEADER */}
      <header className="sd-header">
        <div className="sd-logo">
          <span className="logo-icon">🌿</span>
          <div>
            Sarielle Botanics
            <span>Natural · Artesanal · Premium</span>
          </div>
        </div>
        <div className="header-search">
          <input type="text" placeholder="Buscar productos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
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
      <section className="sd-hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content animate">
          <span className="hero-tag">✦ Colección Exclusiva 2026 ✦</span>
          <h1>Sarielle Botanics<br /><em>La naturaleza en tus manos</em></h1>
          <p>Jabones botánicos artesanales elaborados con ingredientes naturales premium. Una experiencia sensorial única para el cuidado de tu piel.</p>
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
      </section>

      {/* CATEGORÍAS */}
      <section className="categorias-section animate" id="categorias">
        <div className="categorias-grid">
          {categorias.map(cat => (
            <div key={cat.id} className={`categoria-card ${categoriaActiva === cat.id ? 'activa' : ''}`} onClick={() => {
              setCategoriaActiva(cat.id);
              // Scroll suave después de cambiar categoría
              setTimeout(() => {
                const productosSection = document.getElementById('collection');
                if (productosSection) productosSection.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}>
              <div className="categoria-icon">{cat.emoji}</div>
              <h3>Jabones {cat.nombre === 'Todos' ? '' : 'de'} {cat.nombre}</h3>
              <p>{cat.id === 'todos' ? 'Ver todo' : cat.nombre === 'Rosa' ? 'Hidratación profunda' : cat.nombre === 'Uva' ? 'Antioxidante natural' : cat.nombre === 'Floral' ? 'Aroma delicado' : 'Para ocasiones especiales'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="sd-section" id="collection">
        <div className="sd-section-title animate">
          <span className="section-tag">Nuestra Colección</span>
          <h2>Productos Botánicos</h2>
          <div className="sd-divider"></div>
          <p className="section-subtitle">Cada jabón es una obra de arte elaborada con los mejores ingredientes de la naturaleza</p>
        </div>
        <div className="filtros-wrap animate">
          {categorias.map(cat => (
            <button key={cat.id} className={`filtro-btn ${categoriaActiva === cat.id ? 'activo' : ''}`} onClick={() => {
              setCategoriaActiva(cat.id);
              setTimeout(() => {
                const productosSection = document.getElementById('collection');
                if (productosSection) productosSection.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}>
              {cat.emoji} {cat.nombre}
            </button>
          ))}
        </div>
        
        {/* Mostrar productos o mensaje - CORREGIDO CON KEY */}
        {cargando ? (
          <div className="sd-cards" key="cargando">
            <p style={{ textAlign: 'center', color: '#8a7f72', fontSize: '14px', gridColumn: '1/-1', padding: '3rem' }}>
              Cargando productos... 🌸
            </p>
          </div>
        ) : (
          <div className="sd-cards" key={`productos-${categoriaActiva}-${productosFiltrados.length}`}>
            {productosFiltrados.length === 0 ? (
              <div className="no-productos-message">
                <div className="no-productos-emoji">🌸✨🧼</div>
                <h3>Próximamente...</h3>
                <p>
                  {busqueda 
                    ? `No encontramos "${busqueda}" en nuestra colección` 
                    : `✨ Los productos de ${categorias.find(c => c.id === categoriaActiva)?.nombre || 'esta categoría'} están en camino ✨`}
                </p>
                <p className="no-productos-sugerencia">
                  💡 ¿Te interesa algún producto en especial? 
                  <br />
                  <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="no-productos-link">
                    ¡Escríbenos por WhatsApp y lo creamos para ti!
                  </a>
                </p>
                <button 
                  className="btn-outline" 
                  onClick={() => {
                    setCategoriaActiva('todos');
                    setBusqueda('');
                    setTimeout(() => {
                      const productosSection = document.getElementById('collection');
                      if (productosSection) productosSection.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  style={{ marginTop: '1rem' }}
                >
                  ← Ver todos los productos
                </button>
              </div>
            ) : (
              productosFiltrados.map((prod, index) => (
                <div className="sd-card" key={prod._id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="sd-card-img-wrap" onClick={() => setProductoSeleccionado(prod)}>
                    {prod.imagen ? (
                      <img src={prod.imagen} alt={prod.nombre} className="sd-card-img" />
                    ) : (
                      <div className="sd-card-icon">{prod.emoji || '🧼'}</div>
                    )}
                    <div className="sd-card-overlay"><span>Ver detalle</span></div>
                    <div className="sd-card-badge">Botánico</div>
                    {index === 0 && <div className="sd-card-hot">🔥 Más vendido</div>}
                  </div>
                  <div className="sd-card-body">
                    <div className="sd-card-stars">★★★★★ <span className="sd-card-reviews">(24)</span></div>
                    <h3>{prod.nombre}</h3>
                    <p>{prod.descripcion}</p>
                    <div className="sd-card-stock">✓ En stock · Envío inmediato</div>
                    <div className="sd-card-footer">
                      <p className="sd-card-price">{prod.precio}</p>
                      <button className="btn-primary sd-card-btn" onClick={() => agregarAlCarrito(prod)}>+ Carrito</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* BANNER PROMO */}
      <section className="banner-promo animate">
        <div className="banner-promo-content">
          <div>
            <span className="banner-promo-tag">Oferta Especial</span>
            <h2>Sets de Regalo Botánicos</h2>
            <p>Bandejas decoradas con moños dorados y jabones premium — perfectas para bodas, spas y eventos corporativos</p>
            <button className="btn-primary-light" onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}>
              Solicitar Cotización →
            </button>
          </div>
          <div className="banner-promo-deco"><span style={{ fontSize: '80px' }}>🎁</span></div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="sd-section sd-dark" id="esencia">
        <div className="sd-section-title animate">
          <span className="section-tag">¿Por qué elegirnos?</span>
          <h2>Sarielle Botanics — Nuestra Promesa</h2>
          <div className="sd-divider"></div>
        </div>
        <div className="beneficios-grid">
          {[
            { icon: '🌿', titulo: '100% Natural', desc: 'Sin químicos dañinos. Solo ingredientes botánicos seleccionados para el cuidado de tu piel.' },
            { icon: '✋', titulo: 'Hecho a Mano', desc: 'Cada jabón es elaborado artesanalmente con dedicación y amor en cada detalle.' },
            { icon: '💎', titulo: 'Calidad Premium', desc: 'Colecciones exclusivas que convierten cada jabón en una pieza única e irrepetible.' },
            { icon: '🚚', titulo: 'Envío Rápido', desc: 'Enviamos a todo el Ecuador. Gratis en pedidos sobre $30.' },
          ].map((b, i) => (
            <div key={i} className="beneficio-card animate" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="beneficio-icon">{b.icon}</div>
              <h3>{b.titulo}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="sd-section testimonios-section">
        <div className="sd-section-title animate">
          <span className="section-tag">Clientes Felices</span>
          <h2>Lo que dicen nuestros clientes</h2>
          <div className="sd-divider"></div>
        </div>
        <div className="testimonios-grid">
          {[
            { inicial: 'M', nombre: 'María García', ciudad: 'Quito, Ecuador', texto: '"Los jabones son increíbles, el aroma dura todo el día y mi piel se siente suavísima. ¡Los mejores que he probado!"' },
            { inicial: 'A', nombre: 'Andrea López', ciudad: 'Guayaquil, Ecuador', texto: '"Pedí una bandeja de regalo para mi boda y quedó perfecta. Todos los invitados preguntaron dónde los conseguí."' },
            { inicial: 'C', nombre: 'Carlos Mora', ciudad: 'Cuenca, Ecuador', texto: '"Excelente calidad artesanal. Se nota que están hechos con amor y los mejores ingredientes naturales."' },
          ].map((t, i) => (
            <div key={i} className="testimonio-card animate" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="testimonio-stars">★★★★★</div>
              <p>{t.texto}</p>
              <div className="testimonio-autor">
                <div className="testimonio-avatar">{t.inicial}</div>
                <div><strong>{t.nombre}</strong><span>{t.ciudad}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOG */}
      <section className="sd-section blog-section" id="blog">
        <div className="sd-section-title animate">
          <span className="section-tag">Tips & Bienestar</span>
          <h2>Nuestro Blog</h2>
          <div className="sd-divider"></div>
          <p className="section-subtitle">Consejos de bienestar, ingredientes botánicos y más</p>
        </div>
        <div className="blog-grid">
          {blogPosts.map((post, i) => (
            <div className="blog-card animate" key={post.id} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="blog-card-img"><span style={{ fontSize: '48px' }}>{post.emoji}</span></div>
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <span className="blog-tag">{post.tag}</span>
                  <span className="blog-fecha">{post.fecha}</span>
                </div>
                <h3>{post.titulo}</h3>
                <p>{post.desc}</p>
                <button className="blog-leer" onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}>Leer más →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter-section animate">
        <div className="newsletter-content">
          <div className="newsletter-texto">
            <span className="section-tag">¡Únete a nuestra comunidad!</span>
            <h2>Suscríbete al Newsletter</h2>
            <p>Recibe tips de bienestar, descuentos exclusivos y novedades de Sarielle Botanics directamente en tu correo.</p>
          </div>
          {newsletterOk ? (
            <div className="newsletter-ok">
              <span style={{ fontSize: '32px' }}>🎉</span>
              <p>¡Gracias por suscribirte! Pronto recibirás novedades.</p>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input type="email" placeholder="Tu correo electrónico" value={newsletter} onChange={e => setNewsletter(e.target.value)} required />
              <button type="submit" className="btn-primary">Suscribirme →</button>
            </form>
          )}
        </div>
      </section>

      {/* PEDIDOS */}
      <section className="sd-section sd-dark" id="pedidos">
        <div className="sd-section-title animate">
          <span className="section-tag">Historial</span>
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
            <h3>🌿 Sarielle Botanics</h3>
            <p className="footer-tagline">Natural · Artesanal · Premium</p>
            <p className="footer-desc">Jabones botánicos artesanales elaborados con ingredientes naturales premium para el cuidado de tu piel.</p>
            <div className="footer-social">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">📱 WhatsApp</a>
              <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">📸 Instagram</a>
              <a href={EMAIL}>📧 Email</a>
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
            <p>📱 0983444105</p>
            <p>📸 @sarita_aesthetic_treatments</p>
            <p>⏰ Siempre aquí para ti ✨</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Sarielle Botanics. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ en Ecuador</p>
        </div>
      </footer>
    </div>
  );
}

export default App;