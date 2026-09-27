'use client';

import { useState, useCallback } from "react";
import { generateDesign } from "@/lib/api";
import { DesignSchema } from "@/lib/types";
import DesignPreview from "@/components/DesignPreview";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DesignSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateDesign(prompt.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text to Figma</h1>
        <p className="text-gray-500 text-base">
          Describe a website and get a structured design schema ready to import into Figma.
        </p>
      </div>

      {/* Prompt area */}
      <div className="space-y-3">
        <textarea
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none transition"
          rows={4}
          placeholder='Describe the website you want — e.g. "Landing page for a SaaS project management tool with pricing tiers"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {loading ? "" : "Tip: Ctrl+Enter to generate"}
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            {loading ? "Generating…" : "Generate Design"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Generating your design — this usually takes a few seconds…
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Generation failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 text-lg leading-none shrink-0"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Generated design
            </h2>
            <button
              onClick={handleCopy}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              {copied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
          <DesignPreview data={result} />
        </div>
      )}
    </main>
  );
}
