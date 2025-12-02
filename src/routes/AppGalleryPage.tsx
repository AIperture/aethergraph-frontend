import * as React from "react";
import { Link } from "react-router-dom";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  LayoutGrid, 
  ArrowRight, 
  Microscope, 
  Aperture, 
  Gamepad2, 
  Sparkles 
} from "lucide-react";

// Enhanced preset data with icons
const presets = [
  {
    id: "rnd-orchestrator",
    name: "R&D Orchestrator",
    description: "Coordinate multi-step simulation + analysis workflows with resumable runs.",
    badge: "Recommended",
    icon: <Microscope className="w-6 h-6 text-blue-500" />,
  },
  {
    id: "metalens-design",
    name: "Metalens Design Loop",
    description: "From spec → meta-atoms → surrogate model → lens → image analysis. Great for optics demos.",
    badge: "Optics",
    icon: <Aperture className="w-6 h-6 text-emerald-500" />,
  },
  {
    id: "game-agent",
    name: "Game Agent Loop",
    description: "Simulate environment → agent reactions → user feedback. Experimental agentic gameplay loop.",
    badge: "Experimental",
    icon: <Gamepad2 className="w-6 h-6 text-purple-500" />,
  },
];

const AppGalleryPage: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-6 w-full max-w-[1800px] mx-auto p-4 md:p-6">
      
      {/* 1. Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <LayoutGrid className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
                App Gallery
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-9">
            Pick a preset to explore how AetherGraph orchestrates multi-step, agentic workflows.
          </p>
        </div>
      </div>

      {/* 2. Gallery Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
          {presets.map((preset) => (
            <Card
              key={preset.id}
              className="group flex flex-col justify-between shadow-sm border-border/60 hover:shadow-md hover:border-border transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 group-hover:bg-background group-hover:shadow-sm transition-all">
                    {preset.icon}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] font-medium uppercase tracking-wider px-2"
                  >
                    {preset.badge}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  {preset.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pb-4 flex-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {preset.description}
                </p>
              </CardContent>
              
              <CardFooter className="pt-0">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-xs h-9 hover:bg-primary hover:text-primary-foreground group-hover:border-primary/50"
                >
                  <Link to={`/apps/${preset.id}`}>
                    <span>Open App</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Placeholder for "Coming Soon" */}
          <Card className="flex flex-col items-center justify-center p-6 border-dashed border-border/60 bg-muted/20 text-muted-foreground gap-3 min-h-[200px]">
             <div className="p-3 rounded-full bg-muted/50">
                <Sparkles className="w-5 h-5 opacity-40" />
             </div>
             <div className="text-center space-y-1">
                <p className="text-xs font-medium">More coming soon</p>
                <p className="text-[10px] opacity-70">Community presets will appear here.</p>
             </div>
          </Card>
        </div>
      </div>

      {/* Footnote */}
      <div className="shrink-0 text-[10px] text-muted-foreground/60 border-t border-border/40 pt-3 flex justify-between items-center">
        <span>Static mock data for preview purposes.</span>
        <span className="font-mono">v0.1.0-alpha</span>
      </div>
    </div>
  );
};

export default AppGalleryPage;