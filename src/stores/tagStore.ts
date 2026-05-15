import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Tag, TagFormData } from '@/types';
import { TagDAL } from '@/database/dal';
import { useAuthStore } from './authStore';
import { usePlanStore } from './planStore';

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  const userTags = computed(() => {
    const userId = authStore.userId;
    if (!userId) return [];
    return tags.value.filter(tag => tag.userId === userId);
  });

  const tagCount = computed(() => userTags.value.length);

  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async function initializeDefaultTags(userId: string): Promise<void> {
    try {
      const existingTags = await TagDAL.getByUserId(userId);
      if (existingTags.length > 0) {
        return;
      }

      for (const config of TAG_COLORS) {
        const defaultTag: Tag = {
          id: generateId(),
          userId,
          name: config.name,
          icon: config.icon,
          color: config.color,
          isDefault: true,
          createdAt: new Date()
        };
        await TagDAL.create(defaultTag);
      }
    } catch (err) {
      console.error('Initialize default tags error:', err);
      throw err;
    }
  }

  async function loadTags(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        tags.value = [];
        return;
      }

      tags.value = await TagDAL.getByUserId(userId);
    } catch (err) {
      error.value = '加载标签失败';
      console.error('Load tags error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function createTag(formData: TagFormData): Promise<Tag | null> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return null;
      }

      if (formData.name.length < 2 || formData.name.length > 10) {
        error.value = '标签名称长度必须在2-10个字符之间';
        return null;
      }

      const existingTag = await TagDAL.getByName(userId, formData.name);
      if (existingTag) {
        error.value = '标签名称已存在';
        return null;
      }

      const newTag: Tag = {
        id: generateId(),
        userId,
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
        isDefault: false,
        createdAt: new Date()
      };

      await TagDAL.create(newTag);
      tags.value.push(newTag);

      return newTag;
    } catch (err) {
      error.value = '创建标签失败';
      console.error('Create tag error:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTag(id: string, formData: Partial<TagFormData>): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      const tag = tags.value.find(t => t.id === id && t.userId === userId);
      if (!tag) {
        error.value = '标签不存在';
        return false;
      }

      if (formData.name && formData.name !== tag.name) {
        if (formData.name.length < 2 || formData.name.length > 10) {
          error.value = '标签名称长度必须在2-10个字符之间';
          return false;
        }

        const existingTag = await TagDAL.getByName(userId, formData.name);
        if (existingTag && existingTag.id !== id) {
          error.value = '标签名称已存在';
          return false;
        }
      }

      await TagDAL.update(id, {
        ...(formData.name && { name: formData.name }),
        ...(formData.icon && { icon: formData.icon }),
        ...(formData.color && { color: formData.color })
      });

      const index = tags.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tags.value[index] = {
          ...tags.value[index],
          ...(formData.name && { name: formData.name }),
          ...(formData.icon && { icon: formData.icon }),
          ...(formData.color && { color: formData.color })
        };
      }

      return true;
    } catch (err) {
      error.value = '更新标签失败';
      console.error('Update tag error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteTag(id: string): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      const tag = tags.value.find(t => t.id === id && t.userId === userId);
      if (!tag) {
        error.value = '标签不存在';
        return false;
      }

      if (tag.isDefault) {
        error.value = '默认标签不能删除';
        return false;
      }

      await TagDAL.delete(id);
      tags.value = tags.value.filter(t => t.id !== id);

      return true;
    } catch (err) {
      error.value = '删除标签失败';
      console.error('Delete tag error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function getTagById(id: string): Tag | undefined {
    return tags.value.find(t => t.id === id);
  }

  function getTagsByIds(ids: string[]): Tag[] {
    return tags.value.filter(t => ids.includes(t.id));
  }

  function getTagPlanCount(tagId: string): number {
    const planStore = usePlanStore();
    return planStore.getPlansByTagId(tagId).length;
  }

  async function deleteTagWithCleanup(id: string): Promise<{ success: boolean; planCount: number }> {
    try {
      const planStore = usePlanStore();
      const planCount = planStore.getPlansByTagId(id).length;

      const plansToUpdate = planStore.getPlansByTagId(id);
      for (const plan of plansToUpdate) {
        const newTagIds = plan.tagIds.filter(tagId => tagId !== id);
        await planStore.updatePlan(plan.id, { tagIds: newTagIds });
      }

      const deleteSuccess = await deleteTag(id);

      return {
        success: deleteSuccess,
        planCount
      };
    } catch (err) {
      error.value = '删除标签并清理关联失败';
      console.error('Delete tag with cleanup error:', err);
      return {
        success: false,
        planCount: 0
      };
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function clearTags(): void {
    tags.value = [];
  }

  return {
    tags,
    isLoading,
    error,
    userTags,
    tagCount,
    initializeDefaultTags,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagsByIds,
    getTagPlanCount,
    deleteTagWithCleanup,
    clearError,
    clearTags
  };
});
