"use client";

import { useState } from "react";
import { Streamdown } from "streamdown";
import { useChat } from "@ai-sdk/react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LanguagesIcon } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <main className="max-w-2xl flex flex-col min-h-screen mx-auto justify-center items-center">
      <section className="w-full space-y-2">
        <Field data-disabled>
          <FieldLabel htmlFor="textarea-disabled">Message</FieldLabel>
          <Textarea
            id="textarea-disabled"
            placeholder="Type your message here."
            disabled={status === "streaming"}
          />
        </Field>

        <Button onClick={handleSubmit} className="cursor-pointer">
          Translate
          {status === "submitted" ? <Spinner /> : <LanguagesIcon />}
        </Button>
      </section>

      {messages.map((message) => (
        <div key={message.id}>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return (
                  <Streamdown key={`${message.id}-${i}`}>
                    {part.text}
                  </Streamdown>
                );
              default:
                return null;
            }
          })}
        </div>
      ))}
    </main>
  );
}
