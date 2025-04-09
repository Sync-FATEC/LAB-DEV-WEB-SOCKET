import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import WebSocket from 'ws'; // Importando WebSocket
const app = express();
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Inicializa o banco de dados
async function initializeDatabase() {
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database,
    });
    await db.exec(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unixTime INTEGER NOT NULL,
        temperature REAL NOT NULL,
        humidity REAL NOT NULL
    )`);
    return db;
}
async function startServer() {
    const db = await initializeDatabase();
    app.get('/api/measures', async (req, res) => {
        try {
            const rows = await db.all('SELECT * FROM messages ORDER BY unixTime DESC LIMIT 9999');
            res.json(rows);
        }
        catch (err) {
            console.error('Erro ao buscar mensagens:', err);
            res.status(500).send('Erro ao buscar mensagens');
        }
    });
    // Conectando ao WebSocket
    const ws = new WebSocket('ws://192.168.250.87:81');
    ws.onopen = () => {
        console.log("Conexão WebSocket estabelecida!");
    };
    ws.onmessage = async (event) => {
        console.log(event.data);
        try {
            const texto = event.data.toString();
            texto.split(",");
            console.log(texto);
            const temp = texto[0];
            const humidity = texto[1];
            const dados = {
                temperature: parseFloat(temp),
                humidity: parseFloat(humidity),
            };
            // Gerando timestamp no momento da inserção
            const unixTime = Math.floor(Date.now() / 1000);
            // Inserindo os dados no SQLite
            await db.run(`INSERT INTO messages (unixTime, temperature, humidity) VALUES (?, ?, ?)`, [unixTime, dados.temperature, dados.humidity]);
            console.log("Dados inseridos no banco de dados:", { unixTime, ...dados });
        }
        catch (e) {
            console.log("Dados recebidos não são JSON válido");
        }
    };
    ws.onerror = (error) => {
        console.error("Erro na conexão WebSocket:", error);
    };
    ws.onclose = (event) => {
        console.log("Conexão WebSocket fechada. Código:", event.code, "Motivo:", event.reason);
    };
    httpServer.listen(port, () => {
        console.log(`Servidor rodando na página http://localhost:${port}`);
    });
}
startServer().catch((err) => {
    console.error("Erro ao iniciar o servidor:", err);
});
