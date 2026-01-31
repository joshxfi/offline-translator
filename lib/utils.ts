import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Language } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TranslationConfig = {
  text: string;
  sourceLang: Language;
  targetLang: Language;
};

export function buildPrompt(config: TranslationConfig) {
  const { sourceLang, targetLang, text } = config;

  return `You are a professional ${sourceLang.name} (${sourceLang.code}) to ${targetLang.name} (${targetLang.code}) translator. Your goal is to accurately convey the meaning and nuances of the original ${sourceLang.name} text while adhering to ${targetLang.name} grammar, vocabulary, and cultural sensitivities.
Produce only the ${targetLang.name} translation, without any additional explanations or commentary. Please translate the following ${sourceLang.name} text into ${targetLang.name}:


${text}`;
}
