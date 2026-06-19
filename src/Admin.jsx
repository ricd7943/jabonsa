import { useState, useRef } from 'react';
import './Admin.css';

const API = "https://jabonsa.onrender.com";

function Admin() {
  // ====== ESTADOS GENERALES ======
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState('');
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [vista, setVista] = useState('productos');
  const [subiendo, setSubiendo] = useState(false);

  // ====== ESTADOS PARA PRODUCTOS ======
  const [form, setForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    precio: '', 
    emoji: '', 
    imagenes: [],
    categoria: ''
  });
  const [editando, setEditando] = useState(null);

  // ====== ESTADOS PARA CATEGORÍAS ======
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', emoji: '📦', palabrasClave: '' });
  const [editandoCategoria, setEditandoCategoria] = useState(null);

  // ====== ESTADOS PARA RECORTE ======
  const [imagenParaRecortar, setImagenParaRecortar] = useState(null);
  const [cropModalAbierto, setCropModalAbierto] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const login = async () => {
    if (password.trim() === '') return;
    try {
      const res = await fetch(`${API}/admin/productos`, {
        headers: { 'Authorization': password }
      });
      if (res.status === 401) {
        alert('Contraseña incorrecta');
        return;
      }
      const data = await res.json();
      setProductos(data);
      setAutenticado(true);
      cargarCompras(password);
      cargarCategorias(password); // ← NUEVO
    } catch (err) {
      alert('Error conectando al servidor, intenta de nuevo');
      console.error(err);
    }
  };

  const headers = { 'Content-Type': 'application/json', 'Authorization': password };

  // ====== CARGAR DATOS ======
  const cargarProductos = async (pass) => {
    try {
      const res = await fetch(`${API}/admin/productos`, {
        headers: { 'Authorization': pass || password }
      });
      if (!res.ok) return;
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarCompras = async (pass) => {
    try {
      const res = await fetch(`${API}/admin/compras`, {
        headers: { 'Authorization': pass || password }
      });
      if (!res.ok) return;
      const data = await res.json();
      setCompras(data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarCategorias = async (pass) => {
    try {
      const res = await fetch(`${API}/admin/categorias`, {
        headers: { 'Authorization': pass || password }
      });
      if (!res.ok) return;
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ====== SUBIDA DIRECTA ======
  const subirImagenDirecta = async (archivo) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('imagen', archivo);
      const res = await fetch(`${API}/admin/subir-imagen`, {
        method: 'POST',
        headers: { 'Authorization': password },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setForm(f => ({ ...f, imagenes: [...f.imagenes, data.url] }));
        setMensaje('✅ Imagen subida correctamente');
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (err) {
      setMensaje('❌ Error al subir imagen');
      console.error(err);
    }
    setSubiendo(false);
  };

  // ====== RECORTE CON CANVAS ======
  const abrirModalRecorte = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagenParaRecortar(reader.result);
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
      setCropModalAbierto(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMouseDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDragging(true);
    setStartPos({ x, y });
    setCrop({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const width = x - startPos.x;
    const height = y - startPos.y;
    setCrop({
      x: width > 0 ? startPos.x : x,
      y: height > 0 ? startPos.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const aplicarRecorte = async () => {
    if (!imagenParaRecortar || crop.width < 1 || crop.height < 1) {
      setMensaje('❌ Selecciona un área válida para recortar');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setSubiendo(true);
    try {
      const img = new Image();
      img.src = imagenParaRecortar;
      await new Promise(resolve => img.onload = resolve);

      const imgElement = imgRef.current;
      const containerRect = containerRef.current.getBoundingClientRect();
      const imgRect = imgElement.getBoundingClientRect();
      
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;

      const offsetX = (containerRect.width - imgRect.width) / 2;
      const offsetY = (containerRect.height - imgRect.height) / 2;

      const cropX = ((crop.x / 100) * containerRect.width - offsetX) * scaleX;
      const cropY = ((crop.y / 100) * containerRect.height - offsetY) * scaleY;
      const cropWidth = ((crop.width / 100) * containerRect.width) * scaleX;
      const cropHeight = ((crop.height / 100) * containerRect.height) * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const file = new File([blob], 'crop.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('imagen', file);
      const res = await fetch(`${API}/admin/subir-imagen`, {
        method: 'POST',
        headers: { 'Authorization': password },
        body: formData
      });
      const data = await res.json();

      if (data.url) {
        setForm(f => ({ ...f, imagenes: [...f.imagenes, data.url] }));
        setMensaje('✅ Imagen subida y recortada correctamente');
        setCropModalAbierto(false);
        setImagenParaRecortar(null);
        setCrop({ x: 0, y: 0, width: 0, height: 0 });
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (err) {
      setMensaje('❌ Error al recortar imagen: ' + err.message);
      console.error(err);
    }
    setSubiendo(false);
  };

  const cancelarRecorte = () => {
    setCropModalAbierto(false);
    setImagenParaRecortar(null);
    setCrop({ x: 0, y: 0, width: 0, height: 0 });
    setIsDragging(false);
  };

  // ====== CRUD PRODUCTOS ======
  const eliminarImagen = (index) => {
    setForm(f => ({
      ...f,
      imagenes: f.imagenes.filter((_, i) => i !== index)
    }));
  };

  const guardarProducto = async () => {
    if (!form.nombre || !form.precio) return setMensaje('❌ Nombre y precio son obligatorios');
    const dataParaEnviar = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: form.precio,
      emoji: form.emoji,
      imagenes: form.imagenes || [],
      categoria: form.categoria || null
    };
    try {
      const url = editando ? `${API}/admin/productos/${editando}` : `${API}/admin/productos`;
      const method = editando ? 'PUT' : 'POST';
      await fetch(url, { method, headers, body: JSON.stringify(dataParaEnviar) });
      setForm({ nombre: '', descripcion: '', precio: '', emoji: '', imagenes: [], categoria: '' });
      setEditando(null);
      setMensaje('✅ Producto guardado');
      cargarProductos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) { console.error(err); }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await fetch(`${API}/admin/productos/${id}`, { method: 'DELETE', headers });
      cargarProductos();
      setMensaje('✅ Producto eliminado');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) { console.error(err); }
  };

  const editarProducto = (prod) => {
    let imagenesArray = [];
    if (prod.imagenes && Array.isArray(prod.imagenes)) {
      imagenesArray = prod.imagenes;
    } else if (prod.imagen) {
      imagenesArray = [prod.imagen];
    }
    setForm({
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      precio: prod.precio || '',
      emoji: prod.emoji || '🧼',
      imagenes: imagenesArray,
      categoria: prod.categoria?._id || prod.categoria || ''
    });
    setEditando(prod._id);
    setVista('productos');
  };

  // ====== CRUD CATEGORÍAS ======
  const guardarCategoria = async () => {
    if (!categoriaForm.nombre) return setMensaje('❌ El nombre de la categoría es obligatorio');
    const dataParaEnviar = {
      nombre: categoriaForm.nombre,
      emoji: categoriaForm.emoji || '📦',
      palabrasClave: categoriaForm.palabrasClave ? categoriaForm.palabrasClave.split(',').map(p => p.trim()) : []
    };
    try {
      const url = editandoCategoria ? `${API}/admin/categorias/${editandoCategoria}` : `${API}/admin/categorias`;
      const method = editandoCategoria ? 'PUT' : 'POST';
      await fetch(url, { method, headers, body: JSON.stringify(dataParaEnviar) });
      setCategoriaForm({ nombre: '', emoji: '📦', palabrasClave: '' });
      setEditandoCategoria(null);
      setMensaje('✅ Categoría guardada');
      cargarCategorias();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) { console.error(err); }
  };

  const eliminarCategoria = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return;
    try {
      await fetch(`${API}/admin/categorias/${id}`, { method: 'DELETE', headers });
      cargarCategorias();
      setMensaje('✅ Categoría eliminada');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) { console.error(err); }
  };

  const editarCategoria = (cat) => {
    setCategoriaForm({
      nombre: cat.nombre || '',
      emoji: cat.emoji || '📦',
      palabrasClave: cat.palabrasClave ? cat.palabrasClave.join(', ') : ''
    });
    setEditandoCategoria(cat._id);
    setVista('categorias');
  };

  // ====== RENDER ======
  if (!autenticado) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1>Savon d'Art</h1>
          <p>Panel de Administración</p>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          <button onClick={login}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="admin-logo">Savon d'Art <span>Admin</span></div>
        <nav>
          <button className={vista === 'productos' ? 'active' : ''} onClick={() => setVista('productos')}>Productos</button>
          <button className={vista === 'categorias' ? 'active' : ''} onClick={() => setVista('categorias')}>Categorías</button>
          <button className={vista === 'pedidos' ? 'active' : ''} onClick={() => setVista('pedidos')}>Pedidos</button>
          <button onClick={() => setAutenticado(false)}>Salir</button>
        </nav>
      </header>

      {mensaje && <div className="admin-mensaje">{mensaje}</div>}

      {/* ====== VISTA PRODUCTOS ====== */}
      {vista === 'productos' && (
        <div className="admin-content">
          <div className="admin-form">
            <h2>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <input placeholder="Emoji (ej: 🌹)" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} />
            <input placeholder="Nombre del producto" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            <input placeholder="Precio (ej: $12.00 USD)" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} />
            
            {/* ====== SELECTOR DE CATEGORÍA ====== */}
            <select 
              value={form.categoria} 
              onChange={e => setForm({ ...form, categoria: e.target.value })}
              style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '0.5px solid #d4c9b8', background: '#faf9f7' }}
            >
              <option value="">Sin categoría</option>
              {categorias.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.emoji} {cat.nombre}</option>
              ))}
            </select>

            <div className="admin-upload">
              <label className="btn-upload" style={{ marginBottom: '0.5rem' }}>
                {subiendo ? 'Subiendo...' : '📁 Subir imagen sin recortar'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && subirImagenDirecta(e.target.files[0])}
                  disabled={subiendo}
                />
              </label>
              <label className="btn-upload btn-recortar">
                {subiendo ? 'Subiendo...' : '✂️ Subir imagen con recorte'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={abrirModalRecorte}
                  disabled={subiendo}
                />
              </label>
            </div>

            {form.imagenes.length > 0 && (
              <div className="admin-imagenes-preview">
                {form.imagenes.map((url, index) => (
                  <div key={index} className="admin-imagen-preview-item">
                    <img src={url} alt={`Imagen ${index + 1}`} />
                    <button type="button" className="btn-eliminar-imagen" onClick={() => eliminarImagen(index)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-form-btns">
              <button className="btn-guardar" onClick={guardarProducto}>
                {editando ? 'Actualizar' : 'Agregar Producto'}
              </button>
              {editando && (
                <button className="btn-cancelar" onClick={() => { 
                  setEditando(null); 
                  setForm({ nombre: '', descripcion: '', precio: '', emoji: '', imagenes: [], categoria: '' }); 
                }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="admin-lista">
            <h2>Productos ({productos.length})</h2>
            {productos.length === 0 ? (
              <p>No hay productos aún.</p>
            ) : (
              productos.map(p => (
                <div className="admin-item" key={p._id}>
                  {p.imagenes && p.imagenes.length > 0 ? (
                    <img src={p.imagenes[0]} alt={p.nombre} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <span className="admin-item-emoji">{p.emoji}</span>
                  )}
                  <div className="admin-item-info">
                    <strong>{p.nombre}</strong>
                    <span>{p.descripcion}</span>
                    <span>{p.precio}</span>
                    <span className="admin-item-badge">
                      {p.categoria ? `${p.categoria.emoji || '📦'} ${p.categoria.nombre}` : 'Sin categoría'}
                    </span>
                  </div>
                  <div className="admin-item-btns">
                    <button onClick={() => editarProducto(p)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => eliminarProducto(p._id)}>Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ====== VISTA CATEGORÍAS ====== */}
      {vista === 'categorias' && (
        <div className="admin-content">
          <div className="admin-form">
            <h2>{editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <input 
              placeholder="Nombre (ej: Jabones)" 
              value={categoriaForm.nombre} 
              onChange={e => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })} 
            />
            <input 
              placeholder="Emoji (ej: 🧼)" 
              value={categoriaForm.emoji} 
              onChange={e => setCategoriaForm({ ...categoriaForm, emoji: e.target.value })} 
            />
            <input 
              placeholder="Palabras clave (separadas por comas, ej: jabon, jabón)" 
              value={categoriaForm.palabrasClave} 
              onChange={e => setCategoriaForm({ ...categoriaForm, palabrasClave: e.target.value })} 
            />
            <div className="admin-form-btns">
              <button className="btn-guardar" onClick={guardarCategoria}>
                {editandoCategoria ? 'Actualizar' : 'Agregar Categoría'}
              </button>
              {editandoCategoria && (
                <button className="btn-cancelar" onClick={() => { 
                  setEditandoCategoria(null); 
                  setCategoriaForm({ nombre: '', emoji: '📦', palabrasClave: '' }); 
                }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="admin-lista">
            <h2>Categorías ({categorias.length})</h2>
            {categorias.length === 0 ? (
              <p>No hay categorías aún. ¡Crea la primera!</p>
            ) : (
              categorias.map(cat => (
                <div className="admin-item" key={cat._id}>
                  <span style={{ fontSize: '24px', marginRight: '0.5rem' }}>{cat.emoji || '📦'}</span>
                  <div className="admin-item-info">
                    <strong>{cat.nombre}</strong>
                    <span>Palabras clave: {cat.palabrasClave?.join(', ') || 'Ninguna'}</span>
                  </div>
                  <div className="admin-item-btns">
                    <button onClick={() => editarCategoria(cat)}>Editar</button>
                    <button className="btn-eliminar" onClick={() => eliminarCategoria(cat._id)}>Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ====== VISTA PEDIDOS ====== */}
      {vista === 'pedidos' && (
        <div className="admin-content">
          <h2>Pedidos recibidos ({compras.length})</h2>
          <div className="admin-lista">
            {compras.length === 0 ? (
              <p>No hay pedidos aún.</p>
            ) : (
              compras.map(c => (
                <div className="admin-item" key={c._id}>
                  <div className="admin-item-info">
                    <strong>{c.producto}</strong>
                    <span>{new Date(c.fecha).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ====== MODAL DE RECORTE ====== */}
      {cropModalAbierto && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-box" onClick={e => e.stopPropagation()}>
            <div className="crop-modal-header">
              <h3>✂️ Recortar imagen</h3>
              <button className="crop-modal-close" onClick={cancelarRecorte}>✕</button>
            </div>
            <div className="crop-modal-body">
              <p className="crop-modal-hint">Haz clic y arrastra para seleccionar el área</p>
              <div className="crop-container" ref={containerRef}>
                {imagenParaRecortar && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxHeight: '60vh',
                      overflow: 'hidden',
                      cursor: 'crosshair',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: '#1a1a1a',
                      minHeight: '400px'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      ref={imgRef}
                      src={imagenParaRecortar}
                      alt="Recortar"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '60vh',
                        objectFit: 'contain',
                        display: 'block',
                        userSelect: 'none'
                      }}
                      draggable={false}
                    />
                    {crop.width > 0 && crop.height > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${crop.x}%`,
                          top: `${crop.y}%`,
                          width: `${crop.width}%`,
                          height: `${crop.height}%`,
                          border: '2px solid #c97a8a',
                          backgroundColor: 'rgba(201,122,138,0.2)',
                          pointerEvents: 'none',
                          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="crop-modal-footer">
              <button className="btn-cancelar" onClick={cancelarRecorte}>Cancelar</button>
              <button 
                className="btn-guardar" 
                onClick={aplicarRecorte}
                disabled={subiendo}
              >
                {subiendo ? 'Subiendo...' : '✅ Subir imagen recortada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;