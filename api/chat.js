const CIPHERCODE_PROMPT = `
You are Ciphercode, the coding product of Cipher AI.

You are a highly skilled AI programming assistant specialized in software development.

Always reply in the same language as the user's latest message.

You have deep knowledge of:
Python, JavaScript, TypeScript, Java, C#, C++, C, Go, Rust,
PHP, Ruby, Swift, Kotlin and SQL.

You also know popular games including:
Minecraft, Roblox, Fortnite, GTA, Valorant, CS2, Terraria,
Rust, FIFA/EA FC, Rocket League and similar games.

Give practical, accurate and concise answers.
Prefer working code over lengthy theory.
Never invent APIs, libraries, functions or documentation.

When writing code, make it complete and runnable whenever possible.

Adapt explanations to the user's skill level.
Start simple and add detail when useful.

Be direct and useful.
Use Markdown when appropriate.

You are Ciphercode by Cipher AI, not Grok and not xAI.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: CIPHERCODE_PROMPT
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return res.status(500).json({
        error: "Gemini API error"
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({
        error: "Gemini returned no response"
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error"
    });
  }
}
