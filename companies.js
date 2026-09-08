// Company context with source links.
const COMPANIES = {
  "Figma": {
    "website": "https://figma.com",
    "logo": "logos/figma.png",
    "about": "Collaborative tools for interface design, prototyping, and building digital products.",
    "checkedAt": "September 8, 2026",
    "glassdoor": {
      "rating": 3.6,
      "url": "https://www.glassdoor.com/Overview/Working-at-Figma-EI_IE1537286.11%2C16.htm"
    },
    "press": [
      {
        "title": "Dylan Field’s IPO founder letter · July 2025",
        "url": "https://www.figma.com/blog/figma-ipo-founder-letter/",
        "source": "Company announcement"
      }
    ],
    "interviews": [
      {
        "title": "Dylan Field on design, craft, and AI",
        "url": "https://www.youtube.com/watch?v=WyJV6VwEGA8",
        "source": "Lenny’s Podcast · October 2025"
      },
      {
        "title": "Yuhki Yamashita on how Figma builds products",
        "url": "https://www.youtube.com/watch?v=NepFo4zXyK4",
        "source": "Lenny’s Podcast · January 2023"
      }
    ],
    "recognition": [
      {
        "title": "Included in the Lenny 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s curated company list"
      }
    ]
  },
  "Mercury": {
    "website": "https://mercury.com",
    "logo": "logos/mercury.png",
    "about": "Financial technology and banking tools for startups and growing businesses.",
    "checkedAt": "September 8, 2026",
    "glassdoor": {
      "rating": 4.3,
      "url": "https://www.glassdoor.com/Overview/Working-at-Mercury-EI_IE3583070.11%2C18.htm"
    },
    "press": [
      {
        "title": "Mercury’s $5.2B funding valuation · May 2026",
        "url": "https://www.reuters.com/technology/mercury-hits-52-billion-valuation-fintech-firm-banks-ai-startups-2026-05-20/",
        "source": "Reuters"
      }
    ],
    "interviews": [
      {
        "title": "Immad Akhund on lessons from building Mercury",
        "url": "https://www.youtube.com/watch?v=zy2Kd728Wrs",
        "source": "First Round"
      },
      {
        "title": "Immad Akhund on leadership and work-life balance",
        "url": "https://digits.com/between-two-founders/immad-akhund/",
        "source": "Between Two Founders · October 2024"
      }
    ],
    "recognition": [
      {
        "title": "Included in the Lenny 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s curated company list"
      }
    ]
  },
  "Cloudflare": {
    "website": "https://cloudflare.com",
    "logo": "logos/cloudflare.png",
    "about": "Internet infrastructure, security, and performance tools for websites and applications.",
    "checkedAt": "September 8, 2026",
    "glassdoor": {
      "rating": 3.2,
      "url": "https://www.glassdoor.com/Reviews/Cloudflare-Reviews-E430862.htm"
    },
    "press": [
      {
        "title": "AI restructuring and workforce reductions · May 2026",
        "url": "https://www.sfchronicle.com/tech/article/cloudflare-layoffs-ai-san-francisco-22247850.php",
        "source": "San Francisco Chronicle"
      },
      {
        "title": "Matthew Prince on AI bots and the web · December 2025",
        "url": "https://www.wired.com/story/big-interview-event-matthew-prince-cloudflare",
        "source": "WIRED"
      }
    ],
    "interviews": [
      {
        "title": "Matthew Prince on the internet’s business model",
        "url": "https://www.youtube.com/watch?v=UN47z_opfmo",
        "source": "The MAD Podcast"
      }
    ],
    "recognition": [
      {
        "title": "Included in the Lenny 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s curated company list"
      }
    ]
  },
  "AirOps": {
    "website": "https://airops.com",
    "logo": "logos/airops.png",
    "about": "AI-assisted content workflows and tools for brands navigating AI search.",
    "checkedAt": "September 8, 2026",
    "glassdoor": {
      "rating": 3.5,
      "url": "https://www.glassdoor.com/Overview/Working-at-AirOps-EI_IE9384660.11%2C17.htm"
    },
    "press": [
      {
        "title": "AirOps raises $40M Series B · November 2025",
        "url": "https://fortune.com/2025/11/10/airops-raises-40-million-series-b-at-225-million-valuation-to-rethink-marketing-in-the-age-of-ai/",
        "source": "Fortune"
      }
    ],
    "interviews": [
      {
        "title": "Alex Halliday on AI and content strategy",
        "url": "https://www.youtube.com/watch?v=vAYB73x8CCo",
        "source": "Animalz · March 2025"
      },
      {
        "title": "Alex Halliday and Ethan Smith on AI search",
        "url": "https://www.youtube.com/watch?v=RcoVL0ywt_s",
        "source": "AirOps webinar · June 2026"
      }
    ],
    "recognition": []
  },
  "Duolingo": {
    "website": "https://duolingo.com",
    "logo": "logos/duolingo.png",
    "about": "An education platform combining learning, playful product design, and a distinctive consumer brand.",
    "checkedAt": "September 8, 2026",
    "glassdoor": {
      "rating": 4.0,
      "url": "https://www.glassdoor.com/Overview/Working-at-Duolingo-EI_IE629348.11%2C19.htm"
    },
    "press": [
      {
        "title": "Luis von Ahn on the value of human design craft · May 2026",
        "url": "https://www.businessinsider.com/duolingo-ceo-luis-von-ahn-ai-cannot-top-designers-creativity-2026-5",
        "source": "Business Insider"
      }
    ],
    "interviews": [
      {
        "title": "Luis von Ahn on building Duolingo",
        "url": "https://www.youtube.com/watch?v=st6uE-dlunY",
        "source": "No Priors"
      }
    ],
    "recognition": [
      {
        "title": "Most Innovative Companies in social media · 2025",
        "url": "https://www.fastcompany.com/section/duolingo",
        "source": "Fast Company"
      }
    ]
  },
  "Dorsia": {
    "website": "https://dorsia.com",
    "logo": "logos/dorsia.png",
    "about": "A hospitality technology company offering members access to restaurants, events, and experiences.",
    "checkedAt": "September 8, 2026",
    "glassdoor": null,
    "press": [
      {
        "title": "Dorsia’s $50.4M funding announcement · February 2025",
        "url": "https://refreshmiami.com/news/investors-bet-50-4m-on-miami-based-dorsia-a-member-based-reservation-platform-for-top-venues/",
        "source": "Refresh Miami"
      }
    ],
    "interviews": [],
    "recognition": []
  },
  "IE": {
    "website": "https://ie.com.au",
    "logo": "logos/ie.png",
    "about": "A Melbourne product consultancy working across digital experiences, design systems, and client delivery.",
    "checkedAt": "September 8, 2026",
    "glassdoor": {
      "rating": 3.7,
      "url": "https://www.glassdoor.com.au/Overview/Working-at-IE-Digital-EI_IE656401.11%2C21.htm"
    },
    "press": [],
    "interviews": [],
    "recognition": [
      {
        "title": "APT travel website: Webby honoree case study",
        "url": "https://www.ie.com.au/case-studies/building-an-award-winning-travel-website",
        "source": "Company-reported client work recognition"
      }
    ]
  },
  "Airbnb": {
    "website": "https://airbnb.com",
    "logo": "logos/airbnb.png",
    "about": "Short-term rental marketplace",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Anthropic": {
    "website": "https://anthropic.com",
    "logo": "logos/anthropic.png",
    "about": "AI models and tools",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Crusoe": {
    "website": "https://crusoe.ai",
    "logo": "logos/crusoe.png",
    "about": "AI cloud and data centers",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Databricks": {
    "website": "https://databricks.com",
    "logo": "logos/databricks.png",
    "about": "Data analytics and AI infrastructure",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Decagon": {
    "website": "https://decagon.ai",
    "logo": "logos/decagon.png",
    "about": "AI agents for customer support",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Descript": {
    "website": "https://descript.com",
    "logo": "logos/descript.png",
    "about": "Video and podcast creation tools.",
    "checkedAt": "September 8, 2026",
    "recognition": [],
    "interviews": [],
    "press": []
  },
  "ElevenLabs": {
    "website": "https://elevenlabs.io",
    "logo": "logos/elevenlabs.png",
    "about": "AI voice generation",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Exa": {
    "website": "https://exa.ai",
    "logo": "logos/exa.png",
    "about": "Web search API for AI agents",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Fal": {
    "website": "https://fal.ai",
    "logo": "logos/fal.png",
    "about": "AI infrastructure for generative media",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Gamma": {
    "website": "https://gamma.app",
    "logo": "logos/gamma.png",
    "about": "AI design tools",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Handshake": {
    "website": "https://joinhandshake.com",
    "logo": "logos/handshake.png",
    "about": "Career marketplace and AI data services",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Harvey": {
    "website": "https://harvey.ai",
    "logo": "logos/harvey.png",
    "about": "Legal AI",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Helsing": {
    "website": "https://helsing.ai",
    "logo": "logos/helsing.png",
    "about": "Defense AI and autonomous systems",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Hex": {
    "website": "https://hex.tech",
    "logo": "logos/hex.png",
    "about": "AI analytics",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Kalshi": {
    "website": "https://kalshi.com",
    "logo": "logos/kalshi.png",
    "about": "Prediction markets",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "OpenAI": {
    "website": "https://openai.com",
    "logo": "logos/openai.png",
    "about": "AI models and tools",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Runway": {
    "website": "https://runwayml.com",
    "logo": "logos/runway.png",
    "about": "AI video generation",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "SpaceX": {
    "website": "https://spacex.com",
    "logo": "logos/spacex.png",
    "about": "Rockets, spacecraft, satellite internet, AI models, and social media",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Stripe": {
    "website": "https://stripe.com",
    "logo": "logos/stripe.png",
    "about": "Payments infrastructure",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Vercel": {
    "website": "https://vercel.com",
    "logo": "logos/vercel.png",
    "about": "Web app development and hosting",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  },
  "Waymo": {
    "website": "https://waymo.com",
    "logo": "logos/waymo.png",
    "about": "Autonomous ride-hailing",
    "checkedAt": "September 8, 2026",
    "recognition": [
      {
        "title": "Included in the Lenny’s 100 · September 2026",
        "url": "https://www.lennysjobs.com/lenny100",
        "source": "Lenny’s Jobs"
      }
    ],
    "interviews": [],
    "press": []
  }
};
