'use strict';
// 博客全文索引生成器 —— 供 AI 助手检索博客内容（轻量 RAG）
// 在 hexo generate 时生成 public/ai-blog-index.json，
// 包含博客统计信息（stats）和每篇文章的标题、链接、标签、分类、纯文本内容（posts）。

function stripHtml(html) {
    // 去掉 HTML 标签，保留文本
    return String(html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

hexo.extend.generator.register('ai_blog_index', function (locals) {
    // 兼容 hexo server：watch() 模式不会调用 _binaryRelationIndex.load()，
    // 导致 post.tags / post.categories 为空，这里手动补上（幂等，generate 模式也无副作用）
    if (hexo._binaryRelationIndex) {
        try {
            hexo._binaryRelationIndex.post_tag.load();
            hexo._binaryRelationIndex.post_category.load();
        } catch (e) {
            /* ignore */
        }
    }

    const posts = locals.posts.sort('-date').toArray();

    const index = posts.map((post) => {
        // post.content 是渲染后的 HTML；post._content 是原始 Markdown
        const raw = post._content || post.content || '';
        return {
            title: post.title || '',
            url: post.permalink || '',
            date: post.date ? post.date.format('YYYY-MM-DD') : '',
            tags: post.tags ? post.tags.map((t) => t.name) : [],
            categories: post.categories ? post.categories.map((c) => c.name) : [],
            // 存纯文本，控制体积并便于检索
            text: stripHtml(raw).slice(0, 20000),
        };
    });

    // 博客统计信息（用于回答"有多少篇文章/标签/分类"等统计问题）
    const tagCount = {};
    const catCount = {};
    let totalWords = 0;
    for (const p of index) {
        totalWords += p.text.length;
        for (const t of p.tags) tagCount[t] = (tagCount[t] || 0) + 1;
        for (const c of p.categories) catCount[c] = (catCount[c] || 0) + 1;
    }

    const stats = {
        totalPosts: index.length,
        totalWords: totalWords,
        firstDate: index.length ? index[index.length - 1].date : '',
        lastDate: index.length ? index[0].date : '',
        tags: Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count })),
        categories: Object.entries(catCount)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count })),
    };

    // 构建日志：每次生成索引时打印，便于确认 AI 助手知识库已随部署更新
    hexo.log.info(
        `[AI知识库] 已生成 ai-blog-index.json：${index.length} 篇文章，${totalWords} 字，${stats.tags.length} 个标签`
    );

    return {
        path: 'ai-blog-index.json',
        data: JSON.stringify({ stats, posts: index }),
    };
});
