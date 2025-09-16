# BugRecorder

一个帮助测试工程师记录BUG复现过程的工具，能够捕获用户操作、网络请求、控制台日志等信息，并生成Markdown格式的报告。

## 功能特性

- 🎯 **用户操作记录**: 自动捕获点击、输入等用户操作
- 🌐 **网络请求监控**: 记录XHR和Fetch请求的详细信息，支持URL过滤
- 📝 **控制台日志**: 捕获console输出和错误信息，支持内容过滤
- 🔄 **URL变化跟踪**: 监控页面跳转和URL变化
- 📷 **屏幕截图**: 支持全页面/可视区域/指定元素截图功能
- 📋 **备注功能**: 添加自定义备注信息
- 📄 **Markdown导出**: 自动生成格式化的复现报告
- ⌨️ **快捷键操作**: 支持Ctrl+Alt+R快捷键
- 🎮 **多种显示模式**: 悬浮条、隐藏悬浮条、vConsole集成
- 🎨 **现代化UI**: 紧凑的悬浮栏设计，支持流畅拖拽
- 📋 **结果对话框**: 录制完成后显示对话框，支持预览和复制

## 安装

```bash
npm install codebyai-bug-recorder
```

## 使用方法

### 基础用法

```javascript
import BugRecorder from "codebyai-bug-recorder";

// 显示悬浮控制条
new BugRecorder().init({
  show: 'bar'
});
```

### 配置选项

```javascript
// 悬浮控制条模式（默认显示）
new BugRecorder().init({
  show: 'bar'
});

// 隐藏悬浮条模式（快捷键Ctrl+Alt+R控制）
new BugRecorder().init({
  show: 'hidden_bar'
});

// vConsole集成模式
import VConsole from 'vconsole';
const vConsole = new VConsole();

new BugRecorder().init({
  show: vConsole  // 直接传递vConsole实例
});

// 指定截图区域模式
new BugRecorder().init({
  show: 'bar',
  screenshotElement: '#app'  // 只截取指定CSS选择器对应的DOM区域
});

// 过滤网络请求模式
new BugRecorder().init({
  show: 'bar',
  ignoreRequestUrls: [
    '/api/heartbeat',           // 忽略心跳请求
    '/static/',                 // 忽略静态资源
    /\/api\/log\/.*/,          // 使用正则表达式忽略日志相关API
    'analytics.google.com'      // 忽略统计分析请求
  ]
});

// 过滤console输出模式
new BugRecorder().init({
  show: 'bar',
  ignoreConsoleContents: [
    '[DEBUG]',                  // 忽略调试日志
    'WebSocket connection',     // 忽略WebSocket连接日志
    /React DevTools/,          // 使用正则表达式忽略React DevTools相关日志
    'analytics'                 // 忽略包含analytics的日志
  ]
});

// 组合配置模式
new BugRecorder().init({
  show: 'bar',
  screenshotElement: '#app',
  ignoreRequestUrls: ['/api/heartbeat', '/static/'],
  ignoreConsoleContents: ['[DEBUG]', /React DevTools/]
});
```

## 显示模式说明

### bar模式
- 页面右上角显示悬浮控制条
- 包含开始/暂停、停止、截图、备注按钮
- 支持流畅拖拽调整位置，即时跟随鼠标
- 紧凑的ButtonGroup设计，清晰的图标

### hidden_bar模式
- 默认隐藏控制条
- 按`Ctrl + Alt + R`显示/隐藏
- 正在录制时按快捷键会停止录制并隐藏

### vConsole模式
- 在vConsole中添加"Bug录制"标签页
- 提供显示/隐藏悬浮栏的控制按钮
- **重要**: 直接传递vConsole实例给配置项

```javascript
// 正确的初始化方式
import VConsole from 'vconsole';
import BugRecorder from "codebyai-bug-recorder";

// 1. 先初始化vConsole
const vConsole = new VConsole();

// 2. 传递vConsole实例给BugRecorder
new BugRecorder().init({
  show: vConsole  // 传递实例而不是字符串
});
```

## 截图区域配置

### screenshotElement 参数说明

通过 `screenshotElement` 参数可以指定截图时只捕获特定DOM区域，而不是整个页面。

**支持的CSS选择器格式：**
- `'#app'` - ID选择器，截取ID为app的元素
- `'.container'` - 类选择器，截取class为container的元素  
- `'body'` - 标签选择器，截取body元素
- `'div.content'` - 复合选择器，截取class为content的div元素
- 任何有效的CSS选择器

**示例用法：**
```javascript
// 只截取主容器区域
new BugRecorder().init({
  show: 'bar',
  screenshotElement: '#main-container'
});

// 只截取内容区域
new BugRecorder().init({
  show: 'bar', 
  screenshotElement: '.content-wrapper'
});

// 不指定则截取整个页面（默认行为）
new BugRecorder().init({
  show: 'bar'
});
```

**注意事项：**
- 如果指定的选择器找不到对应元素，会自动回退到截取整个页面
- 无效的CSS选择器会在控制台输出警告信息
- 该功能对所有截图方法都生效（普通截图、视口截图、全页截图）

## 录制流程

1. **开始录制**: 点击"开始录制"按钮或使用快捷键
2. **执行操作**: 进行需要记录的用户操作
3. **添加截图**: 点击摄像头图标保存关键画面
4. **添加备注**: 点击笔形图标添加说明文字
5. **停止录制**: 点击红色停止按钮
6. **查看报告**: 弹出结果对话框，预览并复制录制内容

## 输出格式示例

```markdown
## 复现过程

* 备注：用户即将打开客户详情页面
* 2025-09-15 21:50:28 USER_CLICK 用户点击了"客户详情"按钮，id为"btn_customer_detail"
* 2025-09-15 21:50:29 URL_CHANGE 浏览器URL变更，原地址https://xxx.com/list，新地址https://xxx.com/detail?id=123
* 2025-09-15 21:50:30 XHR

Request:
```
POST /api/customer/detail HTTP/1.1
Content-Type: application/json

{"id": 123}
```

Response (200 OK):
```
{"code": "00000", "data": {...}}
```

* 2025-09-15 21:50:31 SCREENSHOT
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...)
```

## 依赖要求

- **dom-to-image**: 截图功能依赖，已内置无需额外引入
- **vconsole**: vConsole模式需要，可选依赖

```html
<!-- 如果使用vConsole模式，需要引入vConsole -->
<script src="https://cdn.jsdelivr.net/npm/vconsole@latest/dist/vconsole.min.js"></script>
```

## API

### BugRecorder.init(config)

初始化BugRecorder

**参数:**
- `config.show`: 显示模式，'bar' | 'hidden_bar' | vConsole实例
- `config.screenshotElement?`: 截图目标元素的CSS选择器，可选参数
- `config.ignoreRequestUrls?`: 要忽略的网络请求URL模式数组，支持字符串和正则表达式，可选参数
- `config.ignoreConsoleContents?`: 要忽略的console内容模式数组，支持字符串和正则表达式，可选参数

### BugRecorder.destroy()

销毁BugRecorder实例，清理所有监听器

### BugRecorder.getVersion()

获取版本号

## CLI工具

### npx codebyai-bug-recorder save

从剪贴板保存BUG录制内容到本地文件，自动提取base64图片并转换为PNG文件。

**功能特性:**
- 📋 自动读取剪贴板中的录制内容
- 🖼️ 提取base64图片并保存为PNG文件（`bug_report_image_1.png`, `bug_report_image_2.png`等）
- 📝 替换markdown中的图片引用为本地文件路径
- 💾 保存处理后的内容到`bug_record.md`
- 🔄 跨平台支持（macOS、Windows、Linux）

**系统要求:**
- Node.js v18或更高版本
- Linux系统需要安装xclip：`sudo apt-get install xclip`

**使用方法:**
```bash
# 复制BugRecorder的录制结果到剪贴板，然后运行：
npx codebyai-bug-recorder save
```

## 兼容性

- Chrome/Safari 现代浏览器
- 支持ES2017+语法
- 需要支持Promise和async/await

## 许可证

MIT License

## 更新日志

### v1.0.0 (2025-01-20)

🎉 **首次正式发布** - 完整的BUG录制解决方案

#### 🏗️ 核心架构
- ✅ 基于TypeScript构建的现代化架构
- ✅ ES Module支持，webpack打包优化
- ✅ 模块化设计：核心管理器、监听器、UI组件分离
- ✅ 完整的类型定义和API文档

#### 🎯 用户操作录制
- ✅ 智能捕获点击、输入、选择等用户交互
- ✅ 精确的元素定位：支持ID、Name、Class、XPath等
- ✅ 输入防抖优化：连续输入只记录最终值，避免重复记录
- ✅ 密码字段自动过滤，保护敏感信息

#### 🌐 网络请求监控
- ✅ 完整的XHR和Fetch请求拦截
- ✅ 详细记录请求头、请求体、响应状态和响应内容
- ✅ 支持JSON、FormData等多种数据格式
- ✅ 自动格式化HTTP报文，便于调试
- ✅ 灵活的URL过滤机制，支持字符串和正则表达式匹配

#### 📝 控制台日志捕获
- ✅ 监控console.log、console.error、console.warn等
- ✅ 捕获JavaScript运行时错误和异常
- ✅ 保留完整的错误堆栈信息
- ✅ 灵活的内容过滤机制，支持字符串和正则表达式匹配

#### 🔄 页面跳转追踪
- ✅ 监控URL变化、History API操作
- ✅ 记录页面跳转的前后地址变化
- ✅ 支持SPA路由变化追踪

#### 📷 高质量截图功能
- ✅ **dom-to-image**技术，提供卓越的截图质量
- ✅ 三种截图模式：全页面、可视区域、指定元素
- ✅ 完美的文本渲染，解决输入框文本截断问题
- ✅ 智能过滤录制器UI元素，确保截图纯净
- ✅ 支持CSS选择器指定截图区域

#### 📋 备注与注释
- ✅ 实时添加自定义备注信息
- ✅ 优雅的备注输入界面
- ✅ 备注与操作时间线完美结合

#### 🎨 多种显示模式
- ✅ **悬浮条模式**: 现代化UI设计，支持流畅拖拽
- ✅ **隐藏模式**: 快捷键(Ctrl+Alt+R)控制显示/隐藏
- ✅ **vConsole集成**: 无缝集成开发者调试工具

#### 📄 智能报告生成
- ✅ 自动生成Markdown格式的复现报告
- ✅ 时间线排序，操作步骤清晰明了
- ✅ 包含操作汇总统计信息
- ✅ 一键复制，便于分享和提交

#### 🔧 CLI工具集
- ✅ **npx codebyai-bug-recorder save**: 剪贴板内容本地化工具
- ✅ base64图片自动提取和转换为PNG文件
- ✅ 跨平台剪贴板读取支持
- ✅ 智能文件命名：`bug_report_image_*.png`、`bug_record.md`

#### 🛠️ 开发体验
- ✅ 完整的TypeScript类型支持
- ✅ 模块化API设计，易于集成
- ✅ 详细的错误处理和调试信息
- ✅ 零配置开箱即用

#### 🔒 安全与隐私
- ✅ 本地数据处理，无服务器依赖
- ✅ 密码字段自动排除
- ✅ 录制器元素智能过滤
- ✅ 用户完全控制录制流程

#### 🚀 性能优化
- ✅ 按需加载和懒初始化
- ✅ 事件防抖和节流处理
- ✅ 内存泄漏防护
- ✅ 轻量级打包，快速加载
