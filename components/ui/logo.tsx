interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 70 75"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Rectángulo horizontal superior - naranja claro */}
        <rect x="0" y="0" width="70" height="45" fill="#F47B20" />
        <rect x="0" y="45" width="35" height="30" fill="#ee580c" />
      </svg>
      {showText && <span className={`font-bold text-foreground ${text}`}>Presupuéstalo</span>}
    </div>
  )
}

export function LogoIcon({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 70 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rectángulo horizontal superior - naranja claro */}
      <rect x="0" y="0" width="70" height="45" fill="#F47B20" />
      <rect x="0" y="45" width="35" height="30" fill="#ee580c" />
    </svg>
  )
}
