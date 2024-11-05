import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Input, Select, Checkbox, notification } from 'antd';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import '../css/proyecto.css'; // Asegúrate de que esta ruta sea correcta y que el archivo exista

const { Option } = Select;

const api = axios.create({
  baseURL: 'https://tareas-api-gm7z.onrender.com/api/proyectos',
});

const ProyectoForm = () => {
  const [proyectos, setProyectos] = useState([]);
  const [visible, setVisible] = useState(false);
  const [formValues, setFormValues] = useState({
    titulo: '',
    descripcion: '',
    costo: '',
    fechaCreacion: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
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
    fetchProyectos(1); // Carga la primera página al inicio
  }, []);

  const fetchProyectos = async (page = 1) => {
    try {
      const response = await api.get(`/?page=${page}&limit=10`); // Paginación con límite de 10
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

      const proyectoData = {
        ...formValues,
        costo_proyecto: parseFloat(formValues.costo),
        paymentMethodId,
      };

      if (editingProyecto) {
        await api.put(`/${editingProyecto.id}`, proyectoData);
        notification.success({ message: 'Proyecto actualizado con éxito' });
      } else {
        await api.post('/', proyectoData);
        notification.success({ message: 'Proyecto creado con éxito' });
      }

      resetForm();
      fetchProyectos(1); // Recarga la primera página de la lista
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
    setFormValues({
      titulo: proyecto.titulo,
      descripcion: proyecto.descripcion,
      costo: proyecto.costo_proyecto,
      fechaCreacion: proyecto.fecha_creacion,
      fechaVencimiento: proyecto.fecha_vencimiento,
      prioridad: proyecto.prioridad,
      asignadoA: proyecto.asignado_a,
      categoria: proyecto.categoria,
      completada: proyecto.completada,
      pagado: proyecto.pagado,
      metodoPago: proyecto.metodo_pago,
    });
    setVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/${id}`);
      notification.success({ message: 'Proyecto eliminado con éxito' });
      fetchProyectos(1); // Recarga la primera página de la lista
    } catch (error) {
      notification.error({ message: 'Error al eliminar el proyecto' });
    }
  };

  const ProyectoItem = React.memo(({ proyecto }) => (
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
  ));

  const resetForm = () => {
    setFormValues({
      titulo: '',
      descripcion: '',
      costo: '',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      prioridad: 'media',
      asignadoA: '',
      categoria: '',
      completada: false,
      pagado: false,
      metodoPago: 'stripe',
    });
    setEditingProyecto(null);
  };

  return (
    <div className="form-container">
      <Button type="primary" onClick={() => setVisible(true)}>
        {editingProyecto ? 'Editar Proyecto' : 'Crear Proyecto'}
      </Button>
      <Modal title={editingProyecto ? 'Editar Proyecto' : 'Crear Proyecto'} visible={visible} onCancel={() => { setVisible(false); resetForm(); }} onOk={handleSubmit}>
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
          value={formValues.fechaCreacion}
          readOnly
        />
        <Input
          type="date"
          placeholder="Fecha de Vencimiento"
          value={formValues.fechaVencimiento}
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

      <h2>Lista de Proyectos</h2>
      <ul className="project-list">
        {proyectos.map((proyecto) => (
          <ProyectoItem key={proyecto.id} proyecto={proyecto} />
        ))}
      </ul>
    </div>
  );
};

export default ProyectoForm;
