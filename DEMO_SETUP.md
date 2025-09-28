# NFL Live Betting Demo Setup

This is a gamified sports betting app with live micro-betting on NFL games for your hackathon demo.

## Quick Setup for Demo

### 1. Install Dependencies
```bash
npm install
```

### 2. (Optional) Add OpenAI API Key
For AI-generated live bets, add your OpenAI API key in `BetGenerator.js`:
```javascript
apiKey: 'your-openai-api-key-here'
```
If no key is provided, the app uses smart fallback bets.

### 3. Start the Expo App
```bash
npm start
```
Then scan the QR code with Expo Go or run on simulator.

**That's it!** No server needed - everything runs with static demo data for reliable presentations.

## Demo Features

### 🏈 Live Game Integration
- Real-time Super Bowl LVII data (Eagles vs Chiefs)
- Live score updates and game clock
- Win probability tracking

### 🤖 AI-Powered Micro-Betting System
- **OpenAI Integration**: GPT-3.5-turbo generates context-aware live bets
- Dynamic betting options that refresh every 5 seconds based on game situation
- Custom bet amounts ($1-$1000) or quick preset amounts ($5, $10, $25, $50, $100)
- Smart bets like "Will Hurts scramble for 5+ yards?", "Will this be a screen pass?", "Timeout in next 30 seconds?"
- Clean, modern UI with loading indicators during AI generation

### 📊 Player Stats
- Live quarterback stats (Hurts vs Mahomes)
- Running back performance (Sarkley)
- Key player metrics

### 🎮 Gamification
- User statistics and win rates
- Leaderboards and friend competitions
- Streak tracking and rewards

## Demo Flow

1. **Home Screen**: Shows live Super Bowl game with current score
2. **Tap Game**: Navigate to detailed game view
3. **Live Betting**: Place micro-bets on next play outcomes
4. **Stats View**: See player performance and game analytics
5. **Social Features**: Leaderboards and watch parties (existing)

## Technical Stack

- **Frontend**: React Native + Expo
- **Database**: Supabase (for user data)
- **Data**: Static NFL play-by-play data from Super Bowl LVII
- **Betting Logic**: Dynamic bet generation with 10+ unique micro-betting options

## For Presentation

The app uses static demo data that's perfect for reliable hackathon presentations. No server setup needed - just run `npm start` and demo! The live betting system generates different bet combinations every 5 seconds to simulate real-time action.

Key selling points:
- **Micro-betting**: Quick, small-stakes bets on live plays
- **Social gamification**: Compete with friends
- **Real-time data**: Live game updates and statistics
- **Mobile-first**: Native app experience
