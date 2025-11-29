// frontend/src/components/ResultsDisplay.tsx
import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, BarChart3, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type ApiResponse = {
  prediction?: "fake" | "real" | string;
  confidence?: number; // backend returns 0..1 float usually
  probabilities?: { fake: number; real: number };
  spectrogram_path?: string;
  spectrogram?: string;
  spectral_heuristic?: number;
  file_name?: string;
  analysis_time?: number;
};

interface ResultsDisplayProps {
  result:
    | {
        classification: "genuine" | "deepfake";
        confidence: number; // percent 0..100
        spectrogramUrl?: string;
        fileName?: string;
        analysisTime?: number;
        spectralHeuristic?: number;
      }
    | ApiResponse;
  onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onReset }) => {
  const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

  const normalized = useMemo(() => {
    // already normalized shape
    if ((result as any).classification !== undefined && typeof (result as any).confidence === "number") {
      const r = result as any;
      return {
        classification: r.classification as "genuine" | "deepfake",
        confidence: Number(r.confidence),
        spectrogramUrl: r.spectrogramUrl as string | undefined,
        fileName: r.fileName as string | undefined,
        analysisTime: r.analysisTime as number | undefined,
        spectralHeuristic: r.spectralHeuristic as number | undefined,
      };
    }

    const api = result as ApiResponse;
    // classification mapping
    const classification =
      api.prediction && (api.prediction === "fake" || api.prediction === "deepfake")
        ? "deepfake"
        : "genuine";

    // confidence: try confidence -> probabilities.fake -> 0
    let confidencePercent = 0;
    if (typeof api.confidence === "number") {
      confidencePercent = api.confidence <= 1 ? api.confidence * 100 : api.confidence;
    } else if (api.probabilities && typeof api.probabilities.fake === "number") {
      confidencePercent = api.probabilities.fake <= 1 ? api.probabilities.fake * 100 : api.probabilities.fake;
    }
    confidencePercent = Math.round(confidencePercent * 100) / 100;

    // spectrogram handling (data-uri or relative path)
    let spectrogramUrl: string | undefined = undefined;
    if (api.spectrogram && typeof api.spectrogram === "string") {
      spectrogramUrl = api.spectrogram;
    } else if (api.spectrogram_path) {
      if (api.spectrogram_path.startsWith("http://") || api.spectrogram_path.startsWith("https://")) {
        spectrogramUrl = api.spectrogram_path;
      } else {
        spectrogramUrl = `${API_BASE.replace(/\/$/, "")}${api.spectrogram_path.startsWith("/") ? "" : "/"}${api.spectrogram_path}`;
      }
    }

    return {
      classification: classification as "genuine" | "deepfake",
      confidence: confidencePercent,
      spectrogramUrl,
      fileName: api.file_name,
      analysisTime: api.analysis_time,
      spectralHeuristic: api.spectral_heuristic,
    };
  }, [result]);

  const isDeepfake = normalized.classification === "deepfake";

  // deepfakeProbability is always normalized.confidence (0..100)
  const deepfakeProbability = normalized.confidence;
  const genuineProbability = Math.round((100 - deepfakeProbability) * 100) / 100;

  // TOP number: show the winning-class probability (fix for previous inversion bug)
  const topDisplayPercent = isDeepfake ? deepfakeProbability : genuineProbability;
  const topLabel = isDeepfake ? "Confidence (Deepfake)" : "Confidence (Genuine)";

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <Card className={`glass-effect p-8 mb-8 border-2 ${isDeepfake ? "border-destructive/50 glow-danger" : "border-success/50"}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {isDeepfake ? (
                <div className="p-4 rounded-full bg-destructive/20">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                </div>
              ) : (
                <div className="p-4 rounded-full bg-success/20">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
              )}

              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {isDeepfake ? "Deepfake Detected" : "Genuine Audio"}
                </h2>
                <p className="text-muted-foreground">
                  {isDeepfake
                    ? "Our AI analysis has detected signs of manipulation in this audio"
                    : "This audio appears to be authentic and unmodified"}
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className={`text-5xl font-bold mb-2 ${isDeepfake ? "text-destructive" : "text-success"}`}>
                {topDisplayPercent}%
              </div>
              <p className="text-sm text-muted-foreground">{topLabel}</p>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="glass-effect p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Analysis Details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Deepfake Probability</span>
                  <span className="text-sm font-semibold">{deepfakeProbability}%</span>
                </div>
                <Progress value={deepfakeProbability} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Genuine Probability</span>
                  <span className="text-sm font-semibold">{genuineProbability}%</span>
                </div>
                <Progress value={genuineProbability} className="h-2" />
              </div>

              {normalized.analysisTime && (
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Analysis Time</span>
                    <span className="text-sm font-semibold">{normalized.analysisTime}s</span>
                  </div>
                </div>
              )}

              {normalized.fileName && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Name</span>
                  <span className="text-sm font-semibold truncate max-w-[200px]">{normalized.fileName}</span>
                </div>
              )}

              {typeof normalized.spectralHeuristic === "number" && (
                <div className="flex justify-between pt-2">
                  <span className="text-sm text-muted-foreground">Spectral Heuristic</span>
                  <span className="text-sm font-semibold">{Math.round(normalized.spectralHeuristic * 100) / 100}%</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="glass-effect p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Mel Spectrogram</h3>
            </div>

            {normalized.spectrogramUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <img src={normalized.spectrogramUrl} alt="Mel Spectrogram Analysis" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-border">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Spectrogram visualization</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={onReset} size="lg" className="gradient-primary">Analyze Another File</Button>
        </div>
      </div>
    </section>
  );
};

export default ResultsDisplay;
