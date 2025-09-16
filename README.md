# BugRecorder

一个帮助测试工程师记录BUG复现过程的工具，能够捕获用户操作、网络请求、控制台日志等信息，并生成Markdown格式的报告。

## 功能特性

- 🎯 **用户操作记录**: 自动捕获点击、输入等用户操作
- 🌐 **网络请求监控**: 记录XHR和Fetch请求的详细信息
- 📝 **控制台日志**: 捕获console输出和错误信息
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
BugRecorder.init({
  show: 'bar'
});
```

### 配置选项

```javascript
// 悬浮控制条模式（默认显示）
BugRecorder.init({
  show: 'bar'
});

// 隐藏悬浮条模式（快捷键Ctrl+Alt+R控制）
BugRecorder.init({
  show: 'hidden_bar'
});

// vConsole集成模式
import VConsole from 'vconsole';
const vConsole = new VConsole();

BugRecorder.init({
  show: vConsole  // 直接传递vConsole实例
});

// 指定截图区域模式
BugRecorder.init({
  show: 'bar',
  screenshotElement: '#app'  // 只截取指定CSS选择器对应的DOM区域
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
BugRecorder.init({
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
BugRecorder.init({
  show: 'bar',
  screenshotElement: '#main-container'
});

// 只截取内容区域
BugRecorder.init({
  show: 'bar', 
  screenshotElement: '.content-wrapper'
});

// 不指定则截取整个页面（默认行为）
BugRecorder.init({
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

- **html2canvas**: 截图功能依赖，需要单独引入
- **vconsole**: vConsole模式需要，可选依赖

```html
<!-- 在HTML中引入html2canvas -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<!-- 如果使用vConsole模式，需要引入vConsole -->
<script src="https://cdn.jsdelivr.net/npm/vconsole@latest/dist/vconsole.min.js"></script>
```

## API

### BugRecorder.init(config)

初始化BugRecorder

**参数:**
- `config.show`: 显示模式，'bar' | 'hidden_bar' | vConsole实例
- `config.screenshotElement?`: 截图目标元素的CSS选择器，可选参数

### BugRecorder.destroy()

销毁BugRecorder实例，清理所有监听器

### BugRecorder.getVersion()

获取版本号

## 兼容性

- Chrome/Safari 现代浏览器
- 支持ES2017+语法
- 需要支持Promise和async/await

## 许可证

MIT License

## 更新日志

### v1.2.0
- 📷 新增截图区域指定功能，支持通过CSS选择器指定截图目标元素
- 🎯 支持任意有效的CSS选择器（ID、类、标签、复合选择器等）
- 🛡️ 增强错误处理，选择器无效时自动回退到默认行为
- 📖 完善文档说明和使用示例

### v1.1.0
- 🎨 全面优化悬浮栏UI，采用紧凑的ButtonGroup设计
- 🖱️ 重写拖拽逻辑，实现鼠标即时跟随的流畅体验
- 🎭 更新图标设计：摄像头图标用于截图，笔形图标用于备注
- ⭕ 停止录制按钮改为红色，视觉效果更明显
- 📋 新增录制结果对话框，支持预览和复制功能
- 🔧 修复vConsole集成问题，正确使用VConsole.VConsolePlugin
- 🔧 修复className.includes()类型错误
- 🎛️ vConsole模式改为控制悬浮栏显示/隐藏
- 📚 改进API设计，支持直接传入vConsole实例

### v1.0.0
- 初始版本发布
- 完整的用户操作录制功能
- 支持多种显示模式
- Markdown格式导出