"use client";

import { useCompletion } from "@ai-sdk/react";
import { CameraIcon, CameraOffIcon, LanguagesIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { detectLanguageAction } from "./actions/language";

export default function Home() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<
    string | null
  >(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState<string | null>(
    "Detect language",
  );
  const [targetLang, setTargetLang] = useState<string | null>("Spanish");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { completion, complete, isLoading, input, setInput } = useCompletion({
    api: "/api/translate",
  });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !streamRef.current) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => {});
  }, [isCameraOpen]);

  const translateText = useCallback(
    async (text: string, sourceSelection: string | null) => {
      if (!sourceSelection || !targetLang || text.trim().length === 0) {
        return;
      }

      const target = languagesList.find((lang) => lang.name === targetLang);

      if (!target) {
        throw new Error("Please select a valid target language.");
      }

      let source: Language | undefined;

      if (sourceSelection === "Detect language") {
        setIsDetecting(true);
        try {
          source = await detectLanguageAction(text);
          setSourceLang(source.name);
        } finally {
          setIsDetecting(false);
        }
      } else {
        source = languagesList.find((lang) => lang.name === sourceSelection);
      }

      if (!source) {
        throw new Error("Please select a valid source language.");
      }

      await complete(
        buildPrompt({
          text,
          sourceLang: source,
          targetLang: target,
        }),
      );
    },
    [complete, targetLang],
  );

  const handleSubmit = async () => {
    await translateText(input, sourceLang);
  };

  const handleStartCamera = useCallback(async () => {
    setOcrError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setOcrError("Camera is not supported in this browser.");
      return;
    }

    try {
      stopCamera();
      setCapturedImageDataUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch {
      setOcrError("Unable to access camera. Check permissions and try again.");
    }
  }, [stopCamera]);

  const handleCloseCamera = useCallback(() => {
    stopCamera();
    setIsCameraOpen(false);
  }, [stopCamera]);

  const handleCaptureAndTranslate = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setOcrError("Camera is not ready yet.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setOcrError("Camera is still initializing. Please try again.");
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      setOcrError("Unable to process captured image.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImageDataUrl(imageDataUrl);
    handleCloseCamera();

    setIsOcrLoading(true);
    setOcrError(null);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl }),
      });

      const data = (await response.json()) as {
        text?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to extract text from image.");
      }

      const extractedText = data.text?.trim() ?? "";

      if (!extractedText) {
        throw new Error("No text detected in the captured photo.");
      }

      setInput(extractedText);
      setSourceLang("Detect language");

      await translateText(extractedText, "Detect language");
    } catch (error) {
      setOcrError(
        error instanceof Error
          ? error.message
          : "Failed to capture and translate text.",
      );
    } finally {
      setIsOcrLoading(false);
    }
  }, [handleCloseCamera, setInput, translateText]);

  const languages = languagesList.map((lang) => lang.name);
  const isBusy = isLoading || isDetecting || isOcrLoading;

  return (
    <main className="container mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-8">
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
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
              className="w-full max-h-75"
              placeholder="Type your message to translate here."
              disabled={isBusy}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isCameraOpen ? "secondary" : "outline"}
              onClick={isCameraOpen ? handleCloseCamera : handleStartCamera}
              disabled={isOcrLoading || isLoading || isDetecting}
              className="cursor-pointer"
            >
              {isCameraOpen ? <CameraOffIcon /> : <CameraIcon />}
              {isCameraOpen
                ? "Close camera"
                : capturedImageDataUrl
                  ? "Retake photo"
                  : "Use camera"}
            </Button>

            {isCameraOpen && (
              <Button
                type="button"
                onClick={handleCaptureAndTranslate}
                disabled={isBusy}
                className="cursor-pointer"
              >
                Capture and translate
                {isOcrLoading ? <Spinner /> : <LanguagesIcon />}
              </Button>
            )}
          </div>

          {isCameraOpen && (
            <div className="border-input bg-input/20 space-y-2 rounded-md border p-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full rounded-md bg-black object-cover"
              />
              <p className="text-muted-foreground text-xs">
                Aim at text, then press Capture and translate.
              </p>
            </div>
          )}

          {!isCameraOpen && capturedImageDataUrl && (
            <div className="border-input bg-input/20 space-y-2 rounded-md border p-2">
              <Image
                src={capturedImageDataUrl}
                alt="Captured text for OCR"
                width={1280}
                height={720}
                unoptimized
                className="aspect-video w-full rounded-md bg-black object-cover"
              />
              <p className="text-muted-foreground text-xs">
                Captured photo used for OCR and translation.
              </p>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {ocrError && <p className="text-destructive text-sm">{ocrError}</p>}

          <Button
            type="button"
            disabled={isBusy || input.trim().length === 0}
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
            <div className="border-input bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs md:text-sm max-h-75 overflow-y-auto">
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
