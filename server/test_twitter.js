import { config } from "dotenv";
config();
import { TwitterApi } from "twitter-api-v2";

// Load environment variables from .env file

async function runTest() {
  console.log("Attempting to connect to Twitter with your keys...");

  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  try {
    // This command simply checks if the keys are valid
    const whoAmI = await twitterClient.v2.me();
    console.log("✅ Authentication successful!");
    console.log(`You are authenticated as: ${whoAmI.data.username}`);
  } catch (error) {
    console.error("❌ Test failed!");
    console.error("The keys in your .env file are not working.");
    console.error("\nReceived this detailed error from the Twitter API:");
    console.error(error);
  }
}

runTest();
