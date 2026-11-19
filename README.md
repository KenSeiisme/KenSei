# KenSei · Personal Portfolio

单页个人作品集。**纯静态、零构建**：HTML + Tailwind CDN（固定 3.4.17）+ 手写 CSS + 原生 JS，部署在 Vercel。

## 文件结构

| 路径 | 说明 |
| --- | --- |
| `index.html` | 页面主体：Hero / About / Stack / Projects / Footer |
| `styles.css` | Tailwind 表达不了的部分：变量、滚动条、焦点环、光晕/噪点、入场动画、卡片与预览 |
| `script.js` | 滚动进度、区块光晕主题、指针视差、导航高亮、移动菜单、入场观察 |
| `404.html` | 同色板的错误页，Vercel 自动接管 |
| `og-image.png` | 1200×630 社交分享卡 |
| `profile_picture.png / .webp` | 头像（400×400，`<picture>` 优先 WebP，PNG 兜底） |
| `favicon.svg` `favicon-32.png` `apple-touch-icon.png` `site.webmanifest` | 图标与安装清单 |
| `scripts/generate-assets.py` | 用 Pillow 重新生成上述位图资源 |
| `robots.txt` / `sitemap.xml` | 搜索收录 |

## 固定色板（不要换主色）

| 用途 | 值 |
| --- | --- |
| 基底 | `#100b14` |
| 主渐变 | `pink-400 #f472b6` → `fuchsia-400 #e879f9` → `violet-400 #a78bfa` |
| 正文 | `rose-100/60`；次要信息 `rose-100/55`；强调标签用 `pink/violet/emerald/fuchsia-300` |
| 区块 accent | hero 粉 `244 114 182`、about 紫 `167 139 250`、stack 翠 `52 211 153`、projects 由 `--accent` 驱动 |

## 代码约定

- 2 空格缩进，HTML 属性超过 3 个逐行换行，统一双引号，文件保持 **CRLF**。
- 分节注释 `<!-- 01 -->` 与区块编号 `01 / ABOUT ME` 同步；新增卡片顺延编号。
- 入场动画统一 `.reveal` + 内联 `style="--d: Nms"`：hero 以 90 ms 等距，项目卡以 100 ms 等距。
- 缓动统一 `cubic-bezier(0.22, 1, 0.36, 1)`，时长 300 / 420 / 900 ms。
- 颜色只用 Tailwind 调色板 + 斜杠透明度；裸 hex 仅限 `#100b14` 与预览图深色块（`#160d18` / `#0c1118`）。
- 所有动画必须被 `prefers-reduced-motion` 关闭；指针效果受 `finePointer` 闸门。
- 交互元素必备 `aria-label` / `aria-hidden` / `focus-visible`；外部链接带 `target="_blank" rel="noopener noreferrer"`。

## 本地预览

直接双击 `index.html` 也能看，但建议起个静态服务（相对路径、锚点、`/_vercel/insights` 行为才和线上一致）：

```powershell
python -m http.server 8080
# 打开 http://127.0.0.1:8080
```

## 重新生成图片资源

```powershell
python scripts/generate-assets.py
```

会重写 `profile_picture.webp/.png`（已存在则跳过，避免二次量化）、`og-image.png`、`favicon-32.png`、`apple-touch-icon.png`。

> 注意：`<picture>` 里的 WebP 与 PNG 兜底是两份文件。只替换头像时，记得同时更新 `.png`，否则老浏览器会看到旧图。

## 部署

```powershell
git add -A
git commit -m "..."
git push origin main
```

Vercel 监听 `main`，推送后自动部署到 <https://kensei-eta.vercel.app/>。

## 质量清单

- 正文与次要文字对比度 ≥ 4.5:1（WCAG AA）。
- 键盘：首键出现 Skip link；Esc 关闭移动菜单并把焦点还给按钮；导航带 `aria-current="location"`。
- 减少动效：无平滑滚动、无光晕旋转、无入场位移动画。
- 目标 Lighthouse：Performance ≥ 90、Accessibility ≥ 95、SEO 100。
