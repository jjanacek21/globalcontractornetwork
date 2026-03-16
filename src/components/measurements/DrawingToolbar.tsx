import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  MousePointer2, Pentagon, Minus, Trash2, Undo2, Redo2
} from "lucide-react";
import type { DrawingTool, EdgeType } from "./types";
import { EDGE_COLORS, EDGE_LABELS } from "./types";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  activeEdgeType: EdgeType;
  onEdgeTypeChange: (type: EdgeType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

const TOOLS: { tool: DrawingTool; icon: typeof MousePointer2; label: string; shortcut: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Select Tool", shortcut: "V" },
  { tool: "facet", icon: Pentagon, label: "Draw Facet", shortcut: "F" },
  { tool: "edge", icon: Minus, label: "Draw Edge", shortcut: "E" },
];

const EDGE_TYPES: EdgeType[] = ["ridge", "hip", "valley", "eave", "rake", "drip_edge", "flashing", "transition"];

export function DrawingToolbar({
  activeTool, onToolChange, activeEdgeType, onEdgeTypeChange,
  onUndo, onRedo, onDelete, canUndo, canRedo, hasSelection,
}: DrawingToolbarProps) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      if (key === "v") onToolChange("select");
      else if (key === "f") onToolChange("facet");
      else if (key === "e") onToolChange("edge");
      else if ((e.metaKey || e.ctrlKey) && key === "z" && !e.shiftKey) { e.preventDefault(); onUndo(); }
      else if ((e.metaKey || e.ctrlKey) && key === "z" && e.shiftKey) { e.preventDefault(); onRedo(); }
      else if (key === "delete" || key === "backspace") { if (hasSelection) onDelete(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToolChange, onUndo, onRedo, onDelete, hasSelection]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-1.5 bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border border-border/50 p-1.5">
        {TOOLS.map(({ tool, icon: Icon, label, shortcut }) => (
          <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool ? "default" : "ghost"}
                size="icon"
                className={`h-9 w-9 ${activeTool === tool ? "bg-primary text-primary-foreground shadow-md" : ""}`}
                onClick={() => onToolChange(tool)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {label} <kbd className="text-[10px] bg-muted px-1 rounded">{shortcut}</kbd>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Edge type quick-switch circles (when edge tool active) */}
        {activeTool === "edge" && (
          <>
            <div className="h-px bg-border my-0.5" />
            <div className="grid grid-cols-2 gap-1 px-0.5">
              {EDGE_TYPES.map(et => (
                <Tooltip key={et}>
                  <TooltipTrigger asChild>
                    <button
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        activeEdgeType === et
                          ? "border-foreground scale-110 shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: EDGE_COLORS[et] }}
                      onClick={() => onEdgeTypeChange(et)}
                    >
                      {activeEdgeType === et && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {EDGE_LABELS[et]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </>
        )}

        <div className="h-px bg-border my-0.5" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Undo <kbd className="text-[10px] bg-muted px-1 rounded">⌘Z</kbd></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRedo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Redo <kbd className="text-[10px] bg-muted px-1 rounded">⌘⇧Z</kbd></TooltipContent>
        </Tooltip>

        {hasSelection && (
          <>
            <div className="h-px bg-border my-0.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Delete Selected <kbd className="text-[10px] bg-muted px-1 rounded">Del</kbd></TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
