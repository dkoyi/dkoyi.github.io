# dkoyi.github.io

The personal portfolio of Dhanush Koyi, live at https://dkoyi.github.io

Plain HTML, CSS and a little JavaScript. No build step.

## Run it locally
```
python -m http.server 8000
```
Then open http://localhost:8000

## Update it
- Words and links are in `index.html`.
- Colors, fonts and layout are in `assets/css/style.css`. The design tokens are at the top.
- Project images go in `assets/img/` as 1200×675 WebP files.

## Publish
In the repo settings, set **Pages → Source** to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys the site on every push to `main` and once a day.

## Commit heatmap
The "My year on GitHub" panel reads `assets/data/contributions.json`. The deploy workflow refreshes that file from the GitHub API each time it runs, without committing to the repo. To refresh the local copy by hand:
```
gh api graphql -f query='query{user(login:"dkoyi"){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}' --jq '.data.user.contributionsCollection.contributionCalendar | {total: .totalContributions, updated: (now|todate), days: [.weeks[].contributionDays[] | [.date, .contributionCount]]}' > assets/data/contributions.json
```
The hackathon chips under the heatmap are listed in `EVENTS` at the top of the heatmap code in `assets/js/main.js`.
