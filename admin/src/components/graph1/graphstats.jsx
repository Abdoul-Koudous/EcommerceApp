import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CircularProgress from "../CircularProgress/CircularProgress";
import "./graphstats.scss";
import { fetchDataFromApi } from "../../pages/utils/api";

const METRICS = {
  ventes: { label: "Totals de Vents", color: "#3b82f6", dotClass: "sales" },
  clients: { label: "Totals clients", color: "#10b981", dotClass: "customer" },
};

const GraphStats = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeMetric, setActiveMetric] = useState("ventes");

  useEffect(() => {
    fetchDataFromApi("/api/dashboard/monthly-stats")
      .then((res) => {
        if (res?.success) {
          setData(res.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="graph-container loading">
        <CircularProgress />
      </div>
    );
  }

  if (error || !data.length) {
    return (
      <div className="graph-container">
        <p>Impossible de charger les statistiques.</p>
      </div>
    );
  }

  const { label, color } = METRICS[activeMetric];

  return (
    <div className="graph-container">
      <h2>📊 Évolution des ventes & clients</h2>

      <div className="points">
        {Object.entries(METRICS).map(([key, meta]) => (
          <span
            key={key}
            className={`legend-item ${activeMetric === key ? "active" : ""}`}
            onClick={() => setActiveMetric(key)}
          >
            <span className={meta.dotClass}></span>
            {meta.label}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          key={activeMetric}
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#555" />
          <YAxis
            stroke="#555"
            allowDecimals={false}
            width={70}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Bar
            dataKey={activeMetric}
            fill={color}
            name={label}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraphStats;
