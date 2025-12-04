/**
 * Custom implementation of Payload CMS live preview for Nuxt
 * Based on @payloadcms/live-preview-vue but compatible with Nuxt
 */

import type { Ref } from "vue";
import { ready, subscribe, unsubscribe } from "@payloadcms/live-preview";

interface UseLivePreviewOptions<T = any> {
  /**
   * The server URL of your Payload instance
   */
  serverURL: string;

  /**
   * The initial data to display before any updates
   */
  initialData: T;

  /**
   * The depth of relationships to fetch
   */
  depth?: number;

  /**
   * Optional API route for preview (not used in client-side preview)
   */
  apiRoute?: string;
}

interface UseLivePreviewResult<T> {
  /**
   * The live preview data that updates in real-time
   */
  data: Ref<T>;

  /**
   * Whether the preview is currently loading/updating
   */
  isLoading: Ref<boolean>;
}

/**
 * Composable for Payload CMS live preview
 * Compatible implementation that works with Nuxt
 */
export function useLivePreview<T extends Record<string, any>>(
  options: UseLivePreviewOptions<T>
): UseLivePreviewResult<T> {
  const { apiRoute, depth, initialData, serverURL } = options;

  console.log("[useLivePreview] Initializing with:", {
    apiRoute,
    depth,
    hasInitialData: !!initialData,
    serverURL,
    initialDataKeys: initialData ? Object.keys(initialData) : [],
    initialDataId: initialData?.id,
    initialDataCollection: (initialData as any)?.collection, // Check if collection property exists
  });

  const data = ref(initialData) as Ref<T>;
  const isLoading = ref(true);
  const hasSentReadyMessage = ref(false);

  const onChange = (mergedData: T) => {
    console.log("[useLivePreview] ✅ Data changed callback triggered!", {
      hasData: !!mergedData,
      dataKeys: mergedData ? Object.keys(mergedData) : [],
      mergedData,
    });
    data.value = mergedData;
    isLoading.value = false;
  };

  let subscription: (event: MessageEvent) => Promise<void> | void;

  onMounted(() => {
    console.log(
      "[useLivePreview] Component mounted, setting up subscription..."
    );

    try {
      console.log("[useLivePreview] Calling subscribe() with:", {
        apiRoute,
        depth,
        serverURL,
        hasCallback: !!onChange,
        hasInitialData: !!initialData,
      });

      subscription = subscribe({
        apiRoute,
        callback: onChange,
        depth,
        initialData,
        serverURL,
      });

      console.log("[useLivePreview] Subscription created:", {
        type: typeof subscription,
        isFunction: typeof subscription === "function",
        subscription,
      });

      if (!hasSentReadyMessage.value) {
        hasSentReadyMessage.value = true;
        console.log(
          "[useLivePreview] Sending ready message to parent at:",
          serverURL
        );

        ready({
          serverURL,
        });

        console.log("[useLivePreview] Ready message sent!");
      }
    } catch (error) {
      console.error("[useLivePreview] Setup failed:", error);
      isLoading.value = false;
    }
  });

  onUnmounted(() => {
    console.log("[useLivePreview] Cleaning up subscription...");
    unsubscribe(subscription);
  });

  return {
    data,
    isLoading,
  };
}
