// DOM Elements
const tempValor = document.getElementById('tempValor');
const velocidadValor = document.getElementById('velocidadValor');
const pwmValor = document.getElementById('pwmValor');
const rangoTexto = document.getElementById('rangoTexto');
const estadoTexto = document.getElementById('estadoTexto');
const rangoBadge = document.getElementById('rangoBadge');
const motorStatusBadge = document.getElementById('motorStatusBadge');
const speedBar = document.getElementById('speedBar');
const speedPercent = document.getElementById('speedPercent');
const motorIcon = document.getElementById('motorIcon');
const rangeIndicator = document.getElementById('rangeIndicator');
const lastUpdateSpan = document.getElementById('lastUpdate');
const healthFill = document.getElementById('healthFill');
const gaugeValue = document.getElementById('gaugeValue');
const gaugeFill = document.querySelector('.gauge-fill');
const manualSlider = document.getElementById('manualSlider');
const manualValue = document.getElementById('manualValue');
const modeAutoBtn = document.getElementById('modeAutoBtn');
const modeManualBtn = document.getElementById('modeManualBtn');
const manualControl = document.getElementById('manualControl');
const logDiv = document.getElementById('log');
const refreshBtn = document.getElementById('btnRefresh');
const clearBtn = document.getElementById('btnClear');

let modoAutomatico = true;
let lastTemperatura = 0;
const circumference = 326.8;

// Functions
function writeLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `[${time}] ${message}`;
    logDiv.insertBefore(entry, logDiv.firstChild);
    
    while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

function updateGauge(temp) {
    let percentage = Math.min(100, Math.max(0, (temp / 50) * 100));
    let offset = circumference - (percentage / 100) * circumference;
    if (gaugeFill) {
        gaugeFill.style.strokeDashoffset = offset;
    }
    gaugeValue.textContent = temp.toFixed(1);
}

async function actualizarEstado() {
    try {
        const res = await fetch('/api/estado');
        const data = await res.json();
        
        // Update values
        tempValor.innerHTML = data.temperatura.toFixed(1);
        velocidadValor.innerHTML = data.velocidad_porcentaje;
        pwmValor.innerHTML = data.velocidad;
        rangoTexto.innerHTML = data.rango;
        estadoTexto.innerHTML = data.estado_sistema;
        
        // Update gauge
        updateGauge(data.temperatura);
        
        // Update speed bar
        speedBar.style.width = data.velocidad_porcentaje + '%';
        speedPercent.innerHTML = data.velocidad_porcentaje + '%';
        
        // Motor animation
        const spinSpeed = 0.5 + (data.velocidad_porcentaje / 100) * 1.5;
        motorIcon.querySelector('i').style.animation = `spin ${spinSpeed}s linear infinite`;
        
        // Update badges based on range
        if (data.rango.includes('BAJO') || data.rango.includes('LOW')) {
            rangoBadge.innerHTML = '❄️ Rango Bajo';
            rangoBadge.style.background = 'rgba(16,185,129,0.2)';
            rangeIndicator.innerHTML = '❄️ Temperatura baja - Motor al 30%';
            rangeIndicator.style.background = 'rgba(16,185,129,0.1)';
            rangeIndicator.style.color = '#10b981';
            motorStatusBadge.innerHTML = '🐢 Velocidad Baja';
            motorStatusBadge.style.background = 'rgba(16,185,129,0.2)';
        } else if (data.rango.includes('MEDIO') || data.rango.includes('MEDIUM')) {
            rangoBadge.innerHTML = '🌤️ Rango Medio';
            rangoBadge.style.background = 'rgba(245,158,11,0.2)';
            rangeIndicator.innerHTML = '🌤️ Temperatura moderada - Motor al 60%';
            rangeIndicator.style.background = 'rgba(245,158,11,0.1)';
            rangeIndicator.style.color = '#f59e0b';
            motorStatusBadge.innerHTML = '⚡ Velocidad Media';
            motorStatusBadge.style.background = 'rgba(245,158,11,0.2)';
        } else if (data.rango.includes('ALTO') || data.rango.includes('HIGH')) {
            rangoBadge.innerHTML = '🔥 Rango Alto';
            rangoBadge.style.background = 'rgba(239,68,68,0.2)';
            rangeIndicator.innerHTML = '🔥 Temperatura alta - Motor al 100%';
            rangeIndicator.style.background = 'rgba(239,68,68,0.1)';
            rangeIndicator.style.color = '#ef4444';
            motorStatusBadge.innerHTML = '🚀 Velocidad Máxima';
            motorStatusBadge.style.background = 'rgba(239,68,68,0.2)';
        }
        
        // Health fill
        let health = 100;
        if (data.estado_sistema.includes('ERROR')) health = 50;
        healthFill.style.width = health + '%';
        
        // Last update
        const now = new Date();
        lastUpdateSpan.innerHTML = now.toLocaleTimeString();
        
        // Log temperature changes
        if (Math.abs(data.temperatura - lastTemperatura) > 1.5) {
            writeLog(`Temperatura: ${data.temperatura.toFixed(1)}°C - ${data.rango}`, 'success');
        }
        lastTemperatura = data.temperatura;
        
    } catch (error) {
        writeLog('Error al conectar con el servidor', 'error');
        estadoTexto.innerHTML = 'Error de conexión';
    }
}

async function enviarVelocidadManual(velocidadPorcentaje) {
    const velocidadPWM = Math.round((velocidadPorcentaje / 100) * 255);
    
    try {
        const res = await fetch('/api/motor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ velocidad: velocidadPWM })
        });
        
        const data = await res.json();
        
        if (data.ok) {
            writeLog(`Modo Manual: Velocidad ${velocidadPorcentaje}% (PWM: ${data.velocidad})`, 'success');
        } else {
            writeLog(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        writeLog('Error al enviar comando al motor', 'error');
    }
}

function toggleModo(automatico) {
    modoAutomatico = automatico;
    
    if (modoAutomatico) {
        modeAutoBtn.classList.add('active');
        modeManualBtn.classList.remove('active');
        manualControl.style.display = 'none';
        writeLog('Modo Automático activado - Control por temperatura', 'success');
        enviarVelocidadManual(0);
    } else {
        modeAutoBtn.classList.remove('active');
        modeManualBtn.classList.add('active');
        manualControl.style.display = 'flex';
        writeLog('Modo Manual activado - Control manual del motor', 'warning');
        const currentSpeed = parseInt(velocidadValor.innerHTML) || 0;
        manualSlider.value = currentSpeed;
        manualValue.innerHTML = currentSpeed + '%';
    }
}

// CSS animation for motor spin
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .motor-icon-animation i {
        display: inline-block;
        animation: spin 1s linear infinite;
        animation-play-state: paused;
    }
`;
document.head.appendChild(style);

// Event Listeners
if (modeAutoBtn) modeAutoBtn.addEventListener('click', () => toggleModo(true));
if (modeManualBtn) modeManualBtn.addEventListener('click', () => toggleModo(false));

if (manualSlider) {
    manualSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        manualValue.innerHTML = val + '%';
        if (!modoAutomatico) {
            enviarVelocidadManual(val);
        }
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        actualizarEstado();
        writeLog('Actualización manual solicitada', 'info');
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        logDiv.innerHTML = '';
        writeLog('Consola limpiada', 'info');
    });
}

// Update datetime
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    document.querySelector('.datetime span').innerHTML = now.toLocaleDateString('es-ES', options);
}

// Initialize
updateDateTime();
setInterval(updateDateTime, 60000);
setInterval(actualizarEstado, 2000);
actualizarEstado();
writeLog('ThermalDrive iniciado - Sistema listo', 'success');
