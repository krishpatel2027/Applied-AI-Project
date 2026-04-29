"use client";

interface MindMapProps {
  tags?: string[];
  title?: string;
}

export function MindMap({ tags = [], title = "Mind Map" }: MindMapProps) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <ul className="list-disc pl-5">
        {tags.map((tag, idx) => (
          <li key={idx}>{tag}</li>
        ))}
      </ul>
    </div>
  );
}
