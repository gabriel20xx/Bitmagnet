import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

// lucide-react has no built-in age-restriction glyph, so this mirrors its icon
// conventions (24x24 viewBox, stroke-based, forwardRef) to drop in wherever a
// LucideIcon is expected.
export const Explicit18Icon = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = 'currentColor', size = 24, strokeWidth = 2, className, ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        stroke="none"
        fill={color}
        fontFamily="sans-serif"
      >
        18+
      </text>
    </svg>
  ),
)

Explicit18Icon.displayName = 'Explicit18Icon'
