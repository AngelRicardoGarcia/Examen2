// Elementos del DOM
const sensorValor = document.getElementById('sensor-valor');
const sensorBar = document.getElementById('sensor-bar');
const velocidadValor = document.getElementById('velocidad-valor');
const motorBar = document.getElementById('motor-bar');
const zonaActiva = document.getElementById('zona-activa');
const accionMotor = document.getElementById('accion-motor');
const zonas = {
    1: document.getElementById('zona-1'),
    2: document.getElementById('zona-2'),
    3: document.getElementById('zona-3')
};
const ultimaActualizacion = document.getElementById('ultima-actualizacion');
const fechaActual = document.getElementById('fecha-actual');

// Límites de zona
const LIMITE_ZONA_1 = 225;
const LIMITE_ZONA_2 = 210;

// Nombres y acciones
const nombresZonas = {
    1: 'FRÍO',
    2: 'TEMPLADO',
    3: 'CALIENTE'
};

const accionesMotor = {
    1: 'Motor apagado',
    2: 'Velocidad media (170/255)',
    3: 'Velocidad máxima (255/255)'
};

// Actualizar fecha
function updateFecha() {
    if (fechaActual) {
        const ahora = new Date();
        fechaActual.textContent = ahora.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
updateFecha();
setInterval(updateFecha, 60000);

// Configuración de la gráfica
const ctx = document.getElementById('mainChart').getContext('2d');
let chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Sensor KY-028',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true
            },
            {
                label: 'Límite 225',
                data: [],
                borderColor: '#f59e0b',
                borderWidth: 2,
                borderDash: [8, 4],
                pointRadius: 0,
                fill: false
            },
            {
                label: 'Límite 210',
                data: [],
                borderColor: '#f59e0b',
                borderWidth: 2,
                borderDash: [8, 4],
                pointRadius: 0,
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#94a3b8',
                borderColor: '#3b82f6',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                min: 0,
                max: 1023,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#94a3b8', stepSize: 200 },
                title: {
                    display: true,
                    text: 'Valor analógico (0-1023)',
                    color: '#94a3b8',
                    font: { size: 11 }
                }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }
            }
        }
    }
});

function actualizarZonas(zona) {
    // Limpiar todas
    Object.values(zonas).forEach(z => {
        if (z) z.classList.remove('active');
    });
    
    // Activar la zona actual
    if (zonas[zona]) zonas[zona].classList.add('active');
    
    // Actualizar textos
    zonaActiva.textContent = nombresZonas[zona] || '---';
    accionMotor.textContent = accionesMotor[zona] || '---';
}

function updateChart(valor) {
    const ahora = new Date().toLocaleTimeString();
    
    chart.data.labels.push(ahora);
    chart.data.datasets[0].data.push(valor);
    chart.data.datasets[1].data.push(LIMITE_ZONA_1);
    chart.data.datasets[2].data.push(LIMITE_ZONA_2);
    
    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
        chart.data.datasets[2].data.shift();
    }
    
    chart.update();
}

async function fetchEstado() {
    try {
        const r = await fetch("/api/estado");
        const j = await r.json();
        
        if (j.ok) {
            sensorValor.textContent = j.sensor;
            sensorBar.style.width = `${(j.sensor / 1023) * 100}%`;
            
            velocidadValor.textContent = j.velocidad;
            motorBar.style.width = `${(j.velocidad / 255) * 100}%`;
            
            actualizarZonas(j.zona);
            updateChart(j.sensor);
            
            const ahora = new Date();
            ultimaActualizacion.textContent = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

setInterval(fetchEstado, 1000);
fetchEstado();
