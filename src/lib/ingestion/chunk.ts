export function chunkText(text: string, maxTokens = 500, overlapTokens = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const wordsPerChunk = Math.floor(maxTokens * 0.75);
  const overlapWords = Math.floor(overlapTokens * 0.75);
  const chunks: string[] = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + wordsPerChunk, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlapWords;
  }
  return chunks;
}