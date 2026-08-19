'use strict';
// 本地 hexo server 的 /api/chat 代理 —— 解决本地开发时 404 的问题
// hexo server 启动时注册中间件，把 /api/chat 转发到 DeepSeek API
// 部署到 Netlify 时由 netlify/functions/chat.js 处理同一路径，两者互不影响
//
// API Key 读取顺序：环境变量 DEEPSEEK_API_KEY → 根目录 .env 文件（DEEPSEEK_API_KEY=...）
// 代码仓库中不存放任何 Key

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

// 从根目录 .env 加载 DEEPSEEK_API_KEY（若环境变量未设置）
function loadApiKey() {
    if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
    try {
        const envPath = path.join(hexo.base_dir, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/^\s*DEEPSEEK_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m);
            if (match && match[1]) return match[1].trim();
        }
    } catch (e) {
        /* ignore */
    }
    return null;
}

hexo.extend.filter.register('server_middleware', function (app) {
    app.use((req, res, next) => {
        // 仅处理 /api/chat（含 /api/chat/xxx），其余交给后续中间件
        if (!req.url || !req.url.startsWith('/api/chat')) return next();

        // CORS（本地开发跨端口调试用）
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            return;
        }

        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            let payload;
            try {
                payload = JSON.parse(body || '{}');
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '请求体不是合法的 JSON' }));
                return;
            }

            const messages = (Array.isArray(payload.messages) ? payload.messages : [])
                .slice(-MAX_MESSAGES)
                .map((m) => ({
                    role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
                    content: String(m.content ?? '').slice(0, MAX_MESSAGE_LENGTH),
                }))
                .filter((m) => m.content.length > 0);

            if (messages.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '缺少 messages' }));
                return;
            }

            const model = typeof payload.model === 'string' ? payload.model : 'deepseek-chat';
            const apiKey = loadApiKey();
            if (!apiKey) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '未配置 DEEPSEEK_API_KEY，请在根目录 .env 文件或环境变量中设置' }));
                return;
            }

            const upstreamBody = JSON.stringify({
                model,
                messages,
                stream: false,
                temperature: 0.7,
            });

            const upstream = https.request(
                DEEPSEEK_API_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Length': Buffer.byteLength(upstreamBody),
                    },
                },
                (upRes) => {
                    let data = '';
                    upRes.on('data', (chunk) => (data += chunk));
                    upRes.on('end', () => {
                        res.writeHead(upRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(data);
                    });
                }
            );

            upstream.on('error', (err) => {
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '调用 DeepSeek API 失败: ' + (err.message || err) }));
            });

            upstream.write(upstreamBody);
            upstream.end();
        });
    });
});
