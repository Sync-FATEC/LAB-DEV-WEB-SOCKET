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
    const ws = new WebSocket("ws://192.168.89.130:81");
    ws.onopen = () => {
      console.log("Conexão WebSocket estabelecida!");
    };
    ws.onmessage = async (event) => {
      try {
        const texto = event.data.toString();
        if (texto === "LIGOU") {
          window.close();
        }
        const vars = texto.split(",");
        const temp = vars[0];
        const humidity = vars[1];

        const unixTime = Math.floor(Date.now() / 1000);

        let novaMedida = {
          id: 292,
          unixTime: unixTime,
          temperature: temp,
          humidity: humidity,
        };
        
        updateMedidas(novaMedida)

      } catch {
        console.log("ERRO");
      }
    };

    fetch("http://localhost:3000/api/measures")
      .then((res) => res.json())
      .then((data) => setMedidas(data))
      .catch((err) => console.error("Erro ao carregar medidas:", err));
  }, []);

  const updateMedidas = (medida: any) => {
    setMedidas((prev) => [...prev, medida]);
  };

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
                  <td>{m.temperature}</td>
                  <td>{m.humidity}</td>
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

      
    </div>
  );
};

export default ListaMedicoes;
