import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Input, Select, Checkbox, notification } from 'antd';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import '../css/proyecto.css';

const stripePromise = loadStripe('pk_test_51Q9AMkB3EtWqqOZ2sr4dExyPgtFOgL7UBEAVEiuUbKdBFaNQSCivO5lTntoXL7DO6vxSjlRio5frb1MrqtztSg68007Hlq6at0'); // Reemplaza con tu clave pública

const { Option } = Select;

const api = axios.create({
  baseURL: 'https://tareas-api-gm7z.onrender.com/api/proyectos',
});

const ProyectoForm = () => {
  const [proyectos, setProyectos] = useState([]);
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [formValues, setFormValues] = useState({
    titulo: '',
    descripcion: '',
    costo: '',
    fechaCreacion: new Date().toISOString().split('T')[0], // Fecha de creación asignada automáticamente
    fechaVencimiento: '', // Fecha de vencimiento seleccionable
    prioridad: 'media',
    asignadoA: '',
    categoria: '',
    completada: false,
    pagado: false,
    metodoPago: 'stripe',
  });
  const [editingProyecto, setEditingProyecto] = useState(null);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    fetchProyectos();
  }, []);

  const fetchProyectos = async () => {
    try {
      const response = await api.get('/');
      setProyectos(response.data);
    } catch (error) {
      notification.error({ message: 'Error al obtener los proyectos' });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formValues.titulo || !formValues.costo) {
        notification.warning({ message: 'Completa los campos obligatorios' });
        return;
      }

      let paymentMethodId = null;

      if (formValues.metodoPago === 'stripe') {
        paymentMethodId = await handleStripePayment();
        if (!paymentMethodId) return;
        formValues.pagado = true;
      }

      if (editingProyecto) {
        await api.put(`/${editingProyecto.id}`, {
          ...formValues,
          costo_proyecto: parseFloat(formValues.costo),
          paymentMethodId,
        });
        notification.success({ message: 'Proyecto actualizado con éxito' });
      } else {
        await api.post('/', {
          ...formValues,
          costo_proyecto: parseFloat(formValues.costo),
          paymentMethodId,
        });
        notification.success({ message: 'Proyecto creado con éxito' });
      }

      resetForm();
      fetchProyectos();
      setVisible(false);
    } catch (error) {
      notification.error({ message: 'Error al gestionar el proyecto' });
    }
  };

  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      notification.error({ message: 'Stripe no está completamente cargado' });
      return null;
    }
    try {
      const { data } = await api.post('/create-payment-intent', {
        amount: parseFloat(formValues.costo) * 100,
      });
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        notification.error({ message: `Error en el pago: ${result.error.message}` });
        return null;
      } else if (result.paymentIntent.status === 'succeeded') {
        notification.success({ message: 'Pago realizado con éxito' });
        return result.paymentIntent.id;
      }
    } catch (error) {
      notification.error({ message: 'Error al procesar el pago con Stripe' });
      return null;
    }
  };

  const handleEdit = (proyecto) => {
    setEditingProyecto(proyecto);

    if (proyecto.fecha_vencimiento && new Date(proyecto.fecha_vencimiento) < new Date()) {
      setConfirmVisible(true);
    } else {
      setFormValues({
        titulo: proyecto.titulo,
        descripcion: proyecto.descripcion,
        costo: proyecto.costo_proyecto,
        fechaCreacion: proyecto.fecha_creacion, // Mantiene la fecha de creación actual
        fechaVencimiento: proyecto.fecha_vencimiento, // Permite editar la fecha de vencimiento
        prioridad: proyecto.prioridad,
        asignadoA: proyecto.asignado_a,
        categoria: proyecto.categoria,
        completada: proyecto.completada,
        pagado: proyecto.metodo_pago === "efectivo" ? formValues.pagado : proyecto.pagado,
        metodoPago: proyecto.metodo_pago,
      });
      setVisible(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/${id}`);
      notification.success({ message: 'Proyecto eliminado con éxito' });
      fetchProyectos();
    } catch (error) {
      notification.error({ message: 'Error al eliminar el proyecto' });
    }
  };

  const resetForm = () => {
    setFormValues({
      titulo: '',
      descripcion: '',
      costo: '',
      fechaCreacion: new Date().toISOString().split('T')[0], // Resetea con la fecha actual
      fechaVencimiento: '', // Mantener editable
      prioridad: 'media',
      asignadoA: '',
      categoria: '',
      completada: false,
      pagado: false,
      metodoPago: 'stripe',
    });
    setEditingProyecto(null);
  };

  const handleConfirmCompletion = () => {
    setFormValues((prev) => ({ ...prev, completada: true }));
    setConfirmVisible(false);
    setVisible(true);
  };

  return (
    <div className="form-container">
      <Button type="primary" onClick={() => setVisible(true)}>
        {editingProyecto ? 'Editar Proyecto' : 'Crear Proyecto'}
      </Button>
      <Modal
        title={editingProyecto ? 'Editar Proyecto' : 'Crear Proyecto'}
        visible={visible}
        onCancel={() => { setVisible(false); resetForm(); }}
        onOk={handleSubmit}
      >
        <Input
          placeholder="Título"
          value={formValues.titulo}
          onChange={(e) => setFormValues({ ...formValues, titulo: e.target.value })}
          required
        />
        <Input.TextArea
          placeholder="Descripción"
          value={formValues.descripcion}
          onChange={(e) => setFormValues({ ...formValues, descripcion: e.target.value })}
        />
        <Input
          type="number"
          placeholder="Costo"
          value={formValues.costo}
          onChange={(e) => setFormValues({ ...formValues, costo: e.target.value })}
          required
        />
        <Input
          type="date"
          placeholder="Fecha de Creación"
          value={formValues.fechaCreacion} // Fecha de creación no editable
          readOnly
        />
        <Input
          type="date"
          placeholder="Fecha de Vencimiento"
          value={formValues.fechaVencimiento} // Fecha de vencimiento editable
          onChange={(e) => setFormValues({ ...formValues, fechaVencimiento: e.target.value })}
        />
        <Select
          value={formValues.prioridad}
          onChange={(value) => setFormValues({ ...formValues, prioridad: value })}
        >
          <Option value="baja">Baja</Option>
          <Option value="media">Media</Option>
          <Option value="alta">Alta</Option>
        </Select>
        <Input
          placeholder="Asignado a"
          value={formValues.asignadoA}
          onChange={(e) => setFormValues({ ...formValues, asignadoA: e.target.value })}
        />
        <Input
          placeholder="Categoría"
          value={formValues.categoria}
          onChange={(e) => setFormValues({ ...formValues, categoria: e.target.value })}
        />
        {formValues.fechaVencimiento && new Date(formValues.fechaVencimiento) < new Date() && (
          <Checkbox
            checked={formValues.completada}
            onChange={(e) => setFormValues({ ...formValues, completada: e.target.checked })}
          >
            Completada
          </Checkbox>
        )}
        {formValues.metodoPago === 'efectivo' && (
          <Checkbox
            checked={formValues.pagado}
            onChange={(e) => setFormValues({ ...formValues, pagado: e.target.checked })}
          >
            Pagado
          </Checkbox>
        )}
        <Select
          value={formValues.metodoPago}
          onChange={(value) => setFormValues({ ...formValues, metodoPago: value })}
        >
          <Option value="stripe">Tarjeta de débito o crédito</Option>
          <Option value="efectivo">Efectivo</Option>
        </Select>
        {formValues.metodoPago === 'stripe' && (
          <div className="payment-section">
            <CardElement />
          </div>
        )}
      </Modal>

      <Modal
        title="Confirmar estado de completado"
        visible={confirmVisible}
        onOk={handleConfirmCompletion}
        onCancel={() => setConfirmVisible(false)}
      >
        <p>La fecha de vencimiento ha pasado. ¿Marcar como completado?</p>
      </Modal>

      <h2>Lista de Proyectos</h2>
      <ul className="project-list">
        {proyectos.map((proyecto) => (
          <li key={proyecto.id} className="project-item">
            <h3>{proyecto.titulo}</h3>
            <p>{proyecto.descripcion}</p>
            <p><strong>Asignado a:</strong> {proyecto.asignado_a}</p>
            <p><strong>Prioridad:</strong> {proyecto.prioridad}</p>
            <p><strong>Completada:</strong> {proyecto.completada ? 'Sí' : 'No'}</p>
            <p><strong>Pagado:</strong> {proyecto.pagado ? 'Sí' : 'No'}</p>
            <p><strong>Categoría:</strong> {proyecto.categoria}</p>
            <p><strong>Fecha de Creación:</strong> {new Date(proyecto.fecha_creacion).toLocaleDateString()}</p>
            <p><strong>Fecha de Vencimiento:</strong> {proyecto.fecha_vencimiento ? new Date(proyecto.fecha_vencimiento).toLocaleDateString() : 'No asignada'}</p>
            <p><strong>Costo:</strong> ${proyecto.costo_proyecto}</p>
            <Button onClick={() => handleEdit(proyecto)}>Editar</Button>
            <Button danger onClick={() => handleDelete(proyecto.id)}>Eliminar</Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const App = () => (
  <Elements stripe={stripePromise}>
    <ProyectoForm />
  </Elements>
);

export default App;

