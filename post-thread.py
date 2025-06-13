import os
import tweepy
from datetime import datetime

# Set up authentication from Render env vars
auth = tweepy.OAuth1UserHandler(
    os.environ["API_KEY"],
    os.environ["API_SECRET"],
    os.environ["ACCESS_TOKEN"],
    os.environ["ACCESS_SECRET"]
)
api = tweepy.API(auth)

# Get today's date and blog URL
today = datetime.utcnow().strftime('%Y-%m-%d')
url = f"https://crypto-consult.onrender.com/blog/{today}.html"
price = "$105,662"  # Optional: fetch dynamically with CoinGecko if you want

# Compose thread tweets
tweets = [
    f"📰 BTC Daily Blog for {today} 🧵",
    f"📈 BTC Price: {price}",
    "📊 ETF inflows still strong. Dominance holding. Here’s the full blog:",
    f"🔗 {url}"
]

# Post as thread
previous_tweet = api.update_status(tweets[0])
for tweet in tweets[1:]:
    previous_tweet = api.update_status(
        tweet,
        in_reply_to_status_id=previous_tweet.id,
        auto_populate_reply_metadata=True
    )

print("✅ Thread posted.")
