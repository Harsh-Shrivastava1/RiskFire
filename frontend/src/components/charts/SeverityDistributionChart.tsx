import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SeverityItem {
  severity: string
  count: number
  color: string
}

interface SeverityDistributionChartProps {
  data?: SeverityItem[]
  height?: number
}

const defaultData: SeverityItem[] = [
  { severity: 'CRITICAL', count: 3, color: '#dc2626' },
  { severity: 'HIGH', count: 5, color: '#ea580c' },
  { severity: 'MEDIUM', count: 8, color: '#d97706' },
  { severity: 'LOW', count: 12, color: '#2563eb' },
]

export const SeverityDistributionChart: React.FC<SeverityDistributionChartProps> = ({
  data = defaultData,
  height = 200,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis
            type="category"
            dataKey="severity"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
