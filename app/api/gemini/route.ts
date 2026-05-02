import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, tasks } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const taskSummary = tasks
      .map((t: { title: string; status: string; priority: string; assignee: string }) =>
        `- "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Assignee: ${t.assignee || "Unassigned"}`
      )
      .join("\n");

    const prompt = `You are a helpful team collaboration assistant. Here is the current state of the team's tasks:

${taskSummary || "No tasks yet."}

User message: ${message}

Provide a helpful, concise response about team coordination, task management, or answer the user's question. Keep it under 150 words.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json({ reply: "Sorry, I couldn't process that. Please try again." }, { status: 500 });
  }
}
