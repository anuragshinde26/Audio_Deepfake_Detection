// frontend/src/pages/Index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Hero } from "@/components/Hero";
import { UploadSection } from "@/components/UploadSection";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Contact } from "@/components/Contact";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// <- NEW: API helper
import { analyzeFile, analyzeUrl } from "@/lib/api";

interface AnalysisResult {
  classification: "genuine" | "deepfake";
  confidence: number; // percent 0..100
  spectrogramUrl?: string | undefined;
  fileName?: string | undefined;
  analysisTime?: number | undefined;
  spectralHeuristic?: number | undefined;
}

const Index = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Base URL for backend API (ensure VITE_API_URL is set in .env or fallback to localhost)
  const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  /**
   * mapBackendResponse
   * Converts backend JSON to the AnalysisResult shape your UI expects.
   */
  const mapBackendResponse = (data: any, fileName?: string, analysisTimeFromClient?: number): AnalysisResult => {
    // classification mapping
    const classification = data.prediction === "fake" || data.prediction === "deepfake" ? "deepfake" : "genuine";

    // normalize confidence
    let confidenceRaw = typeof data.confidence === "number" ? data.confidence : 0;
    let confidencePercent = confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw;
    confidencePercent = Math.round(confidencePercent * 100) / 100; // 2 decimals

    // build spectrogram URL if backend returned spectrogram_path
    let spectrogramUrl: string | undefined = undefined;
    if (data.spectrogram_path) {
      if (data.spectrogram_path.startsWith("http://") || data.spectrogram_path.startsWith("https://")) {
        spectrogramUrl = data.spectrogram_path;
      } else {
        spectrogramUrl = `${API_BASE.replace(/\/$/, "")}${data.spectrogram_path.startsWith("/") ? "" : "/"}${data.spectrogram_path}`;
      }
    } else if (data.spectrogram) {
      // backend may provide base64 data URI in `spectrogram`, which React can use directly
      spectrogramUrl = data.spectrogram;
    } else if (data.spectrogramUrl) {
      spectrogramUrl = data.spectrogramUrl;
    }

    return {
      classification,
      confidence: confidencePercent,
      spectrogramUrl,
      fileName: data.file_name ?? fileName,
      analysisTime: data.analysis_time ?? analysisTimeFromClient,
      spectralHeuristic: data.spectral_heuristic ?? undefined,
    };
  };

  /**
   * handleAnalyze
   * Uses src/lib/api.ts functions analyzeFile/analyzeUrl rather than raw fetch
   */
  const handleAnalyze = async (fileOrUrl: File | string, type: "file" | "url") => {
    setIsAnalyzing(true);

    try {
      if (type === "file" && fileOrUrl instanceof File) {
        // USE analyzeFile helper
        const data = await analyzeFile(fileOrUrl);
        console.log("API response (file):", data);

        const mapped = mapBackendResponse(data, fileOrUrl.name, data.analysis_time ?? undefined);
        console.log("Mapped result (file):", mapped);

        setResult(mapped);
        toast({
          title: "Analysis Complete",
          description: `Audio classified as ${mapped.classification} with ${mapped.confidence}% confidence`,
        });
      } else if (type === "url" && typeof fileOrUrl === "string") {
        // USE analyzeUrl helper (sends youtube_url as FormData)
        const data = await analyzeUrl(fileOrUrl);
        console.log("API response (url):", data);

        const mapped = mapBackendResponse(data, typeof fileOrUrl === "string" ? fileOrUrl.split("/").pop() : undefined, data.analysis_time ?? undefined);
        console.log("Mapped result (url):", mapped);

        setResult(mapped);
        toast({
          title: "Analysis Complete",
          description: `Audio classified as ${mapped.classification} with ${mapped.confidence}% confidence`,
        });
      } else {
        throw new Error("Invalid input type for analysis.");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error?.message || "An error occurred during analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  const scrollToUpload = () => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-4 right-4 flex gap-2 items-center z-10">
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      {!result ? (
        <>
          <Hero onGetStarted={scrollToUpload} />
          <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          <Contact />
        </>
      ) : (
        <ResultsDisplay result={result} onReset={handleReset} />
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">Powered by CNN Deep Learning & Mel Spectrogram Analysis</p>
          <p>Built with FastAPI, Librosa & React</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
