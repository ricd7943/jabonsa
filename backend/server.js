require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('🗄 MongoDB conectado'))
  .catch(err => console.log(err));

// Modelo de compra
const CompraSchema = new mongoose.Schema({
  producto: String,
  fecha: { type: Date, default: Date.now }
});

const Compra = mongoose.model('Compra', CompraSchema);

// Ruta POST /comprar
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

// Ruta GET /compras para listar todas
app.get('/compras', async (req, res) => {
  try {
    const compras = await Compra.find().sort({ fecha: -1 }); // más recientes primero
    res.json(compras);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener las compras' });
  }
});

// Servidor
app.listen(3000, () => console.log('🚀 Backend en http://localhost:3000'));