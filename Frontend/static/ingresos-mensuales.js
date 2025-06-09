document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('selectorFecha');
    const cuerpoTabla = document.querySelector('#tablaIngresos tbody');
    const botonDescargar = document.getElementById('btnDescargarExcel');

    const hoy = new Date();
    selector.value = hoy.toISOString().slice(0, 7);

    selector.addEventListener('change', cargarIngresos);
    botonDescargar.addEventListener('click', descargarExcel);
    cargarIngresos();

    async function cargarIngresos() {
        const mes = selector.value;
        if (!mes) return;

        const response = await fetch(`/api/ingresos?mes=${mes}`);
        const ingresos = await response.json();

        cuerpoTabla.innerHTML = '';

        if (ingresos.length === 0) {
            cuerpoTabla.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay ingresos para el mes seleccionado</td></tr>`;
            return;
        }

        ingresos.forEach(i => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${i.fecha}</td>
                <td>${i.serie}</td>
                <td>${i.ticket}</td>
                <td>${i.empresa}</td>
                <td>${i.tecnico}</td>
                <td>${i.replat ? 'Sí' : 'No'}</td>
                <td>${i.nuevo ? 'Sí' : 'No'}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    function descargarExcel() {
        const mes = selector.value;
        if (!mes) {
            alert('Seleccione un mes válido');
            return;
        }
        window.location.href = `/api/ingresos/excel?mes=${mes}`;
    }
});