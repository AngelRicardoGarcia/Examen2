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
            rangeIndicator.style.background = 'rgba(239,68,68,0
