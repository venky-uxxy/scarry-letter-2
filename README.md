# ScaryLetterHelp

Free tool to decode scary letters in plain English.

## Deploy to Vercel in 3 steps

### 1. Push to GitHub
```
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/scaryletter.git
git push -u origin main
```

### 2. Import to Vercel
- Go to vercel.com → New Project
- Import your GitHub repo
- Click Deploy

### 3. Add your Gemini API key
- In Vercel dashboard → Settings → Environment Variables
- Add: `GEMINI_API_KEY` = your key from aistudio.google.com

Done. Live in 60 seconds.

## Files
```
index.html        ← frontend (no changes needed)
api/analyze.js    ← serverless function (hides your API key)
vercel.json       ← routing config
```

## Get free Gemini API key
https://aistudio.google.com/app/apikey
Free tier: 1,500 requests/day
