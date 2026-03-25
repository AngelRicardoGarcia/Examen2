#!/usr/bin/env python3
"""
Servidor TCP - Bridge entre Flask y Arduino/ESP32
"""

import socket
import serial
import threading
import time
import sys

# CONFIGURACIÓN
if sys.platform == "win32":
    SERIAL_PORT = "COM3"          # Windows
else:
    SERIAL_PORT = "/dev/ttyACM0"  # Linux/Mac

BAUDRATE = 9600
HOST = "127.0.0.1"
PORT = 5001

ser = None
conexion_serial = False

estado = {
    'temperatura': 0.0,
    'velocidad': 0,
    'velocidad_porcentaje': 0,
    'rango': 'Esperando datos',
    'estado_sistema': 'Inicializando'
}

def conectar_serial():
    global ser, conexion_serial
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=2)
        ser.reset_input_buffer()
        conexion_serial = True
        print(f"✅ Conectado a {SERIAL_PORT}")
        return True
    except Exception as e:
        print(f"❌ Error serial: {e}")
        conexion_serial = False
        return False

def enviar_comando(cmd):
    global ser, conexion_serial
    if not conexion_serial or not ser or not ser.is_open:
        if not conectar_serial():
            return "ERR:NO_SERIAL"
    try:
        ser.reset_input_buffer()
        ser.write((cmd + "\n").encode())
        ser.flush()
        start = time.time()
        while time.time() - start < 1.0:
            if ser.in_waiting:
                return ser.readline().decode().strip()
        return "ERR:TIMEOUT"
    except Exception as e:
        conexion_serial = False
        return f"ERR:{e}"

def actualizar_estado():
    resp = enviar_comando("STATUS")
    if resp.startswith("STATUS:"):
        partes = resp[7:].split(",")
        if len(partes) >= 4:
            estado['temperatura'] = float(partes[0])
            estado['velocidad'] = int(partes[1])
            estado['velocidad_porcentaje'] = int((estado['velocidad'] / 255) * 100)
            estado['rango'] = partes[2]
            estado['estado_sistema'] = partes[3]

def controlar_motor(velocidad):
    velocidad = max(0, min(255, velocidad))
    resp = enviar_comando(f"MOTOR:{velocidad}")
    if resp.startswith("OK:MOTOR:"):
        val = int(resp[9:])
        estado['velocidad'] = val
        estado['velocidad_porcentaje'] = int((val / 255) * 100)
        return {'ok': True, 'velocidad': val}
    return {'ok': False, 'error': resp}

def manejar_cliente(conn, addr):
    print(f"Cliente conectado: {addr}")
    while True:
        data = conn.recv(1024)
        if not data:
            break
        cmd = data.decode().strip()
        
        if cmd.startswith("MOTOR:"):
            try:
                val = int(cmd[6:])
                res = controlar_motor(val)
                if res['ok']:
                    conn.sendall(f"OK:MOTOR:{res['velocidad']}\n".encode())
                else:
                    conn.sendall(f"ERR:{res['error']}\n".encode())
            except:
                conn.sendall(b"ERR:VALOR\n")
        
        elif cmd == "STATUS":
            actualizar_estado()
            conn.sendall(f"STATUS:{estado['temperatura']},{estado['velocidad']},{estado['rango']},{estado['estado_sistema']}\n".encode())
        
        elif cmd == "SENSOR":
            resp = enviar_comando("SENSOR")
            conn.sendall((resp + "\n").encode())
        
        elif cmd == "STOP":
            controlar_motor(0)
            conn.sendall(b"OK:STOP\n")
        
        else:
            conn.sendall(b"ERR:CMD\n")
    conn.close()

def main():
    print("=" * 40)
    print("Servidor TCP - Control Motor")
    print("=" * 40)
    conectar_serial()
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        s.listen(5)
        print(f"Escuchando en {HOST}:{PORT}")
        
        while True:
            try:
                conn, addr = s.accept()
                threading.Thread(target=manejar_cliente, args=(conn, addr), daemon=True).start()
            except KeyboardInterrupt:
                print("\nServidor detenido")
                break

if __name__ == "__main__":
    main()
