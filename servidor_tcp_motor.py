#!/usr/bin/env python3
import socket
import serial
import threading
import sys

if sys.platform == "win32":
    SERIAL_PORT = "COM3"
else:
    SERIAL_PORT = "/dev/ttyACM0"

BAUDRATE = 9600
HOST = "127.0.0.1"
PORT = 5001

ser = None
conexion = False

def conectar_serial():
    global ser, conexion
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=2)
        ser.reset_input_buffer()
        conexion = True
        print(f"✅ Conectado a {SERIAL_PORT}")
        return True
    except:
        print(f"❌ Error serial en {SERIAL_PORT}")
        conexion = False
        return False

def enviar_comando(cmd):
    global ser, conexion
    if not conexion or not ser:
        if not conectar_serial():
            return "ERR:NO_SERIAL"
    try:
        ser.reset_input_buffer()
        ser.write((cmd + "\n").encode())
        ser.flush()
        import time
        start = time.time()
        while time.time() - start < 1:
            if ser.in_waiting:
                return ser.readline().decode().strip()
        return "ERR:TIMEOUT"
    except:
        conexion = False
        return "ERR:COM"

def manejar_cliente(conn, addr):
    while True:
        data = conn.recv(1024)
        if not data:
            break
        cmd = data.decode().strip()
        if cmd.startswith("MOTOR:"):
            try:
                val = int(cmd[6:])
                val = max(0, min(255, val))
                resp = enviar_comando(f"MOTOR:{val}")
                conn.sendall((resp + "\n").encode())
            except:
                conn.sendall(b"ERR:VALOR\n")
        elif cmd == "STATUS":
            resp = enviar_comando("STATUS")
            conn.sendall((resp + "\n").encode())
        elif cmd == "SENSOR":
            resp = enviar_comando("SENSOR")
            conn.sendall((resp + "\n").encode())
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
