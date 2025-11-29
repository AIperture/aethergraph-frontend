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

const AppGalleryPage: React.FC = () => {
  return (
    <div className="h-full bg-background">
      <div className="h-full max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            AetherGraph App Gallery
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick a preset to explore how AetherGraph orchestrates multi-step, agentic workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map((preset) => (
            <Card
              key={preset.id}
              className="flex flex-col justify-between shadow-[var(--ag-shadow-soft)]"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <CardTitle className="text-sm text-card-foreground">
                    {preset.name}
                  </CardTitle>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
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
                  className="px-3"
                >
                  <Link to={`/apps/${preset.id}`}>Open</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          This is static mock data. Later, presets can be fetched from the backend or a config file.
        </div>
      </div>
    </div>
  );
};

export default AppGalleryPage;
