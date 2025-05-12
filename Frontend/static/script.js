document.addEventListener('DOMContentLoaded', () => {
    const { jsPDF } = window.jspdf;
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    const btnDescargar = document.getElementById('btnDescargar');
    const errorMensaje = document.getElementById('errorMensaje');
    const form = document.getElementById('registroForm');

    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        signaturePad.clear();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    window.clearSignature = () => {
        signaturePad.clear();
        btnDescargar.disabled = true;
        errorMensaje.style.display = 'none';
    };

    window.validarFormulario = () => {
        const requiredFields = ['fecha', 'serie', 'ticket', 'nombre', 'cedula', 'empresa'];
        const missingFields = requiredFields.filter(id => !document.getElementById(id).value.trim());

        if (missingFields.length > 0) {
            showError('Por favor complete todos los campos.');
            return;
        }

        if (signaturePad.isEmpty()) {
            showError('Por favor proporcione su firma.');
            return;
        }

        clearError();
        btnDescargar.disabled = false;
    };

    window.generarPDF = async () => {
        const registro = {
            fecha: document.getElementById('fecha').value,
            serie: document.getElementById('serie').value,
            ticket: document.getElementById('ticket').value,
            nombre: document.getElementById('nombre').value,
            cedula: document.getElementById('cedula').value,
            empresa: document.getElementById('empresa').value,
            url: signaturePad.toDataURL()
        };

        try {
            const doc = new jsPDF();
            doc.setFontSize(12);
            doc.text(`Fecha de retiro: ${registro.fecha}`, 10, 20);
            doc.text(`Número de serie: ${registro.serie}`, 10, 30);
            doc.text(`N° Ticket Interno: ${registro.ticket}`, 10, 40);
            doc.text(`Nombre: ${registro.nombre}`, 10, 50);
            doc.text(`Cédula: ${registro.cedula}`, 10, 60);
            doc.text(`Empresa cliente: ${registro.empresa}`, 10, 70);
            doc.text('Firma:', 10, 80);
            doc.addImage(registro.url, 'PNG', 10, 85, 100, 40);

            await guardarRegistro(registro);
            doc.save(`registro_${registro.serie}.pdf`);
            form.reset();
            clearSignature();
            mostrarRegistros();
        } catch (error) {
            showError('Error al generar PDF: ' + error.message);
        }
    };

    async function mostrarRegistros() {
        try {
            const response = await fetch('/api/registros');
            if (!response.ok) throw new Error('Error al obtener registros');

            const registros = await response.json();
            const lista = document.getElementById('listaRegistros');
            lista.innerHTML = registros.map((r, i) => `
                <div class="registro-item">
                    <strong>${i + 1}.</strong> Fecha: ${r.fecha} | Serie: ${r.serie}<br>
                    Ticket: ${r.ticket || 'N/A'} | Nombre: ${r.nombre} | Cédula: ${r.cedula || 'N/A'} | Empresa: ${r.empresa}
                </div>
            `).join('');
        } catch (error) {
            console.error('Error:', error);
            const lista = document.getElementById('listaRegistros');
            lista.innerHTML = '<div class="error">Error al cargar registros</div>';
        }
    }

    async function guardarRegistro(registro) {
        try {
            const response = await fetch('/api/registros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registro)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    function showError(message) {
        errorMensaje.textContent = message;
        errorMensaje.style.display = 'block';
        btnDescargar.disabled = true;
    }

    function clearError() {
        errorMensaje.style.display = 'none';
    }

    mostrarRegistros();
});
