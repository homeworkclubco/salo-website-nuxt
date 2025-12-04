<script setup lang="ts">
  import { getPageById, type Page } from "~/composables/usePayloadAPI";
  import { useLivePreview } from "~/composables/useLivePreview";

  const route = useRoute();
  const pageId = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id;

  if (!pageId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Page ID is required",
    });
  }

  // Reactive states with detailed tracking
  const pageData = ref<any>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const livePreviewError = ref<string | null>(null);
  const isLiveMode = ref(false);
  const debugInfo = ref<string[]>([]);
  const isInIframe = ref(false);
  const hasParentOrigin = ref(false);
  const parentOrigin = ref("");

  const addDebug = (message: string) => {
    debugInfo.value.push(`[${new Date().toISOString()}] ${message}`);
    console.log("[Preview Debug]", message);
  };

  // Step 1: Fetch initial data safely
  addDebug("Starting initial data fetch...");
  try {
    const response = await fetch(
      `${useRuntimeConfig().public.payloadUrl}/api/pages/${pageId}?depth=2`
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    pageData.value = data;
    addDebug(`Initial data loaded successfully: ${data.title || "Untitled"}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    error.value = errorMsg;
    addDebug(`Initial fetch failed: ${errorMsg}`);
    isLoading.value = false;
  }

  // Step 2: Set up live preview with error boundaries
  addDebug("Setting up live preview...");

  onMounted(() => {
    let parentOriginValue = "No parent";

    // Safely check if we're in an iframe and get parent origin
    try {
      isInIframe.value = window.self !== window.top;
      if (isInIframe.value) {
        parentOriginValue = window.parent?.origin || "Unknown parent";
        hasParentOrigin.value = !!window.parent?.origin;
      }
    } catch (error) {
      // Cross-origin frame access blocked
      isInIframe.value = true; // We are in an iframe, but can't access parent
      parentOriginValue = "Cross-origin blocked";
      hasParentOrigin.value = false;
      addDebug(`Cross-origin frame access blocked: ${error}`);
    }

    parentOrigin.value = parentOriginValue;
    addDebug(
      `Iframe detection: isInIframe=${isInIframe.value}, parentOrigin=${parentOrigin.value}`
    );

    // Listen for ALL messages from parent (Payload CMS) - comprehensive debugging
    const messageHandler = (event: MessageEvent) => {
      addDebug(
        `📨 RAW MESSAGE: origin=${event.origin}, type=${event.data?.type || 'NO TYPE'}, allKeys=${Object.keys(event.data || {}).join(',')}`
      );
      console.log("[Preview] 📨 FULL MESSAGE RECEIVED:", {
        origin: event.origin,
        data: event.data,
        type: event.data?.type,
        source: event.source === window.parent ? 'FROM PARENT ✅' : 'from other',
        expectedParentOrigin: useRuntimeConfig().public.payloadUrl,
        originMatches: event.origin === useRuntimeConfig().public.payloadUrl,
        fullEvent: event
      });

      // Check if this is a Payload message
      if (event.data && typeof event.data === 'object') {
        if (event.data.type && event.data.type.startsWith('payload')) {
          addDebug(`🎯 PAYLOAD MESSAGE DETECTED: ${event.data.type}`);
          console.log("[Preview] 🎯 THIS IS A PAYLOAD MESSAGE!", event.data);
        }
      }
    };

    window.addEventListener("message", messageHandler);
    addDebug("✅ Message listener attached to window");

    // Manual Ready Signal: Send to wildcard origin to ensure parent receives it
    addDebug(`📤 Sending manual ready signal to * from ${window.location.origin}`);
    window.parent.postMessage(
      {
        type: "payload-live-preview-ready",
      },
      "*"
    );
    addDebug("📤 Ready signal sent!");

    // Send test ping every 2 seconds to verify parent is listening
    let pingCount = 0;
    const pingInterval = setInterval(() => {
      pingCount++;
      if (pingCount > 5) {
        clearInterval(pingInterval);
        addDebug("⏹️ Stopped sending ping messages after 5 attempts");
        return;
      }
      addDebug(`📤 Sending test ping #${pingCount} to parent...`);
      window.parent.postMessage(
        {
          type: "test-ping",
          count: pingCount,
          timestamp: Date.now()
        },
        "*"
      );
    }, 2000);

    addDebug("Component mounted, initializing live preview...");

    try {
      // Only initialize live preview if we have initial data
      if (pageData.value) {
        addDebug("Attempting to initialize useLivePreview...");

        const { data: liveData, isLoading: liveLoading } = useLivePreview<Page>(
          {
            initialData: pageData.value,
            serverURL: useRuntimeConfig().public.payloadUrl,
            apiRoute: "pages", // Explicitly set the collection slug
            depth: 2, // Explicitly match the fetch depth
          }
        );

        // Watch for live preview changes
        watch(liveData, (newData) => {
          if (newData && newData !== pageData.value) {
            addDebug("Live preview data received - switching to live mode!");
            console.log("[Preview] Live data received:", newData);
            pageData.value = newData;
            isLiveMode.value = true;
          } else {
            addDebug("Live preview data unchanged");
          }
        });

        watch(
          () => liveLoading.value,
          (loading) => {
            addDebug(`Live preview loading state: ${loading}`);
            if (!loading) {
              addDebug(
                "Live preview finished loading - checking for data changes"
              );
              // Check if we actually got live preview data
              setTimeout(() => {
                if (!isLiveMode.value) {
                  addDebug(
                    "Live preview did not activate - may not be receiving messages from parent"
                  );
                }
              }, 2000);
            }
          },
          { immediate: true }
        );

        addDebug("Live preview initialized successfully");
      } else {
        addDebug("Skipping live preview - no initial data");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown live preview error";
      livePreviewError.value = errorMsg;
      addDebug(`Live preview setup failed: ${errorMsg}`);
    } finally {
      isLoading.value = false;
      addDebug("Setup completed");
    }
  });

  useHead({
    title: computed(() => `Preview: ${pageData.value?.title || "Loading..."}`),
  });
</script>

<template>
  <div class="preview-container">
    <ClientOnly>
      <!-- Debug Panel -->
      <div class="debug-panel" v-if="debugInfo.length > 0">
        <h3>Debug Info</h3>
        <ul>
          <li v-for="(msg, index) in debugInfo" :key="index">{{ msg }}</li>
        </ul>
      </div>

      <!-- Status Indicators -->
      <div class="status-panel">
        <span v-if="isLiveMode" class="live-indicator">🔄 LIVE MODE</span>
        <span v-if="isLoading" class="loading-indicator">⏳ Loading...</span>
      </div>

      <!-- Error States -->
      <div v-if="error" class="error">
        <h1>Initial Load Error</h1>
        <p>{{ error }}</p>
      </div>

      <div v-if="livePreviewError" class="live-preview-error">
        <h1>Live Preview Error</h1>
        <p>{{ livePreviewError }}</p>
        <p>Showing static content instead.</p>
      </div>

      <!-- Content -->
      <div v-if="isLoading" class="loading">
        <h1>Loading preview...</h1>
      </div>

      <div v-else-if="pageData" class="preview-content">
        <h1>{{ pageData.title }}</h1>
        <p>Page ID: {{ pageId }}</p>
        <p>
          Status: {{ isLiveMode ? "Live Preview Active" : "Static Content" }}
        </p>
        <p>Iframe: {{ isInIframe ? "Yes" : "No" }} ({{ parentOrigin }})</p>

        <!-- Render actual content blocks -->
        <template v-if="pageData.content">
          <template v-for="block in pageData.content" :key="block.id">
            <HeroBlock v-if="block.blockType === 'hero'" v-bind="block" />
            <RichTextBlock
              v-else-if="block.blockType === 'richText'"
              v-bind="block"
            />
            <div v-else class="unknown-block">
              <p>Unknown block type: {{ block.blockType }}</p>
              <pre>{{ JSON.stringify(block, null, 2) }}</pre>
            </div>
          </template>
        </template>
      </div>

      <!-- Fallback for SSR/loading -->
      <template #fallback>
        <div class="loading">
          <h1>Loading preview...</h1>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
  .preview-container {
    min-height: 100vh;
    padding: 2rem;
  }

  .debug-panel {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    font-family: monospace;
    font-size: 0.75rem;
  }

  .debug-panel h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
  }

  .debug-panel ul {
    margin: 0;
    padding-left: 1rem;
  }

  .debug-panel li {
    margin-bottom: 0.25rem;
  }

  .status-panel {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .live-indicator {
    background: #059669;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .loading-indicator {
    background: #2563eb;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .error,
  .live-preview-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .error h1,
  .live-preview-error h1 {
    color: #dc2626;
    margin: 0 0 0.5rem 0;
  }

  .live-preview-error {
    background: #fffbeb;
    border-color: #fed7aa;
  }

  .live-preview-error h1 {
    color: #ea580c;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
  }

  .preview-content {
    max-width: 100%;
  }

  .unknown-block {
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1rem 0;
  }

  .unknown-block pre {
    background: #f3f4f6;
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    font-size: 0.75rem;
  }
</style>
