import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dinheiro } from './formato'

const CORES = ['#2a78d6', '#eb6834']   // azul e laranja

// Gráfico de barras horizontal. "series" = [{ campo: 'total', nome: 'Período atual' }, ...]
export default function Grafico({ dados, series }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, dados.length * 56)}>
      <BarChart data={dados} layout="vertical" margin={{ left: 20, right: 20 }} barGap={2}>
        <CartesianGrid horizontal={false} stroke="#e9ecef" />
        <XAxis type="number" tickFormatter={(v) => dinheiro(v)} tick={{ fontSize: 12, fill: '#6c757d' }} />
        <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 12, fill: '#212529' }} />
        <Tooltip formatter={(v) => dinheiro(v)} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        {series.length > 1 && <Legend formatter={(nome) => <span className="text-body">{nome}</span>} />}
        {series.map((s, i) => (
          <Bar key={s.campo} dataKey={s.campo} name={s.nome} fill={CORES[i]} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
