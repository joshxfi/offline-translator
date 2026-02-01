"use client";

import { useCompletion } from "@ai-sdk/react";
import { LanguagesIcon } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { languagesList } from "@/lib/constants";
import type { Language } from "@/lib/types";
import { buildPrompt } from "@/lib/utils";
import { getLanguageFromText } from "./actions/language";

export default function Home() {
  const [input, setInput] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [sourceLang, setSourceLang] = useState<string | null>(
    "Detect language",
  );
  const [targetLang, setTargetLang] = useState<string | null>("Spanish");

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/translate",
  });

  const handleSubmit = async () => {
    if (!sourceLang || !targetLang) return;

    const target = languagesList.find((l) => l.name === targetLang);

    let source: Language | undefined;

    if (sourceLang === "Detect language") {
      setIsDetecting(true);
      source = await getLanguageFromText(input);
      setSourceLang(source.name);
      setIsDetecting(false);
    } else {
      source = languagesList.find((l) => l.name === sourceLang);
    }

    if (!target || !source) return;

    complete(
      buildPrompt({
        text: input,
        sourceLang: source,
        targetLang: target,
      }),
    );
  };

  const languages = languagesList.map((lang) => lang.name);

  return (
    <main className="max-w-4xl container px-4 flex min-h-screen mx-auto justify-center items-center">
      <div className="grid grid-cols-2 w-full gap-12">
        <section className="w-full space-y-2">
          <Field data-disabled>
            <FieldLabel htmlFor="textarea-disabled">
              Translate from
              <Combobox
                value={sourceLang}
                onValueChange={setSourceLang}
                items={["Detect language", ...languages]}
              >
                <ComboboxInput placeholder="Select a language" />
                <ComboboxContent>
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </FieldLabel>
            <Textarea
              id="textarea-disabled"
              onChange={(e) => setInput(e.target.value)}
              value={input}
              className="w-full"
              placeholder="Type your message to translate here."
              disabled={isLoading || isDetecting}
            />
          </Field>

          <Button
            disabled={isLoading || isDetecting}
            onClick={handleSubmit}
            className="cursor-pointer"
          >
            Translate
            {isLoading || isDetecting ? <Spinner /> : <LanguagesIcon />}
          </Button>
        </section>

        <section className="w-full">
          <Field data-disabled>
            <FieldLabel>
              Translate to
              <Combobox
                value={targetLang}
                onValueChange={setTargetLang}
                items={languages}
              >
                <ComboboxInput placeholder="Select a language" />
                <ComboboxContent>
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </FieldLabel>
            <div className="border-input bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs md:text-sm">
              {completion ? (
                <Streamdown>{completion}</Streamdown>
              ) : (
                <p className="text-muted-foreground">
                  Your translated text will appear here.
                </p>
              )}
            </div>
          </Field>
        </section>
      </div>
    </main>
  );
}
