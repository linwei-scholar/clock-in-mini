<template>
  <div class="tag-icon-wrapper" :style="{ background: color }">
    <el-icon :size="size">
      <component :is="iconComponent" />
    </el-icon>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Running,
  Food,
  Books,
  Star,
  Briefcase,
  Heart,
  Coffee,
  Reading,
  SetUp,
  Monitor,
  Grid,
  Folder,
  Guide,
  DataLine,
  Bell,
  Shoot,
  Medal,
  Present,
  Promotion
} from '@element-plus/icons-vue'

const props = defineProps({
  icon: {
    type: String,
    required: true,
    default: 'Star'
  },
  color: {
    type: String,
    default: '#409EFF'
  },
  size: {
    type: [Number, String],
    default: 24
  }
})

const iconMap = {
  Running,
  Food,
  Books,
  Star,
  Briefcase,
  Heart,
  Coffee,
  Reading,
  SetUp,
  Monitor,
  Grid,
  Folder,
  Guide,
  DataLine,
  Bell,
  Shoot,
  Medal,
  Present,
  Promotion
}

const iconComponent = computed(() => {
  return iconMap[props.icon] || Star
})
</script>

<style scoped>
.tag-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  color: white;
  font-size: 24px;
}

.tag-icon-wrapper:deep(.el-icon) {
  color: white;
}
</style>
