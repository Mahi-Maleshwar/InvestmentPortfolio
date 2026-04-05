import type { Analytics } from '@/types/api'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const chartFont = { family: "'DM Sans', system-ui, sans-serif", size: 12 }
const gridColor = 'rgba(148, 163, 184, 0.08)'
const tickColor = '#94a3b8'

const typeColors: Record<string, string> = {
  stock: 'rgba(45, 212, 191, 0.85)',
  crypto: 'rgba(56, 189, 248, 0.9)',
  mutual_fund: 'rgba(167, 139, 250, 0.9)',
}

export function GrowthChart({ history }: { history: Analytics['portfolio_history'] }) {
  const labels = history.map((h) => h.date)
  const data = {
    labels,
    datasets: [
      {
        label: 'Portfolio value',
        data: history.map((h) => h.total_value),
        borderColor: 'rgb(45, 212, 191)',
        backgroundColor: 'rgba(45, 212, 191, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  }
  return (
    <div className="h-[280px] w-full">
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 900, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              titleFont: chartFont,
              bodyFont: chartFont,
              padding: 12,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: tickColor, maxRotation: 0 },
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: tickColor,
                callback: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
              },
            },
          },
        }}
      />
    </div>
  )
}

export function DistributionChart({ slices }: { slices: Analytics['asset_distribution'] }) {
  const bg = slices.map((s) => typeColors[s.asset_type] ?? 'rgba(148, 163, 184, 0.7)')
  const data = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: bg,
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  }
  return (
    <div className="mx-auto h-[260px] max-w-sm">
      <Doughnut
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          animation: { animateRotate: true, duration: 800 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: tickColor, padding: 14, font: chartFont },
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              callbacks: {
                label: (ctx) => {
                  const v = ctx.parsed
                  return ` ${ctx.label}: ₹${Number(v).toLocaleString('en-IN')}`
                },
              },
            },
          },
        }}
      />
    </div>
  )
}

export function PlBarChart({ bars }: { bars: Analytics['profit_loss_by_asset'] }) {
  const labels = bars.map((b) => b.asset_name)
  const values = bars.map((b) => b.profit_loss)
  const colors = values.map((v) => (v >= 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(248, 113, 113, 0.85)'))
  const data = {
    labels,
    datasets: [
      {
        label: 'P/L',
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }
  return (
    <div className="h-[300px] w-full">
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 800, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              callbacks: {
                label: (ctx) => ` ₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: tickColor, maxRotation: 45, minRotation: 0 },
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: tickColor,
                callback: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
              },
            },
          },
        }}
      />
    </div>
  )
}
