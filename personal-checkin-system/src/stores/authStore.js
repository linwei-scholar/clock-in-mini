import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref(null)
  const isLoggedIn = computed(() => !!userInfo.value)

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => u.username === username)

    if (!user) {
      throw new Error('用户名不存在')
    }

    const passwordHash = CryptoJS.SHA256(password).toString()

    if (user.passwordHash !== passwordHash) {
      throw new Error('密码错误')
    }

    user.lastLoginAt = new Date().toISOString()
    localStorage.setItem('users', JSON.stringify(users))

    userInfo.value = user
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('currentUser', JSON.stringify(user))

    return user
  }

  const register = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')

    if (users.some(u => u.username === username)) {
      throw new Error('用户名已存在')
    }

    const passwordHash = CryptoJS.SHA256(password).toString()
    const newUser = {
      id: Date.now().toString(),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      settings: {
        theme: 'light',
        defaultCalendarView: 'month',
        reminderEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      }
    }

    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))

    const defaultTags = [
      { id: '1', userId: newUser.id, name: '运动健身', icon: 'Running', color: '#409EFF', isDefault: true, createdAt: new Date().toISOString() },
      { id: '2', userId: newUser.id, name: '合理膳食', icon: 'Food', color: '#67C23A', isDefault: true, createdAt: new Date().toISOString() },
      { id: '3', userId: newUser.id, name: '阅读学习', icon: 'Reading', color: '#E6A23C', isDefault: true, createdAt: new Date().toISOString() },
      { id: '4', userId: newUser.id, name: '习惯养成', icon: 'Star', color: '#909399', isDefault: true, createdAt: new Date().toISOString() },
      { id: '5', userId: newUser.id, name: '工作任务', icon: 'Briefcase', color: '#F56C6C', isDefault: true, createdAt: new Date().toISOString() },
      { id: '6', userId: newUser.id, name: '兴趣爱好', icon: 'Heart', color: '#9B59B6', isDefault: true, createdAt: new Date().toISOString() }
    ]
    localStorage.setItem(`tags_${newUser.id}`, JSON.stringify(defaultTags))

    userInfo.value = newUser
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('currentUser', JSON.stringify(newUser))

    return newUser
  }

  const logout = () => {
    userInfo.value = null
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('currentUser')
  }

  const checkAuth = () => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      userInfo.value = JSON.parse(savedUser)
      return true
    }
    return false
  }

  const resetPassword = (userId, newPassword) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      throw new Error('用户不存在')
    }

    const passwordHash = CryptoJS.SHA256(newPassword).toString()
    users[userIndex].passwordHash = passwordHash
    localStorage.setItem('users', JSON.stringify(users))

    if (userInfo.value && userInfo.value.id === userId) {
      userInfo.value.passwordHash = passwordHash
      localStorage.setItem('currentUser', JSON.stringify(userInfo.value))
    }
  }

  const getAllUsers = () => {
    return JSON.parse(localStorage.getItem('users') || '[]')
  }

  const deleteUser = (userId) => {
    let users = JSON.parse(localStorage.getItem('users') || '[]')
    users = users.filter(u => u.id !== userId)
    localStorage.setItem('users', JSON.stringify(users))

    localStorage.removeItem(`tags_${userId}`)
    localStorage.removeItem(`plans_${userId}`)
    localStorage.removeItem(`records_${userId}`)

    if (userInfo.value && userInfo.value.id === userId) {
      logout()
    }
  }

  return {
    userInfo,
    isLoggedIn,
    login,
    register,
    logout,
    checkAuth,
    resetPassword,
    getAllUsers,
    deleteUser
  }
})
