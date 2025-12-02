<script setup lang="ts">
import { getPageBySlug } from '~/composables/usePayloadAPI'
import HeroBlock from '~/components/blocks/HeroBlock.vue'
import RichTextBlock from '~/components/blocks/RichTextBlock.vue'

const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : route.params.slug

// Fetch page data by slug
const page = await getPageBySlug(slug)

if (!page) {
  throw createError({
    statusCode: 404,
    message: 'Page not found',
  })
}

const { title, content, meta } = page

useHead({
  title: meta?.title || title,
  meta: [
    {
      name: 'description',
      content: meta?.description || '',
    },
  ],
})
</script>

<template>
  <article>
    <h1 class="sr-only">{{ title }}</h1>

    <template v-if="content">
      <template v-for="block in content" :key="block.id">
        <HeroBlock v-if="block.blockType === 'hero'" v-bind="block" />
        <RichTextBlock v-else-if="block.blockType === 'richText'" v-bind="block" />
      </template>
    </template>
  </article>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
