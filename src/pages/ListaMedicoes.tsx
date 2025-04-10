import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './ListaMedicoes.css';

interface Medida {
  id: number;
  unixTime: number;
  temperature: number;
  humidity: number;
}

const ListaMedicoes: React.FC = () => {
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));

    socket.on('new_measurement', (data: Medida) => {
      setMedidas(prev => [data, ...prev]);
    });

    fetch('http://localhost:3000/api/measures')
      .then(res => res.json())
      .then(data => setMedidas(data))
      .catch(err => console.error('Erro ao carregar medidas:', err));

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatarData = (unixTime: number) => {
    const data = new Date(unixTime * 1000);
    return data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  return (
    <div className="container">
      <h1>Lista de Medições</h1>

      <table className="measures-list">
        <thead>
          <tr className='measures-list-header'>
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
              <td colSpan={3} className="no-data">Nenhuma medição disponível</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className={`status ${conectado ? 'connected' : 'disconnected'}`}>
        {conectado ? 'Conectado ao servidor' : 'Desconectado do servidor'}
      </div>
    </div>
  );
};

export default ListaMedicoes;
