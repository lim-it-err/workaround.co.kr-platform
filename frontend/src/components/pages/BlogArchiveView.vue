<script setup>
import { reactive, toRefs } from 'vue'
import { formatBlogDate } from '../../composables/useBlogStore.js'

const props = defineProps({
  // useBlogStore() 의 반환값(상태·함수 묶음).
  store: { type: Object, required: true }
})

const { blogArchiveYears, openBlogPost } = toRefs(reactive(props.store))
</script>

<template>
  <section class="feature-shell blog-shell">
    <section class="blog-tone-page blog-archive-page">
      <header class="blog-tone-hero">
        <small>글 보관함</small>
        <h1>생각이 지나간 자리</h1>
      </header>

      <section v-for="group in blogArchiveYears" :key="group.year" class="blog-year-group">
        <h2 class="blog-year-label">{{ group.year }}<template v-if="group.year !== '날짜 미정'">년</template></h2>
        <div class="blog-archive-timetable">
          <button
            v-for="post in group.posts"
            :key="post.id"
            type="button"
            class="blog-archive-row"
            @click="openBlogPost(post.slug)"
          >
            <time>{{ formatBlogDate(post.publishedAt) }}</time>
            <strong>{{ post.title }}</strong>
          </button>
        </div>
      </section>

      <p v-if="blogArchiveYears.length === 0" class="blog-empty-copy">아직 공개된 글이 없습니다.</p>
    </section>
  </section>
</template>
