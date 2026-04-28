import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const CLIENT_ID = "Ab19yvkLv-4wloKedfocQDk6w_yg39fjBRIQQD3bawA8OWOHEnU8j8mWcxazYJSNln1vcKh6JcPjx01a";

function PayPalButton({ total, onSuccess }) {
  return (
    <PayPalScriptProvider options={{ "client-id": CLIENT_ID, currency: "USD" }}>
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", color: "black" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: total.toFixed(2),
                currency_code: "USD"
              },
              description: "Savon d'Art - Pedido"
            }]
          });
        }}
        onApprove={(data, actions) => {
          return actions.order.capture().then((details) => {
            onSuccess(details);
          });
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