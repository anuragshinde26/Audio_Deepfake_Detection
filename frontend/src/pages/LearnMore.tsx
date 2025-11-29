// src/pages/LearnMore.tsx
import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, ArrowLeft, Sparkles } from "lucide-react";

const REPORT_PATH = "/mnt/data/f93271de-91f6-4bd4-8211-b4a40704ae62.pdf"; // local path (will be transformed to served url)

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071126] via-[#0d1f2b] to-[#081425] text-slate-200">
      {/* Hero */}
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-6 shadow-[0_10px_60px_rgba(3,10,18,0.5)]">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-primary mb-4">
            About This Project
          </h1>

          <p className="max-w-3xl mx-auto text-slate-300 text-lg sm:text-xl leading-relaxed">
            Audio Deepfake Detection — a practical, CNN-based system that analyzes
            Mel-spectrograms to distinguish genuine speech from AI-generated audio.
            Built with PyTorch, FastAPI, and a modern React + Tailwind UI for fast,
            explainable predictions.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 border border-border bg-transparent text-sm hover:bg-white/3 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <a
              href={REPORT_PATH}
              download
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 bg-gradient-to-r from-primary to-indigo-500 text-black text-sm font-semibold shadow-lg hover:scale-[1.01] transition-transform"
            >
              <FileText className="w-4 h-4" />
              Download Full Report
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Overview + Objectives */}
          <div className="lg:col-span-2 space-y-6">
            <section className="p-6 rounded-2xl bg-gradient-to-b from-white/2 to-transparent border border-border shadow-[0_10px_30px_rgba(2,8,23,0.5)]">
              <h2 className="text-2xl font-semibold text-primary mb-3">Overview</h2>
              <p className="text-slate-300 leading-relaxed">
                This system converts input audio into Mel-spectrograms and feeds them
                to a convolutional neural network trained to detect spectral artifacts
                introduced by synthetic voice generators. The backend exposes a FastAPI
                endpoint for analysis while the frontend visualizes spectrograms and
                provides confidence scores for transparency.
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-gradient-to-b from-white/2 to-transparent border border-border shadow-[0_10px_30px_rgba(2,8,23,0.5)]">
              <h2 className="text-2xl font-semibold text-primary mb-3">Objectives</h2>
              <ul className="list-disc pl-5 text-slate-300 space-y-2">
                <li>Build a robust CNN to classify genuine vs synthetic speech.</li>
                <li>Use Mel-spectrograms and preprocessing/augmentation to improve generalization.</li>
                <li>Provide real-time UI with spectrogram visualization and confidence scores.</li>
                <li>Support file uploads and extraction from videos/YouTube links.</li>
              </ul>
            </section>

            <section className="p-6 rounded-2xl bg-gradient-to-b from-white/2 to-transparent border border-border shadow-[0_10px_30px_rgba(2,8,23,0.5)]">
              <h2 className="text-2xl font-semibold text-primary mb-3">Why this matters today</h2>
              <p className="text-slate-300 leading-relaxed">
                Recent advances in generative models have made synthetic voices increasingly
                realistic. This presents risks — from social-engineering scams to misinformation.
                Detecting audio deepfakes helps protect journalism, security-sensitive workflows,
                banking verification, and legal evidence integrity.
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-gradient-to-b from-white/2 to-transparent border border-border shadow-[0_10px_30px_rgba(2,8,23,0.5)]">
              <h2 className="text-2xl font-semibold text-primary mb-3">Methodology (short)</h2>
              <p className="text-slate-300 leading-relaxed">
                Pipeline: <strong>input → preprocess → Mel-spectrogram → CNN → output</strong>.
                Preprocessing includes normalization, augmentation (pitch shift, time-stretch),
                and noise handling. The CNN analyzes spectral patterns; output includes label,
                confidence and optional spectrogram visualization.
              </p>
            </section>
          </div>

          {/* Right: Features / CTA */}
          <aside className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/3 to-transparent border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">Key Features</h3>
                <Sparkles className="w-5 h-5 text-primary/90" />
              </div>

              <ul className="mt-4 space-y-3 text-slate-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-none w-2 h-2 mt-2 bg-primary rounded-full" />
                  Dual input support (audio files & video links)
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-2 h-2 mt-2 bg-primary rounded-full" />
                  Mel-spectrogram + CNN for robust detection
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-2 h-2 mt-2 bg-primary rounded-full" />
                  Real-time predictions with confidence scores
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-2 h-2 mt-2 bg-primary rounded-full" />
                  Privacy-aware processing (no permanent storage by default)
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/2 to-transparent border border-border text-center">
              <h4 className="text-md font-semibold text-primary mb-2">Get the full report</h4>
              <p className="text-slate-300 text-sm mb-4">
                Download the full thesis, datasets and model details (PDF).
              </p>

              <a
                href={REPORT_PATH}
                download
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-indigo-500 text-black font-semibold"
              >
                <FileText className="w-4 h-4" />
                Download Report (PDF)
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/3 to-transparent border border-border">
              <h4 className="text-md font-semibold text-primary mb-2">Future Scope</h4>
              <p className="text-slate-300 text-sm">
                Expand to transformer/hybrid models, multilingual datasets, edge deployments,
                and cloud scaling for verification-as-a-service.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
