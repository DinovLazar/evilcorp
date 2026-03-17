# E Corp Support Widget

Embeddable AI customer support chat widget powered by Google Gemini.

## Embed on any site

```html
<script src="https://your-domain.com/embed.js" data-ecorp-host="https://your-domain.com"></script>
```

Or without the attribute (auto-detects host from script src):

```html
<script src="https://your-domain.com/embed.js"></script>
```

## Setup

```bash
cp .env.local.example .env.local
# Add your GEMINI_API_KEY
npm install
npm run dev
```
