import { useState } from 'react';
import Cropper from 'react-easy-crop';
import './Admin.css';

const API = "https://jabonsa.onrender.com";

function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState('');
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [form, setForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    precio: '', 
    emoji: '', 
    imagenes: []
  });
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [vista, setVista] = useState('productos');
  const [subiendo, setSubiendo] = useState(false);

  // Estados para el recorte
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imagenParaRecortar, setImagenParaRecortar] = useState(null);
  const [cropModalAbierto, setCropModalAbierto] = useState(false);

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
    } catch (err) {
      alert('Error conectando al servidor, intenta de nuevo');
      console.error(err);
    }
  };

  const headers = { 'Content-Type': 'application/json', 'Authorization': password };

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

  // Función para crear el recorte
  const createCropImage = async () => {
    if (!imagenParaRecortar || !croppedAreaPixels) return;
    
    setSubiendo(true);
    try {
      const image = new Image();
      image.src = imagenParaRecortar;
      await new Promise(resolve => image.onload = resolve);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const { x, y, width, height } = croppedAreaPixels;
      
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(
        image,
        x,
        y,
        width,
        height,
        0,
        0,
        width,
        height
      );

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
        setCroppedAreaPixels(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
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
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const seleccionarImagenParaRecortar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagenParaRecortar(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropModalAbierto(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

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
      imagenes: form.imagenes || []
    };
    try {
      const url = editando ? `${API}/admin/productos/${editando}` : `${API}/admin/productos`;
      const method = editando ? 'PUT' : 'POST';
      await fetch(url, { method, headers, body: JSON.stringify(dataParaEnviar) });
      setForm({ nombre: '', descripcion: '', precio: '', emoji: '', imagenes: [] });
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
      imagenes: imagenesArray
    });
    setEditando(prod._id);
    setVista('productos');
  };

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
          <button className={vista === 'pedidos' ? 'active' : ''} onClick={() => setVista('pedidos')}>Pedidos</button>
          <button onClick={() => setAutenticado(false)}>Salir</button>
        </nav>
      </header>

      {mensaje && <div className="admin-mensaje">{mensaje}</div>}

      {vista === 'productos' && (
        <div className="admin-content">
          <div className="admin-form">
            <h2>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <input placeholder="Emoji (ej: 🌹)" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} />
            <input placeholder="Nombre del producto" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            <input placeholder="Precio (ej: $12.00 USD)" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} />
            
            <div className="admin-upload">
              <label className="btn-upload">
                {subiendo ? 'Subiendo...' : '📁 Subir imagen desde computador (con recorte)'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={seleccionarImagenParaRecortar}
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
                  setForm({ nombre: '', descripcion: '', precio: '', emoji: '', imagenes: [] }); 
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
                    <span className="admin-item-badge">{p.imagenes?.length || 0} imágenes</span>
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

      {/* ====== MODAL DE RECORTE CON REACT-EASY-CROP (RECORTE LIBRE) ====== */}
      {cropModalAbierto && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-box" onClick={e => e.stopPropagation()}>
            <div className="crop-modal-header">
              <h3>✂️ Recortar imagen</h3>
              <button className="crop-modal-close" onClick={cancelarRecorte}>✕</button>
            </div>
            <div className="crop-modal-body">
              <p className="crop-modal-hint">Arrastra para seleccionar el área que quieres mostrar</p>
              <div className="crop-container">
                {imagenParaRecortar && (
                  <Cropper
                    image={imagenParaRecortar}
                    crop={crop}
                    zoom={zoom}
                    aspect={undefined}  // ← RECORTE LIBRE
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={true}
                    style={{
                      containerStyle: {
                        width: '100%',
                        height: '100%',
                        minHeight: '400px',
                        maxHeight: '60vh',
                        position: 'relative',
                        background: '#e8e0d8'
                      },
                      mediaStyle: {
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }
                    }}
                  />
                )}
              </div>
            </div>
            <div className="crop-modal-footer">
              <button className="btn-cancelar" onClick={cancelarRecorte}>Cancelar</button>
              <button 
                className="btn-guardar" 
                onClick={createCropImage}
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