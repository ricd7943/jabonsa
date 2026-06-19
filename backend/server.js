if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fetch = require('node-fetch');

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🗄 MongoDB conectado'))
  .catch(err => console.log(err));

// ====== MODELO DE COMPRA ======
const CompraSchema = new mongoose.Schema({
  producto: String,
  fecha: { type: Date, default: Date.now }
});
const Compra = mongoose.model('Compra', CompraSchema);

// ====== MODELO DE PRODUCTO ======
const ProductoSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: String,
  emoji: String,
  imagenes: { type: [String], default: [] },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }, // ← NUEVO
  activo: { type: Boolean, default: true }
});
const Producto = mongoose.model('Producto', ProductoSchema);

// ====== MODELO DE CATEGORÍA (NUEVO) ======
const CategoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  emoji: { type: String, default: '📦' },
  palabrasClave: { type: [String], default: [] },
  activo: { type: Boolean, default: true }
});
const Categoria = mongoose.model('Categoria', CategoriaSchema);

// Middleware de admin
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "savon2026";
const verificarAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (auth !== ADMIN_PASSWORD) return res.status(401).json({ mensaje: 'No autorizado' });
  next();
};

// ---- RUTAS PÚBLICAS ----

// Obtener productos (con populate de categoría)
app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).populate('categoria');
    res.json(productos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener productos' });
  }
});

// Obtener categorías (público)
app.get('/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.find({ activo: true });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener categorías' });
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

// ---- SUBIR IMAGEN ----

app.post('/admin/subir-imagen', verificarAdmin, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ mensaje: 'No se recibió imagen' });
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'savon-dart' },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    res.json({ url: resultado.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al subir imagen' });
  }
});

// ---- PAYPAL ----

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID_LIVE;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET_LIVE;
const PAYPAL_API = 'https://api-m.paypal.com';

const getPayPalToken = async () => {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
};

app.post('/paypal/crear-orden', async (req, res) => {
  try {
    const { total } = req.body;
    const token = await getPayPalToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: parseFloat(total).toFixed(2) },
          description: "Savon d'Art - Pedido"
        }]
      })
    });
    const order = await response.json();
    res.json({ id: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al crear orden PayPal' });
  }
});

app.post('/paypal/capturar-orden', async (req, res) => {
  try {
    const { orderID } = req.body;
    const token = await getPayPalToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al capturar pago' });
  }
});

// ---- RUTAS DE ADMIN (PRODUCTOS) ----

app.get('/admin/productos', verificarAdmin, async (req, res) => {
  try {
    const productos = await Producto.find().populate('categoria');
    res.json(productos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error' });
  }
});

app.post('/admin/productos', verificarAdmin, async (req, res) => {
  try {
    // Si se envía categoriaId, lo asignamos; si no, se buscará por palabras clave automáticamente
    const producto = new Producto(req.body);
    await producto.save();
    res.json(producto);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear producto' });
  }
});

app.put('/admin/productos/:id', verificarAdmin, async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('categoria');
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

// ====== RUTAS DE ADMIN (CATEGORÍAS) - NUEVO ======

// Obtener todas las categorías (admin)
app.get('/admin/categorias', verificarAdmin, async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener categorías' });
  }
});

// Crear categoría
app.post('/admin/categorias', verificarAdmin, async (req, res) => {
  try {
    const categoria = new Categoria(req.body);
    await categoria.save();
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear categoría' });
  }
});

// Actualizar categoría
app.put('/admin/categorias/:id', verificarAdmin, async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar categoría' });
  }
});

// Eliminar categoría
app.delete('/admin/categorias/:id', verificarAdmin, async (req, res) => {
  try {
    await Categoria.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar categoría' });
  }
});

// ---- SERVIDOR ----
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend en puerto ${PORT}`));