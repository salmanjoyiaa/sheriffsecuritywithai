import Groq from "groq-sdk";

// Lazy Groq SDK singleton — avoids crash during build when env var is missing
let _groq: Groq | null = null;
function getGroq(): Groq {
    if (!_groq) {
        _groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }
    return _groq;
}

interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
}

/**
 * Generate a text response from the LLM
 */
export async function generateText(
    prompt: string,
    systemPrompt: string,
    options: GenerateOptions = {}
): Promise<string> {
    const {
        temperature = 0.6,
        maxTokens = 1024,
        model = "llama-3.3-70b-versatile",
    } = options;

    const response = await getGroq().chat.completions.create({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || "";
}

/**
 * Generate a structured JSON response from the LLM with retry logic
 */
export async function generateJSON<T>(
    prompt: string,
    systemPrompt: string,
    options: GenerateOptions = {}
): Promise<T> {
    const {
        temperature = 0.6,
        maxTokens = 2048,
        model = "llama-3.3-70b-versatile",
    } = options;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await getGroq().chat.completions.create({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
                temperature,
                max_tokens: maxTokens,
                response_format: { type: "json_object" },
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error("Empty response from LLM");
            }

            return JSON.parse(content) as T;
        } catch (error) {
            lastError = error as Error;
            console.error(`Groq attempt ${attempt + 1} failed:`, error);

            // Don't retry on rate limit errors — wait and retry
            if (
                error instanceof Error &&
                error.message.includes("rate_limit_exceeded")
            ) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 2000 * (attempt + 1))
                );
            }
        }
    }

    throw lastError || new Error("Failed to generate JSON response");
}
