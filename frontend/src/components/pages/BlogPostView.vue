<script setup>
import { reactive, toRefs } from 'vue'
import { blogCategory, formatBlogLongDate } from '../../composables/useBlogStore.js'
import { renderMarkdownToHtml } from '../../composables/blogMarkdown.js'

const props = defineProps({
  // useBlogStore() 의 반환값(상태·함수 묶음).
  store: { type: Object, required: true }
})

const { activeBlogPost, openBlogArchive, openStudioForPost } = toRefs(reactive(props.store))
</script>

<template>
  <section class="feature-shell blog-shell">
    <article v-if="activeBlogPost" class="post-detail">
      <header class="post-tone-hero">
        <h1>{{ activeBlogPost.title }}</h1>
        <p>{{ formatBlogLongDate(activeBlogPost.publishedAt) }} · {{ blogCategory(activeBlogPost) }}</p>
      </header>

      <div class="markdown-body post-body" v-html="renderMarkdownToHtml(activeBlogPost.bodyMarkdown, activeBlogPost.tables)"></div>

      <footer class="post-foot-nav">
        <button type="button" class="post-nav-link" @click="openBlogArchive">← 보관함</button>
        <button type="button" class="post-nav-link" @click="openStudioForPost(activeBlogPost.id)">이어서 쓰기 →</button>
      </footer>
    </article>
    <article v-else class="blog-tone-page blog-not-found" role="status">
      <p class="eyebrow">찾을 수 없음</p>
      <h3>공개 글을 찾을 수 없습니다</h3>
      <p>주소가 바뀌었거나 보관된 글입니다.</p>
      <button type="button" class="ghost-button" @click="openBlogArchive">공개 글 목록</button>
    </article>
  </section>
</template>
