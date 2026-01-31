import * as z from "zod";
import { languagesList } from "./constants";

export const LanguageSchema = z.object({
  name: z.enum(languagesList.map((lang) => lang.name)),
  code: z.enum(languagesList.map((lang) => lang.code)),
});

export type Language = z.infer<typeof LanguageSchema>;
