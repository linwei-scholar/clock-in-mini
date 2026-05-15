import { ref, computed, watch } from 'vue'

export function usePagination(options = {}) {
  const {
    initialPage = 1,
    initialPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
    total = 0
  } = options

  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)

  const totalPages = computed(() => {
    return Math.ceil(total / pageSize.value) || 1
  })

  const startIndex = computed(() => {
    return (currentPage.value - 1) * pageSize.value
  })

  const endIndex = computed(() => {
    return Math.min(startIndex.value + pageSize.value, total)
  })

  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value
  })

  const hasPrevPage = computed(() => {
    return currentPage.value > 1
  })

  const pageRange = computed(() => {
    const range = []
    const total = totalPages.value
    const current = currentPage.value

    let start = Math.max(1, current - 2)
    let end = Math.min(total, current + 2)

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4)
      } else {
        start = Math.max(1, end - 4)
      }
    }

    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    return range
  })

  const setPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }

  const firstPage = () => {
    currentPage.value = 1
  }

  const lastPage = () => {
    currentPage.value = totalPages.value
  }

  const setPageSize = (size) => {
    pageSize.value = size
    currentPage.value = 1
  }

  const reset = () => {
    currentPage.value = initialPage
    pageSize.value = initialPageSize
  }

  return {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    pageRange,
    pageSizeOptions,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    reset
  }
}

export function useScrollPagination(options = {}) {
  const {
    loadMore = () => {},
    threshold = 200,
    enabled = true
  } = options

  const isLoading = ref(false)
  const hasMore = ref(true)

  let observer = null

  const observe = (element) => {
    if (!element || !enabled) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading.value && hasMore.value) {
            handleLoadMore()
          }
        })
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0
      }
    )

    observer.observe(element)
  }

  const unobserve = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  const handleLoadMore = async () => {
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true
    try {
      const result = await loadMore()
      if (result === false) {
        hasMore.value = false
      }
    } catch (error) {
      console.error('Load more error:', error)
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    isLoading.value = false
    hasMore.value = true
  }

  return {
    isLoading,
    hasMore,
    observe,
    unobserve,
    reset
  }
}

export function useInfiniteScroll(data, options = {}) {
  const {
    pageSize = 20,
    threshold = 200
  } = options

  const currentPage = ref(1)
  const isLoading = ref(false)
  const hasMore = ref(true)

  const displayData = computed(() => {
    return data.value.slice(0, currentPage.value * pageSize)
  })

  const canLoadMore = computed(() => {
    return hasMore.value && !isLoading.value
  })

  const loadMore = async () => {
    if (!canLoadMore.value) return false

    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      currentPage.value++

      if (displayData.value.length >= data.value.length) {
        hasMore.value = false
        return false
      }
      return true
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    currentPage.value = 1
    hasMore.value = true
    isLoading.value = false
  }

  return {
    displayData,
    currentPage,
    isLoading,
    hasMore,
    canLoadMore,
    loadMore,
    reset
  }
}
