if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🗄 MongoDB conectado'))
  .catch(err => console.log(err));

// Modelo de compra
const CompraSchema = new mongoose.Schema({
  producto: String,
  fecha: { type: Date, default: Date.now }
});
const Compra = mongoose.model('Compra', CompraSchema);

// Modelo de producto
const ProductoSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: String,
  emoji: String,
  activo: { type: Boolean, default: true }
});
const Producto = mongoose.model('Producto', ProductoSchema);

// Middleware de admin
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "savon2026";
const verificarAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (auth !== ADMIN_PASSWORD) return res.status(401).json({ mensaje: 'No autorizado' });
  next();
};

// ---- RUTAS PÚBLICAS ----

app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener productos' });
  }
});

app.post('/comprar', async (req, res) => {
  const { producto } = req.body;
  try {
    const compra = new Compra({ producto });
    await compra.save();
    res.json({ mensaje: 'Compra guardada correctamente', producto });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al guardar la compra' });
  }
});

app.get('/compras', async (req, res) => {
  try {
    const compras = await Compra.find().sort({ fecha: -1 });
    res.json(compras);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener las compras' });
  }
});

// ---- RUTAS DE ADMIN ----

app.get('/admin/productos', verificarAdmin, async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});

app.post('/admin/productos', verificarAdmin, async (req, res) => {
  try {
    const producto = new Producto(req.body);
    await producto.save();
    res.json(producto);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear producto' });
  }
});

app.put('/admin/productos/:id', verificarAdmin, async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar producto' });
  }
});

app.delete('/admin/productos/:id', verificarAdmin, async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar producto' });
  }
});

app.get('/admin/compras', verificarAdmin, async (req, res) => {
  try {
    const compras = await Compra.find().sort({ fecha: -1 });
    res.json(compras);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});

// Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend en puerto ${PORT}`));