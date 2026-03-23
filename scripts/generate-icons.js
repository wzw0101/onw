#!/usr/bin/env node

/**
 * 生成PWA图标
 * 使用 ImageMagick 或 Sharp 生成不同尺寸的图标
 */

const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const publicDir = path.join(__dirname, '../public');

console.log('🎨 生成 PWA 图标...\n');

// 方法1: 使用 Sharp (推荐，需要安装)
// npm install sharp
async function generateWithSharp() {
  try {
    const sharp = require('sharp');

    // 创建简单的蓝色图标
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#2563eb" rx="64"/>
        <text x="256" y="320" font-size="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif">🐺</text>
        <text x="256" y="400" font-size="48" text-anchor="middle" fill="white" font-family="Arial, sans-serif">ONW</text>
      </svg>
    `;

    const buffer = Buffer.from(svg);

    for (const size of sizes) {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      await sharp(buffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✅ 生成 ${outputPath}`);
    }

    console.log('\n🎉 图标生成完成！');
  } catch (error) {
    console.log('❌ Sharp 不可用，尝试其他方法...');
    console.log('运行: npm install sharp');
  }
}

// 方法2: 使用 Canvas (备用方案)
function generateWithCanvas() {
  try {
    const { createCanvas } = require('canvas');

    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // 背景
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, size, size);

      // 圆角效果
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${size * 0.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐺', size / 2, size / 2 - size * 0.05);

      ctx.font = `${size * 0.1}px Arial`;
      ctx.fillText('ONW', size / 2, size / 2 + size * 0.15);

      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ 生成 ${outputPath}`);
    }

    console.log('\n🎉 图标生成完成！');
  } catch (error) {
    console.log('❌ Canvas 不可用');
    console.log('运行: npm install canvas');
  }
}

// 方法3: 创建占位符文件（最低要求）
function createPlaceholders() {
  console.log('⚠️  创建占位符图标文件（请手动替换）\n');

  sizes.forEach(size => {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
    const placeholder = `
      这是一个 ${size}x${size} 的占位符文件
      请替换为实际的图标图片

      推荐工具:
      - https://www.favicon-generator.org/
      - https://realfavicongenerator.net/

      要求:
      - 尺寸: ${size}x${size} 像素
      - 格式: PNG
      - 建议: 透明背景，简洁设计
    `;
    fs.writeFileSync(outputPath, placeholder);
    console.log(`📝 创建 ${outputPath} (请手动替换)`);
  });

  console.log('\n请手动替换图标文件后重新构建');
}

// 尝试依次使用不同方法
async function main() {
  if (fs.existsSync(path.join(__dirname, '../node_modules/sharp'))) {
    await generateWithSharp();
  } else if (fs.existsSync(path.join(__dirname, '../node_modules/canvas'))) {
    generateWithCanvas();
  } else {
    createPlaceholders();
  }
}

main();
