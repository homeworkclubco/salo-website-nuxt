<script setup lang="ts">
import type { RichTextBlock } from '~/composables/usePayloadAPI'

const props = defineProps<RichTextBlock>()


// Simple text extraction for now (you can add proper lexical serializer later)
const extractText = (content: any): string => {
  if (!content || !content.root || !content.root.children) {
    return ''
  }

  const getText = (node: any): string => {
    if (typeof node === 'string') return node
    if (node.text) return node.text
    if (node.children) {
      return node.children.map(getText).join('')
    }
    return ''
  }

  return content.root.children.map(getText).join('\n\n')
}

const text = extractText(props.content)
</script>

<template>
  <div class="rich-text">
    <p>{{ text }}</p>
    <!-- TODO: Implement proper lexical serializer like in Astro frontend -->
  </div>
</template>

<style scoped>
.rich-text {
  max-width: 800px;
  margin: 3rem auto;
  padding: 0 2rem;
  line-height: 1.7;
}

.rich-text :deep(h2) {
  font-size: 2rem;
  font-weight: bold;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.rich-text :deep(h3) {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.rich-text :deep(p) {
  margin-bottom: 1rem;
}

.rich-text :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.rich-text :deep(a:hover) {
  color: #2563eb;
}

.rich-text :deep(strong) {
  font-weight: 600;
}

.rich-text :deep(em) {
  font-style: italic;
}

.rich-text :deep(ul),
.rich-text :deep(ol) {
  margin-left: 2rem;
  margin-bottom: 1rem;
}

.rich-text :deep(li) {
  margin-bottom: 0.5rem;
}

.rich-text :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875em;
}
</style>
