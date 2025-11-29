import { useState, useCallback } from "react";
import { Upload, Link as LinkIcon, FileAudio, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface UploadSectionProps {
  onAnalyze: (file: File | string, type: 'file' | 'url') => void;
  isAnalyzing: boolean;
}

export const UploadSection = ({ onAnalyze, isAnalyzing }: UploadSectionProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const validExtensions = ['.wav', '.mp3', '.mp4', '.m4a', '.webm'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload .wav, .mp3, .mp4, .m4a, or .webm files",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    onAnalyze(file, 'file');
  };

  const handleYoutubeSubmit = () => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL",
        variant: "destructive"
      });
      return;
    }

    if (!youtubeRegex.test(youtubeUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    onAnalyze(youtubeUrl, 'url');
  };

  return (
    <section id="upload" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">Upload Audio for Analysis</h2>
        <p className="text-center text-muted-foreground mb-12">
          Upload an audio/video file or provide a YouTube link to verify authenticity
        </p>

        <Card className="glass-effect p-8 mb-8">
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
              dragActive 
                ? "border-primary bg-primary/10 scale-105" 
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".wav,.mp3,.mp4,.m4a,.webm"
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
            
            <label 
              htmlFor="file-upload" 
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="mb-4 p-4 rounded-full bg-primary/10 glow-primary">
                {isAnalyzing ? (
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-primary" />
                )}
              </div>
              
              <p className="text-lg font-semibold mb-2">
                {isAnalyzing ? "Processing..." : "Drag & drop your file here"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileAudio className="w-4 h-4" />
                  .wav, .mp3
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  .mp4, .webm
                </span>
              </div>
            </label>
          </div>
        </Card>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground">OR</span>
          </div>
        </div>

        <Card className="glass-effect p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Analyze from YouTube</h3>
            </div>
            
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isAnalyzing}
              className="bg-background/50"
            />
            
            <Button 
              onClick={handleYoutubeSubmit}
              disabled={isAnalyzing || !youtubeUrl.trim()}
              className="gradient-primary"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Video"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};
