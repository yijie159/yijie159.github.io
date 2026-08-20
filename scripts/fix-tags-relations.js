'use strict';
// 修复 hexo server（watch 模式）下 post.tags / post.categories / site.tags 为空的问题
// 原因：hexo 8 的 watch() 流程不会调用 _binaryRelationIndex.load()，
//      只有 load()（hexo generate）会调用，导致 server 模式下标签/分类数据缺失。
// 在每次生成前手动补上关联索引加载（幂等，generate 模式无副作用）。

function loadRelationIndex() {
    if (hexo && hexo._binaryRelationIndex) {
        try {
            hexo._binaryRelationIndex.post_tag.load();
            hexo._binaryRelationIndex.post_category.load();
        } catch (e) {
            /* ignore */
        }
    }
}

// 生成前加载（覆盖 hexo generate 与 hexo server 的 _generate 流程）
hexo.extend.filter.register('before_generate', loadRelationIndex);
