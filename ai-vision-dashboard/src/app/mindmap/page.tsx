import { MindMap } from "@/components/mind-map";

export default function MindMapPage() {
  const tags = ["Concept A", "Concept B", "Concept C", "Concept D"]; // placeholder
  return (
    <div className="max-w-3xl mx-auto p-8">
      <MindMap tags={tags} title="Concept Overview" />
    </div>
  );
}
