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
  Sparkles,
  MessageCircle,
  Bolt,
  Cpu
} from "lucide-react";
import { useShellStore } from "../store/shellStore";
import type { AppPreset } from "../lib/types";

const AppGalleryPage: React.FC = () => {
  const presets = useShellStore((s) => s.presets);

  const corePresets = presets.filter((p) => p.category === "Core");
  const labPresets = presets.filter(
    (p) => p.category === "R&D Lab" || p.category === "Experimental"
  );
  const infraPresets = presets.filter((p) => p.category === "Infra");

  const renderIcon = (preset: AppPreset) => {
    switch (preset.iconKey) {
      case "chat":
        return <MessageCircle className="w-6 h-6 text-blue-500" />;
      case "microscope":
        return <Microscope className="w-6 h-6 text-blue-500" />;
      case "aperture":
        return <Aperture className="w-6 h-6 text-emerald-500" />;
      case "gamepad":
        return <Gamepad2 className="w-6 h-6 text-purple-500" />;
      case "cpu":
        return <Cpu className="w-6 h-6 text-slate-500" />;
      case "sparkles":
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      case "bolt":
        return <Bolt className="w-6 h-6 text-amber-500" />;
      default:
        return <Sparkles className="w-6 h-6 text-amber-500" />;
    }
  };

  const renderSection = (
    title: string,
    description: string,
    items: AppPreset[]
  ) => {
    if (!items.length) return null;

    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-1">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground/80">{description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((preset) => {
            const isComingSoon = preset.status === "coming-soon";

            return (
              <Card
                key={preset.id}
                className="group flex flex-col justify-between shadow-sm border-border/60 hover:shadow-md hover:border-border transition-all bg-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 group-hover:bg-background group-hover:shadow-sm transition-all">
                      {renderIcon(preset)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] font-medium uppercase tracking-wider px-2"
                      >
                        {preset.badge}
                      </Badge>
                      {isComingSoon && (
                        <Badge 
                          variant="outline" 
                          className="text-[9px] px-1.5 py-0 h-4 border-dashed text-muted-foreground"
                        >
                          Coming soon
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
                    {preset.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pb-4 flex-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {preset.shortDescription}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-0">
                  {isComingSoon ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full justify-center text-xs h-9 opacity-70 cursor-not-allowed bg-muted/20"
                    >
                      In development
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-xs h-9 hover:bg-primary hover:text-primary-foreground group-hover:border-primary/50 transition-colors"
                    >
                      <Link to={`/apps/${preset.id}`}>
                        <span>Open App</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    // Removed fixed height constraint to allow natural page scrolling via PaneLayout
    <div className="flex flex-col gap-8 w-full max-w-[1800px] mx-auto p-4 md:p-6 pb-20">
      
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
          <p className="text-xs text-muted-foreground ml-9 max-w-2xl">
            Pick a preset to explore how AetherGraph orchestrates multi-step, agentic workflows.
          </p>
        </div>
      </div>

      {/* 2. Sections */}
      <div className="flex flex-col gap-8">
        {renderSection(
          "Core Examples",
          "Lightweight demos that exercise the main AetherGraph services: channels, memory, artifacts, and simple graphs.",
          corePresets
        )}

        {renderSection(
          "R&D and Experimental Labs",
          "Heavier or more domain-specific flows – optics, R&D orchestration, and experimental agents.",
          labPresets
        )}

        {renderSection(
          "Infra & Systems",
          "System-level demos for job orchestration, monitoring, and observability.",
          infraPresets
        )}

        {/* Optional global placeholder if no apps loaded */}
        {!presets.length && (
          <Card className="flex flex-col items-center justify-center p-12 border-dashed border-border/60 bg-muted/10 text-muted-foreground gap-4">
            <div className="p-4 rounded-full bg-muted/50">
              <Sparkles className="w-6 h-6 opacity-40" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">App Registry Empty</p>
              <p className="text-xs opacity-70">
                No presets found in the store. Please check your configuration.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Footnote */}
      <div className="shrink-0 text-[10px] text-muted-foreground/60 border-t border-border/40 pt-4 flex justify-between items-center">
        <span>Presets are backed by registered graphs (graph_id = preset.id).</span>
        <span className="font-mono">v0.1.0-alpha</span>
      </div>
    </div>
  );
};

export default AppGalleryPage;