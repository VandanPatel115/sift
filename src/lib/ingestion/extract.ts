import { extractText, getDocumentProxy } from "unpdf";

export async function extractTextFromPdf(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = new Uint8Array(await res.arrayBuffer());
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}