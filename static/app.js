// Elementos DOM
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
const manualSlider = document.getElementById('manualSlider');
const manualValue = document.getElementById('manualValue');
const modeAutoBtn = document.getElementById('modeAutoBtn');
const modeManualBtn = document.getElementById('modeManualBtn');
const manualControl = document.getElementById('manualControl');
const logDiv = document.getElementById('log');
const btnRefresh = document.getElementById('btnRefresh');

let modoAutomatico = true;
let tempGaugeChart = null;
let lastTemperatura = 0;

// Inicializar gráfico de temperatura
function initTempGauge() {
    const canvas = document.getElementById('tempGauge');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    tempGaugeChart = {
        draw: function(value) {
            ctx.clearRect(0, 0, 200, 200);
            
            // Fondo del gauge
            ctx.beginPath();
            ctx.arc(100, 100, 85, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
            
            // Arco de temperatura
            const angle = (value / 50) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(100, 100, 85, -Math.PI / 2, -Math.PI / 2 + angle);
            
            let gradient = ctx.createLinearGradient(0, 0, 200, 200);
            if (value < 25) {
                gradient.addColorStop(0, '#10b981');
                gradient.addColorStop(1, '#34d399');
            } else if (value <= 30) {
                gradient.addColorStop(0, '#f59e0b');
                gradient.addColorStop(1, '#fbbf24');
            } else {
                gradient.addColorStop(0, '#ef4444');
                gradient.addColorStop(1, '#f87171');
            }
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 12;
            ctx.stroke();
            
            // Marcadores
            ctx.font = '10px Inter';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('0°C', 15, 105);
            ctx.fillText('25°C', 85, 25);
            ctx.fillText('50°C', 165, 105);
        }
    };
    
    tempGaugeChart.draw(0);
}

function updateTempGauge(value) {
    if (tempGaugeChart) {
        tempGaugeChart.draw(value);
    }
    document.getElementById('gaugeTempValue').textContent = value.toFixed(1);
}

function writeLog(message, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `[${time}] ${message}`;
    logDiv.insertBefore(entry, logDiv.firstChild);
    
    // Limitar número de entradas
    while (logDiv.children.length > 50) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

async function actualizarEstado() {
    try {
        const res = await fetch('/api/estado');
        const data = await res.json();
        
        // Actualizar valores principales
        tempValor.innerHTML = data.temperatura.toFixed(1);
        velocidadValor.innerHTML = data.velocidad_porcentaje;
        pwmValor.innerHTML = data.velocidad;
        rangoTexto.innerHTML = data.rango;
        estadoTexto.innerHTML = data.estado_sistema;
        
        // Badge de rango
        if (data.rango.includes('BAJO')) {
            rangoBadge.innerHTML = '❄️ Rango Bajo';
            rangoBadge.style.background = 'rgba(16,185,129,0.2)';
            rangeIndicator.innerHTML = '❄️ Temperatura baja - Motor al 30%';
            rangeIndicator.style.background = 'rgba(16,185,129,0.1)';
            rangeIndicator.style.color = '#10b981';
        } else if (data.rango.includes('MEDIO')) {
            rangoBadge.innerHTML = '🌤️ Rango Medio';
            rangoBadge.style.background = 'rgba(245,158,11,0.2)';
            rangeIndicator.innerHTML = '🌤️ Temperatura moderada - Motor al 60%';
            rangeIndicator.style.background = 'rgba(245,158,11,0.1)';
            rangeIndicator.style.color = '#f59e0b';
        } else if (data.rango.includes('ALTO')) {
            rangoBadge.innerHTML = '🔥 Rango Alto';
            rangoBadge.style.background = 'rgba(239,68,68,0.2)';
            rangeIndicator.innerHTML = '🔥 Temperatura alta - Motor al 100%';
            rangeIndicator.style.background = 'rgba(239,68,68,0.1)';
            rangeIndicator.style.color = '#ef4444';
        }
        
        // Barra de velocidad
        speedBar.style.width = data.velocidad_porcentaje + '%';
        speedPercent.innerHTML = data.velocidad_porcentaje + '%';
        
        // Motor badge
        if (data.velocidad_porcentaje <= 30) {
            motorStatusBadge.innerHTML = '🐢 Velocidad Baja';
            motorStatusBadge.style.background = 'rgba(16,185,129,0.2)';
        } else if (data.velocidad_porcentaje <= 60) {
            motorStatusBadge.innerHTML = '⚡ Velocidad Media';
            motorStatusBadge.style.background = 'rgba(245,158,11,0.2)';
        } else {
            motorStatusBadge.innerHTML = '🚀 Velocidad Máxima';
            motorStatusBadge.style.background = 'rgba(239,68,68,0.2)';
        }
        
        // Animación del motor
        const spinSpeed = 0.5 + (data.velocidad_porcentaje / 100) * 2;
        motorIcon.style.animation = `fa-spin ${spinSpeed}s infinite linear`;
        
        // Gauge de temperatura
        updateTempGauge(data.temperatura);
        
        // Health fill
        let health = 100;
        if (data.estado_sistema.includes('ERROR')) health = 50;
        healthFill.style.width = health + '%';
        
        // Última actualización
        const now = new Date();
        lastUpdateSpan.innerHTML = now.toLocaleTimeString();
        
        // Detectar cambios significativos
        if (Math.abs(data.temperatura - lastTemperatura) > 2) {
            writeLog(`Temperatura: ${data.temperatura.toFixed(1)}°C - ${data.rango}`, 'success');
        }
        lastTemperatura = data.temperatura;
        
    } catch (error) {
        writeLog('Error al conectar con el servidor', 'error');
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
            writeLog(`Modo Manual: Velocidad ajustada al ${velocidadPorcentaje}% (PWM: ${data.velocidad})`, 'success');
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
        writeLog('Modo Automático activado - El sistema controla según temperatura', 'success');
        // Enviar velocidad 0 para que el sistema retome control automático
        enviarVelocidadManual(0);
    } else {
        modeAutoBtn.classList.remove('active');
        modeManualBtn.classList.add('active');
        manualControl.style.display = 'flex';
        writeLog('Modo Manual activado - Usa el slider para controlar el motor', 'warning');
        // Inicializar slider con velocidad actual
        const currentSpeed = parseInt(document.getElementById('velocidadValor').innerHTML) || 0;
        manualSlider.value = currentSpeed;
        manualValue.innerHTML = currentSpeed + '%';
    }
}

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

if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
        actualizarEstado();
        writeLog('Actualización manual solicitada', 'system');
    });
}

// Actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const dateStr = now.toLocaleDateString('es-ES', options);
    document.querySelector('.datetime span').innerHTML = dateStr;
}

// Inicialización
function init() {
    initTempGauge();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    setInterval(actualizarEstado, 2000);
    actualizarEstado();
    writeLog('Plataforma ThermalDrive iniciada correctamente', 'success');
}

init();
