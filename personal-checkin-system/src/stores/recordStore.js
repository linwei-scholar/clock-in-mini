import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRecordStore = defineStore('record', () => {
  const records = ref([])

  const loadRecords = (userId) => {
    const savedRecords = localStorage.getItem(`records_${userId}`)
    records.value = savedRecords ? JSON.parse(savedRecords) : []
  }

  const addRecord = (record) => {
    records.value.push(record)
    saveRecords()
  }

  const updateRecord = (recordId, updates) => {
    const index = records.value.findIndex(r => r.id === recordId)
    if (index !== -1) {
      records.value[index] = { ...records.value[index], ...updates, updatedAt: new Date().toISOString() }
      saveRecords()
    }
  }

  const deleteRecord = (recordId) => {
    records.value = records.value.filter(r => r.id !== recordId)
    saveRecords()
  }

  const saveRecords = () => {
    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id
    if (userId) {
      localStorage.setItem(`records_${userId}`, JSON.stringify(records.value))
    }
  }

  const getRecordById = (recordId) => {
    return records.value.find(r => r.id === recordId)
  }

  const getRecordsByPlan = (planId) => {
    return records.value.filter(r => r.planId === planId)
  }

  const getRecordsByDate = (date) => {
    const targetDate = new Date(date).toDateString()
    return records.value.filter(r => new Date(r.checkInDate).toDateString() === targetDate)
  }

  const getTodayRecords = () => {
    return getRecordsByDate(new Date())
  }

  return {
    records,
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordById,
    getRecordsByPlan,
    getRecordsByDate,
    getTodayRecords
  }
})
