from flask import Flask, request, jsonify, send_from_directory, send_file
import sqlite3
import os
import io
import pandas as pd
from datetime import datetime

app = Flask(__name__)
DB_PATH = "data/registros.db"
FRONTEND_PATH = os.getenv('FRONTEND_PATH', '../Frontend')

def init_db():
    os.makedirs("data", exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS registros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha TEXT,
                serie TEXT,
                ticket TEXT,
                nombre TEXT,
                cedula TEXT,
                empresa TEXT,
                url TEXT
            )
        """)

@app.route("/")
def serve_index():
    try:
        return send_from_directory(FRONTEND_PATH, 'main.html')
    except FileNotFoundError:
        return "Frontend no encontrado. Por favor, construya el frontend.", 404

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(FRONTEND_PATH, filename)

@app.route("/api/registros", methods=["POST"])
def guardar_registro():
    try:
        data = request.get_json()
        required_fields = ["fecha", "serie", "ticket", "nombre", "cedula", "empresa", "url"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT INTO registros (fecha, serie, ticket, nombre, cedula, empresa, url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                data["fecha"],
                data["serie"],
                data["ticket"],
                data["nombre"],
                data["cedula"],
                data["empresa"],
                data["url"]
            ))
        return jsonify({"mensaje": "Registro guardado correctamente"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/registros", methods=["GET"])
def obtener_registros():
    mes_param = request.args.get("mes")
    query = "SELECT fecha, serie, ticket, nombre, cedula, empresa, url FROM registros"
    params = []
    if mes_param:
        try:
            fecha_inicio = datetime.strptime(mes_param, "%Y-%m")
            fecha_fin = datetime(fecha_inicio.year + int(fecha_inicio.month / 12), (fecha_inicio.month % 12) + 1, 1)
            query += " WHERE fecha >= ? AND fecha < ?"
            params = [fecha_inicio.strftime("%Y-%m-%d"), fecha_fin.strftime("%Y-%m-%d")]
        except ValueError:
            return jsonify({"error": "Parámetro de mes inválido. Use formato YYYY-MM."}), 400

    query += " ORDER BY fecha DESC"

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(query, params)
        registros = [
            dict(zip(('fecha', 'serie', 'ticket', 'nombre', 'cedula', 'empresa', 'url'), row))
            for row in cursor.fetchall()
        ]
    return jsonify(registros)

@app.route("/api/registros/excel", methods=["GET"])
def exportar_excel():
    mes_param = request.args.get("mes")
    if not mes_param:
        return jsonify({"error": "Parámetro 'mes' requerido (YYYY-MM)"}), 400

    try:
        fecha_inicio = datetime.strptime(mes_param, "%Y-%m")
        fecha_fin = datetime(fecha_inicio.year + int(fecha_inicio.month / 12), (fecha_inicio.month % 12) + 1, 1)
    except ValueError:
        return jsonify({"error": "Formato de mes inválido. Use YYYY-MM."}), 400

    with sqlite3.connect(DB_PATH) as conn:
        df = pd.read_sql_query("""
            SELECT fecha, serie, ticket, nombre, cedula, empresa FROM registros
            WHERE fecha >= ? AND fecha < ?
            ORDER BY fecha DESC
        """, conn, params=(fecha_inicio.strftime("%Y-%m-%d"), fecha_fin.strftime("%Y-%m-%d")))

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name="Registros")
    output.seek(0)

    filename = f"registros_{mes_param}.xlsx"
    return send_file(output, as_attachment=True, download_name=filename, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)