import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./graphstats.scss";

const data = [
  { name: "Janv", clients: 400, ventes: 240 },
  { name: "Févr", clients: 300, ventes: 139 },
  { name: "Mars", clients: 500, ventes: 400 },
  { name: "Avr", clients: 278, ventes: 390 },
  { name: "Mai", clients: 489, ventes: 480 },
  { name: "Juin", clients: 239, ventes: 380 },
  { name: "Juil", clients: 349, ventes: 430 },
  { name: "Août", clients: 420, ventes: 460 },
  { name: "Sept", clients: 510, ventes: 500 },
  { name: "Oct", clients: 470, ventes: 410 },
  { name: "Nov", clients: 530, ventes: 490 },
  { name: "Déc", clients: 600, ventes: 550 },
];


const GraphStats = () => {
  return (
    <div className="graph-container">
      <h2>📊 Évolution des ventes & clients</h2>
      <div className="points">
        <span className="customer"></span>
        Totals clients
        <span className="sales"></span>
        Totals de Vents
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#555" />
          <YAxis stroke="#555" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="ventes"
            stroke="#3b82f6"
            strokeWidth={2}
            activeDot={{ r: 7 }}
            name="Ventes (en unités)"
          />
          <Line
            type="monotone"
            dataKey="clients"
            stroke="#10b981"
            strokeWidth={2}
            name="Clients"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraphStats;
