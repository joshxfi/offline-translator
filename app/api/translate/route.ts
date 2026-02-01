import { streamText } from "ai";
import { ollama } from "ai-sdk-ollama";

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = streamText({
    model: ollama("translategemma:12b"),
    prompt,
  });

  return result.toUIMessageStreamResponse();
}
