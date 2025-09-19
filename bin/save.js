#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * 从剪贴板读取内容
 */
function readClipboard() {
  try {
    // 检查操作系统
    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
      command = 'pbpaste';
    } else if (platform === 'win32') {
      command = 'powershell.exe -Command "Get-Clipboard"';
    } else {
      // Linux
      command = 'xclip -selection clipboard -o';
    }

    const clipboardContent = execSync(command, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 30 // 30MB 缓冲区
    });
    return clipboardContent;
  } catch (error) {
    console.error('读取剪贴板失败:', error.message);
    console.error('请确保已安装相应的剪贴板工具:');
    console.error('- macOS: 无需额外安装');
    console.error('- Windows: 无需额外安装');
    console.error('- Linux: 安装 xclip (sudo apt-get install xclip)');
    process.exit(1);
  }
}

/**
 * 从文件读取内容
 */
function readFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
    process.exit(1);
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log('BugRecorder Save Tool - 保存BUG录制内容到本地文件');
  console.log('');
  console.log('用法:');
  console.log('  npx codebyai-bug-recorder [文件路径]');
  console.log('');
  console.log('参数:');
  console.log('  文件路径    要处理的文件路径 (可选，未指定时从剪贴板读取)');
  console.log('');
  console.log('示例:');
  console.log('  npx codebyai-bug-recorder              # 从剪贴板读取内容');
  console.log('  npx codebyai-bug-recorder report.md   # 从文件读取内容');
  console.log('');
  console.log('功能:');
  console.log('  - 自动提取base64图片并保存为PNG文件');
  console.log('  - 替换markdown中的图片引用为本地文件路径');
  console.log('  - 保存处理后的内容到bug_record.md');
}

/**
 * 提取所有base64图片并保存为PNG文件
 */
function extractAndSaveImages(content) {
  const base64ImageRegex = /!\[([^\]]*)\]\(data:image\/png;base64,([^)]+)\)/g;
  const images = [];
  let match;
  let imageNo = 1;

  while ((match = base64ImageRegex.exec(content)) !== null) {
    const [fullMatch, altText, base64Data] = match;
    const filename = `bug_report_image_${imageNo}.png`;

    try {
      // 解码base64并保存为PNG文件
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filename, buffer);

      images.push({
        originalMatch: fullMatch,
        filename: filename,
        altText: altText
      });

      console.log(`保存图片: ${filename}`);
      imageNo++;
    } catch (error) {
      console.error(`保存图片 ${filename} 失败:`, error.message);
    }
  }

  return images;
}

/**
 * 替换markdown中的图片引用
 */
function replaceImageReferences(content, images) {
  let updatedContent = content;

  images.forEach(image => {
    // 替换原始的base64图片引用为本地文件引用
    updatedContent = updatedContent.replace(
      image.originalMatch,
      `![${image.altText}](${image.filename})`
    );
  });

  return updatedContent;
}

/**
 * 保存处理后的markdown内容
 */
function saveMarkdownContent(content) {
  const filename = 'bug_record.md';

  try {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`保存markdown文件: ${filename}`);
  } catch (error) {
    console.error(`保存markdown文件失败:`, error.message);
    process.exit(1);
  }
}

/**
 * 处理内容的通用函数
 */
function processContent(content, source) {
  if (!content || !content.trim()) {
    console.error(`${source}内容为空`);
    process.exit(1);
  }

  console.log(`${source}内容读取成功`);

  // 检查是否包含base64图片
  const hasBase64Images = /data:image\/png;base64,/.test(content);

  if (!hasBase64Images) {
    console.log('未找到base64图片，直接保存markdown内容');
    saveMarkdownContent(content);
    return;
  }

  console.log('正在提取并保存图片...');

  // 提取并保存图片
  const images = extractAndSaveImages(content);

  if (images.length === 0) {
    console.log('未找到有效的base64图片');
    saveMarkdownContent(content);
    return;
  }

  console.log(`成功提取 ${images.length} 张图片`);

  // 替换图片引用
  console.log('正在更新markdown中的图片引用...');
  const updatedContent = replaceImageReferences(content, images);

  // 保存处理后的markdown文件
  saveMarkdownContent(updatedContent);

  console.log('处理完成!');
  console.log(`- 图片文件: ${images.map(img => img.filename).join(', ')}`);
  console.log('- Markdown文件: bug_record.md');
}

/**
 * 主函数
 */
function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);

  // 检查是否需要显示帮助
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }

  // 检查命令行参数
  if (args.length > 1) {
    console.error('错误: 参数过多');
    console.error('');
    showHelp();
    process.exit(1);
  }

  let content;

  if (args.length === 1) {
    // 从文件读取
    const filePath = args[0];
    console.log(`正在从文件读取内容: ${filePath}`);
    content = readFromFile(filePath);
    processContent(content, '文件');
  } else {
    // 从剪贴板读取
    console.log('正在读取剪贴板内容...');
    content = readClipboard();
    processContent(content, '剪贴板');
  }
}

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error(`错误: 需要 Node.js v18 或更高版本，当前版本: ${nodeVersion}`);
  process.exit(1);
}

// 运行主函数
main();
