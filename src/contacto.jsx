import { useState } from 'react';
import emailjs from '@emailjs/browser';
import './Contacto.css';

const SERVICE_ID = 'service_vtd6pr7';
const TEMPLATE_ID = 'template_r8prc5m';
const PUBLIC_KEY = 'xOGgrb9-0mnsvUWgSNIkJ';

function Contacto() {
  const [form, setForm] = useState({ from_name: '', from_email: '', phone: '', message: '' });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const enviar = async () => {
    if (!form.from_name || !form.from_email || !form.message) {
      setMensaje('❌ Nombre, email y mensaje son obligatorios');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }
    setEnviando(true);
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY);
      setMensaje('✅ Mensaje enviado correctamente');
      setForm({ from_name: '', from_email: '', phone: '', message: '' });
    } catch (err) {
      setMensaje('❌ Error al enviar, intenta de nuevo');
      console.error(err);
    }
    setEnviando(false);
    setTimeout(() => setMensaje(''), 4000);
  };

  return (
    <section className="sd-section" id="contacto">
      <div className="sd-section-title">
        <p>Contactez-nous</p>
        <h2>Contáctenos</h2>
        <div className="sd-divider"></div>
      </div>
      <div className="contacto-form">
        <input
          placeholder="Nombre completo *"
          value={form.from_name}
          onChange={e => setForm({ ...form, from_name: e.target.value })}
        />
        <input
          placeholder="Correo electrónico *"
          type="email"
          value={form.from_email}
          onChange={e => setForm({ ...form, from_email: e.target.value })}
        />
        <input
          placeholder="Teléfono (opcional)"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
        <textarea
          placeholder="Mensaje *"
          rows="5"
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
        />
        {mensaje && <p className="contacto-mensaje">{mensaje}</p>}
        <button className="sd-btn" onClick={enviar} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </div>
    </section>
  );
}

export default Contacto;