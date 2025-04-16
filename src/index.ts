import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import WebSocket from 'ws'; // Importando WebSocket
import cors from 'cors'; // Importe o módulo cors
import { log } from 'console';

const app = express();
app.use(cors()); // Use o middleware cors
const port = 3000;
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

interface Medida {
    temperature: number;
    humidity: number;
}

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
            const rows = await db.all('SELECT * FROM messages ORDER BY unixTime DESC LIMIT 10');
            res.json(rows);
        } catch (err) {
            console.error('Erro ao buscar mensagens:', err);
            res.status(500).send('Erro ao buscar mensagens');
        }
    });

    // Conectando ao WebSocket
    const ws = new WebSocket('ws://192.168.89.130:81');

    ws.onopen = () => {
        console.log("Conexão WebSocket estabelecida!");
    };

ws.onmessage = async (event) => {
    const texto = event.data.toString().trim();
    console.log("Recebido:", texto);

    // Trata mensagens de controle
    if (texto === "LIGADO") {
        io.emit('stop', "stop");
        return; // Impede processamento abaixo
    }

    if (texto === "DESLIGADO") {
        io.emit('volta', "volta");
        return; // Impede processamento abaixo
    }

    try {
        const vars = texto.split(",");
        
        // Verificação se temos exatamente duas partes
        if (vars.length !== 2) {
            console.warn("Formato inesperado:", texto);
            return;
        }

        const temp = parseFloat(vars[0]);
        const humidity = parseFloat(vars[1]);

        // Verifica se os valores são válidos
        if (isNaN(temp) || isNaN(humidity)) {
            console.warn("Valores inválidos:", vars);
            return;
        }

        const dados: Medida = { temperature: temp, humidity: humidity };
        const unixTime = Math.floor(Date.now() / 1000);

        await db.run(
            `INSERT INTO messages (unixTime, temperature, humidity) VALUES (?, ?, ?)`,
            [unixTime, dados.temperature, dados.humidity]
        );

        console.log("Dados inseridos no banco de dados:", { unixTime, ...dados });
    } catch (e) {
        console.error("Erro ao processar mensagem:", e);
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
