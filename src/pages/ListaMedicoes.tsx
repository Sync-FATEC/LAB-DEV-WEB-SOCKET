import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./ListaMedicoes.css";
import { log } from "console";

interface Medida {
  id: number;
  unixTime: number;
  temperature: number;
  humidity: number;
}

const ListaMedicoes: React.FC = () => {
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [conectado, setConectado] = useState(false);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.29.130:81");
    ws.onopen = () => {
      console.log("Conexão WebSocket estabelecida!");
    };
    ws.onmessage = async (event) => {
      console.log(event.data);
      try {
        const texto = event.data.toString();
        if (texto === "LIGOU") {
          window.close();
        }
        texto.split(",");
        console.log(texto);
        const temp = texto[0];
        const humidity = texto[1];
        const dados = {
          temperature: parseFloat(temp),
          humidity: parseFloat(humidity),
        };
        const unixTime = Math.floor(Date.now() / 1000);

        let novaMedida = {
          id: 292,
          unixTime: unixTime,
          temperature: temp,
          humidity: humidity,
        };
        setTimeout(() => setMedidas([...medidas, novaMedida]), 1000);
      } catch {
        console.log("ERROO");
      }
    };

    fetch("http://localhost:3000/api/measures")
      .then((res) => res.json())
      .then((data) => setMedidas(data))
      .catch((err) => console.error("Erro ao carregar medidas:", err));
  }, []);

  const formatarData = (unixTime: number) => {
    const data = new Date(unixTime * 1000);
    return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  };

  return (
    <div className="container">
      <h1>Lista de Medições</h1>

      <table className="measures-list">
        <thead>
          <tr className="measures-list-header">
            <th>Data/Hora</th>
            <th>Temperatura (°C)</th>
            <th>Umidade (%)</th>
          </tr>
        </thead>
        <tbody>
          {medidas.length > 0 ? (
            medidas
              .sort((a, b) => b.unixTime - a.unixTime)
              .map((m) => (
                <tr key={m.id}>
                  <td>{formatarData(m.unixTime)}</td>
                  <td>{m.temperature.toFixed(1)}</td>
                  <td>{m.humidity.toFixed(1)}</td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan={3} className="no-data">
                Nenhuma medição disponível
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className={`status ${conectado ? "connected" : "disconnected"}`}>
        {conectado ? "Conectado ao servidor" : "Desconectado do servidor"}
      </div>
    </div>
  );
};

export default ListaMedicoes;
