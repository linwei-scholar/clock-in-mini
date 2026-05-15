# 个人打卡系统

一款基于Vue 3 + Vite构建的个人习惯养成打卡工具，采用纯前端架构，所有数据存储在浏览器本地。

## 技术栈

- **Vue 3** - 渐进式JavaScript框架（组合式API + Script Setup）
- **Vite 5** - 新一代前端构建工具
- **Vue Router 4** - Vue.js官方路由管理器
- **Pinia 2** - 新一代状态管理库
- **Element Plus** - 基于Vue 3的组件库
- **ECharts 5** - 可视化图表库
- **FullCalendar 6** - 功能强大的日历组件
- **Dexie.js** - IndexedDB封装库
- **SCSS** - CSS预处理器
- **Crypto-JS** - 加密库（SHA-256）

## 功能特性

### 用户管理
- ✅ 用户注册与登录
- ✅ 本地密码存储（SHA-256加密）
- ✅ 管理员Token验证
- ✅ 密码重置功能

### 打卡计划
- ✅ 创建/编辑/删除打卡计划
- ✅ 多种打卡频率（每日/每周/工作日/周末/自定义）
- ✅ 计划暂停/恢复/归档
- ✅ 标签关联管理

### 打卡日历
- ✅ 月/周/年视图切换
- ✅ 打卡状态可视化
- ✅ 快速打卡入口
- ✅ 计划筛选功能

### 统计分析
- ✅ 打卡趋势图
- ✅ 完成率分布
- ✅ 周统计图表
- ✅ 多维度数据展示

### 数据管理
- ✅ JSON完整数据备份
- ✅ JSON数据导入
- ✅ CSV报表导出
- ✅ 本地持久化存储

## 项目结构

```
personal-checkin-system/
├── src/
│   ├── assets/
│   │   ├── images/          # 图片资源
│   │   └── styles/          # 样式文件
│   │       ├── global.scss   # 全局样式
│   │       └── variables.scss # CSS变量
│   ├── components/          # 公共组件
│   ├── views/               # 页面组件
│   │   ├── Login.vue       # 登录页
│   │   ├── Register.vue    # 注册页
│   │   ├── Dashboard.vue   # 首页仪表盘
│   │   ├── Plans.vue       # 计划列表
│   │   ├── PlanCreate.vue  # 创建计划
│   │   ├── PlanEdit.vue    # 编辑计划
│   │   ├── Calendar.vue    # 日历视图
│   │   ├── Statistics.vue  # 统计分析
│   │   ├── Tags.vue        # 标签管理
│   │   ├── Export.vue      # 数据导出
│   │   ├── Settings.vue    # 个人设置
│   │   └── Admin.vue       # 管理员面板
│   ├── router/
│   │   └── index.js        # 路由配置
│   ├── stores/
│   │   ├── authStore.js    # 用户状态
│   │   ├── tagStore.js     # 标签状态
│   │   ├── planStore.js    # 计划状态
│   │   └── recordStore.js  # 打卡记录状态
│   ├── utils/              # 工具函数
│   ├── db/
│   │   └── index.js        # IndexedDB配置
│   ├── App.vue
│   └── main.js
├── vite.config.js
├── package.json
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

项目将在 http://localhost:5173 启动。

### 构建生产版本

```bash
npm run build
```

## 管理员Token

**管理员Token：`checkin-admin-token-2024`**

此Token用于访问管理员功能，包括：
- 用户列表查看
- 密码重置
- 用户删除

使用方法：
1. 进入管理员页面
2. 输入Token进行验证
3. 验证通过后即可使用管理功能

**注意**：密码重置后的默认密码为 `AaBb@123456`

## 默认标签

系统预设6个默认标签：
1. 运动健身 - 蓝色
2. 合理膳食 - 绿色
3. 阅读学习 - 橙色
4. 习惯养成 - 灰色
5. 工作任务 - 红色
6. 兴趣爱好 - 紫色

## 安全说明

- 密码使用SHA-256哈希存储，不可逆
- 用户数据完全隔离，按用户名区分
- 无网络传输，纯本地存储
- 建议定期导出数据备份

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 开发指南

### 添加新页面

1. 在 `src/views/` 目录创建页面组件
2. 在 `src/router/index.js` 中注册路由
3. 添加相应的状态管理（可选）

### 添加新组件

1. 在 `src/components/` 目录创建组件
2. 使用组合式API和Script Setup语法
3. 遵循项目CSS变量规范

### 样式规范

使用项目提供的CSS变量：
- 颜色：`--primary-color`, `--success-color` 等
- 间距：`--spacing-xs`, `--spacing-sm`, `--spacing-md` 等
- 圆角：`--border-radius-sm`, `--border-radius-md` 等
- 阴影：`--shadow-light`, `--shadow-medium` 等

## 许可证

MIT License

## 版本历史

### v1.0.0 (2024)
- 完成基础框架搭建
- 实现用户认证模块
- 实现打卡计划管理
- 实现日历视图
- 实现统计分析
- 实现数据导出

---

**个人打卡系统** - 让习惯养成更简单！
