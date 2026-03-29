import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

/* ─── inline the component (no router/context deps) ───────── */
function TyreIcon({ filled, size = 40 }) {
  const color = filled ? '#D97706' : '#D1D5DB'
  return (
    <svg data-testid={filled ? 'tyre-filled' : 'tyre-empty'}
         width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="4" />
    </svg>
  )
}

const WHEEL_LABELS = ['', 'Small', 'Medium', 'Large', 'Very large']
const WHEEL_DESCS  = ['', '< 30 cm', '30–60 cm', '60–90 cm', '> 90 cm']

function WheelSelector({ value, onChange }) {
  return (
    <div>
      <label>How many wheels fit inside the pothole?</label>
      <div role="group">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            data-testid={`wheel-${n}`}
            onClick={() => onChange(value === n ? null : n)}
          >
            <TyreIcon filled={value >= n} size={44} />
            <span>{n}</span>
          </button>
        ))}
      </div>
      {value && (
        <div data-testid="wheel-summary">
          {value} wheel{value > 1 ? 's' : ''} — {WHEEL_LABELS[value]} pothole
          {' '}≈ {WHEEL_DESCS[value]}
        </div>
      )}
    </div>
  )
}

/* ─── tests ────────────────────────────────────────────────── */
describe('WheelSelector', () => {
  it('renders 4 wheel buttons', () => {
    render(<WheelSelector value={null} onChange={() => {}} />)
    expect(screen.getByTestId('wheel-1')).toBeInTheDocument()
    expect(screen.getByTestId('wheel-2')).toBeInTheDocument()
    expect(screen.getByTestId('wheel-3')).toBeInTheDocument()
    expect(screen.getByTestId('wheel-4')).toBeInTheDocument()
  })

  it('shows no summary when value is null', () => {
    render(<WheelSelector value={null} onChange={() => {}} />)
    expect(screen.queryByTestId('wheel-summary')).not.toBeInTheDocument()
  })

  it('shows summary when a wheel count is selected', () => {
    render(<WheelSelector value={2} onChange={() => {}} />)
    expect(screen.getByTestId('wheel-summary')).toHaveTextContent('2 wheels')
    expect(screen.getByTestId('wheel-summary')).toHaveTextContent('Medium pothole')
    expect(screen.getByTestId('wheel-summary')).toHaveTextContent('30–60 cm')
  })

  it('fills tyre icons up to the selected count', () => {
    render(<WheelSelector value={3} onChange={() => {}} />)
    const filled = screen.getAllByTestId('tyre-filled')
    const empty  = screen.getAllByTestId('tyre-empty')
    expect(filled).toHaveLength(3)
    expect(empty).toHaveLength(1)
  })

  it('all 4 tyres filled when value is 4', () => {
    render(<WheelSelector value={4} onChange={() => {}} />)
    expect(screen.getAllByTestId('tyre-filled')).toHaveLength(4)
    expect(screen.queryAllByTestId('tyre-empty')).toHaveLength(0)
  })

  it('all tyres empty when value is null', () => {
    render(<WheelSelector value={null} onChange={() => {}} />)
    expect(screen.queryAllByTestId('tyre-filled')).toHaveLength(0)
    expect(screen.getAllByTestId('tyre-empty')).toHaveLength(4)
  })

  it('calls onChange with the clicked number', () => {
    const onChange = vi.fn()
    render(<WheelSelector value={null} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('wheel-3'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('calls onChange with null when clicking the same value (deselect)', () => {
    const onChange = vi.fn()
    render(<WheelSelector value={2} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('wheel-2'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('summary text is correct for each count', () => {
    const cases = [
      [1, 'Small pothole',     '< 30 cm'],
      [2, 'Medium pothole',    '30–60 cm'],
      [3, 'Large pothole',     '60–90 cm'],
      [4, 'Very large pothole','> 90 cm'],
    ]
    cases.forEach(([count, label, size]) => {
      const { unmount } = render(<WheelSelector value={count} onChange={() => {}} />)
      const summary = screen.getByTestId('wheel-summary')
      expect(summary).toHaveTextContent(label)
      expect(summary).toHaveTextContent(size)
      unmount()
    })
  })
})
