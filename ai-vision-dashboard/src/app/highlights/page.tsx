import { KeyHighlights } from "@/components/key-highlights";

export default function HighlightsPage() {
  const analysis = { description: "Placeholder summary of the image. This is a detailed explanation of the visual content, focusing on key aspects." };
  return (
    <div className="max-w-3xl mx-auto p-8">
      <KeyHighlights analysis={analysis} />
    </div>
  );
}
