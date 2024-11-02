import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/proyecto.css';
import StripeCheckout from 'react-stripe-checkout';

const api = axios.create({
  baseURL: 'https://tareas-api-gm7z.onrender.com/api/proyectos', // URL actualizada
});

const ProyectoForm = () => {
  const [proyectos, setProyectos] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [costo, setCosto] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [asignadoA, setAsignadoA] = useState('');
  const [categoria, setCategoria] = useState('');
  const [completada, setCompletada] = useState(false);
  const [pagado, setPagado] = useState(false);
  const [metodoPago, setMetodoPago] = useState('stripe'); // Nuevo estado para el método de pago
  const [editingProyecto, setEditingProyecto] = useState(null);

  useEffect(() => {
    fetchProyectos();
  }, []);

  const fetchProyectos = async () => {
    try {
      const response = await api.get('/');
      setProyectos(response.data);
    } catch (error) {
      console.error('Error al obtener los proyectos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProyecto) {
        // Actualizar proyecto
        await api.put(`/${editingProyecto.id}`, {
          titulo,
          descripcion,
          completada,
          fecha_vencimiento: fechaVencimiento,
          prioridad,
          asignado_a: asignadoA,
          categoria,
          costo_proyecto: parseFloat(costo),
          pagado,
          metodo_pago: metodoPago,
        });
        alert('Proyecto actualizado con éxito');
        setEditingProyecto(null);
      } else {
        // Crear nuevo proyecto
        await api.post('/', {
          titulo,
          descripcion,
          completada,
          fecha_vencimiento: fechaVencimiento,
          prioridad,
          asignado_a: asignadoA,
          categoria,
          costo_proyecto: parseFloat(costo),
          pagado,
          metodo_pago: metodoPago,
        });
        alert('Proyecto creado con éxito');
        if (metodoPago === 'stripe') {
          alert('Por favor, completa el proceso de pago con tarjeta');
        }
      }
      resetForm();
      fetchProyectos();
    } catch (error) {
      console.error('Error al gestionar el proyecto:', error);
      alert('Error al gestionar el proyecto');
    }
  };

  const handlePayment = async (token) => {
    if (metodoPago === 'stripe') {
      try {
        const response = await api.post('/pago', {
          token,
          amount: parseFloat(costo) * 100, // Convertir a centavos
        });
        if (response.data.success) {
          alert('Pago realizado con éxito');
          setPagado(true);
        } else {
          alert('Error en el proceso de pago');
        }
      } catch (error) {
        console.error('Error al procesar el pago:', error);
        alert('Error al procesar el pago');
      }
    } else {
      handleEfectivo();
    }
  };

  const handleEfectivo = () => {
    alert('Pago en efectivo registrado con éxito');
    setPagado(true);
  };

  const handleEdit = (proyecto) => {
    setEditingProyecto(proyecto);
    setTitulo(proyecto.titulo);
    setDescripcion(proyecto.descripcion);
    setCosto(proyecto.costo_proyecto);
    setFechaVencimiento(proyecto.fecha_vencimiento);
    setPrioridad(proyecto.prioridad);
    setAsignadoA(proyecto.asignado_a);
    setCategoria(proyecto.categoria);
    setCompletada(proyecto.completada);
    setPagado(proyecto.pagado);
    setMetodoPago(proyecto.metodo_pago);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/${id}`);
      alert('Proyecto eliminado con éxito');
      fetchProyectos();
    } catch (error) {
      console.error('Error al eliminar el proyecto:', error);
      alert('Error al eliminar el proyecto');
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setCosto('');
    setFechaVencimiento('');
    setPrioridad('media');
    setAsignadoA('');
    setCategoria('');
    setCompletada(false);
    setPagado(false);
    setMetodoPago('stripe');
    setEditingProyecto(null);
  };

  return (
    <div className="form-container">
      <h1>{editingProyecto ? 'Editar Proyecto' : 'Crear Proyecto'}</h1>
      <form onSubmit={handleSubmit}>
        <label>Título:</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <label>Descripción:</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <label>Costo:</label>
        <input
          type="number"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          required
        />
        <label>Fecha de Vencimiento:</label>
        <input
          type="date"
          value={fechaVencimiento}
          onChange={(e) => setFechaVencimiento(e.target.value)}
        />
        <label>Prioridad:</label>
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
        >
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
        <label>Asignado a:</label>
        <input
          type="text"
          value={asignadoA}
          onChange={(e) => setAsignadoA(e.target.value)}
        />
        <label>Categoría:</label>
        <input
          type="text"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
        <label>Completada:</label>
        <input
          type="checkbox"
          checked={completada}
          onChange={(e) => setCompletada(e.target.checked)}
        />
        <label>Pagado:</label>
        <input
          type="checkbox"
          checked={pagado}
          onChange={(e) => setPagado(e.target.checked)}
        />
        <label>Método de Pago:</label>
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
        >
          <option value="stripe">Stripe</option>
          <option value="efectivo">Efectivo</option>
        </select>
        <button type="submit">{editingProyecto ? 'Actualizar Proyecto' : 'Crear Proyecto'}</button>
        {editingProyecto && <button type="button" onClick={resetForm}>Cancelar Edición</button>}
      </form>

      {metodoPago === 'stripe' && !editingProyecto && (
        <StripeCheckout
          stripeKey="pk_test_51Q9AMkB3EtWqqOZ2sr4dExyPgtFOgL7UBEAVEiuUbKdBFaNQSCivO5lTntoXL7DO6vxSjlRio5frb1MrqtztSg68007Hlq6at0"
          token={handlePayment}
          amount={parseFloat(costo) * 100}
          name="Pago de Proyecto"
          currency="USD"
        />
      )}

<h2>Lista de Proyectos</h2>
<ul className="project-list">
        {proyectos.map((proyecto) => (
          <li key={proyecto.id} className="project-item">
            <h3>{proyecto.titulo}</h3>
            <p>{proyecto.descripcion}</p>
            <p><strong>Asignado a:</strong> {proyecto.asignado_a}</p>
            <p><strong>Prioridad:</strong> {proyecto.prioridad}</p>
            <p><strong>Completada:</strong> {proyecto.completada ? 'Sí' : 'No'}</p>
            <button onClick={() => handleEdit(proyecto)}>Editar</button>
            <button onClick={() => handleDelete(proyecto.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProyectoForm;
