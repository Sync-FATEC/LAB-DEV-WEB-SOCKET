import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

interface KaueFrancisco {
    unixTime: number;
    temperature: number;
    humidity: number;
}

async function initializeDatabase() {
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database,
    });

    // Create table SCript
    await db.exec(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unixTime INTEGER NOT NULL,
        temperature REAL NOT NULL,
        humidity REAL NOT NULL
    )`);

    return db;
}


const db = await initializeDatabase();

app.get('/api/measures', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM messages ORDER BY unixTime DESC LIMIT 9999');
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        res.status(500).send('Erro ao buscar mensagens');
    }
});


// WebSocket connection
// Conectando ao WebSocket
const ws = new WebSocket('ws://192.168.250.87:81');

ws.onopen = (event) => {
  console.log("Conexão WebSocket estabelecida!");
  
};

ws.onmessage = (event) => {
  console.log("Dados recebidos do servidor:", event.data);
  
  try {
    const dados = JSON.parse(event.data);
    console.log("Temperatura:", dados.temperature);
    console.log("Umidade:", dados.humidity);
  } catch (e) {
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
    console.log(`Servidor rodando na pagina http://localhost:${port}`);
});

