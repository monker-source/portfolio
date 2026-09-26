# Portfolio

Static site for Sasha’s design work. Pages are HTML, CSS, and JavaScript files. There is no build step.

## Preview

From the repository root:

```sh
python3 serve.py
```

The server listens on `127.0.0.1:8080` and sends `Cache-Control: no-store`, so CSS and JavaScript edits show on reload.

## Layout

- `index.html` — home grid
- `projects/projects.json` — index cards
- `projects/<slug>/` — a live project page
- `templates/project/` — identity, logo, and other non-type pages
- `templates/type/` — type-design pages
- `other/` — shared styles and scripts (`tokens.css`, `site.js`, `project-md.js`, `story-md.js`, `slideshow.js`)

## Add a project

Copy a template folder to `projects/<slug>/`. Copy `templates/project/` for identity, logo, and other non-type work. Copy `templates/type/` for type design. Leave live pages such as Bora and Tangley as they are.

Each page names its template in the first HTML comment. Keep that comment.

Register the page in `projects/projects.json`:

```json
{
  "title": "Project",
  "kind": "Logo",
  "year": "2026",
  "slug": "project",
  "href": "projects/project/",
  "description": "Short description for the index.",
  "preview": "projects/project/preview.svg",
  "width": 1280,
  "height": 800
}
```

`info` and `illustration` are optional. The home page loads `projects.json`, then replaces `title`, `kind`, `year`, and `description` with the front matter in that project’s `Project.md`.

## Edit copy

The home intro is `Intro.md`, using the same body rules as `Project.md`. `name` in the front matter is the word shown in the main text colour.

### Non-type pages

Front matter, in this order:

```yaml
title: Project
kind: Logo
year: Year
description: Short description for the index.
client: Client
art-direction: Art director
deliverables: Deliverables
```

The intro always lists four credits, in this order: Year, Client, Art-direction, Deliverables. Include every field. If a value is unknown, ask for it. The Art-direction label uses a non-breaking hyphen (`Art‑direction`).

### Type pages

Type pages skip that credit list. Front matter:

```yaml
title: Project
kind: Type design
year: Year
description: Short description for the index.
link: https://
link-label: Available on Foundry
```

Put the trial font in `source/`.

### Body and history

Paragraphs under the front matter support `*italic*` with single asterisks. A blank line in the project description renders as a pilcrow, with the same space on both sides. In the story, a blank line stays as space between paragraphs. The letters stay the same size.

History text is `history/story.md`. Images use these lines:

```markdown
![Caption](image.jpg)

![Pair caption](left.jpg)+(right.jpg)

![Wide image](wide.jpg)+
```

Slideshow images are listed in `slideshow/slides.json`.

## Images

On project pages, only hero SVGs follow `--ink` when the theme changes. Story images and other project images keep their original colours. To keep a hero SVG in its own colours, add `data-keep-color` to the `img` or a parent.

## Commits

When committing to GitHub, include a note that describes the changes. The first line says what changed. The note after it says what the change covers.

```text
Add the Rante case study and tighten project credits.

Publish the Rante page with markdown-driven history, optical-size note, and Bora credit alignment.
```
