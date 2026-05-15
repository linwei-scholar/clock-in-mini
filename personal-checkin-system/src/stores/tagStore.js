import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTagStore = defineStore('tag', () => {
  const tags = ref([])

  const loadTags = (userId) => {
    const savedTags = localStorage.getItem(`tags_${userId}`)
    tags.value = savedTags ? JSON.parse(savedTags) : []
  }

  const addTag = (tag) => {
    tags.value.push(tag)
    saveTags()
  }

  const updateTag = (tagId, updates) => {
    const index = tags.value.findIndex(t => t.id === tagId)
    if (index !== -1) {
      tags.value[index] = { ...tags.value[index], ...updates }
      saveTags()
    }
  }

  const deleteTag = (tagId) => {
    tags.value = tags.value.filter(t => t.id !== tagId)
    saveTags()
  }

  const saveTags = () => {
    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id
    if (userId) {
      localStorage.setItem(`tags_${userId}`, JSON.stringify(tags.value))
    }
  }

  const getTagById = (tagId) => {
    return tags.value.find(t => t.id === tagId)
  }

  return {
    tags,
    loadTags,
    addTag,
    updateTag,
    deleteTag,
    getTagById
  }
})
