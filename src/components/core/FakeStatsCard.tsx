import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface FakeStatsCardProps {
  label: string;
  value: string;
  hint?: string;
}

export const FakeStatsCard: React.FC<FakeStatsCardProps> = ({
  label,
  value,
  hint,
}) => {
  return (
    <Card className="shadow-[var(--ag-shadow-soft)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-2xl font-semibold text-card-foreground">
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
