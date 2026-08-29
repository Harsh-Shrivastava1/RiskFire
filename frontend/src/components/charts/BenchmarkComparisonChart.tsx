import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface BenchmarkComparisonChartProps {
  data?: {
    metric: string
    before: number
    after: number
  }[]
  height?: number
}

const defaultData = [
  { metric: 'Detection Recall (%)', before: 71.4, after: 94.2 },
  { metric: 'Precision (%)', before: 82.5, after: 95.8 },
  { metric: 'F1 Score (%)', before: 76.5, after: 95.0 },
  { metric: 'False Positive (%)', before: 4.8, after: 1.2 },
  { metric: 'Attack Success (%)', before: 28.6, after: 5.8 },
]

export const BenchmarkComparisonChart: React.FC<BenchmarkComparisonChartProps> = ({
  data = defaultData,
  height = 260,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="metric"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fill: '#475569', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value: any) => [`${value}%`]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
          />
          <Bar
            dataKey="before"
            name="Baseline Policy (v1.2)"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="after"
            name="Patched Policy (v1.3)"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
