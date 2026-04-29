"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FlashcardCreator() {
  const [text, setText] = useState("");
  const [flashcards, setFlashcards] = useState<any[]>([]);

  const generate = () => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const cards: { question: string; answer: string }[] = [];
    for (let i = 0; i < lines.length; i += 2) {
      const q = lines[i];
      const a = lines[i + 1] || "";
      if (q) {
        cards.push({ question: q, answer: a });
      }
    }
    setFlashcards(cards);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Flashcard Creator</h2>
      <textarea
        className="w-full h-32 p-2 border border-border rounded-md"
        placeholder="Enter Q/A pairs separated by new lines. Example:\nQ: What is X?\nA: Answer."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button onClick={generate}>Generate Flashcards</Button>
      <div className="space-y-2">
        {flashcards.map((card, i) => (
          <div key={i} className="p-3 border rounded-md">
            <div className="font-bold">{card.question}</div>
            <div>{card.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
