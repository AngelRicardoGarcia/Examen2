const logEl = document.getElementById("log");
const btnClear = document.getElementById("btnClear");

function writeLog(msg) {
    const t = new Date().toLocaleTimeString();
    logEl.textContent = `[${t}] ${msg}\n` + logEl.textContent;
}

async function actualizarEstado() {
    try {
        const res = await fetch("/api/estado");
        const data = await res.json();
        
        document.getElementById("tempValor").innerHTML = data.temperatura.toFixed(1);
        document.getElementById("rangoTexto").innerHTML = data.rango;
        document.getElementById("velocidadValor").innerHTML = data.velocidad_porcentaje;
        document.getElementById("estadoTexto").innerHTML = data.estado_sistema;
        
        const tempPorc = Math.min(100, Math.max(0, (data.temperatura / 50) * 100));
        document.getElementById("gaugeFill").style.width = tempPorc + "%";
        document.getElementById("progressFill").style.width = data.velocidad_porcentaje + "%";
        
        const motorBadge = document.getElementById("motorBadge");
        if (data.velocidad_porcentaje <= 30) {
            motorBadge.innerHTML = "🐢 Velocidad Baja (30%)";
            motorBadge.style.background = "rgba(34,197,94,0.2)";
        } else if (data.velocidad_porcentaje <= 60) {
            motorBadge.innerHTML = "⚡ Velocidad Media (60%)";
            motorBadge.style.background = "rgba(249,115,22,0.2)";
        } else {
            motorBadge.innerHTML = "🚀 Velocidad Alta (100%)";
            motorBadge.style.background = "rgba(239,68,68,0.2)";
        }
        
        document.getElementById("dotTemp").style.background = data.temperatura > 30 ? "#ef4444" : (data.temperatura > 25 ? "#f97316" : "#22c55e");
        document.getElementById("dotRango").style.background = data.rango.includes("ALTO") ? "#ef4444" : (data.rango.includes("MEDIO") ? "#f97316" : "#22c55e");
        document.getElementById("dotMotor").style.background = data.velocidad_porcentaje > 60 ? "#ef4444" : (data.velocidad_porcentaje > 30 ? "#f97316" : "#22c55e");
        
    } catch (e) {
        writeLog("ERROR: No se pudo conectar al servidor");
    }
}

if (btnClear) {
    btnClear.addEventListener("click", () => {
        logEl.textContent = "Log limpiado.\n";
    });
}

setInterval(actualizarEstado, 2000);
actualizarEstado();
writeLog("Sistema iniciado. Esperando datos...");
