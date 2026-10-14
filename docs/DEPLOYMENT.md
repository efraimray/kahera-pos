# Deploying Kahera POS

Kahera is a static site: HTML, CSS, JS and a service worker. There is no server, database or build step to deploy. Before any deploy, run:

```bash
npm test          # money tests
npm run check     # syntax check all JS
npm run build     # refresh demo/index.html (single-file copy)
```

## 1. Publish the repository

### Option A: GitHub Desktop

1. **File → Add local repository…** and choose the `kahera-pos` folder. When asked, click **create a repository**.
2. Name `kahera-pos`, keep the existing README/LICENSE (leave "Initialize with README" unticked), click **Create repository**.
3. Write the first commit: Summary `Kahera POS v1.0.0`, then **Commit to main**.
4. Click **Publish repository**. Untick **Keep this code private**, then **Publish repository**.

### Option B: git CLI

```bash
cd kahera-pos
git init -b main
git add .
git commit -m "Kahera POS v1.0.0"
gh repo create EfraimRay/kahera-pos --public --source=. --remote=origin --push \
  --description "Free offline-first POS for Philippine cafés and karinderyas"
# or, without the GitHub CLI: create the empty repo on github.com, then
# git remote add origin https://github.com/EfraimRay/kahera-pos.git && git push -u origin main
```

## 2. GitHub Pages (recommended, free)

1. Repository → **Settings → Pages**.
2. **Source:** Deploy from a branch. **Branch:** `main`, folder `/ (root)`. **Save**.
3. After about a minute the app is live at `https://efraimray.github.io/kahera-pos/` and the single-file demo at `https://efraimray.github.io/kahera-pos/demo/`.

CLI equivalent:

```bash
gh api -X POST repos/EfraimRay/kahera-pos/pages -f "source[branch]=main" -f "source[path]=/"
```

GitHub Pages serves over HTTPS, so the service worker and "Add to Home Screen" work immediately.

## 3. Other static hosts

| Host | Steps |
| --- | --- |
| **Netlify** | Add new site → Import from GitHub → pick `kahera-pos`. Build command: *(empty)*. Publish directory: `.` Or drag the folder onto app.netlify.com/drop. CLI: `npx netlify-cli deploy --dir=. --prod` |
| **Vercel** | New Project → import the repo → Framework preset **Other**, no build command, output directory `.`. CLI: `npx vercel --prod` |
| **Cloudflare Pages** | Create project → Connect to Git → build command *(none)*, output directory `/`. CLI: `npx wrangler pages deploy . --project-name kahera-pos` |
| **Any web host / cPanel** | Upload every file (keep the folders) into `public_html/pos/`. Must be HTTPS for offline mode. |

## 4. Installing on a shop tablet

1. Open the live URL in Chrome (Android) or Safari (iPad).
2. Chrome: menu **⋮ → Add to Home screen / Install app**. Safari: **Share → Add to Home Screen**.
3. Open it once while online so the service worker caches everything. After that it works offline.
4. Go to **Menu** and replace the sample items, business name and VAT setting, then **Shift → Start new shift** to clear the sample orders.

Data is saved in that tablet's browser only. Export the CSV at the end of each shift as your backup.

## 5. Releasing a new version

1. Make your changes and add tests.
2. Bump the version everywhere it appears:
   - `package.json` → `"version"`
   - `sw.js` → `const CACHE = 'kahera-vX.Y.Z'` (forces tablets to fetch the new files)
   - `index.html` About section → `v X.Y.Z`
   - `README.md` version badge
3. Add a dated entry at the top of `CHANGELOG.md`.
4. `npm test && npm run check && npm run build`
5. Commit, tag and release:

```bash
git add .
git commit -m "Kahera POS v1.1.0"
git tag v1.1.0
git push origin main --tags
zip -r kahera-pos-v1.1.0.zip . -x ".git/*" "node_modules/*" "dist/*"
gh release create v1.1.0 kahera-pos-v1.1.0.zip --title "v1.1.0" --notes-file CHANGELOG.md
```

In GitHub Desktop: commit, **Push origin**, then on github.com go to **Releases → Draft a new release**, create tag `v1.1.0`, attach the zip and publish.

Use semantic versioning: patch (`1.0.1`) for fixes, minor (`1.1.0`) for new features, major (`2.0.0`) for changes that break saved data.
