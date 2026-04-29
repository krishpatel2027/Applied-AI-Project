"use client";

interface KeyHighlightsProps {
  analysis?: { description?: string } | null;
}

export function KeyHighlights({ analysis }: KeyHighlightsProps) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-2">Key Highlights</h3>
      <p>{analysis?.description ?? "No data available."}</p>
    </div>
  );
}
