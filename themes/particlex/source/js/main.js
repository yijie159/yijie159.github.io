const app = Vue.createApp({
    mixins: Object.values(mixins),
    data() {
        return {
            loading: true,
            hiddenMenu: false,
            showMenuItems: false,
            menuColor: false,
            scrollTop: 0,
            renderers: [],
        };
    },
    created() {
        window.addEventListener("load", () => {
            this.loading = false;
        });
    },
    mounted() {
        window.addEventListener("scroll", this.handleScroll, true);
        this.render();
        this.buildToc();
    },
    methods: {
        render() {
            for (let i of this.renderers) i();
        },
        buildToc() {
            const toc = document.querySelector(".post-toc");
            if (!toc) return;
            const headings = [...document.querySelectorAll(".article .content h1, .article .content h2, .article .content h3, .article .content h4, .article .content h5, .article .content h6")];
            const links = [...toc.querySelectorAll("a.toc-link")];
            links.forEach((link, index) => {
                const heading = headings[index];
                if (!heading) return;
                const id = `post-heading-${index}`;
                heading.id = id;
                link.href = `#${id}`;
            });
        },
        handleScroll() {
            let wrap = this.$refs.homePostsWrap;
            let newScrollTop = document.documentElement.scrollTop;
            if (this.scrollTop < newScrollTop) {
                this.hiddenMenu = true;
                this.showMenuItems = false;
            } else this.hiddenMenu = false;
            if (wrap) {
                if (newScrollTop <= window.innerHeight - 100) this.menuColor = true;
                else this.menuColor = false;
                if (newScrollTop <= 400) wrap.style.top = "-" + newScrollTop / 5 + "px";
                else wrap.style.top = "-80px";
            }
            this.scrollTop = newScrollTop;
        },
    },
});
app.mount("#layout");
