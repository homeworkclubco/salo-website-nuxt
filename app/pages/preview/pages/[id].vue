<script setup lang="ts">
import { getPageById, type Page } from '~/composables/usePayloadAPI'
import HeroBlock from '~/components/blocks/HeroBlock.vue'
import RichTextBlock from '~/components/blocks/RichTextBlock.vue'

const route = useRoute()
const pageId = route.params.id as string

// Fetch initial page data
const initialData = await getPageById(pageId)

if (!initialData) {
  throw createError({
    statusCode: 404,
    message: 'Page not found',
  })
}

// Set up live preview - data will update in real-time when changes are made in CMS
const { data, isLoading } = useLivePreview<Page>({
  initialData,
  serverURL: (useRuntimeConfig().public.payloadUrl as string) || 'http://localhost:3000',
  depth: 2,
})

useHead({
  title: `Preview: ${data.value.title}`,
})
</script>

<template>
  <div class="preview-container">

    <!-- Page content -->
    <article class="preview-content">
      <h1 class="sr-only">{{ data.title }}</h1>

      <template v-if="data.content">
        <template v-for="block in data.content" :key="block.id">
          <HeroBlock v-if="block.blockType === 'hero'" v-bind="block" />
          <RichTextBlock v-else-if="block.blockType === 'richText'" v-bind="block" />
        </template>
      </template>
    </article>
  </div>
</template>

<style scoped>
.preview-container {
  min-height: 100vh;
}

.preview-content {
  max-width: 100%;
}

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
