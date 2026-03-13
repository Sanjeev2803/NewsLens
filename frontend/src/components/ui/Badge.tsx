interface BadgeProps {
  label: string;
  color?: string;
  variant?: "default" | "sentiment" | "verification" | "rank";
  className?: string;
}

const variantStyles = {
  default: "bg-mist-gray/20 text-scroll-cream",
  sentiment: "",
  verification: "",
  rank: "",
};

export default function Badge({
  label,
  color,
  variant = "default",
  className = "",
}: BadgeProps) {
  const style = color
    ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` }
    : {};

  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-mono font-medium border ${variant === "default" ? variantStyles.default : "border-current/30"} ${className}`}
      style={style}
    >
      {label}
    </span>
  );
}
