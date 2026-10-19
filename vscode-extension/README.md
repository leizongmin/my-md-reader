# Markdown Reader for VS Code

A beautiful Markdown preview extension for Visual Studio Code with TOC, themes, code highlighting, Mermaid diagrams, and KaTeX math support.

## Features

- 📖 Beautiful Markdown rendering with multiple themes (light/dark/auto)
- 📑 Table of Contents (TOC) sidebar navigation
- 🎨 Syntax highlighting for code blocks with copy button
- 📊 Mermaid diagram support
- 🔢 KaTeX math formula support
- 🖼️ Image preview with zoom
- 🌐 HTML and XML previews
- ⚡ Automatic refresh for saved and externally changed files
- 🔄 Manual refresh from the preview toolbar or context menu

## Usage

1. Open a Markdown, HTML, or XML file
2. Right-click on the file in the Explorer or in the editor
3. Select the corresponding **"My MD Reader: Preview"** command
4. A new tab will open with the rendered content

Use the refresh button in the preview toolbar or the preview context menu to
reload content manually. HTML and XML preview context menus also provide an
entry for opening Webview Developer Tools.

## Configuration

Open VS Code Settings and search for "Markdown Reader" to configure:

| Setting                      | Default   | Description                             |
| ---------------------------- | --------- | --------------------------------------- |
| `myMdReader.pageTheme`       | `auto`    | Theme for the preview (light/dark/auto) |
| `myMdReader.pageWidth`       | `default` | Width of the content (default/full)     |
| `myMdReader.centered`        | `true`    | Center the content                      |
| `myMdReader.showLineNumbers` | `false`   | Show line numbers in code blocks        |
| `myMdReader.hiddenSide`      | `false`   | Hide sidebar by default                 |
| `myMdReader.mdPlugins`       | [...]     | Enabled Markdown plugins                |

## Supported Markdown Extensions

- Emoji
- Subscript/Superscript
- Insert text
- Abbreviation
- KaTeX (math formulas)
- Mermaid (diagrams)
- Mark (highlight)
- Definition lists
- Footnotes
- Task lists
- Table of Contents
- Alert/Callout blocks

## Development

Requires Node.js 22.22.1 or later and pnpm 10. The extension continues to support VS Code 1.74 or later.

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Package extension
pnpm package
```

## License

MIT
