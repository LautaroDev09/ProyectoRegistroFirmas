document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('selectorFecha');
    const tabla = document.getElementById('tablaRegistros');
    const cuerpoTabla = document.querySelector('#tablaRegistros tbody');
    const botonDescargar = document.getElementById('btnDescargarExcel');

    // Inicializa el selector con mes y año actuales
    const hoy = new Date();
    const mes = hoy.toISOString().slice(0, 7); // formato yyyy-MM
    selector.value = mes;

    selector.addEventListener('change', () => {
        cargarRegistros();
    });

    botonDescargar.addEventListener('click', () => {
    const fecha = selector.value;
    if (!fecha) {
        alert('Seleccione un mes válido');
        return;
    }
    window.location.href = `/api/registros/excel?mes=${fecha}`;
});

    async function cargarRegistros() {
        const fecha = selector.value;
        if (!fecha) return;

        const response = await fetch(`/api/registros?mes=${fecha}`);
        const registros = await response.json();

        cuerpoTabla.innerHTML = '';

        if (registros.length === 0) {
            const fila = document.createElement('tr');
            fila.innerHTML = `<td colspan="6" style="text-align:center;">No hay registros para el mes seleccionado</td>`;
            cuerpoTabla.appendChild(fila);
            return;
        }

        registros.forEach(r => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${r.fecha}</td>
                <td>${r.serie}</td>
                <td>${r.ticket || 'N/A'}</td>
                <td>${r.nombre}</td>
                <td>${r.cedula}</td>
                <td>${r.empresa}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    cargarRegistros();
});