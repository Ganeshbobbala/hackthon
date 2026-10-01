import React from "react";
import { MessageSquare, X, ChevronRight, Play, Square } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { DEMO_SCRIPT, demoDirector } from "../demo/DemoDirector";

export const SpeakerNotesOverlay: React.FC = () => {
  const speakerNotesOpen = useAppStore((state) => state.speakerNotesOpen);
  const setSpeakerNotesOpen = useAppStore((state) => state.setSpeakerNotesOpen);
  const demoMode = useAppStore((state) => state.demoMode);
  const demoStep = useAppStore((state) => state.demoStep);

  if (!speakerNotesOpen) return null;

  const currentStep = DEMO_SCRIPT[Math.min(DEMO_SCRIPT.length - 1, demoStep)];

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-slate-900/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Presenter Pitch Notes
          </span>
        </div>
        <button
          onClick={() => setSpeakerNotesOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-blue-400 font-semibold">
          <span>STEP {demoStep + 1} OF {DEMO_SCRIPT.length}</span>
          <span>{currentStep.timeSeconds}s Mark</span>
        </div>
        <div className="text-sm font-bold text-white">{currentStep.title}</div>
        <p className="text-xs text-slate-300 leading-relaxed pt-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          "{currentStep.talkingPoint}"
        </p>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
        <span>Shortcuts: [D] Demo • [N] Notes</span>
        <button
          onClick={() => demoDirector.toggle()}
          className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
        >
          {demoMode ? (
            <>
              <Square className="w-3 h-3 fill-current" /> Stop
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" /> Play
            </>
          )}
        </button>
      </div>
    </div>
  );
};

