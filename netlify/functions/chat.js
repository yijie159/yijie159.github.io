// DeepSeek Chat 代理 —— Netlify Function
// 前端调用 /api/chat（由 netlify.toml 重写到本函数），
// 本函数再把请求转发给 DeepSeek API。
// API Key 只存放在服务端环境变量 DEEPSEEK_API_KEY 中，不会暴露给浏览器。

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
// API Key 只从环境变量 DEEPSEEK_API_KEY 读取（Netlify Site settings → Environment variables 配置），
// 代码仓库中不存放任何 Key
const MAX_MESSAGES = 20; // 最多携带的上下文消息条数
const MAX_MESSAGE_LENGTH = 4000; // 单条消息最大字符数
const RATE_LIMIT = 30; // 每个 IP 每分钟最多请求次数
const RATE_WINDOW_MS = 60 * 1000;

// 简单的内存限流（个人博客够用；Netlify 多实例时是近似限流）
const buckets = new Map();

function rateLimit(ip) {
    const now = Date.now();
    const bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    bucket.count += 1;
    return bucket.count <= RATE_LIMIT;
}

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json; charset=utf-8",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    const ip = event.headers["x-nf-client-connection-ip"] || "unknown";
    if (!rateLimit(ip)) {
        return {
            statusCode: 429,
            headers,
            body: JSON.stringify({ error: "请求太频繁了，请稍后再试" }),
        };
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "服务器未配置 DEEPSEEK_API_KEY 环境变量，请在 Netlify 环境变量中添加" }),
        };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || "{}");
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "请求体不是合法的 JSON" }) };
    }

    const messages = (Array.isArray(payload.messages) ? payload.messages : [])
        .slice(-MAX_MESSAGES)
        .map((m) => ({
            role: ["system", "user", "assistant"].includes(m.role) ? m.role : "user",
            content: String(m.content ?? "").slice(0, MAX_MESSAGE_LENGTH),
        }))
        .filter((m) => m.content.length > 0);

    if (messages.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "缺少 messages" }) };
    }

    const model = typeof payload.model === "string" ? payload.model : "deepseek-chat";

    try {
        const upstream = await fetch(DEEPSEEK_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                temperature: 0.7,
            }),
        });

        const text = await upstream.text();
        return {
            statusCode: upstream.status,
            headers,
            body: text,
        };
    } catch (err) {
        return {
            statusCode: 502,
            headers,
            body: JSON.stringify({ error: "调用 DeepSeek API 失败: " + (err.message || err) }),
        };
    }
};
