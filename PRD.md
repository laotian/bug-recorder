[200~工具名称：BugRecorder，中文名称BUG录制器
工具用途：帮助测试工程师记录BUG复现过程，及页面操作过程产生的数据(下文称为操作状态），用以帮助开发工程师分析问题。

交互效果：
悬浮状态条上自左至右包含四个图标，一个用于点击时交替切换开始/暂停状态；一个停止按钮，仅在非录制状态下展示。一个屏幕截图按钮，点击后切换为短暂切换为打勾图标，用以提示用户已经保存截图。一个备注按钮，点击后弹出输入框，用户可以输入备注信息。每次输入的备注信息均需要记录。
仅在录制状态下显示屏幕截图按钮。
暂停状态下暂停记录。
悬浮状态条支持拖动调整位置，以避免遮挡页面元素。悬浮状态条要添加一些阴影效果以实现层次感。图标采用SVG格式。

记录以下内容：
* 用户点击的页面元素信息，包括元素标识id/name或class，元素类型（按钮、文本等）、元素label；表单输入项输入内容。
* 页面URL变化，包括原URL与新URL
* console日志，控制台输出的log/info/warn/error日志
* XHR、Fetch类型网络请求request/response具体内容，需包含请求的URL、request header/body与reponse 状态码、body。如果是文件上传，则不记录request body. 如果是文件下载，则不记录reponse body.
* 屏幕截图。用户可以手动点击悬浮状态条上的屏幕截图按钮，实现整个网页截图，截图格式为PNG，截图内容暂存到内存中，以Base64格式。
* 用户备注信息。

除备注信息外，每项记录包括对应的操作时间。

保存数据：
当切换为“停止”状态时，以Markdown文本的形式保存记录的内容到粘贴板中。其中的图片内容以base64格式，采用以下格式记录：![](data:image/png;base64,XXXXX)
图片换行展示，输出格式示例：
```
## 复现过程

* 备注：用户即将打开客户详情页。
* 2025-09-15 21:50:28 USER_CLICK 用户点击了“客户详情“按钮，按钮id为"btn_customer_detail", class为".btnCustomerDetail"
* 2025-09-15 21:50:29 URL_CHANGE 浏览器URL变更，原地址https://xxx.com/xxx，新地址http://xxx.com/customer-detail?id=xxxx
* 2025-09-15 21:50:29 CONSOLE CONSOLE日志类型:info, 日志内容：XXXXX
* 2025-09-15 21:50:31 XHR

Request:
```
POST /cdn_cgi_bs_bot/api HTTP/1.1
Accept: */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: zh-CN,zh;q=0.9
Cache-Control: no-cache
Connection: keep-alive
Content-Length: 1482
Content-Type: application/json
Cookie: XXXXX
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36

{"foo":"bar"}

```

Response Body:
```
{"code": "00000", "data":"xxxx"}
```

* 2025-09-15 21:50:29 SCREENSHOT
![](data:image/png;base64,XXXXX)
```

打包方式：WebPack5
运行环境：Chrome/Safari浏览器
技术框架：不采用任何UI库，采用原生HTML5与CSS，源码采用TS开发
前端包发布方式：此工具发布到npm仓库，包名称`codebyai-bug-recorder`
此包加载方式：
```
import BugRecord from "codebyai-bug-recorder";
BugRecord.init({
	show: 'bar' | 'hidden_bar' | vConsole'
})

```

当show 设置为bar时，以悬浮图标显示，默认展示且不可以隐藏。
当show 设置为hidden_bar时，以悬浮图标显示，默认隐藏，用户在网页上按快捷键Ctrl + Alt + R，显示BUG记录器页面悬浮状态条，用户再次按下Ctrl + Alt + R, 隐藏图标，如果此时正在录制，则执行停止录制操作，并隐藏悬浮状态条。
当show 设置为vConsole时，在vConsole中的扩展一个TAB，名称为Bug录制，控制按钮显示在此TAB中。



