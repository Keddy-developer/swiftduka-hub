// components/ui/Badge.tsx
import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  color?: "green" | "yellow" | "red" | "blue";
  className?: string;
}

export function Badge({ children, color = "blue", className = "" }: BadgeProps) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
