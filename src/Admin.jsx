import { useState, useEffect } from 'react';
import './Admin.css';

const API = "https://jabonsa.onrender.com";

function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState('');
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', emoji: '' });
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [vista, setVista] = useState('productos');

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
  const guardarProducto = async () => {
    if (!form.nombre || !form.precio) return setMensaje('❌ Nombre y precio son obligatorios');
    try {
      const url = editando ? `${API}/admin/productos/${editando}` : `${API}/admin/productos`;
      const method = editando ? 'PUT' : 'POST';
      await fetch(url, { method, headers, body: JSON.stringify(form) });
      setForm({ nombre: '', descripcion: '', precio: '', emoji: '' });
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
    setForm({ nombre: prod.nombre, descripcion: prod.descripcion, precio: prod.precio, emoji: prod.emoji });
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
            <div className="admin-form-btns">
              <button className="btn-guardar" onClick={guardarProducto}>{editando ? 'Actualizar' : 'Agregar Producto'}</button>
              {editando && <button className="btn-cancelar" onClick={() => { setEditando(null); setForm({ nombre: '', descripcion: '', precio: '', emoji: '' }); }}>Cancelar</button>}
            </div>
          </div>

          <div className="admin-lista">
            <h2>Productos ({productos.length})</h2>
            {productos.length === 0 ? <p>No hay productos aún.</p> : productos.map(p => (
              <div className="admin-item" key={p._id}>
                <span className="admin-item-emoji">{p.emoji}</span>
                <div className="admin-item-info">
                  <strong>{p.nombre}</strong>
                  <span>{p.descripcion}</span>
                  <span>{p.precio}</span>
                </div>
                <div className="admin-item-btns">
                  <button onClick={() => editarProducto(p)}>Editar</button>
                  <button className="btn-eliminar" onClick={() => eliminarProducto(p._id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === 'pedidos' && (
        <div className="admin-content">
          <h2>Pedidos recibidos ({compras.length})</h2>
          <div className="admin-lista">
            {compras.map(c => (
              <div className="admin-item" key={c._id}>
                <div className="admin-item-info">
                  <strong>{c.producto}</strong>
                  <span>{new Date(c.fecha).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;