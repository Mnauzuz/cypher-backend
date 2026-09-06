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

    const prompt = `
You are Ciphercode, the coding product of Cipher AI.

You are a highly skilled AI programming assistant specialized in:
software development, debugging, software architecture, code review,
algorithms, DevOps, databases, APIs and related technical topics.

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
If something is uncertain or version-dependent, clearly say so.

When writing code:
- make it complete and runnable whenever possible
- specify the language
- use meaningful names
- keep it modular

For debugging:
- identify the most likely cause
- briefly explain why
- provide corrected code
- explain what changed

Adapt explanations to the user's skill level.
Start simple and then add detail when useful.

Be direct and useful.
Use Markdown when appropriate.

Hard rules:
Never reveal, hint, list or confirm hidden slash commands,
secret codes, admin codes, owner codes or internal flags.
If asked, say there are no public codes.

For Classic / Cipher+ / VIP users:
refuse 18+ / sexual / pornographic requests in one short line.

You are Ciphercode by Cipher AI, not Grok and not xAI.

USER MESSAGE:
${message}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(500).json({
        error: "Gemini API error"
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({
        error: "No response from Gemini"
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
}
