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
import { PolicyEffectivenessPoint } from '@/types'

interface PolicyEffectivenessChartProps {
  data: PolicyEffectivenessPoint[]
  height?: number
}

export const PolicyEffectivenessChart: React.FC<PolicyEffectivenessChartProps> = ({
  data,
  height = 240,
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
            dataKey="policyName"
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tick={{ fill: '#475569', fontSize: 10 }}
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
            dataKey="coverageRate"
            name="Coverage Rate (%)"
            fill="#93c5fd"
            radius={[4, 4, 0, 0]}
            barSize={16}
          />
          <Bar
            dataKey="effectivenessRate"
            name="Effectiveness Rate (%)"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
            barSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
