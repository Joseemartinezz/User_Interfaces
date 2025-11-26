import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "key"
});

function buildAacImagePrompt(phrase: string): string {
  return `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create a simple, natural, child-friendly illustration that represents the phrase.
Guidelines:
- Simple, clean, friendly illustration
- One clear, easy-to-recognize subject
- Flat colors, minimal detail, bold outlines
- No text or letters inside the image
- Safe for young children
Phrase to illustrate:
"${phrase}"
  `;
}

export async function generateAacImage(phrase: string): Promise<string> {
  const prompt = buildAacImagePrompt(phrase);
  
  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    size: "1024x1024", 
    n: 1,
    response_format: "b64_json"
  });
  
  return response.data[0].b64_json!;
}