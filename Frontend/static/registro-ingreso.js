document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formIngreso');
    const btnEnviar = document.getElementById('btnEnviar');
    const mensaje = document.getElementById('mensaje');

    btnEnviar.addEventListener('click', async () => {
        const fecha = document.getElementById('fecha').value;
        const serie = document.getElementById('serie').value;
        const ticket = document.getElementById('ticket').value;
        const empresa = document.getElementById('empresa').value;
        const tecnico = document.getElementById('tecnico').value;
        const replat = document.getElementById('replat').checked;
        const nuevo = document.getElementById('nuevo').checked;

        if (!fecha || !serie || !ticket || !empresa || !tecnico) {
            mensaje.textContent = 'Por favor complete todos los campos obligatorios.';
            mensaje.style.color = 'red';
            return;
        }

        const ingreso = {
            fecha, serie, ticket, empresa, tecnico,
            replat: replat ? 1 : 0,
            nuevo: nuevo ? 1 : 0
        };

        try {
            const response = await fetch('/api/ingresos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ingreso)
            });

            if (!response.ok) throw new Error('Error al guardar el ingreso.');

            mensaje.textContent = 'Ingreso registrado correctamente.';
            mensaje.style.color = 'green';
            form.reset();
        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.style.color = 'red';
        }
    });
});