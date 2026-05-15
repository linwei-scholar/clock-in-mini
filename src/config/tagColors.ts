export interface TagColorConfig {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const TAG_COLORS: TagColorConfig[] = [
  {
    name: '运动健身',
    icon: 'Running',
    color: '#409EFF',
    description: '跑步、健身、瑜伽等'
  },
  {
    name: '合理膳食',
    icon: 'Food',
    color: '#67C23A',
    description: '健康饮食、断食、饮水'
  },
  {
    name: '阅读学习',
    icon: 'Reading',
    color: '#E6A23C',
    description: '读书、课程、学习'
  },
  {
    name: '习惯养成',
    icon: 'Star',
    color: '#909399',
    description: '早起、早睡、冥想'
  },
  {
    name: '工作任务',
    icon: 'Briefcase',
    color: '#F56C6C',
    description: '工作计划、项目跟进'
  },
  {
    name: '兴趣爱好',
    icon: 'Heart',
    color: '#9B59B6',
    description: '绘画、音乐、摄影'
  }
];

export const getDefaultTags = () => {
  return TAG_COLORS.map((config, index) => ({
    id: `default-tag-${index}`,
    name: config.name,
    icon: config.icon,
    color: config.color,
    isDefault: true
  }));
};
