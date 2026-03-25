#!/usr/bin/env python3
"""
Aplicación Flask - Interfaz Web para Control de Motor
"""

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import check_password_hash
import socket
import os

# CONFIGURACIÓN
APP_USER = "admin"
APP_PW_HASH = "scrypt:32768:8:1$DtWYQBVkDz5zYzqW$95f8c8a8e5c7e2c9f3e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3"
SECRET_KEY = "clave_para_examen_motor_2024"
TCP_HOST = "127.0.0.1"
TCP_PORT = 5001

app = Flask(__name__, 
            template_folder="templates",
            static_folder="static",
            static_url_path="/static")
app.secret_key = SECRET_KEY

estado_cache = {
    'temperatura': 0.0,
    'velocidad': 0,
    'velocidad_porcentaje': 0,
    'rango': 'Esperando datos',
    'estado_sistema': 'Inicializando'
}

def is_logged_in():
    return session.get("logged_in") is True

def send_tcp(cmd):
    try:
        with socket.create_connection((TCP_HOST, TCP_PORT), timeout=3) as s:
            s.sendall((cmd + "\n").encode())
            data = s.recv(1024)
            return data.decode().strip()
    except:
        return "ERR:CONEXION"

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = request.form.get("username", "").strip()
        pw = request.form.get("password", "")
        if user == APP_USER and check_password_hash(APP_PW_HASH, pw):
            session["logged_in"] = True
            return redirect(url_for("index"))
        return render_template("login.html", error="Usuario o contraseña incorrectos")
    return render_template("login.html", error=None)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/")
def index():
    if not is_logged_in():
        return redirect(url_for("login"))
    return render_template("index.html")

@app.route("/api/estado")
def api_estado():
    if not is_logged_in():
        return jsonify({"error": "No autorizado"}), 401
    
    resp = send_tcp("STATUS")
    if resp.startswith("STATUS:"):
        partes = resp[7:].split(",")
        if len(partes) >= 4:
            estado_cache['temperatura'] = float(partes[0])
            estado_cache['velocidad'] = int(partes[1])
            estado_cache['velocidad_porcentaje'] = int((estado_cache['velocidad'] / 255) * 100)
            estado_cache['rango'] = partes[2]
            estado_cache['estado_sistema'] = partes[3]
    
    return jsonify(estado_cache)

@app.route("/api/motor", methods=["POST"])
def api_motor():
    if not is_logged_in():
        return jsonify({"error": "No autorizado"}), 401
    
    data = request.get_json() or {}
    velocidad = int(data.get("velocidad", 0))
    velocidad = max(0, min(255, velocidad))
    
    resp = send_tcp(f"MOTOR:{velocidad}")
    if resp.startswith("OK:MOTOR:"):
        val = int(resp[9:])
        return jsonify({"ok": True, "velocidad": val})
    return jsonify({"ok": False, "error": resp}), 500

if __name__ == "__main__":
    print("=" * 50)
    print("  THERMALDRIVE - Control Inteligente de Motor")
    print("=" * 50)
    print("  Usuario: admin")
    print("  Contraseña: motor123")
    print("  Accede a: http://localhost:5000")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
