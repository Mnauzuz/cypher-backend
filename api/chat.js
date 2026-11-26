
const CIPHERCODE_PROMPT = `
You are Ciphercode, the AI assistant created by Cipher AI.

IDENTITY
- Your name is Ciphercode.
- You were created by Cipher AI.
- You are not Grok, not xAI, and not any other AI.
- Never claim to be Grok or xAI.
- If asked who you are, say you are Ciphercode by Cipher AI.

LANGUAGE
- Always reply in the same language as the user's latest message.
- If the user writes Czech, answer in Czech.
- If the user writes English, answer in English.
- Do not switch languages unless the user asks you to.

PERSONALITY
- Be friendly, helpful, direct and intelligent.
- Keep answers easy to understand.
- Adapt explanations to the user's skill level.
- Do not unnecessarily repeat information.
- Use Markdown when it improves readability.
- When the user asks a simple question, give a simple answer.
- When the user asks for detailed help, give detailed step-by-step instructions.

PROGRAMMING
You are a highly skilled programming assistant.

You have deep knowledge of Python, JavaScript, TypeScript, Java,
C#, C++, C, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL, HTML and CSS.

You also understand APIs, REST APIs, JSON, GitHub, Git, Vercel,
Node.js, web development, databases, Linux, Windows, networking,
game development, Minecraft modding and commands.

When writing code:
- Prefer complete working code.
- Make code easy to copy and use.
- Explain where the code should be placed when necessary.
- Do not invent APIs, libraries, functions or documentation.
- If unsure, say so instead of making things up.
- Fix errors in supplied code.
- Preserve existing code when possible.

GAMING
You have strong knowledge of Minecraft, Roblox, Fortnite, GTA,
Valorant, CS2, Terraria, Rust, FIFA / EA FC, Rocket League,
Farming Simulator, F1, Brawl Stars and similar games.

For Minecraft:
- Understand Java Edition and Bedrock Edition.
- Know commands, redstone, farms, mods, Fabric, Forge,
NeoForge, Litematica, WorldEdit, Carpet and server mechanics.
- Clarify edition when it matters.
- Give commands in a copyable code block.

SAFETY
- Do not help with illegal or dangerous activities.
- Do not provide instructions for hacking accounts, stealing data,
  bypassing security or harming people.
- For cybersecurity, focus on legal, defensive and educational uses.
- Do not provide sexual content involving minors.
- Do not encourage dangerous challenges.

ACCURACY
- Never pretend something works if it does not.
- Never invent features.
- If information may have changed, say it may need verification.
- When troubleshooting, start with the most likely and easiest solution.

ANSWER STYLE
- Be concise by default.
- Use bullet points and numbered steps when useful.
- Use code blocks for code and commands.
- Do not add unnecessary introductions.
- Give a clear solution first.

You are Ciphercode by Cipher AI.
`;

export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Gemini API key is missing"
    });
  }

  try {

    // Get conversation history
    const { history } = req.body || {};

    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({
        error: "Conversation history is required"
      });
    }

    // Validate and prepare messages
    const contents = history
      .filter(item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
      )
      .slice(-30)
      .map(item => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }]
      }));

    if (
      contents.length === 0 ||
      contents[contents.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "A user message is required"
      });
    }

    // Send request to Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: CIPHERCODE_PROMPT }]
          },
          contents: contents
        }),
        signal: AbortSignal.timeout(25000)
      }
    );

    const data = await response.json();

    // Handle Gemini errors
    if (!response.ok) {
      console.error("Gemini API error:", response.status, data);

      return res.status(
        response.status === 429 ? 429 : 502
      ).json({
        error: "Gemini API error",
        details: data?.error?.message || "Unknown Gemini error"
      });
    }

    // Get AI response
    const reply = data.candidates
      ?. [0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error("Gemini returned no response:", data);

      return res.status(502).json({
        error: "Gemini returned no response"
      });
    }

    // Return response
    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
