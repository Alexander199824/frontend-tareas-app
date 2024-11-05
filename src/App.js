import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ProyectoForm from './components/proyectoftorm'; // Asegúrate de que la ruta es correcta

const stripePromise = loadStripe('pk_test_51Q9AMkB3EtWqqOZ2sr4dExyPgtFOgL7UBEAVEiuUbKdBFaNQSCivO5lTntoXL7DO6vxSjlRio5frb1MrqtztSg68007Hlq6at0'); // Reemplaza con tu clave pública

function App() {
  return (
    <Elements stripe={stripePromise}>
      <ProyectoForm />
    </Elements>
  );
}

export default App;
