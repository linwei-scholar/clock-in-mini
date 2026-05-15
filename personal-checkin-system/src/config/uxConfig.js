export const uxConfig = {
  loading: {
    defaultText: '加载中...',
    duration: 0
  },
  message: {
    success: {
      duration: 3000,
      closable: true
    },
    error: {
      duration: 4000,
      closable: true
    },
    warning: {
      duration: 3500,
      closable: true
    },
    info: {
      duration: 3000,
      closable: true
    }
  },
  toast: {
    duration: 3000,
    closable: true,
    position: 'top-center'
  },
  confirm: {
    title: '确认操作',
    confirmText: '确定',
    cancelText: '取消',
    type: 'warning'
  },
  emptyState: {
    noData: {
      icon: 'Document',
      message: '暂无数据',
      description: '暂无数据，请稍后再试'
    },
    noPlan: {
      icon: 'FolderAdd',
      message: '暂无打卡计划',
      description: '创建您的第一个打卡计划，开始养成好习惯'
    },
    noRecord: {
      icon: 'Calendar',
      message: '暂无打卡记录',
      description: '还没有打卡记录，开始今日打卡吧'
    },
    noResult: {
      icon: 'Search',
      message: '搜索无结果',
      description: '没有找到匹配的内容，请尝试其他关键词'
    }
  },
  validation: {
    inline: true,
    scrollToError: true,
    focusOnError: true
  }
};

export default uxConfig;
