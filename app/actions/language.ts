"use server";

import { generateText, Output } from "ai";
import { ollama } from "ai-sdk-ollama";
import { LanguageSchema } from "@/lib/types";

export const detectLanguageAction = async (text: string) => {
  "use cache";

  const { output } = await generateText({
    model: ollama("translategemma:4b"),
    output: Output.object({
      schema: LanguageSchema,
    }),
    prompt: `Detect the language of the following text: "${text}"`,
  });

  return output;
};
