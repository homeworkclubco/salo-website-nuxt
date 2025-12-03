<script setup lang="ts">
  import { getPageById, type Page } from "~/composables/usePayloadAPI";
  import HeroBlock from "~/components/blocks/HeroBlock.vue";
  import RichTextBlock from "~/components/blocks/RichTextBlock.vue";

  const route = useRoute();
  const pageId = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;
  const event = useRequestEvent();

  if (!pageId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Page ID is required",
    });
  }

  // Reactive data for the page
  const pageData = ref<Page | null>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const isLiveMode = ref(false);

  // Fetch page data
  const fetchPage = async (draft: boolean = false) => {
    try {
      const data = await getPageById(pageId, draft, event);
      if (data) {
        pageData.value = data;
        isLiveMode.value = draft;
      } else if (!draft) {
        error.value = "Page not found";
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load page";
    } finally {
      isLoading.value = false;
    }
  };

  // Initial fetch - try draft first if we're in an iframe (likely from CMS)
  const isInIframe = ref(false);
  onMounted(() => {
    isInIframe.value = window.self !== window.top;

    // If we're in an iframe, try draft mode first
    if (isInIframe.value) {
      fetchPage(true).then(() => {
        // If draft fails, fallback to published
        if (!pageData.value) {
          fetchPage(false);
        }
      });
    } else {
      fetchPage(false);
    }
  });

  // Simple polling for live updates when in draft mode
  let pollInterval: NodeJS.Timeout | null = null;
  watch(isLiveMode, (live) => {
    if (live) {
      // Poll every 2 seconds for draft updates
      pollInterval = setInterval(() => {
        fetchPage(true);
      }, 2000);
    } else {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }
  });

  onUnmounted(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  });

  useHead({
    title: computed(() => `Preview: ${pageData.value?.title || "Loading..."}`),
  });
</script>

<template>
  <div class="preview-container">
    <!-- Live mode indicator -->
    <div v-if="isLiveMode" class="live-indicator">
      🔄 LIVE PREVIEW - Auto-updating every 2 seconds
    </div>

    <div v-if="isLoading" class="loading">
      <h1>Loading preview...</h1>
    </div>
    <div v-else-if="error" class="error">
      <h1>Error loading preview</h1>
      <p>{{ error }}</p>
    </div>
    <div v-else-if="pageData" class="preview-content">
      <h1 class="sr-only">{{ pageData.title }}</h1>
      <template v-if="pageData.content">
        <template v-for="block in pageData.content" :key="block.id">
          <HeroBlock v-if="block.blockType === 'hero'" v-bind="block" />
          <RichTextBlock
            v-else-if="block.blockType === 'richText'"
            v-bind="block"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .preview-container {
    min-height: 100vh;
  }

  .loading,
  .error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
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
