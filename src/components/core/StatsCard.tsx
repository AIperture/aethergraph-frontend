import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  hint,
  icon,
  className,
}) => {
  return (
    <Card className={cn(
      "overflow-hidden shadow-sm border-border/60 transition-all hover:border-border hover:shadow-md", 
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          {/* Label & Value */}
          <div className="space-y-1.5 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
            <div className="text-2xl font-bold text-foreground tracking-tight truncate">
              {value}
            </div>
          </div>

          {/* Icon Badge */}
          {icon && (
            <div className="shrink-0 p-2 rounded-md bg-muted/40 text-foreground/70 ring-1 ring-inset ring-border/20">
              {/* Ensure icon passed has appropriate sizing, usually w-4 h-4 */}
              {icon}
            </div>
          )}
        </div>

        {/* Hint Footer */}
        {hint && (
          <div className="mt-2 text-[10px] text-muted-foreground/80 leading-none">
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  );
};