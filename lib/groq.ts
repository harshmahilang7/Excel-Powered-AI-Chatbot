import Groq from "groq-sdk";
import type { StudentRow } from "@/types";
import { rowToText } from "./excel-parser";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a friendly orientation assistant. Your sole purpose is to help users find information stored in the uploaded data file.

You will receive a set of matched records and the user's question. Follow these rules:

1. **If a matching record is found**: Give a warm, direct answer. Include all relevant details from the record. Use **bold** for key info and bullet points for multiple entries.

2. **If multiple records match**: List each entry clearly with their details.

3. **If no record is found**: Politely say the information wasn't found and suggest the user contact the relevant administrator. Do not make up information.

4. **If the data doesn't look relevant to the question**: Inform the user and ask them to upload a more appropriate file.

5. **If the question is completely unrelated to the data**: Politely redirect — explain you can only help with queries about the uploaded dataset.

6. **Never fabricate** information not present in the records provided.

7. Keep answers concise, clear, and user-friendly. Use markdown formatting where helpful.`;

function buildUserMessage(
  query: string,
  matchedRows: StudentRow[],
  allHeaders: string[],
  total: number
): string {
  const meta = [
    `Total records in database: ${total}`,
    allHeaders.length > 0 ? `Available columns: ${allHeaders.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const context =
    matchedRows.length > 0
      ? matchedRows.map((r, i) => `Record ${i + 1}: ${rowToText(r)}`).join("\n")
      : "No matching records found in the database.";

  return `Database metadata:
${meta}

User's question: "${query}"

Relevant records (${matchedRows.length} shown):
${context}

Please answer the user's question. Use the metadata (total count, column names) when the question is about the database itself (e.g. "how many records", "what columns exist").`;
}

export async function generateAnswer(
  query: string,
  matchedRows: StudentRow[],
  allHeaders: string[],
  totalRows?: number
): Promise<string> {
  const total = totalRows ?? matchedRows.length;
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(query, matchedRows, allHeaders, total) },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  return (
    completion.choices[0]?.message?.content ??
    "I couldn't generate a response. Please try again."
  );
}

export async function streamAnswer(
  query: string,
  matchedRows: StudentRow[],
  allHeaders: string[],
  totalRows?: number
): Promise<AsyncIterable<string>> {
  const total = totalRows ?? matchedRows.length;
  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(query, matchedRows, allHeaders, total) },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    stream: true,
  });

  return (async function* () {
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  })();
}
