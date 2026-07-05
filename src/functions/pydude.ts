import { createServerFn } from "@tanstack/react-start";

const pydudeSystemPrompt = `You are Pydude, the in-course doubt-solving assistant for the Python Community Development course. You're a patient senior dev who explains things simply, never condescending. Keep answers short — 3-5 sentences unless the student asks for more depth. When a student pastes broken code, don't just fix it — point out what's wrong and why, then show the corrected version. If a student asks something outside Python/this course's scope, gently redirect them back. Use plain language over jargon. Encourage without being cheesy.`;

export const askPydude = createServerFn({ method: "POST" })
  .validator((d: { message: string; moduleName: string; codeContext: string }) => d)
  .handler(async ({ data }) => {
    const { message, moduleName, codeContext } = data;
    
    // In TanStack Start (Vinxi/Nitro), process.env is usually available.
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Mock mode for local testing without an API key
      return `*(Mock Mode)* Hey there! My brain isn't hooked up to an OpenAI API key on this server right now. 

Normally, I'd read your code for Module "${moduleName}" and help you out. Since I'm running offline, I recommend double-checking your syntax or looking at the Common Mistake section above!`;
    }

    const prompt = `Module: ${moduleName}
Current Code:
\`\`\`python
${codeContext}
\`\`\`

Student Question:
${message}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: pydudeSystemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API Error:", await response.text());
        throw new Error("API responded with " + response.status);
      }

      const json = await response.json();
      return json.choices[0].message.content as string;
    } catch (error) {
      console.error("Pydude Error:", error);
      return "Whoops! I'm having trouble connecting to my brain right now. Please try again in a moment.";
    }
  });
