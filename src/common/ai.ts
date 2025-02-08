import OpenAI from "openai";

export interface IAskAiOptions {
    baseUrl: string;
    question: string;
    model: string;
    apiKey: string;
    timeout?: number;
}

export async function askAi(
    options: IAskAiOptions,
    onChunk: (chunk: string) => Promise<void>
): Promise<void> {
    const openai = new OpenAI({
        baseURL: options.baseUrl,
        apiKey: options.apiKey,
    });

    // 默认超时时间为 5000 毫秒
    const timeoutMs = options.timeout ?? 5000;

    // 创建一个超时 Promise
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    const stream = await Promise.race([
        openai.chat.completions.create({
            messages: [
                { role: "system", content: "你是一个专业的ai助手" },
                { role: "user", content: options.question }
            ],
            model: options.model,
            stream: true,
        }),
        timeoutPromise
    ]);

    if (stream instanceof Error) {
        throw stream;
    }
    
    for await (const chunk of stream as any) {
        const content = chunk.choices[0].delta?.content;
        if (content) {
            await onChunk(content);
        }
    }
}
