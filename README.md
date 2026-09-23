# NDA Aspirants Community — Final Build

A responsive NDA preparation and community platform with Supabase authentication, profiles, real-time chat, discussions, study groups, mock tests, SSB practice and the 20-feature Mission Control suite.

## Included
- Responsive desktop + mobile layout
- Supabase Auth / profiles / groups / discussions / realtime chat
- 100-entry practice bank for every chapter across Mathematics, GAT, English, Current Affairs and SSB
- Daily live current-affairs feed via `/api/current-affairs.js`
- 10 PPDT practice pictures plus PPDT mock workflow
- SSB practice simulator
- 20 Mission Control features
- SEO metadata, robots.txt, sitemap.xml and Google Search Console verification file
- NDA Aspirants Community logo

## Deploy to Vercel
1. Upload the contents of this folder to the root of your GitHub repository.
2. Keep `index.html`, `config.js`, `nda-logo.png`, `robots.txt`, `sitemap.xml`, `google9280e9a5acf167663.html` and the `api/` folder in the repository root.
3. Vercel will automatically deploy the static site and the current-affairs serverless function.

## Supabase
`config.js` contains only the browser-safe publishable key. Never put a Supabase service-role key or database password in the repository.

## Important
The Mission Control readiness dashboard is a preparation-progress view, not a prediction of selection. Current-affairs headlines come from live external feeds and should be verified at the original publisher.

## Question bank update
The current build contains 25,000 question entries: 5 subjects × 10 chapters × 500 questions per chapter. Question text is unique across the complete bank. Existing unique questions are retained and additional chapter-specific practice variants are included to reach the requested 500-per-chapter target.
