---
name: check-global-change
description: >-
  After a global site improvement, ask whether to check it, and if the user
  says yes, open every live page in the browser. Use when changing shared
  styles or scripts, site-wide type, spacing, header, theme, or layout, or
  when the user says global, everywhere, all pages, or site-wide.
---

# Check a global improvement

A global improvement changes something every page shares: `other/tokens.css`, `other/site.js`, `other/project-md.js`, `other/story-md.js`, `other/slideshow.js`, or the same visual change copied across pages (type, spacing, header, theme, layout).

A single project's copy, images, or `Project.md` is not global. Do not ask for those.

## Ask first

After the change is in place, ask once: whether to check it on every page. Wait for the answer. Do not open the browser sweep in the same turn as the question.

If the user already asked to check every page, that is the yes. Do not ask again.

If they say no, stop.

## If they say yes

Preview with `python3 serve.py` (`http://127.0.0.1:8080`). Open each live page and exercise the changed behavior. A single screenshot of one screen is not the check.

- `/`
- `/home.html`
- `/fun-stuff/`
- `/process/`
- `/other/about.html`
- `/other/index.html`
- `/projects/audit/`
- `/projects/bora/`
- `/projects/bora/history/`
- `/projects/bridge/`
- `/projects/bridge/history/`
- `/projects/rante/`
- `/projects/rante/history/`
- `/projects/tangley/`
- `/projects/tangley/history/`

Skip `templates/` and `other/concepts/`. Those are not live pages.

If the change is layout, also look at a narrow viewport on the home page and one project page. If the change is colour or theme, switch Paper, Black, Colour, and Live on the home page and one project page.

Fix anything the change broke, then recheck the pages that failed. Report what you opened and what still looks wrong.
