// 轻量内联 SVG 图标（避免引入额外依赖）。统一 24x24 viewBox、currentColor 着色，
// 通过 className 控制尺寸（如 w-5 h-5）。遵循「不用 emoji 作图标」的规范。
import type { ReactNode } from 'react'

type IconProps = { className?: string }

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || 'w-5 h-5'}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function HomeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </Svg>
  )
}

export function HeadphonesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </Svg>
  )
}

export function PenIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Svg>
  )
}

export function ChartIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </Svg>
  )
}

export function RocketIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </Svg>
  )
}

export function BulbIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </Svg>
  )
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </Svg>
  )
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </Svg>
  )
}

export function BoxIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </Svg>
  )
}

export function FlameIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Svg>
  )
}

export function StarIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.617 1.878l.882 5.14a.53.53 0 0 1-.77.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.617-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
    </Svg>
  )
}

export function TargetIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  )
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Svg>
  )
}

/**
 * 品牌徽标：蓝色星球 + 橙色星环 + 小火箭。
 * 自带渐变配色（不随 currentColor 变化），用于顶部品牌区与 PWA 图标，
 * 小尺寸下仍能保持高识别度。
 */
export function PlanetMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className || 'w-7 h-7'} aria-hidden>
      <defs>
        <linearGradient id="pm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b8cff" />
          <stop offset="100%" stopColor="#1f47e6" />
        </linearGradient>
        <linearGradient id="pm-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffc257" />
          <stop offset="100%" stopColor="#ff8a1f" />
        </linearGradient>
      </defs>
      {/* 圆形底 */}
      <circle cx="16" cy="16" r="16" fill="url(#pm-bg)" />
      {/* 星球本体 */}
      <circle cx="15" cy="18" r="7" fill="#f8fbff" />
      {/* 星球表面纹理 */}
      <path
        d="M10 20c1.6-1.2 3-1 4.2.3 1-1.4 2.6-1.8 4-.9"
        stroke="#bcd2ff"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* 星环 */}
      <ellipse
        cx="15"
        cy="17.5"
        rx="11.5"
        ry="4.2"
        fill="none"
        stroke="url(#pm-ring)"
        strokeWidth="2.4"
        transform="rotate(-20 15 17.5)"
      />
      {/* 小火箭 */}
      <g transform="translate(18 2) rotate(28) scale(0.75)">
        <path d="M6 2c2.2 2 3.4 4.6 3.4 7.2L6 12l-3.4-2.8C2.6 6.6 3.8 4 6 2z" fill="#ffffff" />
        <circle cx="6" cy="7" r="1.4" fill="#1f47e6" />
        <path d="M6 12.6c1 1 1 2.2 0 3.2-1-1-1-2.2 0-3.2z" fill="#ff8a1f" />
      </g>
      {/* 装饰星星 */}
      <circle cx="5" cy="9" r="1.3" fill="#ffd27a" />
      <circle cx="8.5" cy="5" r="0.9" fill="#ffffff" />
    </svg>
  )
}

// 保留原有音频/麦克风图标（已为内联 SVG）
export function soundOutlined() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

export function micOutlined() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
