# Changelog

## [1.3.1] - 2026-10-19

### Added

- Graphviz / DOT diagrams in Chrome and VS Code, sharing the Mermaid plugin toggle
- A complete Markdown feature showcase with diagrams, extended tables and alerts
- Chrome tab titles derived from the first Markdown heading

### Changed

- Book-inspired in-document contents with serif typography and hierarchical indentation
- Wide tables expand into available page margins, with merged-cell-aware column fitting
- Colored alert cards with borders in light and dark themes

### Fixed

- Bundle Chrome Mermaid diagrams without page-relative lazy script loading
- Preserve Mermaid source and show a compact error when a diagram cannot render
- Restore Markdown theme colors, table borders and header backgrounds
- Include KaTeX styles and fonts to prevent duplicate formula rendering
- Keep contents links aligned with unique IDs for formatted and duplicate headings

## [1.3.0] - 2026-10-19

### Changed

- Upgrade Markdown-it to 15, Mermaid to 12, KaTeX to 0.19, and the Markdown theme to 2
- Render Mermaid diagrams with the asynchronous API in light and dark themes
- Update Chrome popup components to Svelte 5 and SMUI 9
- Upgrade build tools to TypeScript 7 and current webpack tooling
- Source builds require Node.js 22.22.1 or later and pnpm 10; VS Code 1.74 remains supported

### Fixed

- Preserve extended table rendering with Markdown-it 15
- Preserve Chrome popup setting persistence with the updated UI components
- Replace vulnerable transitive dependencies; npm audit reported no known vulnerabilities in either extension at release preparation

## [1.2.0] - 2026-10-10

### Added

- Browser-style XML preview with syntax coloring and collapsible nodes
- Manual preview refresh from the editor title and context menus
- Webview Developer Tools command for HTML and XML previews

### Fixed

- Preview content now refreshes after files are changed externally, including over Remote SSH
- Remote document URIs are preserved when loading previews and relative links
- HTML base tags are injected correctly into compact documents

## [1.1.0] - 2026-04-02

### Added

- HTML files now support "Open HTML Preview with My MD Reader" menu, rendering the HTML page directly in a new tab
- Clicking relative path links in Markdown preview now navigates correctly: Markdown files open with the plugin preview, other files open in a new editor tab

## [1.0.2] - 2025-03-01

### Added

- Chinese language pack (i18n)
- MD Reader Light / Dark VS Code editor themes
- Frontmatter parsing and rendering support
- Font size configuration option
- Line numbers display in code blocks
- Page width configuration option

### Changed

- Support previewing multiple documents simultaneously (panels managed via Map)
- Various style improvements: tables, scrollbars, print styles, blockquote theme colors, etc.

## [1.0.1] - 2025-01-01

### Added

- Initial release
- Markdown preview with TOC sidebar, code highlighting (highlight.js), Mermaid diagrams, and KaTeX math
- Plugin support: Emoji, Sub/Sup, Ins, Abbr, Mark, Deflist, Footnote, TaskLists, TOC, Alert
- Click-to-zoom image viewer
- One-click code block copy
- Light / Dark / Auto theme switching
- Right-click context menu and editor title bar quick preview actions
