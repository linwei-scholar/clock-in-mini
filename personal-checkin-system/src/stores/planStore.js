import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlanStore = defineStore('plan', () => {
  const plans = ref([])

  const loadPlans = (userId) => {
    const savedPlans = localStorage.getItem(`plans_${userId}`)
    plans.value = savedPlans ? JSON.parse(savedPlans) : []
  }

  const addPlan = (plan) => {
    plans.value.push(plan)
    savePlans()
  }

  const updatePlan = (planId, updates) => {
    const index = plans.value.findIndex(p => p.id === planId)
    if (index !== -1) {
      plans.value[index] = { ...plans.value[index], ...updates, updatedAt: new Date().toISOString() }
      savePlans()
    }
  }

  const deletePlan = (planId) => {
    plans.value = plans.value.filter(p => p.id !== planId)
    savePlans()
  }

  const savePlans = () => {
    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id
    if (userId) {
      localStorage.setItem(`plans_${userId}`, JSON.stringify(plans.value))
    }
  }

  const getPlanById = (planId) => {
    return plans.value.find(p => p.id === planId)
  }

  const getActivePlans = () => {
    return plans.value.filter(p => p.status === 'active')
  }

  const getArchivedPlans = () => {
    return plans.value.filter(p => p.status === 'archived')
  }

  const getPausedPlans = () => {
    return plans.value.filter(p => p.status === 'paused')
  }

  return {
    plans,
    loadPlans,
    addPlan,
    updatePlan,
    deletePlan,
    getPlanById,
    getActivePlans,
    getArchivedPlans,
    getPausedPlans
  }
})
