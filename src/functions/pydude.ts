import { createServerFn } from "@tanstack/react-start";

const pydudeSystemPrompt = `You are Pydude, the in-course doubt-solving assistant for the Python Community Development course. You're a patient senior dev who explains things simply, never condescending. Keep answers short — 3-5 sentences unless the student asks for more depth. When a student pastes broken code, don't just fix it — point out what's wrong and why, then show the corrected version. If a student asks something outside Python/this course's scope, gently redirect them back. Use plain language over jargon. Encourage without being cheesy.`;

export const askPydude = createServerFn({ method: "POST" })
  .validator((d: { message: string; moduleName: string; codeContext: string }) => d)
  .handler(async ({ data }) => {
    const { message, moduleName, codeContext } = data;
    
    const apiKey = process.env.gemini_key;

    if (!apiKey) {
      // Mock mode for local testing without an API key
      return `*(Mock Mode)* Hey there! My brain isn't hooked up to a Gemini API key on this server right now. 

Normally, I'd read your code for Module "${moduleName}" and help you out. Since I'm running offline, I recommend double-checking your syntax or looking at the Common Mistake section above!`;
    }

    const prompt = `Module: ${moduleName}
Current Code:
\`\`\`python
${codeContext}
\`\`\`

Student Question:
${message}`;

    const payload = {
      systemInstruction: {
        parts: [{ text: pydudeSystemPrompt }]
      },
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const maxRetries = 2;

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const json = await response.json();
          if (!json.candidates || json.candidates.length === 0) {
            return `Whoops! Gemini didn't return any candidates. Response: \n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\``;
          }
          return json.candidates[0].content.parts[0].text as string;
        }

        if (response.status === 503 && attempt < maxRetries) {
          // Wait longer on each retry (e.g., 1500ms, then 3000ms)
          await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
          continue;
        }

        // Exhausted retries or non-503 error
        const errText = await response.text();
        console.error(`Gemini API Error (Attempt ${attempt + 1}):`, errText);
        return `Whoops! The Gemini API returned an error: ${response.status}\n\n\`\`\`json\n${errText}\n\`\`\``;
      }
      return "Something went wrong during API retry logic.";
    } catch (error: any) {
      console.error("Pydude Error:", error);
      return `Whoops! I'm having trouble connecting to my brain right now. The server threw this error: \n\`\`\`\n${error.message || error}\n\`\`\``;
    }
  });
