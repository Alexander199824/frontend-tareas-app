import React, { Suspense } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51Q9AMkB3EtWqqOZ2sr4dExyPgtFOgL7UBEAVEiuUbKdBFaNQSCivO5lTntoXL7DO6vxSjlRio5frb1MrqtztSg68007Hlq6at0'); // Reemplaza con tu clave pública

const ProyectoForm = React.lazy(() => import('./components/proyectoftorm')); // Carga diferida del formulario

function App() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <Elements stripe={stripePromise}>
        <ProyectoForm />
      </Elements>
    </Suspense>
  );
}

export default App;
