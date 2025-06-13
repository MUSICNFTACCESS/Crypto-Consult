import os
import tweepy
from datetime import datetime

auth = tweepy.OAuth1UserHandler(
    os.environ["API_KEY"],
    os.environ["API_SECRET"],
    os.environ["ACCESS_TOKEN"],
    os.environ["ACCESS_SECRET"]
)
api = tweepy.API(auth)

today = datetime.utcnow().strftime('%Y-%m-%d')
price = "105859"
url = f"https://crypto-consult.onrender.com/blog/{today}.html"

tweets = [
    f"📰 BTC Daily Blog for {today} 🧵",
    f"📈 BTC Price: ${price}",
    "📊 ETF inflows still strong. Dominance holding. Here’s the full blog:",
    f"🔗 {url}"
]

previous = api.update_status(tweets[0])
for tweet in tweets[1:]:
    previous = api.update_status(
        tweet,
        in_reply_to_status_id=previous.id,
        auto_populate_reply_metadata=True
    )
print("✅ Thread posted.")
