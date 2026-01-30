import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TranslationConfig = {
  text: string;
  sourceLang: string;
  sourceCode: string;
  targetLang: string;
  targetCode: string;
};

export function buildPrompt(config: TranslationConfig) {
  const { sourceLang, sourceCode, targetLang, targetCode, text } = config;

  return `You are a professional ${sourceLang} (${sourceCode}) to ${targetLang} (${targetCode}) translator. Your goal is to accurately convey the meaning and nuances of the original ${sourceLang} text while adhering to ${targetLang} grammar, vocabulary, and cultural sensitivities.
Produce only the ${targetLang} translation, without any additional explanations or commentary. Please translate the following ${sourceLang} text into ${targetLang}:


${text}`;
}
