from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os

app = Flask(__name__)
DB_PATH = "data/registros.db"
FRONTEND_PATH = os.getenv('FRONTEND_PATH', '../Frontend')

def init_db():
    os.makedirs("data", exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("PRAGMA table_info(registros)")
        columns = [col[1] for col in cursor.fetchall()]
        if "cedula" not in columns:
            conn.execute("ALTER TABLE registros ADD COLUMN cedula TEXT")
        if "ticket" not in columns:
            conn.execute("ALTER TABLE registros ADD COLUMN ticket TEXT")

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
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("""
            SELECT fecha, serie, ticket, nombre, cedula, empresa, url
            FROM registros
            ORDER BY id DESC
            LIMIT 5
        """)
        registros = [
            dict(zip(('fecha', 'serie', 'ticket', 'nombre', 'cedula', 'empresa', 'url'), row))
            for row in cursor.fetchall()
        ]
    return jsonify(registros)

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)