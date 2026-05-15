# React + Vite + CRXJS

This template helps you quickly start developing Chrome extensions with React, TypeScript and Vite. It includes the CRXJS Vite plugin for seamless Chrome extension development.

## Features

- React with TypeScript
- TypeScript support
- Vite build tool
- CRXJS Vite plugin integration
- Chrome extension manifest configuration

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory.

4. Build for production:

```bash
npm run build
```

## Project Structure

- `src/popup/` - Extension popup UI
- `src/content/` - Content scripts
- `manifest.config.ts` - Chrome extension manifest configuration

## 目录结构

```bash
pdd_auto/
├── src/
│   ├── popup/              # Popup 页面
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   ├── options/            # Options 页面
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   ├── content/            # Content Script（页面注入）
│   │   ├── index.tsx       # Shadow DOM 入口
│   │   └── App.tsx         # 纯 Tailwind，不用 shadcn
│   ├── components/         # shadcn 组件目录
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── ...         # 其他安装的组件
│   ├── lib/
│   │   └── utils.ts        # cn() 工具函数
│   └── content/views/      # shadcn 创建的目录
│       └── index.css       # Tailwind 入口
├── manifest.json
├── vite.config.ts
├── tailwind.config.ts      # 或 .js
└── package.json
```
