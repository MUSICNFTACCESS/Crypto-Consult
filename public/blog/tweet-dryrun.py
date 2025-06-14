import os
import tweepy
from datetime import datetime

API_KEY = os.environ["API_KEY"]
API_SECRET = os.environ["API_SECRET"]
ACCESS_TOKEN = os.environ["ACCESS_TOKEN"]
ACCESS_SECRET = os.environ["ACCESS_SECRET"]

auth = tweepy.OAuth1UserHandler(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_SECRET)
api = tweepy.API(auth)

today = datetime.utcnow().strftime("%Y-%m-%d")
tweet = f"📰 BTC Daily Blog - {today}\nLive price, analysis, and charts 📈\nhttps://crypto-consult.onrender.com/blog/{today}.html\n#Bitcoin #Crypto #BTC"

print("✅ Dry run successful! This is the tweet that would be posted:\n")
print(tweet)
