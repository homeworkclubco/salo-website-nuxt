<script setup lang="ts">
import { getMediaUrl, type HeroBlock } from '~/composables/usePayloadAPI'

defineProps<HeroBlock>()
</script>

<template>
  <section class="hero">
    <div v-if="image" class="hero-image">
      <img
        :src="getMediaUrl(image.url)"
        :alt="image.alt"
        loading="eager"
      />
    </div>

    <div class="hero-content">
      <h2 class="hero-heading">{{ heading }}</h2>
      <p v-if="subheading" class="hero-subheading">{{ subheading }}</p>

      <a
        v-if="cta && cta.text && cta.link"
        :href="cta.link"
        :class="['hero-cta', `hero-cta--${cta.style}`]"
      >
        {{ cta.text }}
      </a>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-image {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-content {
  max-width: 800px;
  padding: 2rem;
  text-align: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-heading {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.hero-subheading {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

.hero-cta {
  display: inline-block;
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.hero-cta--primary {
  background-color: #3b82f6;
  color: white;
}

.hero-cta--primary:hover {
  background-color: #2563eb;
}

.hero-cta--secondary {
  background-color: #6b7280;
  color: white;
}

.hero-cta--secondary:hover {
  background-color: #4b5563;
}

.hero-cta--outline {
  background-color: transparent;
  border: 2px solid white;
  color: white;
}

.hero-cta--outline:hover {
  background-color: white;
  color: #1f2937;
}

@media (max-width: 768px) {
  .hero-heading {
    font-size: 2rem;
  }

  .hero-subheading {
    font-size: 1.25rem;
  }
}
</style>
