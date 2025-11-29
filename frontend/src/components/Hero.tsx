import { Shield, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom"; // ⭐ ADDED

export const Hero = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 glow-primary rounded-full" />
            <div className="relative bg-card/50 p-6 rounded-full backdrop-blur-sm border border-primary/30">
              <Shield className="w-16 h-16 text-primary animate-float" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse-slow">
          Audio Deepfake Detection
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          AI-Powered Spectral Analysis for Authentic Voice Verification
        </p>
        
        <p className="text-base md:text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
          Advanced CNN-based deep learning system using Mel Spectrograms to detect synthetic voices with high precision
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button 
            size="lg" 
            className="gradient-primary text-lg px-8 py-6 shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
            onClick={onGetStarted}
          >
            <Radio className="mr-2 h-5 w-5" />
            Analyze Audio
          </Button>
          
          {/* ⭐ UPDATED ONLY THIS BUTTON FOR NAVIGATION */}
          <Link to="/learn-more" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-primary/30 hover:border-primary hover:bg-primary/10 w-full"
            >
              Learn More
            </Button>
          </Link>
        </div>

        {/* ⭐ ADDED SMALL INFO (Does NOT affect layout) */}
        <p className="text-sm text-muted-foreground/70 mb-10">
          Learn how the system works, its real-world importance, objectives & architecture.
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: "Real-Time Detection",
              description: "Instant analysis with confidence scores"
            },
            {
              title: "Multiple Formats",
              description: "Support for audio, video, and YouTube links"
            },
            {
              title: "Visual Analysis",
              description: "Mel Spectrogram visualization"
            }
          ].map((feature, idx) => (
            <div 
              key={idx}
              className="glass-effect p-6 rounded-xl hover:border-primary/50 transition-all duration-300 hover:scale-105"
            >
              <h3 className="font-semibold text-lg mb-2 text-primary">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
