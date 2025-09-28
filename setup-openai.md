# OpenAI Setup for AI Live Bets

## Getting Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

## Adding the Key to Your App

Open `BetGenerator.js` and replace the placeholder:

```javascript
const openai = new OpenAI({
  apiKey: 'sk-your-actual-api-key-here', // Replace this
  dangerouslyAllowBrowser: true
});
```

## Cost Information

- **Model**: GPT-3.5-turbo (cheapest option)
- **Cost**: ~$0.002 per bet generation
- **Usage**: 3 bets every 5 seconds = ~$0.001 per minute
- **Demo Cost**: Less than $0.10 for a full demo session

## How It Works

The AI analyzes:
- Current score and game state
- Down and distance
- Field position
- Last play result
- Time remaining

Then generates contextual bets like:
- "Will Hurts throw a TD on this red zone drive?"
- "Will the Eagles convert this crucial 3rd down?"
- "Will Chiefs call timeout to ice the kicker?"

## Fallback System

If OpenAI is unavailable or you don't have a key:
- App automatically uses smart fallback bets
- No functionality is lost
- Perfect for reliable demo presentations

Your app works great with or without the API key!
