const COMPANY_STAGES = {
  "ClickUp": {
    "stage": "Series C+",
    "url": "https://clickup.com/blog/series-c/",
    "checkedAt": "2026-09-10"
  },
  "Modal": {
    "stage": "Series C+",
    "url": "https://modal.com/blog/modal-series-c",
    "checkedAt": "2026-09-09"
  },
  "AirOps": {
    "stage": "Series B",
    "url": "https://www.airops.com/blog/series-b",
    "checkedAt": "2026-09-08"
  },
  "Gamma": {
    "stage": "Series B",
    "url": "https://gamma.app/insights/how-we-built-a-usd100m-business-differently",
    "checkedAt": "2026-09-08"
  },
  "Mercury": {
    "stage": "Series C+",
    "url": "https://mercury.com/blog/series-d-announcement",
    "checkedAt": "2026-09-08"
  },
  "Harvey": {
    "stage": "Series C+",
    "url": "https://www.harvey.ai/blog/harvey-raises-growth-round-at-dollar11-billion-valuation-co-led-by-gic-and-sequoia",
    "checkedAt": "2026-09-08"
  },
  "Legora": {
    "stage": "Series C+",
    "url": "https://legora.com/newsroom/legora-extends-series-d-with-additional-50-million-welcomes-atlassian-and-nventures-as-investors",
    "checkedAt": "2026-09-08"
  },
  "Anthropic": {
    "stage": "Series C+",
    "url": "https://www.anthropic.com/news/anthropic-series-c",
    "checkedAt": "2026-09-08"
  },
  "Crusoe": {
    "stage": "Series C+",
    "url": "https://www.crusoe.ai/resources/newsroom/crusoe-announces-series-e-funding",
    "checkedAt": "2026-09-08"
  },
  "Decagon": {
    "stage": "Series C+",
    "url": "https://decagon.ai/blog/series-d-announcement",
    "checkedAt": "2026-09-08"
  },
  "Descript": {
    "stage": "Series C+",
    "url": "https://www.descript.com/blog/article/all-new-descript-backed-by-openai-startup-fund",
    "checkedAt": "2026-09-08"
  },
  "ElevenLabs": {
    "stage": "Series C+",
    "url": "https://elevenlabs.io/blog/series-d",
    "checkedAt": "2026-09-08"
  },
  "Exa": {
    "stage": "Series C+",
    "url": "https://exa.ai/blog/announcing-series-c",
    "checkedAt": "2026-09-08"
  },
  "Fal": {
    "stage": "Series C+",
    "url": "https://blog.fal.ai/our-series-d-scaling-fal/",
    "checkedAt": "2026-09-08"
  },
  "Helsing": {
    "stage": "Series C+",
    "url": "https://helsing.ai/newsroom/helsing-raises-1-8bn-in-series-e",
    "checkedAt": "2026-09-08"
  },
  "Hex": {
    "stage": "Series C+",
    "url": "https://hex.tech/newsroom/",
    "checkedAt": "2026-09-08"
  },
  "Kalshi": {
    "stage": "Series C+",
    "url": "https://news.kalshi.com/p/kalshi-11-billion-valuation-series-e",
    "checkedAt": "2026-09-08"
  },
  "Runway": {
    "stage": "Series C+",
    "url": "https://runway.com/news/runway-series-e-funding",
    "checkedAt": "2026-09-08"
  },
  "Stripe": {
    "stage": "Series C+",
    "url": "https://stripe.com/en-ca/newsroom/news/stripe-series-i-employee-liquidity",
    "checkedAt": "2026-09-08"
  },
  "Vercel": {
    "stage": "Series C+",
    "url": "https://vercel.com/blog/series-f",
    "checkedAt": "2026-09-08"
  },
  "Figma": {
    "stage": "Public",
    "url": "https://investor.figma.com/overview/default.aspx",
    "checkedAt": "2026-09-08"
  },
  "SpaceX": {
    "stage": "Public",
    "url": "https://ir.spacex.com/updates/releases-details/2026/Space-Exploration-Technologies-Corp--Announces-Closing-of-Initial-Public-Offering-Including-Full-Exercise-of-Underwriters-Option-to-Purchase-Additional-Shares-2026-RgoR-Y1Vwh/default.aspx",
    "checkedAt": "2026-09-08"
  },
  "Adobe": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/adobe",
    "checkedAt": "2026-09-08"
  },
  "Google": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/google",
    "checkedAt": "2026-09-08"
  },
  "Salesforce": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/salesforce",
    "checkedAt": "2026-09-08"
  },
  "Intuit": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/intuit",
    "checkedAt": "2026-09-08"
  },
  "Amazon": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/amazon",
    "checkedAt": "2026-09-08"
  },
  "Cisco": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/cisco",
    "checkedAt": "2026-09-08"
  },
  "Autodesk": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/autodesk",
    "checkedAt": "2026-09-08"
  },
  "Microsoft": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/microsoft",
    "checkedAt": "2026-09-08"
  },
  "Nasdaq": {
    "stage": "Public",
    "url": "https://www.linkedin.com/company/nasdaq",
    "checkedAt": "2026-09-08"
  },
  "Airbnb": {
    "stage": "Public",
    "url": "https://investors.airbnb.com/home/default.aspx",
    "checkedAt": "2026-09-08"
  },
  "Duolingo": {
    "stage": "Public",
    "url": "https://investors.duolingo.com/",
    "checkedAt": "2026-09-08"
  },
  "Notion": {
    "stage": "Series C+",
    "url": "https://research.contrary.com/report/notion",
    "checkedAt": "2026-09-08"
  },
  "Databricks": {
    "stage": "Series C+",
    "url": "https://techcrunch.com/2026/07/17/databricks-hits-188b-valuation-extending-its-run-as-ais-favorite-second-act/",
    "checkedAt": "2026-09-08"
  },
  "Dorsia": {
    "stage": "Series A",
    "url": "https://www.axios.com/newsletters/axios-pro-rata-bd01f990-eed6-11ef-b614-af3718e42e6a",
    "checkedAt": "2026-09-08"
  },
  "Cloudflare": {
    "stage": "Public",
    "url": "https://www.cloudflare.com/en-gb/press/press-releases/2026/cloudflare-announces-second-quarter-2026-financial-results/",
    "checkedAt": "2026-09-08"
  },
  "Ramp": {
    "stage": "Series C+",
    "url": "https://ramp.com/blog/ramp-series-c/",
    "checkedAt": "2026-09-08"
  },
  "Perplexity": {
    "stage": "Series C+",
    "url": "https://www.crunchbase.com/funding_round/perplexity-ai-series-c--b16aaa84",
    "checkedAt": "2026-09-08"
  },
  "Vanta": {
    "stage": "Series C+",
    "url": "https://www.vanta.com/resources/vanta-announces-series-d",
    "checkedAt": "2026-09-08"
  },
  "Lovable": {
    "stage": "Series C+",
    "url": "https://lovable.dev/blog/series-c",
    "checkedAt": "2026-09-09"
  }
};
