# 🚨 Action Items for You

To get **Lala Kids** running live on Vercel and fully functional, I need you to complete these steps:

## 1. Database Setup (Supabase)
- Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/lelfgtfzbtsiuprvehhm).
- Open the **SQL Editor**.
- Copy and run the code from the migration file I created: `supabase/migrations/20260107000000_initial_schema.sql` (You can find this file in your local project folder).
- **Why?** This creates the necessary tables (`users`, `courses`, `scenes`) for the app to work.

## 2. GitHub & Vercel
1.  **Push to GitHub**:
    -   Create a new repository on your GitHub.
    -   Run these commands in your terminal (I have already committed the code locally):
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/lala-kids.git
        git branch -M main
        git push -u origin main
        ```
2.  **Deploy to Vercel**:
    -   Go to Vercel and "Import Project" from GitHub.
    -   Select the `lala-kids` repository.
    -   **Crucial**: In the "Environment Variables" section, add ALL the variables from your local `.env.local` file:
        -   `NEXT_PUBLIC_SUPABASE_URL`
        -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        -   `GOOGLE_CLIENT_ID`
        -   `GOOGLE_CLIENT_SECRET`
        -   `CLOUDFLARE_ACCOUNT_ID`
        -   `CLOUDFLARE_ACCESS_KEY_ID`
        -   `CLOUDFLARE_SECRET_ACCESS_KEY`
        -   `CLOUDFLARE_R2_BUCKET_NAME`
        -   `GOOGLE_GENERATIVE_AI_API_KEY` (You need to generate this from Google AI Studio if you haven't already and add it).

## 3. Google OAuth Redirect
-   In your Google Cloud Console (where you got the Client ID), ensure this Authorized Redirect URI is added:
    -   `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`
    -   (Keep `http://localhost:3000/auth/callback` for local testing).
