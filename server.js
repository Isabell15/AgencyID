
const express = require('express');

const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Importa el paquete CORS
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON


// Middleware para habilitar CORS
app.use(cors({
  origin: ['http://agencyid.site', 'https://agencyid.site']
}));

// Usar bodyParser para poder leer JSON en el cuerpo de la solicitud
app.use(bodyParser.json());

// Conexión a la base de datos
const db = new sqlite3.Database('./autos.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Verificar y agregar la columna "imagen" si no existe
db.all('PRAGMA table_info(autos)', [], (err, rows) => {
    if (err) {
        console.error("Error al obtener información de la tabla:", err.message);
    } else {
        console.log("Información de la tabla 'autos':", rows);  // Verifica los datos recibidos
        
        if (Array.isArray(rows)) {
            const hasImagen = rows.some(column => column.name === 'imagen');
            if (!hasImagen) {
                db.run('ALTER TABLE autos ADD COLUMN imagen TEXT', (err) => {
                    if (err) {
                        console.error("Error al agregar la columna 'imagen':", err.message);
                    } else {
                        console.log("Columna 'imagen' agregada a la tabla 'autos'.");
                    }
                });
            } else {
                console.log("La columna 'imagen' ya existe en la tabla 'autos'.");
            }
        } else {
            console.error("El resultado de PRAGMA table_info no es un arreglo.");
        }
    }
});

// Crear tabla de autos si no existe
db.run(`
    CREATE TABLE IF NOT EXISTS autos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marca TEXT NOT NULL,
        modelo TEXT NOT NULL,
        tipo TEXT NOT NULL,
        precio REAL NOT NULL,
        año INTEGER NOT NULL,
        uso TEXT CHECK(uso IN ('ciudad', 'familiar', 'trabajo')) NOT NULL,
        consumo TEXT CHECK(consumo IN ('bajo', 'medio', 'alto')) NOT NULL,
         imagen TEXT
    )
`, (err) => {
    if (err) {
        console.error('Error al crear la tabla:', err.message);
    } else {
        console.log('Tabla "autos" verificada o creada.');
    }
});

// Verificar y agregar la columna "imagen" si no existe
db.all(`PRAGMA table_info(autos)`, [], (err, rows) => {
    if (err) {
        console.error("Error al obtener información de la tabla:", err.message);
    } else {
        // Asegurarse de que rows es un arreglo
        console.log("Información de la tabla:", rows);  // Agregar un log para ver la estructura de 'rows'
        
        if (Array.isArray(rows)) {
            const hasImagen = rows.some(column => column.name === 'imagen'); // Verificar si la columna 'imagen' existe
            if (!hasImagen) {
                db.run(`ALTER TABLE autos ADD COLUMN imagen TEXT`, (err) => {
                    if (err) {
                        console.error("Error al agregar la columna 'imagen':", err.message);
                    } else {
                        console.log("Columna 'imagen' agregada a la tabla 'autos'.");
                    }
                });
            } else {
                console.log("La columna 'imagen' ya existe en la tabla 'autos'.");
            }
        } else {
            console.error("El resultado de PRAGMA table_info no es un arreglo.");
        }
    }
});



// Endpoint para obtener todos los autos
app.get('/api/autos', (req, res) => {
    db.all('SELECT * FROM autos', [], (err, rows) => {
        if (err) {
            console.error('Error al recuperar los autos:', err.message);
            return res.status(500).json({ error: 'Error al recuperar los autos.' });
        }
        res.status(200).json(rows);  // Retorna todos los autos en formato JSON
    });
});

// Endpoint para buscar autos según uso, precio y consumo
app.get('/api/autos/buscar', (req, res) => {
    const { uso, precio, consumo} = req.query;

    // Validar los parámetros
    if (!uso || !precio ||!consumo) {
        return res.status(400).json({ error: 'Se deben proporcionar los parámetros "uso" , "precio" y "consumo".' });
    }

    // Realizar la consulta en la base de datos
    const query = `
        SELECT * FROM autos 
        WHERE uso = ? AND precio <= ? AND consumo = ?
    `;
    db.all(query, [uso, precio, consumo], (err, rows) => {
        if (err) {
            console.error('Error al realizar la búsqueda:', err.message);
            return res.status(500).json({ error: 'Error al realizar la búsqueda.' });
        }
        res.status(200).json(rows);  // Retorna los resultados en formato JSON
    });
});


// Ruta para obtener todos los autos
app.get('/api/autos', (req, res) => {
    db.all('SELECT * FROM autos', (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener los autos', error: err.message });
        }
        res.json(rows);
    });
});

// Ruta para agregar un nuevo auto
app.post('/api/autos', (req, res) => {
    const { marca, modelo, tipo, precio, año, uso, consumo, imagen } = req.body;

    if (!marca || !modelo || !tipo || !precio || !año || !uso || !consumo || !imagen) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const sql = `INSERT INTO autos (marca, modelo, tipo, precio, año, uso, consumo, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [marca, modelo, tipo, precio, año, uso, consumo, imagen];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error al agregar el auto', error: err.message });
        }
        res.status(201).json({ message: 'Auto agregado correctamente', id: this.lastID });
    });
});

// Ruta para actualizar un auto
app.put('/api/autos/:id', (req, res) => {
    const { id } = req.params;  // Obtener el id del auto desde la URL
    const { marca, modelo, tipo, precio, año, uso, consumo, imagen } = req.body;

    // Verificar que los campos necesarios estén presentes
    if (!marca || !modelo || !tipo || !precio || !año || !uso || !consumo || !imagen) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Consulta SQL para actualizar el auto
    const sql = `UPDATE autos SET marca = ?, modelo = ?, tipo = ?, precio = ?, año = ?, uso = ?, consumo = ?, imagen = ? WHERE id = ?`;
    const params = [marca, modelo, tipo, precio, año, uso, consumo, imagen, id];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar el auto', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Auto no encontrado' });
        }
        res.status(200).json({ message: 'Auto actualizado correctamente' });
    });
});

// Ruta para obtener un auto específico por su id
app.get('/api/autos/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM autos WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener el auto', error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Auto no encontrado' });
        }
        res.json(row);
    });
});
// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
