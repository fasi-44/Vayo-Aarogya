// Inline figure components for the MoCA dialog.
//
// Reproduces the visual stimuli from the official MoCA v8.3 form so the
// assessor can administer the test from the dialog. The original PDF is
// also bundled at /scales/MoCA.pdf for reference.

import { cn } from '@/lib/utils'
import type { MoCAFigureKey } from '@/lib/clinical-scales/moca'

interface FigureProps {
  className?: string
}

/** Trail-making pattern: 1→A→2→B→3→C→4→D→5→E */
export function TrailMakingFigure({ className }: FigureProps) {
  // Coordinates roughly mirror the layout printed on the MoCA form.
  const nodes: { id: string; x: number; y: number; label?: string }[] = [
    { id: '1', x: 110, y: 40,  label: 'Begin' },
    { id: 'A', x: 200, y: 40 },
    { id: '2', x: 220, y: 105 },
    { id: 'B', x: 165, y: 110 },
    { id: '3', x: 245, y: 175 },
    { id: 'C', x: 130, y: 165 },
    { id: '4', x: 75,  y: 110 },
    { id: 'D', x: 30,  y: 50 },
    { id: '5', x: 35,  y: 195 },
    { id: 'E', x: 70,  y: 250, label: 'End' },
  ]

  return (
    <svg
      viewBox="0 0 280 290"
      className={cn('w-full max-w-[280px] text-foreground', className)}
      role="img"
      aria-label="Trail making — connect 1 to A to 2 to B to 3 to C to 4 to D to 5 to E"
    >
      {/* dashed path arrows between consecutive nodes */}
      {nodes.slice(0, -1).map((from, i) => {
        const to = nodes[i + 1]
        return (
          <line
            key={`${from.id}-${to.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.35"
          />
        )
      })}
      {/* nodes */}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r="14" fill="white" stroke="currentColor" strokeWidth="1.5" />
          <text
            x={n.x}
            y={n.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="14"
            fontWeight="600"
            fill="currentColor"
          >
            {n.id}
          </text>
          {n.label && (
            <text
              x={n.x + 18}
              y={n.y + 4}
              fontSize="10"
              fill="currentColor"
              opacity="0.6"
              fontStyle="italic"
            >
              {n.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

/** Three-dimensional bed/cot wireframe to be copied. */
export function CopyBedFigure({ className }: FigureProps) {
  return (
    <svg
      viewBox="0 0 200 130"
      className={cn('w-full max-w-[220px] text-foreground', className)}
      role="img"
      aria-label="Bed — three dimensional wireframe figure to copy"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* mattress top */}
        <polygon points="40,40 150,30 180,55 70,65" />
        {/* foot of bed (front face) */}
        <polygon points="40,40 70,65 70,95 40,70" />
        {/* head of bed (back face) */}
        <polygon points="150,30 180,55 180,30 150,5" />
        {/* mattress side / front edge */}
        <line x1="70" y1="65" x2="180" y2="55" />
        <line x1="180" y1="55" x2="180" y2="30" />
        {/* legs */}
        <line x1="50" y1="60" x2="50" y2="80" />
        <line x1="170" y1="50" x2="170" y2="70" />
      </g>
    </svg>
  )
}

/** Reference clock face showing five past ten (10:05). */
export function ClockFigure({ className }: FigureProps) {
  const numbers = [
    { n: 12, x: 50, y: 14 },
    { n: 1,  x: 70, y: 20 },
    { n: 2,  x: 84, y: 33 },
    { n: 3,  x: 88, y: 53 },
    { n: 4,  x: 84, y: 73 },
    { n: 5,  x: 70, y: 86 },
    { n: 6,  x: 50, y: 92 },
    { n: 7,  x: 30, y: 86 },
    { n: 8,  x: 16, y: 73 },
    { n: 9,  x: 12, y: 53 },
    { n: 10, x: 16, y: 33 },
    { n: 11, x: 30, y: 20 },
  ]
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('w-full max-w-[140px] text-foreground', className)}
      role="img"
      aria-label="Reference clock face showing five past ten"
    >
      <circle cx="50" cy="50" r="44" fill="white" stroke="currentColor" strokeWidth="1.5" />
      {numbers.map(({ n, x, y }) => (
        <text
          key={n}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fill="currentColor"
        >
          {n}
        </text>
      ))}
      {/* hour hand at 10 */}
      <line x1="50" y1="50" x2="28" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* minute hand at 1 (five past) */}
      <line x1="50" y1="50" x2="65" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="50" cy="50" r="2" fill="currentColor" />
    </svg>
  )
}

interface AnimalFigureProps extends FigureProps {
  label: string
  emoji: string
}

function AnimalFigure({ label, emoji, className }: AnimalFigureProps) {
  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center gap-1 px-3 py-2 rounded border border-dashed border-muted-foreground/30 bg-muted/20 min-w-[80px]',
        className
      )}
    >
      <span className="text-3xl leading-none" aria-hidden>{emoji}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  )
}

export function HorseFigure(props: FigureProps) {
  return <AnimalFigure {...props} emoji="🐴" label="Horse" />
}
export function TigerFigure(props: FigureProps) {
  return <AnimalFigure {...props} emoji="🐅" label="Tiger" />
}
export function DuckFigure(props: FigureProps) {
  return <AnimalFigure {...props} emoji="🦆" label="Duck" />
}

/** Render the figure for a given key. Returns null if no figure is registered. */
export function MoCAFigure({ figure, className }: { figure: MoCAFigureKey; className?: string }) {
  switch (figure) {
    case 'trail':         return <TrailMakingFigure className={className} />
    case 'bed':           return <CopyBedFigure className={className} />
    case 'clock':         return <ClockFigure className={className} />
    case 'animal-horse':  return <HorseFigure className={className} />
    case 'animal-tiger':  return <TigerFigure className={className} />
    case 'animal-duck':   return <DuckFigure className={className} />
  }
}
