<template>
  <div class="skeleton-wrapper" :class="{ 'is-animate': animate }">
    <slot>
      <div class="skeleton-default">
        <div class="skeleton-line" :style="{ width: '60%', height: '24px' }"></div>
        <div class="skeleton-line" :style="{ width: '100%', height: '48px' }"></div>
        <div class="skeleton-line" :style="{ width: '80%', height: '48px' }"></div>
        <div class="skeleton-line" :style="{ width: '40%', height: '48px' }"></div>
      </div>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  animate: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.skeleton-wrapper {
  width: 100%;
}

.skeleton-wrapper.is-animate .skeleton-line,
.skeleton-wrapper.is-animate .skeleton-circle,
.skeleton-wrapper.is-animate .skeleton-rect {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-default {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
