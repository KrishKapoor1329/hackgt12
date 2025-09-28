# FanZone

## Overview
FanZone is a social companion app that transforms every game into a live, shared betting experience. It allows fans to connect globally, place real-time bets, and join virtual watch parties, making every moment of the game more engaging and interactive.

---

## Inspiration
“You will never watch a game alone.”  
This was the guiding principle in building FanZone. Whether at home, in a bar, or in a new city, the goal is to ensure that every fan can find their community and share the excitement of live sports.

---

## Features
- **Live Game Experience**: Real-time scores, team logos, play-by-play tracking, and betting opportunities refreshed every 10 seconds.  
- **AI-Powered Betting**: Suggested bets based on real-time analysis, including yardage, play type, and penalties.  
- **Location-Based Discovery**: Automatic city and state detection with regional and national leaderboards.  
- **Social Interaction**: Watch parties, live chat, and leaderboards supporting large groups of concurrent users.  
- **Performance Tracking**: Statistics on accuracy, streaks, and winnings, visualized with responsive charts.  
- **Seamless User Experience**: Adaptive themes, animations, and smooth screen transitions.  
- **Security and Reliability**: Supabase authentication, encryption, error handling, and offline support.  

---

## Tech Stack
- **Frontend**: [React Native](https://reactnative.dev/), [Expo](https://expo.dev/)  
- **Backend**: [Supabase](https://supabase.com/) PostgreSQL with real-time subscriptions  
- **Authentication**: Supabase JWT with automatic session refresh  
- **Location Services**: IP geolocation with fallback layers  
- **Analytics**: [`react-native-chart-kit`](https://github.com/indiespirit/react-native-chart-kit)  
- **UI/State Management**: React hooks, custom theming (light/dark modes)  
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)  

---

## Challenges
One of the primary challenges was Expo Go’s restrictions on native speech-to-text integration.  
Our initial vision included **voice-powered betting**, where users could place bets by speaking naturally during live games. While Expo Go did not support this feature, development is underway for a standalone application to enable this capability.

---

## Lessons Learned
- **Performance Optimization**: Refresh intervals taught us that milliseconds matter, requiring optimized database queries and resilient fallback mechanisms.  
- **Design Standards**: Delivering a professional-grade experience reinforced how much trust and engagement depend on polished design choices.  

---

## Roadmap
- **Voice-Powered Betting**: A standalone app enabling natural voice commands to place bets in real time.  
- **AI-Driven Bet Intelligence**: Advanced machine learning models analyzing player performance, historical data, and environmental conditions to provide personalized, high-accuracy betting suggestions.  

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)  
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)  
- [Expo CLI](https://docs.expo.dev/get-started/installation/)  

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/fanzone.git
cd fanzone

# Install dependencies
npm install
# or
yarn install

# Start the development server
npx expo start
