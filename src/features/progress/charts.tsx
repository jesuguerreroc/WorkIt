import { useId, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * Single-series charts (one hue = the lime accent). Specs from the dataviz guide:
 * bars ≤ 24px with a 4px rounded data-end, 2px lines, ≥ 8px markers with a surface
 * ring, hairline solid gridlines, no legend for one series (the title names it),
 * text in text tokens, a hover tooltip and a table view for every chart.
 */

const C = {
  mark: 'var(--color-primary)',
  grid: 'var(--color-border)',
  tick: 'var(--color-muted)',
  surface: 'var(--color-surface)',
  cursor: 'var(--color-surface-3)',
}

const compact = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

/** Any row with a "label" field plus the plotted numeric field. */
type Datum = { label: string }

interface ChartFrameProps {
  title: string
  subtitle?: string
  /** Shown instead of the chart when there is nothing to plot. */
  empty?: string | null
  table: { columns: string[]; rows: Array<Array<string | number>> }
  children: ReactNode
}

/** Title + chart + an accessible table view (<details>) for the same data. */
export function ChartFrame({ title, subtitle, empty, table, children }: ChartFrameProps) {
  const id = useId()
  return (
    <figure aria-labelledby={id} className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 sm:p-5">
      <figcaption>
        <p id={id} className="font-semibold">
          {title}
        </p>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </figcaption>
      {empty ? (
        <p className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border-strong px-6 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <>
          <div className="h-52 w-full" aria-hidden="true">
            {children}
          </div>
          <details className="text-sm">
            <summary className="min-h-11 cursor-pointer content-center text-muted hover:text-fg">Ver datos en tabla</summary>
            <table className="mt-2 w-full text-left tabular-nums">
              <thead className="text-muted">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="py-1 pr-3 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {row.map((cell, j) => (
                      <td key={j} className="py-1 pr-3">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ value?: unknown }>
  label?: unknown
  unit: string
}

function ChartTooltip({ active, payload, label, unit }: TooltipProps) {
  if (!active || !payload?.length || payload[0].value === null || payload[0].value === undefined) return null
  return (
    <div className="rounded-xl border border-border-strong bg-surface-2 px-3 py-2 text-sm shadow-xl">
      <p className="text-muted">{String(label)}</p>
      <p className="flex items-center gap-2 font-semibold text-fg">
        <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
        {full.format(Number(payload[0].value))} {unit}
      </p>
    </div>
  )
}

const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: C.tick, fontSize: 12 },
} as const

export function SingleBarChart({ data, dataKey, unit }: { data: ReadonlyArray<Datum>; dataKey: string; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={[...data]} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={1} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...axisProps} width={40} allowDecimals={false} tickFormatter={(v: number) => compact.format(v)} />
        <Tooltip cursor={{ fill: C.cursor, opacity: 0.5 }} content={(props) => <ChartTooltip {...props} unit={unit} />} />
        <Bar dataKey={dataKey} fill={C.mark} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SingleLineChart({ data, dataKey, unit }: { data: ReadonlyArray<Datum>; dataKey: string; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={[...data]} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={1} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...axisProps} width={44} domain={['auto', 'auto']} tickFormatter={(v: number) => compact.format(v)} />
        <Tooltip cursor={{ stroke: C.tick, strokeWidth: 1 }} content={(props) => <ChartTooltip {...props} unit={unit} />} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={C.mark}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          connectNulls
          dot={{ r: 4, fill: C.mark, stroke: C.surface, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: C.mark, stroke: C.surface, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
