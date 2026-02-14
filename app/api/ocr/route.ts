import { generateText } from "ai";
import { ollama } from "ai-sdk-ollama";

type OcrRequestBody = {
  imageDataUrl?: string;
};

const IMAGE_DATA_URL_REGEX =
  /^data:(image\/[a-zA-Z0-9.+-]+);base64,[A-Za-z0-9+/=\s]+$/;

function getMediaType(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);

  return match?.[1];
}

function cleanOcrOutput(text: string) {
  const trimmedText = text.trim();

  if (!trimmedText.startsWith("```") || !trimmedText.endsWith("```")) {
    return trimmedText;
  }

  return trimmedText
    .replace(/^```[a-zA-Z0-9_-]*\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { imageDataUrl }: OcrRequestBody = await req.json();
    const imageData = imageDataUrl?.trim();

    if (!imageData || !IMAGE_DATA_URL_REGEX.test(imageData)) {
      return Response.json(
        { error: "A valid base64 image data URL is required." },
        { status: 400 },
      );
    }

    const mediaType = getMediaType(imageData);

    if (!mediaType) {
      return Response.json(
        { error: "Unable to determine image media type." },
        { status: 400 },
      );
    }

    const { text } = await generateText({
      model: ollama("glm-ocr:bf16"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an OCR engine. Extract all visible text from this image. Return only the extracted text with original line breaks. Do not add explanations.",
            },
            {
              type: "file",
              data: imageData,
              mediaType,
            },
          ],
        },
      ],
    });

    const extractedText = cleanOcrOutput(text);

    if (!extractedText) {
      return Response.json(
        { error: "No text detected in the image." },
        { status: 422 },
      );
    }

    return Response.json({ text: extractedText });
  } catch {
    return Response.json(
      { error: "Failed to extract text from the image." },
      { status: 500 },
    );
  }
}
