/**
 * DeepSeek AI 聊天窗（右下角悬浮）
 * 依赖 chat.ejs 中注入的 window.aiChatConfig
 */
(function () {
    "use strict";

    const cfg = window.aiChatConfig || {};
    const endpoint = cfg.endpoint || "/api/chat";
    const model = cfg.model || "deepseek-chat";
    const HISTORY_KEY = "ai-chat-history-v1";
    const MAX_HISTORY = Number(cfg.maxHistory) || 12;

    // 博客检索（轻量 RAG）相关
    const SEARCH_ENABLED = cfg.searchBlog !== false;
    const INDEX_URL = cfg.indexPath || "/ai-blog-index.json";
    const SEARCH_RESULTS = Number(cfg.searchResults) || 3;
    let blogIndex = null; // 缓存的博客索引 { stats, posts } 或旧版数组
    let blogStats = null; // 缓存的博客统计信息

    const panel = document.getElementById("ai-chat-panel");
    const toggle = document.getElementById("ai-chat-toggle");
    const closeBtn = document.getElementById("ai-chat-close");
    const clearBtn = document.getElementById("ai-chat-clear");
    const messagesEl = document.getElementById("ai-chat-messages");
    const inputEl = document.getElementById("ai-chat-input");
    const sendBtn = document.getElementById("ai-chat-send");

    if (!panel || !toggle) return;

    let history = loadHistory();
    let busy = false;
    let greeted = false;

    // ---------- 工具函数 ----------

    function loadHistory() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
        } catch (e) {
            /* ignore */
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /** 轻量 Markdown 渲染（安全：先转义再替换） */
    function renderMarkdown(text) {
        let html = escapeHtml(text);
        // 代码块 ```lang\n...```
        html = html.replace(/```([\s\S]*?)```/g, (m, code) => {
            const lines = code.split("\n");
            let lang = "";
            if (lines[0] && !/\s/.test(lines[0]) && lines[0].length < 30) {
                lang = lines.shift();
            }
            return (
                '<pre class="ai-chat-code"><code' +
                (lang ? ` data-lang="${lang}"` : "") +
                ">" +
                escapeHtml(lines.join("\n")) +
                "</code></pre>"
            );
        });
        // 行内代码
        html = html.replace(/`([^`\n]+)`/g, '<code class="ai-chat-inline-code">$1</code>');
        // 加粗
        html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        // 链接
        html = html.replace(
            /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        // 换行
        html = html.replace(/\n/g, "<br>");
        return html;
    }

    function addMessage(role, content) {
        const wrap = document.createElement("div");
        wrap.className = "ai-chat-msg " + (role === "user" ? "ai-chat-msg-user" : "ai-chat-msg-bot");

        const avatar = document.createElement("div");
        avatar.className = "ai-chat-avatar";
        avatar.innerHTML =
            role === "user"
                ? '<i class="fa-solid fa-user"></i>'
                : '<i class="fa-solid fa-robot"></i>';

        const bubble = document.createElement("div");
        bubble.className = "ai-chat-bubble";
        if (role === "user") {
            bubble.textContent = content;
        } else {
            bubble.innerHTML = renderMarkdown(content);
            // 高亮代码块（主题已加载 highlight.js）
            bubble.querySelectorAll("pre code").forEach((el) => {
                if (window.hljs) {
                    try {
                        hljs.highlightElement(el);
                    } catch (e) {
                        /* ignore */
                    }
                }
            });
        }

        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        messagesEl.appendChild(wrap);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return wrap;
    }

    function showTyping() {
        const wrap = document.createElement("div");
        wrap.className = "ai-chat-msg ai-chat-msg-bot";
        wrap.id = "ai-chat-typing";
        const avatar = document.createElement("div");
        avatar.className = "ai-chat-avatar";
        avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
        const bubble = document.createElement("div");
        bubble.className = "ai-chat-bubble ai-chat-typing";
        bubble.innerHTML = "<span></span><span></span><span></span>";
        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        messagesEl.appendChild(wrap);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById("ai-chat-typing");
        if (el) el.remove();
    }

    // ---------- 博客检索（轻量 RAG） ----------

    /** 加载博客索引（只加载一次，失败静默返回；兼容 {stats, posts} 与旧版数组） */
    async function loadBlogIndex() {
        if (blogIndex !== null) return blogIndex;
        try {
            // no-cache：每次都向服务器确认索引是否更新，避免浏览器缓存旧索引导致检索不到新文章
            const res = await fetch(INDEX_URL + (INDEX_URL.includes("?") ? "&" : "?") + "_t=" + Date.now(), {
                cache: "no-cache",
            });
            if (!res.ok) {
                blogIndex = [];
                return blogIndex;
            }
            const data = await res.json();
            if (data && Array.isArray(data.posts)) {
                blogStats = data.stats || null;
                blogIndex = data.posts;
            } else if (Array.isArray(data)) {
                blogIndex = data;
            } else {
                blogIndex = [];
            }
        } catch (e) {
            blogIndex = [];
        }
        return blogIndex;
    }

    /** 简单分词：提取中文词（2-gram）与英文词，用于关键词匹配 */
    function tokenize(text) {
        const str = String(text || "").toLowerCase();
        const tokens = [];
        // 英文/数字词
        const en = str.match(/[a-z0-9][a-z0-9._+-]{1,}/g) || [];
        tokens.push(...en.map((w) => w.toLowerCase()));
        // 中文连续片段按 2-gram 切分
        const zh = str.match(/[\u4e00-\u9fa5]{2,}/g) || [];
        for (const seg of zh) {
            for (let i = 0; i < seg.length - 1; i++) {
                tokens.push(seg.slice(i, i + 2));
            }
            if (seg.length >= 4) tokens.push(seg);
        }
        return tokens;
    }

    /** 去掉对检索无意义的高频词（停用词） */
    const STOP_WORDS = new Set([
        "的", "了", "是", "我", "你", "他", "她", "它", "们", "在", "有", "和", "与",
        "就", "都", "而", "及", "或", "这", "那", "吗", "呢", "啊", "吧", "嘛", "哦",
        "吗", "什么", "怎么", "如何", "为什么", "哪里", "哪儿", "哪个", "哪些", "多少",
        "可以", "能够", "请问", "一下", "博客", "文章", "内容", "问题", "描述", "讲解",
        "介绍", "关于", "请问", "知道", "告诉", "说下", "看看", "找到", "查询", "搜索",
        "检索", "回答", "了解", "这个", "那个", "一个", "我们", "你们", "他们", "自己",
        "进行", "通过", "如果", "然后", "或者", "因为", "所以", "但是", "需要", "应该",
    ]);

    /** 返回与问题最相关的文章（带评分） */
    function searchBlog(question, limit) {
        const tokens = tokenize(question).filter((t) => !STOP_WORDS.has(t) && t.length > 1);
        if (tokens.length === 0) return [];

        const scored = [];
        for (const post of blogIndex) {
            const haystack = (post.title + " " + (post.tags || []).join(" ") + " " + post.text).toLowerCase();
            let score = 0;
            for (const tok of tokens) {
                const idx = haystack.indexOf(tok);
                if (idx >= 0) {
                    // 命中标题/标签权重更高
                    const inTitle = post.title.toLowerCase().includes(tok);
                    const inTag = (post.tags || []).some((t) => t.toLowerCase().includes(tok));
                    score += inTitle ? 5 : inTag ? 4 : 2;
                    // 正文多处命中可加分（上限控制）
                    let count = 0;
                    let from = 0;
                    while (count < 5) {
                        const p = haystack.indexOf(tok, from);
                        if (p < 0) break;
                        count++;
                        from = p + tok.length;
                    }
                    score += count;
                }
            }
            if (score > 0) scored.push({ post, score });
        }

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map((s) => s.post);
    }

    /** 从文章正文中截取包含关键词的上下文片段 */
    function extractSnippet(post, question, maxLen) {
        const text = post.text || "";
        const tokens = tokenize(question).filter((t) => !STOP_WORDS.has(t) && t.length > 1);
        const lower = text.toLowerCase();

        // 找第一个命中的位置
        let hit = -1;
        for (const tok of tokens) {
            hit = lower.indexOf(tok);
            if (hit >= 0) break;
        }
        if (hit < 0) return text.slice(0, maxLen);

        const start = Math.max(0, hit - 120);
        const end = Math.min(text.length, hit + maxLen - 120);
        return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    }

    /** 判断问题是否是"博客统计"类问题（文章数/标签数/分类数等） */
    function isStatsQuestion(question) {
        const q = String(question || "");
        return (
            /(多少|几|几个|几篇|总共|一共|共有|有多少|数量|统计|总数|篇数|文章数|帖子数|篇文)/.test(q) &&
            /(篇|文章|帖子|博客|博文|标签|分类|类别|字数|内容|记录)/.test(q)
        );
    }

    /** 组装博客统计信息上下文（回答"有多少篇文章"等问题；不依赖 stats 字段，可自行统计兜底） */
    function buildStatsContext() {
        // 优先用索引自带的 stats；没有则用文章数组自行统计
        let s = blogStats;
        if (!s && blogIndex && blogIndex.length) {
            const tagCount = {};
            const catCount = {};
            let words = 0;
            const dates = [];
            for (const p of blogIndex) {
                words += (p.text || "").length;
                if (p.date) dates.push(p.date);
                for (const t of p.tags || []) tagCount[t] = (tagCount[t] || 0) + 1;
                for (const c of p.categories || []) catCount[c] = (catCount[c] || 0) + 1;
            }
            dates.sort();
            s = {
                totalPosts: blogIndex.length,
                totalWords: words,
                firstDate: dates[0] || "",
                lastDate: dates[dates.length - 1] || "",
                tags: Object.entries(tagCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => ({ name, count })),
                categories: Object.entries(catCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => ({ name, count })),
            };
        }
        if (!s) return null;

        const tagsStr = (s.tags && s.tags.length
            ? s.tags.map((t) => `${t.name}(${t.count})`).join("、")
            : "无");
        const catsStr = (s.categories && s.categories.length
            ? s.categories.map((c) => `${c.name}(${c.count})`).join("、")
            : "无");
        return {
            role: "system",
            content:
                `【博客概况】本博客共有 ${s.totalPosts} 篇文章` +
                (s.totalWords ? `，约 ${s.totalWords} 字` : "") +
                (s.firstDate && s.lastDate ? `，时间范围 ${s.firstDate} 至 ${s.lastDate}` : "") +
                `。标签：${tagsStr}。分类：${catsStr}。` +
                "请直接依据这些统计数据回答用户关于博客规模、文章数量、标签分类等问题。",
        };
    }

    /** 检索博客并组装上下文消息（返回 null 表示不注入） */
    async function buildBlogContext(question) {
        if (!SEARCH_ENABLED) return null;
        const index = await loadBlogIndex();
        if (!index.length) return null;

        // 统计类问题：优先给博客概况
        if (isStatsQuestion(question)) {
            const statsCtx = buildStatsContext();
            if (statsCtx) return statsCtx;
        }

        const hits = searchBlog(question, SEARCH_RESULTS);
        if (!hits.length) {
            // 没检索到相关文章，但至少注入博客概况，避免答非所问
            const statsCtx = buildStatsContext();
            if (statsCtx) return statsCtx;
            return null;
        }

        const parts = hits.map((post, i) => {
            const snippet = extractSnippet(post, question, 500);
            const tagStr = (post.tags && post.tags.length ? " 标签: " + post.tags.join(", ") : "");
            return (
                `【资料${i + 1}】《${post.title}》` +
                (post.date ? "（" + post.date + "）" : "") +
                tagStr +
                "\n链接: " + (post.url || "") +
                "\n摘要: " + snippet
            );
        });

        return {
            role: "system",
            content:
                "以下是用户博客中可能与问题相关的文章资料，请优先依据这些资料回答；若资料不足请如实说明。\n\n" +
                parts.join("\n\n"),
        };
    }

    // ---------- 对话 ----------

    async function send() {
        const text = inputEl.value.trim();
        if (!text || busy) return;

        busy = true;
        inputEl.value = "";
        autoResize();
        addMessage("user", text);
        history.push({ role: "user", content: text });
        saveHistory();
        showTyping();

        // 检索博客内容（若启用），把相关文章作为额外 system 上下文注入
        const blogCtx = await buildBlogContext(text);

        const messages = [
            { role: "system", content: cfg.system || "你叫「小桃花」，是部署在个人博客上的 AI 助手，回答请使用简体中文。" },
            ...(blogCtx ? [blogCtx] : []),
            ...history.slice(-MAX_HISTORY),
        ];

        try {
            const content = await callApi(endpoint, messages, model, {});
            hideTyping();
            addMessage("bot", content);
            history.push({ role: "assistant", content });
            saveHistory();
        } catch (e) {
            // 代理不可用（如本地 hexo server 没有 /api/chat）时，若配置了 apiKey 则回退直连 DeepSeek API
            if (cfg.apiKey) {
                try {
                    const content = await callApi(cfg.directApi || "https://api.deepseek.com/chat/completions", messages, model, {
                        apiKey: cfg.apiKey,
                    });
                    hideTyping();
                    addMessage("bot", content);
                    history.push({ role: "assistant", content });
                    saveHistory();
                    return;
                } catch (e2) {
                    hideTyping();
                    addMessage("bot", "直连 DeepSeek 也失败了：" + (e2.message || e2));
                    return;
                }
            }
            hideTyping();
            addMessage(
                "bot",
                "网络出错或服务端代理不可用（" +
                    (e.message || e) +
                    "）。请确认服务端已配置 Key：本地在根目录 .env 配置 DEEPSEEK_API_KEY 并重启 hexo server；线上在 Netlify 环境变量配置 DEEPSEEK_API_KEY。"
            );
        } finally {
            busy = false;
            inputEl.focus();
        }
    }

    /** 调用一次聊天补全接口，成功返回回复文本 */
    async function callApi(url, messages, model, opts) {
        const headers = { "Content-Type": "application/json" };
        if (opts.apiKey) headers["Authorization"] = "Bearer " + opts.apiKey;

        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ model, messages }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }

        const content =
            data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) throw new Error("（没有获取到回复内容）");
        return content;
    }

    function autoResize() {
        inputEl.style.height = "auto";
        inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
    }

    function openPanel() {
        panel.classList.remove("ai-chat-hidden");
        toggle.classList.add("ai-chat-open");
        if (!greeted) {
            greeted = true;
            // 已有历史则渲染历史，否则显示欢迎语
            if (history.length === 0) {
                addMessage("bot", cfg.greeting || "你好呀！有什么可以帮你？");
            } else {
                history.forEach((m) => addMessage(m.role, m.content));
            }
        }
        inputEl.focus();
    }

    function closePanel() {
        panel.classList.add("ai-chat-hidden");
        toggle.classList.remove("ai-chat-open");
    }

    function clearHistory() {
        history = [];
        saveHistory();
        messagesEl.innerHTML = "";
        greeted = false;
        openPanel();
    }

    // ---------- 事件 ----------

    toggle.addEventListener("click", () => {
        if (panel.classList.contains("ai-chat-hidden")) openPanel();
        else closePanel();
    });

    closeBtn.addEventListener("click", closePanel);
    clearBtn.addEventListener("click", clearHistory);

    sendBtn.addEventListener("click", send);

    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    });

    inputEl.addEventListener("input", autoResize);
})();
