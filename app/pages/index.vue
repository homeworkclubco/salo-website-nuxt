<script setup lang="ts">
import { getHomepage } from '~/composables/usePayloadAPI'
import HeroBlock from '~/components/blocks/HeroBlock.vue'
import RichTextBlock from '~/components/blocks/RichTextBlock.vue'

// Fetch homepage data
const page = await getHomepage()

// During build, if homepage is not available, provide a fallback
// This prevents build failures while allowing proper 404 handling in production
if (!page) {
  // Log the issue for debugging
  console.error('Homepage not found - check that:')
  console.error('1. NUXT_PUBLIC_PAYLOAD_URL is set correctly')
  console.error('2. PayloadCMS backend is accessible')
  console.error('3. A homepage is configured in Site Settings or a page has isHomepage=true')

  // In production, throw 404
  // During build/dev, show error message instead of crashing
  if (process.server && process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      message: 'Homepage not found. Please configure a homepage in Site Settings.',
    })
  }
}

const { title, content, meta } = page || {
  title: 'Homepage',
  content: [],
  meta: { title: 'Loading...', description: '' }
}

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
