/**
 * 主页左侧文章目录
 * 从 #home-posts 的 .post 卡片提取标题，生成吸顶目录；
 * 点击平滑滚动到对应文章，滚动时高亮当前可见项。
 */
(function () {
    "use strict";

    function initHomeToc() {
        const postsWrap = document.getElementById("home-posts-wrap");
        const homePosts = document.getElementById("home-posts");
        if (!postsWrap || !homePosts) return;

        const posts = homePosts.querySelectorAll(".post");
        if (!posts.length) return;

        // 已有目录则不重复生成
        if (document.getElementById("home-toc")) return;

        // 构建目录容器
        const toc = document.createElement("aside");
        toc.id = "home-toc";
        toc.innerHTML =
            '<div id="home-toc-title"><i class="fa-solid fa-list"></i><span>文章目录</span></div>' +
            '<ul id="home-toc-list"></ul>';

        const list = toc.querySelector("#home-toc-list");

        // 为每篇文章生成目录项，并给文章卡片加锚点 id
        posts.forEach((post, index) => {
            const titleEl = post.querySelector(".post-title");
            if (!titleEl) return;
            const id = "home-post-" + index;
            post.id = id;

            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = "#" + id;
            a.textContent = titleEl.textContent.trim() || ("文章 " + (index + 1));
            a.dataset.target = id;
            li.appendChild(a);
            list.appendChild(li);
        });

        // 插入到文章列表左侧
        postsWrap.insertBefore(toc, postsWrap.firstChild);
        toc.style.display = "block";

        // 滚动高亮：找出当前视口内最靠上的文章
        const links = list.querySelectorAll("a");
        function updateActive() {
            let currentId = null;
            const marker = window.innerHeight * 0.4; // 视口 40% 处作为基准线
            for (const post of posts) {
                const rect = post.getBoundingClientRect();
                if (rect.top <= marker) {
                    currentId = post.id;
                } else {
                    break; // posts 按文档顺序，遇到第一个超过基准线的即停止
                }
            }
            links.forEach((a) => {
                a.classList.toggle("active", a.dataset.target === currentId);
            });
        }

        // 点击目录项：平滑滚动（CSS scroll-behavior 已开启，这里阻止默认跳转并偏移）
        links.forEach((a) => {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                const target = document.getElementById(a.dataset.target);
                if (!target) return;
                const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
                window.scrollTo({ top: top, behavior: "smooth" });
            });
        });

        window.addEventListener("scroll", updateActive, { passive: true });
        window.addEventListener("resize", updateActive);
        updateActive();
    }

    // 等待 DOM 就绪后初始化
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHomeToc);
    } else {
        initHomeToc();
    }
})();
