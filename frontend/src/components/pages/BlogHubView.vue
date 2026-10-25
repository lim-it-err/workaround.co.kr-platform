<script setup>
import { reactive, toRefs } from 'vue'
import { blogCategory, formatBlogDate } from '../../composables/useBlogStore.js'

const props = defineProps({
  // useBlogStore() 의 반환값(상태·함수 묶음).
  store: { type: Object, required: true }
})
const emit = defineEmits(['open-page'])

const { latestPublishedBlogPost, publishedBlogPosts, openBlogArchive, openBlogPost } = toRefs(reactive(props.store))
</script>

<template>
  <section class="feature-shell blog-shell">
    <section class="blog-tone-page blog-hub-page">
      <section v-if="latestPublishedBlogPost" class="blog-tone-hero">
        <small>최근 글</small>
        <h1>
          <button type="button" class="blog-text-link" @click="openBlogPost(latestPublishedBlogPost.slug)">
            {{ latestPublishedBlogPost.title }}
          </button>
        </h1>
        <p>{{ latestPublishedBlogPost.summary }}</p>
      </section>
      <section v-else class="blog-tone-hero">
        <small>최근 글</small>
        <h1>아직 공개된 글이 없습니다</h1>
        <p>첫 기록은 글쓰기에서 시작할 수 있습니다.</p>
      </section>

      <nav class="blog-tone-actions" aria-label="블로그 바로가기">
        <button type="button" class="ghost-button" @click="emit('open-page', 'writingStudio')">새 글 쓰기</button>
        <button type="button" class="ghost-button" @click="openBlogArchive">보관함</button>
      </nav>

      <div class="blog-timetable" aria-label="최근 발행 글">
        <article v-for="post in publishedBlogPosts.slice(1, 4)" :key="post.id" class="blog-timetable-row">
          <p class="blog-timetable-meta">
            <time>{{ formatBlogDate(post.publishedAt) }}</time> · {{ blogCategory(post) }}
          </p>
          <h2>
            <button type="button" class="blog-text-link" @click="openBlogPost(post.slug)">{{ post.title }}</button>
          </h2>
        </article>
      </div>
    </section>
  </section>
</template>
