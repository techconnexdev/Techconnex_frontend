import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("resume") as File

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type or missing file." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64PDF = buffer.toString("base64")

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that extracts structured resume information. 
Given a base64 PDF, extract and return a JSON like this:
{
  "bio": "Professional summary (2-3 lines)",
  "skills": ["React", "Node.js", ...],
  "languages": ["English", "Bahasa Malaysia", ...],
  "yearsExperience": "X-Y",
  "suggestedHourlyRate": "RM 50-150 range",
  "certifications": [
    {
      "name": "Cert Name",
      "issuer": "Cert Issuer",
      "issuedDate": "YYYY-MM-DD"
    }
  ]
}

Focus on ICT industry and Malaysian market for the hourly rate.`,
          },
          {
            role: "user",
            content: `Resume PDF (base64): data:application/pdf;base64,${base64PDF}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1800,
      }),
    })

    if (!openaiResponse.ok) {
      const err = await openaiResponse.text()
      console.error("OpenAI error:", err)
      return NextResponse.json({ error: "Failed to process resume" }, { status: 500 })
    }

    const result = await openaiResponse.json()
    const content = result.choices?.[0]?.message?.content

    const parsed = JSON.parse(content)

    const cleaned = {
      bio: parsed.bio || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 15) : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages.slice(0, 8) : [],
      yearsExperience: parsed.yearsExperience || "",
      suggestedHourlyRate: parsed.suggestedHourlyRate || "",
      certifications: Array.isArray(parsed.certifications)
        ? parsed.certifications.map((cert: { name: unknown; issuer: unknown; issuedDate: unknown }) => ({
            name: (typeof cert.name === "string" ? cert.name : "") || "",
            issuer: (typeof cert.issuer === "string" ? cert.issuer : "") || "",
            issuedDate: (typeof cert.issuedDate === "string" ? cert.issuedDate : "") || "",
            verified: false,
          }))
        : [],
    }

    return NextResponse.json(cleaned)
  } catch (error) {
    console.error("Resume AI error:", error)
    return NextResponse.json({ error: "Something went wrong during resume processing" }, { status: 500 })
  }
}
