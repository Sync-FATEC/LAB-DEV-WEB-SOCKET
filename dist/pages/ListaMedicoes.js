import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./ListaMedicoes.css";
const ListaMedicoes = () => {
    const [medidas, setMedidas] = useState([]);
    const [conectado, setConectado] = useState(false);
    const [pausado, setPausado] = useState(false);
    useEffect(() => {
        const socket = io("http://localhost:3000");
        socket.on("connect", () => setConectado(true));
        socket.on("disconnect", () => setConectado(false));
        socket.on("stop", () => {
            console.log("Parando...");
            setPausado(true);
        });
        socket.on("volta", () => {
            console.log("Volta ...");
            setPausado(false);
        });
        socket.on("new_measurement", (data) => {
            if (!pausado) {
                setMedidas((prev) => [data, ...prev]);
            }
        });
        fetch("http://localhost:3000/api/measures")
            .then((res) => res.json())
            .then((data) => setMedidas(data))
            .catch((err) => console.error("Erro ao carregar medidas:", err));
        return () => {
            socket.disconnect();
        };
    }, []);
    const formatarData = (unixTime) => {
        const data = new Date(unixTime * 1000);
        return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    };
    return (_jsxs("div", { className: "container", children: [_jsx("h1", { children: "Lista de Medi\u00E7\u00F5es" }), _jsxs("table", { className: "measures-list", children: [_jsx("thead", { children: _jsxs("tr", { className: "measures-list-header", children: [_jsx("th", { children: "Data/Hora" }), _jsx("th", { children: "Temperatura (\u00B0C)" }), _jsx("th", { children: "Umidade (%)" })] }) }), _jsx("tbody", { children: medidas.length > 0 ? (medidas
                            .sort((a, b) => b.unixTime - a.unixTime)
                            .map((m) => (_jsxs("tr", { children: [_jsx("td", { children: formatarData(m.unixTime) }), _jsx("td", { children: m.temperature.toFixed(1) }), _jsx("td", { children: m.humidity.toFixed(1) })] }, m.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 3, className: "no-data", children: "Nenhuma medi\u00E7\u00E3o dispon\u00EDvel" }) })) })] }), _jsx("div", { className: `status ${conectado ? "connected" : "disconnected"}`, children: conectado ? "Conectado ao servidor" : "Desconectado do servidor" })] }));
};
export default ListaMedicoes;
