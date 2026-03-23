# Ghostty Themes

Ghostty terminal themes derived from the [My MD Reader](https://github.com/leizongmin/my-md-reader) VSCode extension color themes.

## Themes

### My MD Reader Light

A warm off-white light theme.

| Element    | Color     |
| ---------- | --------- |
| Background | `#f9f7f4` |
| Foreground | `#3b3b3b` |
| Cursor     | `#000000` |
| Selection  | `#add6ff` |

### My MD Reader Dark

A dark charcoal theme.

| Element    | Color     |
| ---------- | --------- |
| Background | `#232326` |
| Foreground | `#d4d4d4` |
| Cursor     | `#aeafad` |
| Selection  | `#264f78` |

## Installation

Copy the theme files to your Ghostty themes directory:

```bash
cp "My MD Reader Light" "My MD Reader Dark" ~/.config/ghostty/themes/
```

Then add to your `~/.config/ghostty/config`:

```
theme = light:My MD Reader Light,dark:My MD Reader Dark
```

Ghostty will automatically switch between light and dark themes based on your system appearance.
