class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.marks = {}
  }

  mark(name) {
    this.marks[name] = performance.now()
  }

  measure(name, startMark, endMark = 'navigationEnd') {
    const start = this.marks[startMark] || 0
    const end = endMark === 'navigationEnd'
      ? performance.timing.navigationStart + performance.timing.loadEventEnd
      : (this.marks[endMark] || performance.now())

    const duration = end - start

    if (!this.metrics[name]) {
      this.metrics[name] = []
    }
    this.metrics[name].push({
      duration,
      timestamp: Date.now()
    })

    return duration
  }

  getMetrics(name) {
    return this.metrics[name] || []
  }

  getAverage(name) {
    const values = this.metrics[name]
    if (!values || values.length === 0) return 0

    const sum = values.reduce((acc, v) => acc + v.duration, 0)
    return sum / values.length
  }

  clear() {
    this.metrics = {}
    this.marks = {}
  }

  getReport() {
    const report = {}
    Object.keys(this.metrics).forEach(name => {
      const values = this.metrics[name]
      const durations = values.map(v => v.duration)

      report[name] = {
        count: values.length,
        average: this.getAverage(name),
        min: Math.min(...durations),
        max: Math.max(...durations)
      }
    })

    return report
  }

  static getNavigationTiming() {
    const timing = performance.timing
    const navigation = performance.getEntriesByType('navigation')[0]

    if (!timing) return null

    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      ttfb: timing.responseStart - timing.requestStart,
      download: timing.responseEnd - timing.responseStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      domComplete: timing.domComplete - timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint')
        .find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      loadComplete: timing.loadEventEnd - timing.navigationStart
    }
  }

  static getResourceTiming() {
    const resources = performance.getEntriesByType('resource')
    return resources.map(resource => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      size: resource.transferSize || 0
    }))
  }

  static observeFCP(callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          callback(entries[0])
        }
      })
      observer.observe({ type: 'paint', buffered: true })
      return observer
    }
    return null
  }

  static observeLCP(callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          callback(entries[entries.length - 1])
        }
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      return observer
    }
    return null
  }

  static observeFID(callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          callback(entries[0])
        }
      })
      observer.observe({ type: 'first-input', buffered: true })
      return observer
    }
    return null
  }

  static observeCLS(callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length > 0) {
          callback(entries[0])
        }
      })
      observer.observe({ type: 'layout-shift', buffered: true })
      return observer
    }
    return null
  }
}

export const perfMonitor = new PerformanceMonitor()

export function usePerformance() {
  const startMeasure = (name) => {
    perfMonitor.mark(name)
  }

  const endMeasure = (name, startMark) => {
    return perfMonitor.measure(name, startMark)
  }

  const getMetrics = (name) => {
    return perfMonitor.getMetrics(name)
  }

  const getReport = () => {
    return perfMonitor.getReport()
  }

  const getNavigationTiming = () => {
    return PerformanceMonitor.getNavigationTiming()
  }

  const getResourceTiming = () => {
    return PerformanceMonitor.getResourceTiming()
  }

  return {
    startMeasure,
    endMeasure,
    getMetrics,
    getReport,
    getNavigationTiming,
    getResourceTiming
  }
}
