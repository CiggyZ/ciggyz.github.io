# Portfolio V6 — now with Jekyll

This is the original minimal V6 portfolio, with the original hexadecimal backdrop,
trailing cursor and design, converted to GitHub Pages' built-in Jekyll format.

## Publish without installing anything (GitHub web interface)

1. Create a **public** repository named `ciggyz.github.io` under your GitHub account
   (or use your existing one). If you previously published the static V6 site,
   remove the old root HTML/assets or replace them with this project. In particular,
   **delete any `.nojekyll` file** because it disables the Markdown build.
2. Upload **the contents** of this folder to the repository root (`index.html`,
   `_config.yml`, `_layouts/`, `_writeups/`, etc.), not the enclosing directory or ZIP.
3. In **Settings → Pages**, select **Deploy from a branch** and **main / (root)**.
4. GitHub builds the Jekyll website for you. Visit https://ciggyz.github.io
   when deployment succeeds (check the **Actions** tab for errors).

## Publish your first writeup

1. Copy `_templates/writeup.md` to `_writeups/my-first-writeup.md`.
2. Edit the Markdown: title, date, summary, and content.
3. Commit the Markdown file to `main`.
4. GitHub Pages will build the new article and link it on `/writeups/` automatically.

To add a project, copy `_templates/project.md` to `_projects/my-project.md`
and edit its contents. Projects and writeups are deliberately empty by default.

**Security:** Never publish secrets, flags, confidential code, or writeups for
CTFs/courses that prohibit public solutions (including pwn.college challenges).

## Optional: local preview (Omarchy / Linux)

Ruby is not needed for GitHub-based publishing. If you want local Jekyll preview later:

```bash
bundle install
bundle exec jekyll serve --livereload
```

Then open http://localhost:4000. Installing Ruby and Bundler is only necessary
if your computer does not already have them.

## Where to edit things

- `index.html` — homepage headline and tagline.
- `about.html` — short bio and image.
- `assets/css/site.css` — styling.
- `assets/js/site.js` — the original V6 cursor and hex background.
- `_layouts/default.html` — shared navigation, site shell and footer.
- `_layouts/entry.html` — automatically used for writeups and projects.
- `_writeups/` and `_projects/` — add Markdown articles here.

Source Markdown files cannot be previewed merely by opening `index.html` with
`file://`. GitHub Pages builds the site automatically, or use local Jekyll.
