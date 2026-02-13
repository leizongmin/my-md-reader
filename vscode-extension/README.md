# Markdown Reader for VS Code

A beautiful Markdown preview extension for Visual Studio Code with TOC, themes, code highlighting, Mermaid diagrams, and KaTeX math support.

## Features

- 📖 Beautiful Markdown rendering with multiple themes (light/dark/auto)
- 📑 Table of Contents (TOC) sidebar navigation
- 🎨 Syntax highlighting for code blocks with copy button
- 📊 Mermaid diagram support
- 🔢 KaTeX math formula support
- 🖼️ Image preview with zoom
- ⚡ Real-time preview on file save

## Usage

1. Open a Markdown file (`.md`, `.mdx`, `.mkd`, `.markdown`)
2. Right-click on the file in the Explorer or in the editor
3. Select **"Markdown Reader: Preview"**
4. A new tab will open with the rendered Markdown content

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
