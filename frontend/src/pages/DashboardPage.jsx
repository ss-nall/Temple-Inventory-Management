import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import StatCard from "../components/StatCard";
import api from "../services/api";

const chartPalette = {
  gold: "#d4af37",
  cream: "#f8f1e5",
  beige: "#e6d3b3",
  maroon: "#9a4444",
  amber: "#c58c2a"
};

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const [metricsRes, trendsRes] = await Promise.all([
          api.get("/inventory/dashboard"),
          api.get("/reports/trends")
        ]);
        setMetrics(metricsRes.data);
        setTrends(trendsRes.data);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  const monthlyData = trends.map((row) => {
    const totalAdded = row.addedSarees + row.addedPanchas;
    const totalDistributed = row.distributedSarees + row.distributedPanchas;
    const netFlow = totalAdded - totalDistributed;
    const totalMovement = totalAdded + totalDistributed;
    return {
      ...row,
      totalAdded,
      totalDistributed,
      totalMovement,
      netFlow
    };
  });

  const compositionData = [
    { name: "Sarees", value: metrics?.currentSarees ?? 0, color: chartPalette.gold },
    { name: "Panchas", value: metrics?.currentPanchas ?? 0, color: chartPalette.beige }
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-templeGold">Temple Vastram Inventory Management</h2>
        <p className="text-sm text-templeCream/80">Sacred stock intelligence for monthly planning and Kalyanam readiness</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Current Sarees" value={metrics?.currentSarees ?? 0} />
        <StatCard title="Current Panchas" value={metrics?.currentPanchas ?? 0} />
        <StatCard title="Distributed This Month" value={metrics?.distributedThisMonth ?? 0} />
        <StatCard title="Newly Added Stock" value={metrics?.addedThisMonth ?? 0} />
        <StatCard title="Remaining Inventory" value={metrics?.remainingInventory ?? 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="temple-card min-w-0 h-72 p-3 sm:h-80 sm:p-4">
          <h3 className="font-heading text-lg text-templeGold">Monthly Distribution Mix</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#9f8e66" />
              <XAxis dataKey="key" stroke="#f8f1e5" />
              <YAxis stroke="#f8f1e5" />
              <Tooltip />
              <Legend />
              <Bar dataKey="distributedSarees" stackId="dist" fill={chartPalette.gold} name="Sarees" />
              <Bar dataKey="distributedPanchas" stackId="dist" fill={chartPalette.beige} name="Panchas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="temple-card min-w-0 h-72 p-3 sm:h-80 sm:p-4">
          <h3 className="font-heading text-lg text-templeGold">Monthly Addition Mix</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#9f8e66" />
              <XAxis dataKey="key" stroke="#f8f1e5" />
              <YAxis stroke="#f8f1e5" />
              <Tooltip />
              <Legend />
              <Bar dataKey="addedSarees" stackId="add" fill={chartPalette.amber} name="Sarees Added" />
              <Bar dataKey="addedPanchas" stackId="add" fill={chartPalette.cream} name="Panchas Added" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="temple-card min-w-0 h-72 p-3 sm:h-80 sm:p-4">
          <h3 className="font-heading text-lg text-templeGold">Inventory Composition</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={compositionData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
              >
                {compositionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="temple-card min-w-0 h-72 p-3 sm:h-80 sm:p-4">
          <h3 className="font-heading text-lg text-templeGold">Net Monthly Flow</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#9f8e66" />
              <XAxis dataKey="key" stroke="#f8f1e5" />
              <YAxis stroke="#f8f1e5" />
              <Tooltip />
              <Legend />
              <Bar dataKey="netFlow" name="Net Flow (Added - Distributed)">
                {monthlyData.map((entry) => (
                  <Cell key={entry.key} fill={entry.netFlow >= 0 ? chartPalette.gold : chartPalette.maroon} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
