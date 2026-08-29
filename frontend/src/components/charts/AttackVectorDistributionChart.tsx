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
import { AttackVectorDistribution } from '@/types'

interface AttackVectorDistributionChartProps {
  data: AttackVectorDistribution[]
  height?: number
}

const colors = ['#dc2626', '#ea580c', '#d97706', '#2563eb', '#64748b', '#7c3aed']

export const AttackVectorDistributionChart: React.FC<AttackVectorDistributionChartProps> = ({
  data,
  height = 240,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis
            type="category"
            dataKey="vectorName"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value: any, name: any, item: any) => [
              `${value} bypasses (${item.payload.bypassRate * 100}% rate)`,
              item.payload.vectorName,
            ]}
          />
          <Bar dataKey="bypassesDetected" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
