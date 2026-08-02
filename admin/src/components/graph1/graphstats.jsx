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
  ventes: { label: "Totals de Vents", color: "var(--color-info)", dotClass: "gst-dot-sales" },
  clients: { label: "Totals clients", color: "var(--color-success)", dotClass: "gst-dot-customer" },
};

// ✅ largeur d'écran suivie en live pour adapter l'axe X (labels inclinés sous 600px)
const useIsNarrow = (breakpoint = 600) => {
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isNarrow;
};

const GraphStats = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeMetric, setActiveMetric] = useState("ventes");
  const isNarrow = useIsNarrow();

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
      <div className="gst-container gst-loading">
        <CircularProgress />
      </div>
    );
  }

  if (error || !data.length) {
    return (
      <div className="gst-container">
        <p>Impossible de charger les statistiques.</p>
      </div>
    );
  }

  const { label, color } = METRICS[activeMetric];

  return (
    <div className="gst-container">
      <h2>📊 Évolution des ventes & clients</h2>

      <div className="gst-legend">
        {Object.entries(METRICS).map(([key, meta]) => (
          <span
            key={key}
            className={`gst-legend-item ${activeMetric === key ? "active" : ""}`}
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
          margin={{ top: 10, right: 20, left: 20, bottom: isNarrow ? 25 : 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
          <XAxis
            dataKey="name"
            stroke="var(--color-text-secondary)"
            interval={0}
            angle={isNarrow ? -45 : 0}
            textAnchor={isNarrow ? "end" : "middle"}
            height={isNarrow ? 50 : 30}
          />
          <YAxis
            stroke="var(--color-text-secondary)"
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