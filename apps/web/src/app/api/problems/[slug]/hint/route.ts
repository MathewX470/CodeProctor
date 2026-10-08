import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { code, language, problemTitle, problemDescription, hintNumber } = body;

    if (!code || !problemTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (hintNumber > 3) {
      return NextResponse.json({ error: "Maximum hints reached for this session." }, { status: 403 });
    }

    const prompt = `
You are an expert coding tutor. A student is trying to solve a programming problem but needs a hint.
Do NOT give them the direct answer or write the complete code for them. Give them a helpful hint based on what they have written so far.
This is hint #${hintNumber} of 3. If it's hint 1, give a gentle nudge. If it's hint 2, be a bit more specific. If it's hint 3, give a very clear structural hint or pseudocode.

Problem Title: ${problemTitle}
Problem Description: ${problemDescription}
Language: ${language}

Student's Current Code:
\`\`\`${language}
${code}
\`\`\`

Provide a short, concise, and helpful hint.
    `;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a helpful coding assistant that provides hints without giving away the direct answer."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "qwen/qwen3.8-27b",
        stream: false,
        temperature: 0.7
      })
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      console.error("Groq API error:", err);
      throw new Error("Failed to communicate with Groq API");
    }

    const data = await groqResponse.json();
    const hint = data.choices[0].message.content;

    return NextResponse.json({ hint });
  } catch (error: any) {
    console.error("Error generating hint:", error);
    return NextResponse.json(
      { error: "Failed to generate hint." },
      { status: 500 }
    );
  }
}
