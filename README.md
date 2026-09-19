# JOIN WITH NDA ASPIRANT — Real Website Starter v2.0

This package converts the prototype toward a real multi-user website using Supabase Auth + Postgres + Realtime.

## 1. Create backend
Create a Supabase project, then open SQL Editor and run `supabase/schema.sql`.

## 2. Configure frontend
Copy the values from the Supabase Connect/API settings into `config.js`:
- `url`: your project URL
- `publishableKey`: your publishable/browser key

Never put a service-role or secret key in `config.js`.

## 3. Enable Realtime
Enable Realtime/database changes for `public.messages` in the Supabase dashboard. Keep access restricted to authenticated users.

## 4. Test
Open `index.html` through a local/static web server, create two test accounts, open the same chat room in two browser windows, and send messages. Messages should appear to the other signed-in user without refreshing.

## 5. Deploy
The folder can be deployed as a static site. Cloudflare Pages supports static HTML deployments and Git/direct upload workflows. Set the production output to this folder.

The existing NDA mock tests and SSB simulator remain client-side training features. The online community features being connected here are authentication, profiles, chat messages and discussions.
