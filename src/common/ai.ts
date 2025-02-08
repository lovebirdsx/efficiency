import OpenAI from "openai";

export interface IAskAiOptions {
    baseUrl: string;
    question: string;
    model: string;
    apiKey: string;
}

export async function askAi(
    options: IAskAiOptions,
    onChunk: (chunk: string) => Promise<void>
): Promise<void> {
    const openai = new OpenAI({
        baseURL: options.baseUrl,
        apiKey: options.apiKey,
    });
    
    const stream = await openai.chat.completions.create(
        {
            messages: [
                { role: "system", content: "你是一个专业的ai助手" },
                { role: "user", content: options.question }
            ],
            model: options.model,
            stream: true,
        }
    );
    
    for await (const chunk of stream) {
        const content = chunk.choices[0].delta?.content;
        if (content) {
            await onChunk(content);
        }
    }
}
