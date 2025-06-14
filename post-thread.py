from dotenv import load_dotenv
load_dotenv(dotenv_path="/data/data/com.termux/files/home/CryptoConsult/.env")


import os
import tweepy

# Auth using env vars from CrimznsKeys
client = tweepy.Client(
    consumer_key=os.environ["API_KEY"],
    consumer_secret=os.environ["API_SECRET"],
    access_token=os.environ["ACCESS_TOKEN"],
    access_token_secret=os.environ["ACCESS_SECRET"]
)

# Define the tweet thread content
tweets = [
    "BTC Daily Blog for June 14 🧵",
    "BTC Price: $105,662",
    "ETF inflows still strong. Dominance holding. Here’s the full blog:",
    "🔗 https://crypto-consult.onrender.com/blog/2025-06-14.html"
]

# Post the thread
response = client.create_tweet(text=tweets[0])
thread_id = response.data["id"]

for tweet in tweets[1:]:
    response = client.create_tweet(text=tweet, in_reply_to_tweet_id=thread_id)
    thread_id = response.data["id"]

print("✅ Tweet thread posted.")
