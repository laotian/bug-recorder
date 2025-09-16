# BugRecorder

一个帮助测试工程师记录BUG复现过程的工具，能够捕获用户操作、网络请求、控制台日志等信息，并生成Markdown格式的报告。

## 功能特性

- 🎯 **用户操作记录**: 自动捕获点击、输入等用户操作
- 🌐 **网络请求监控**: 记录XHR和Fetch请求的详细信息
- 📝 **控制台日志**: 捕获console输出和错误信息
- 🔄 **URL变化跟踪**: 监控页面跳转和URL变化
- 📷 **屏幕截图**: 支持手动截图功能
- 📋 **备注功能**: 添加自定义备注信息
- 📄 **Markdown导出**: 自动生成格式化的复现报告
- ⌨️ **快捷键操作**: 支持Ctrl+Alt+R快捷键
- 🎮 **多种显示模式**: 悬浮条、隐藏悬浮条、vConsole集成

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
```

## 显示模式说明

### bar模式
- 页面右上角显示悬浮控制条
- 包含开始/暂停、停止、截图、备注按钮
- 支持拖拽调整位置

### hidden_bar模式
- 默认隐藏控制条
- 按`Ctrl + Alt + R`显示/隐藏
- 正在录制时按快捷键会停止录制并隐藏

### vConsole模式
- 在vConsole中添加"Bug录制"标签页
- 控制按钮集成在vConsole面板中
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

## 录制流程

1. **开始录制**: 点击"开始录制"按钮或使用快捷键
2. **执行操作**: 进行需要记录的用户操作
3. **添加截图**: 点击截图按钮保存关键画面
4. **添加备注**: 点击备注按钮添加说明文字
5. **停止录制**: 点击"停止录制"按钮
6. **获取报告**: 录制内容自动复制到剪贴板

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
- `config.show`: 显示模式，'bar' | 'hidden_bar' | 'vConsole'

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

### v1.0.0
- 初始版本发布
- 完整的用户操作录制功能
- 支持多种显示模式
- Markdown格式导出