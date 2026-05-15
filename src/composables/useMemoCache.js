import { ref, computed, watch } from 'vue'

export function useMemoCache(options = {}) {
  const {
    ttl = 5 * 60 * 1000,
    maxSize = 100
  } = options

  const cache = ref(new Map())
  const lastUpdate = ref(0)

  const createKey = (...args) => {
    return JSON.stringify(args)
  }

  const get = (key) => {
    const entry = cache.value.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > ttl) {
      cache.value.delete(key)
      return null
    }

    return entry.value
  }

  const set = (key, value) => {
    if (cache.value.size >= maxSize) {
      const firstKey = cache.value.keys().next().value
      cache.value.delete(firstKey)
    }

    cache.value.set(key, {
      value,
      timestamp: Date.now()
    })
    lastUpdate.value = Date.now()
  }

  const has = (key) => {
    return get(key) !== null
  }

  const delete_ = (key) => {
    return cache.value.delete(key)
  }

  const clear = () => {
    cache.value.clear()
    lastUpdate.value = 0
  }

  const invalidate = () => {
    lastUpdate.value = 0
    cache.value.forEach((entry) => {
      entry.timestamp = 0
    })
  }

  const size = computed(() => cache.value.size)

  const isExpired = (key) => {
    const entry = cache.value.get(key)
    if (!entry) return true
    return Date.now() - entry.timestamp > ttl
  }

  return {
    cache,
    lastUpdate,
    size,
    createKey,
    get,
    set,
    has,
    delete: delete_,
    clear,
    invalidate,
    isExpired
  }
}

export function useMemo(fn, options = {}) {
  const {
    ttl = 5 * 60 * 1000,
    deps = []
  } = options

  const cacheKey = ref(JSON.stringify(deps))
  const { get, set, has, clear } = useMemoCache({ ttl })

  const memoizedFn = (...args) => {
    const key = cacheKey.value + JSON.stringify(args)

    if (has(key)) {
      return get(key)
    }

    const result = fn(...args)
    set(key, result)
    return result
  }

  const invalidate = () => {
    clear()
  }

  const updateDeps = (newDeps) => {
    cacheKey.value = JSON.stringify(newDeps)
    invalidate()
  }

  return {
    memoizedFn,
    invalidate,
    updateDeps
  }
}

export function useAsyncMemo(fn, options = {}) {
  const {
    ttl = 5 * 60 * 1000,
    defaultValue = null
  } = options

  const data = ref(defaultValue)
  const isLoading = ref(false)
  const error = ref(null)
  const lastUpdate = ref(0)

  const cache = new Map()

  const getCacheKey = (...args) => JSON.stringify(args)

  const isExpired = (key) => {
    const entry = cache.get(key)
    if (!entry) return true
    return Date.now() - entry.timestamp > ttl
  }

  const getCached = (key) => {
    const entry = cache.get(key)
    if (entry && !isExpired(key)) {
      return entry.value
    }
    return null
  }

  const setCache = (key, value) => {
    if (cache.size >= 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    cache.set(key, {
      value,
      timestamp: Date.now()
    })
    lastUpdate.value = Date.now()
  }

  const execute = async (...args) => {
    const cacheKey = getCacheKey(...args)

    const cached = getCached(cacheKey)
    if (cached !== null) {
      data.value = cached
      return cached
    }

    isLoading.value = true
    error.value = null

    try {
      const result = await fn(...args)
      data.value = result
      setCache(cacheKey, result)
      return result
    } catch (err) {
      error.value = err
      console.error('Async memo error:', err)
      return defaultValue
    } finally {
      isLoading.value = false
    }
  }

  const invalidate = (key = null) => {
    if (key) {
      cache.delete(key)
    } else {
      cache.clear()
    }
    lastUpdate.value = 0
  }

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    execute,
    invalidate,
    getCached,
    isExpired
  }
}

export function useDebounceFn(fn, delay = 300) {
  let timeout = null

  const debouncedFn = (...args) => {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => {
        const result = fn(...args)
        resolve(result)
      }, delay)
    })
  }

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return {
    fn: debouncedFn,
    cancel
  }
}

export function useThrottleFn(fn, delay = 300) {
  let lastCall = 0
  let timeout = null

  const throttledFn = (...args) => {
    return new Promise((resolve) => {
      const now = Date.now()
      const remaining = delay - (now - lastCall)

      if (remaining <= 0) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        lastCall = now
        const result = fn(...args)
        resolve(result)
      } else if (!timeout) {
        timeout = setTimeout(() => {
          lastCall = Date.now()
          timeout = null
          const result = fn(...args)
          resolve(result)
        }, remaining)
      }
    })
  }

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    lastCall = 0
  }

  return {
    fn: throttledFn,
    cancel
  }
}

export function useLocalStorage(key, defaultValue) {
  const data = ref(defaultValue)

  const storedValue = localStorage.getItem(key)
  if (storedValue) {
    try {
      data.value = JSON.parse(storedValue)
    } catch (e) {
      data.value = storedValue
    }
  }

  const set = (value) => {
    data.value = value
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('LocalStorage set error:', e)
    }
  }

  const remove = () => {
    data.value = defaultValue
    localStorage.removeItem(key)
  }

  return {
    data,
    set,
    remove
  }
}
