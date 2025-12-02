// src/routes/AppGalleryPage.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";

const presets = [
  {
    id: "rnd-orchestrator",
    name: "R&D Orchestrator",
    description: "Coordinate multi-step simulation + analysis workflows with resumable runs.",
    badge: "Recommended",
  },
  {
    id: "metalens-design",
    name: "Metalens Design Loop",
    description:
      "From spec → meta-atoms → surrogate model → lens → image analysis. Great for optics demos.",
    badge: "Optics",
  },
  {
    id: "game-agent",
    name: "Game Agent Loop",
    description:
      "Simulate environment → agent reactions → user feedback. Experimental agentic gameplay loop.",
    badge: "Experimental",
  },
];

// src/routes/AppGalleryPage.tsx
const AppGalleryPage: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          AetherGraph App Gallery
        </h1>
        <p className="text-xs text-muted-foreground">
          Pick a preset to explore how AetherGraph orchestrates multi-step, agentic workflows.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <Card
            key={preset.id}
            className="flex flex-col justify-between shadow-[var(--ag-shadow-soft)]"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <CardTitle className="text-sm font-semibold text-card-foreground tracking-tight">
                  {preset.name}
                </CardTitle>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border uppercase tracking-wide">
                  {preset.badge}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-xs text-muted-foreground">
                {preset.description}
              </p>
            </CardContent>
            <CardFooter className="pt-2 flex justify-end">
              <Button
                asChild
                variant="accent"
                size="sm"
                className="px-3 text-xs"
              >
                <Link to={`/apps/${preset.id}`}>Open</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Footnote */}
      <div className="text-[11px] text-muted-foreground">
        This is static mock data. Later, presets can be fetched from the backend or a config file.
      </div>
    </div>
  );
};


export default AppGalleryPage;
