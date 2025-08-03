// mcp.tool.js

import { TwitterApi } from "twitter-api-v2";
import { config } from "dotenv";
config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// The function now accepts an optional imagePath
export async function createPost(status, imagePath) {
  try {
    let tweetOptions = {};

    // If an image path is provided, upload it first
    if (imagePath) {
      // .v1 is used for media uploads in this library
      const mediaId = await twitterClient.v1.uploadMedia(imagePath);
      tweetOptions.media = { media_ids: [mediaId] };
    }

    // Create the tweet with or without media
    const newPost = await twitterClient.v2.tweet(status, tweetOptions);

    return {
      content: [
        {
          type: "text",
          text: `Tweeted successfully! ID: ${newPost.data.id}`,
        },
      ],
    };
  } catch (error) {
    console.error("Error posting to Twitter:", error);
    return {
      content: [
        {
          type: "text",
          text: `Failed to post tweet. Error: ${error.message}`,
        },
      ],
    };
  }
}
