import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const CLIENT_ID = "AZ3xXQaRn9qEJMfnNLY1cWsDlbykALVRWqBl0wSzyWFnFh7I57lj97g2j-2yQt6Owyk1OhwU9mszLdM8";
const API = "https://jabonsa.onrender.com";

function PayPalButton({ total, onSuccess }) {
  return (
    <PayPalScriptProvider options={{ "client-id": CLIENT_ID, currency: "USD" }}>
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", color: "black" }}
        createOrder={async () => {
          const res = await fetch(`${API}/paypal/crear-orden`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total })
          });
          const data = await res.json();
          return data.id;
        }}
        onApprove={async (data) => {
          const res = await fetch(`${API}/paypal/capturar-orden`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID })
          });
          const details = await res.json();
          onSuccess(details);
        }}
        onError={(err) => {
          console.error("PayPal error:", err);
          alert("Error al procesar el pago, intenta de nuevo");
        }}
      />
    </PayPalScriptProvider>
  );
}

export default PayPalButton;