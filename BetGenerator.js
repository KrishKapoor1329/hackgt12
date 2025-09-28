import OpenAI from 'openai';

// Initialize OpenAI with your API key
// Replace 'your-api-key-here' with your actual OpenAI API key
const openai = new OpenAI({
  apiKey: 'your-api-key-here', // You'll need to add your key here
  dangerouslyAllowBrowser: true // For client-side usage in Expo
});

class BetGenerator {
  constructor() {
    this.fallbackBets = [
      { id: 1, question: "Will the next play gain 5+ yards?", options: ["Yes", "No"] },
      { id: 2, question: "Will the next play be a PASS or RUSH?", options: ["Pass", "Rush"] },
      { id: 3, question: "Will Jalen Hurts throw to A.J. Brown?", options: ["Yes", "No"] },
      { id: 4, question: "Will the Eagles score on this drive?", options: ["Yes", "No"] },
      { id: 5, question: "Will the next play be incomplete?", options: ["Yes", "No"] },
      { id: 6, question: "Will there be a penalty on next play?", options: ["Yes", "No"] },
      { id: 7, question: "Will the Eagles get a first down?", options: ["Yes", "No"] },
      { id: 8, question: "Will the play go to the left or right?", options: ["Left", "Right"] },
      { id: 9, question: "Will Hurts scramble for 5+ yards?", options: ["Yes", "No"] },
      { id: 10, question: "Will the Chiefs call a timeout?", options: ["Yes", "No"] }
    ];
  }

  async generateLiveBets(gameState) {
    try {
      const prompt = `You are creating micro-betting options for a live NFL game. Generate exactly 3 unique, exciting micro-bets for the next play.

Game Situation:
- Score: ${gameState.awayTeam} ${gameState.awayScore} - ${gameState.homeTeam} ${gameState.homeScore}
- Quarter: ${gameState.quarter}, Time: ${gameState.clock}
- Down: ${gameState.down}nd & ${gameState.distance} at ${gameState.yardLine}
- Possession: ${gameState.possession}
- Last Play: ${gameState.lastPlay}

Create bets that are:
- Specific to this exact game situation
- Quick to resolve (next play or drive)
- Exciting and engaging
- Simple yes/no or A/B choices

Return ONLY a JSON array with this exact format:
[
  {"id": 1, "question": "Will [specific question]?", "options": ["Option A", "Option B"]},
  {"id": 2, "question": "Will [specific question]?", "options": ["Option A", "Option B"]},
  {"id": 3, "question": "Will [specific question]?", "options": ["Option A", "Option B"]}
]`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const betsData = JSON.parse(content);
      
      // Ensure we have an array and it has the right structure
      if (Array.isArray(betsData)) {
        return betsData.slice(0, 3); // Take first 3
      } else if (betsData.bets && Array.isArray(betsData.bets)) {
        return betsData.bets.slice(0, 3);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.log('AI bet generation failed, using fallback:', error.message);
      // Return 3 random fallback bets
      const shuffled = this.fallbackBets.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }
  }

  // Get fallback bets when AI is unavailable
  getFallbackBets() {
    const shuffled = this.fallbackBets.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }
}

export default new BetGenerator();
