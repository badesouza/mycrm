"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

type EvolutionPoint = { date: string; total: number };
interface DashboardStats {
  period: { start: string; end: string };
  totalCustomers: number;
  newCustomersInPeriod: number;
  totalAmount: number;
  forecastInPeriod: number;
  revenueInPeriod: number;
  totalUnpaid: number;
  performance: number;
  evolution: EvolutionPoint[];
}

const API_BASE_URL = 'http://localhost:3001';

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const params = new URLSearchParams();
      if (start) params.set('start', new Date(start).toISOString());
      if (end) params.set('end', new Date(end).toISOString());

      const res = await fetch(`${API_BASE_URL}/api/dashboard/stats?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 p-8">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Data início</label>
            <input type="date" className="bg-gray-700 text-white rounded px-3 py-2" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Data fim</label>
            <input type="date" className="bg-gray-700 text-white rounded px-3 py-2" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <Button onClick={fetchStats} className="bg-blue-600 hover:bg-blue-700 text-white">{loading ? 'Buscando...' : 'Pesquisar'}</Button>
        </div>

        {stats && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-blue-900/50 border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-200">Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-blue-100">
                  <div>
                    <div className="text-sm text-blue-300">Novos no período</div>
                    <div className="text-2xl font-bold">{stats.newCustomersInPeriod}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-300">Total ativos</div>
                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-900/40 border-green-800">
              <CardHeader>
                <CardTitle className="text-green-200">Faturamento (período)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-green-100">
                  <div>
                    <div className="text-sm text-green-300">Previsão (período)</div>
                    <div className="text-xl font-bold">
                      R$ {Number(stats.forecastInPeriod || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-300">Faturado (pago)</div>
                    <div className="text-xl font-bold">
                      R$ {Number(stats.revenueInPeriod || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-300">Não pago (período)</div>
                    <div className="text-xl font-bold">
                      R$ {Number(stats.totalUnpaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-300">Performance</div>
                    <div className="text-xl font-bold">
                      {Number(stats.performance || 0).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/40 border-gray-800 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-gray-200">Evolução de Clientes (linha)</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart data={stats.evolution || []} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: EvolutionPoint[] }) {
  if (!data.length) return <div className="text-gray-400">Sem dados</div>;
  const width = 800;
  const height = 240;
  const padding = 32;
  const xs = data.map(d => new Date(d.date).getTime());
  const ys = data.map(d => d.total);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xScale = (t: number) => padding + ((t - xMin) / Math.max(1, (xMax - xMin))) * (width - padding * 2);
  const yScale = (v: number) => height - padding - ((v - yMin) / Math.max(1, (yMax - yMin))) * (height - padding * 2);
  const points = data.map(d => `${xScale(new Date(d.date).getTime())},${yScale(d.total)}`).join(' ');
  // Build ticks
  const xTickCount = 4;
  const xTicks: Array<{ x: number; label: string }> = [];
  for (let i = 0; i <= xTickCount; i++) {
    const t = xMin + ((xMax - xMin) * i) / xTickCount;
    const date = new Date(t);
    const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    xTicks.push({ x: xScale(t), label });
  }

  const yTicksValues = [yMin, Math.round((yMin + yMax) / 2), yMax];
  const yTicks = yTicksValues.map(v => ({ y: yScale(v), label: String(v) }));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-60">
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="1" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth="1" />
      {/* X ticks */}
      {xTicks.map((t, idx) => (
        <g key={`xt-${idx}`}>
          <line x1={t.x} y1={height - padding} x2={t.x} y2={height - padding + 6} stroke="#4B5563" strokeWidth="1" />
          <text x={t.x} y={height - padding + 18} textAnchor="middle" fontSize="10" fill="#9CA3AF">{t.label}</text>
        </g>
      ))}
      {/* Y ticks */}
      {yTicks.map((t, idx) => (
        <g key={`yt-${idx}`}>
          <line x1={padding - 6} y1={t.y} x2={padding} y2={t.y} stroke="#4B5563" strokeWidth="1" />
          <text x={padding - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill="#9CA3AF">{t.label}</text>
        </g>
      ))}
      <polyline fill="none" stroke="#60A5FA" strokeWidth="2" points={points} />
    </svg>
  );
}