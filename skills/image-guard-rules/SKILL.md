---
name: image-guard-rules
description: Image dimension management rules to prevent workflow blocking. Applies to ALL image sources — browser screenshots, ADB captures, Figma/Canva, user-pasted images.
version: "1.0.0"
user-invocable: false
metadata:
  domain: tooling
  triggers: image dimensions, screenshot resize, image too large, 2000px limit, image processing, workflow blocking
  role: specialist
  scope: infrastructure
  output-format: code
  related-skills: agent-browser
---

# Image Dimension Management (Prevents Workflow Blocking)

## The Problem

The Claude API has a hard limit: when multiple images exist in conversation context,
EACH image must be <= 2000px in both width and height. Exceeding this blocks ALL further tool calls.

## Auto-Protection (Hooks)

Two hooks work together to prevent this:
1. **image-auto-resize.js** (PreToolUse on Read) — auto-resizes ANY image > 1800px before it enters context
2. **image-guard.js** (PreToolUse on screenshot tools) — counts screenshots and blocks after 7 without /compact
3. **precompact-save.js** (PreCompact) — resets the screenshot counter when /compact runs

## Mandatory Rules

### Rule 1: Browser Resize Before ANY Screenshot

BEFORE calling `browser_take_screenshot` or `computer` on Claude in Chrome:
1. Call `mcp__claude-in-chrome__resize_window` with `width: 1280, height: 900`
2. THEN take the screenshot

This applies EVERY time. No exceptions.

### Rule 2: ADB / Mobile Screenshots (CRITICAL)

Mobile phone screenshots are ALWAYS > 2000px (typical: 1080x2400).
The auto-resize hook handles this automatically when you Read the file.

If taking screenshots in batch (e.g., beta testing multiple screens):
1. The auto-resize hook will resize each image when Read
2. Run `/compact` every 5 screenshots to keep context clean
3. If autonomous workflow, plan compact points into the workflow BEFORE starting

### Rule 3: Prefer Text Over Screenshots

Before taking a screenshot, ask: "Can I get this information as text instead?"

| Use this tool FIRST | Instead of screenshot |
|---------------------|----------------------|
| `get_page_text` | Full page screenshot |
| `read_page` | Page content capture |
| `browser_snapshot` | Accessibility tree |
| `read_console_messages` | Console screenshot |
| `adb shell uiautomator dump` | Android UI structure |

Only take a screenshot when VISUAL information is strictly needed.

### Rule 4: Compact Proactively

- After 3 images in context → suggest /compact
- After 5 images in context → run /compact (autonomous mode)
- In multi-screen workflows → plan compact every 5 screens
- NEVER accumulate more than 7 images without compacting

### Rule 5: Figma and Canva

- Figma: request specific node screenshots, not full-page captures
- Canva: thumbnails usually fine, but they accumulate

### Rule 6: User-Pasted Images

Recommend /compact after processing each pasted image to prevent accumulation.

## Recovery

If the error occurs:
1. Tell user to run `/compact` immediately
2. If that fails, suggest new session
3. Do NOT retry — it will fail again until images are cleared

## Workflow Planning for Image-Heavy Tasks

When planning a task that involves many images (beta testing, UI review, design comparison):
1. Estimate total images needed
2. Plan compact points every 5 images
3. At each compact point, save task progress (the precompact hook preserves context)
4. After compact, re-read only the information needed for the next batch
5. NEVER try to hold all images in context at once
