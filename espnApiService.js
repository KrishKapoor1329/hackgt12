/*
/**
 * ESPN API Service
 * 
 * This file demonstrates how to pull various sports data from ESPN's public API endpoints.
 * ESPN provides free access to many sports data endpoints without requiring authentication.
 * 
 * Base URL: https://site.api.espn.com/apis/site/v2/sports/
 * 
 * Common endpoints structure:
 * - /sports/{sport}/{league}/scoreboard - Current games and scores
 * - /sports/{sport}/{league}/teams - Team information
 * - /sports/{sport}/{league}/teams/{teamId} - Specific team details
 * - /sports/{sport}/{league}/teams/{teamId}/roster - Team roster
 * - /sports/{sport}/{league}/news - Latest news
 * - /sports/{sport}/{league}/standings - League standings
 */

// Example: NFL endpoints
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';
const NFL_BASE = `${ESPN_BASE_URL}/football/nfl`;

/**
 * Fetch current NFL scoreboard data
 * Returns live scores, game status, and basic game information
 */
async function getNFLScoreboard() {
  try {
    const response = await fetch(`${NFL_BASE}/scoreboard`);
    const data = await response.json();
    
    // Structure of returned data:
    // {
    //   leagues: [...],
    //   season: {...},
    //   week: {...},
    //   events: [
    //     {
    //       id: "game_id",
    //       name: "Team A vs Team B",
    //       shortName: "A vs B",
    //       date: "2024-01-01T18:00Z",
    //       competitions: [
    //         {
    //           id: "competition_id",
    //           competitors: [
    //             {
    //               team: { id, name, abbreviation, displayName, color, logo },
    //               score: "21",
    //               homeAway: "home"
    //             }
    //           ],
    //           status: {
    //             type: { name: "STATUS_FINAL", completed: true },
    //             displayClock: "0:00",
    //             period: 4
    //           }
    //         }
    //       ]
    //     }
    //   ]
    // }
    
    return data;
  } catch (error) {
    console.error('Error fetching NFL scoreboard:', error);
    throw error;
  }
}

/**
 * Fetch NFL team information
 * Returns all teams with basic info like logos, colors, records
 */
async function getNFLTeams() {
  try {
    const response = await fetch(`${NFL_BASE}/teams`);
    const data = await response.json();
    
    // Structure:
    // {
    //   sports: [...],
    //   leagues: [...],
    //   teams: [
    //     {
    //       team: {
    //         id: "1",
    //         uid: "s:20~l:28~t:1",
    //         slug: "atlanta-falcons",
    //         abbreviation: "ATL",
    //         displayName: "Atlanta Falcons",
    //         shortDisplayName: "Falcons",
    //         name: "Falcons",
    //         nickname: "Falcons",
    //         location: "Atlanta",
    //         color: "a71930",
    //         alternateColor: "000000",
    //         isActive: true,
    //         logos: [...]
    //       }
    //     }
    //   ]
    // }
    
    return data;
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    throw error;
  }
}

/**
 * Fetch specific team details including roster
 * @param {string} teamId - ESPN team ID (e.g., "1" for Atlanta Falcons)
 */
async function getNFLTeamDetails(teamId) {
  try {
    const response = await fetch(`${NFL_BASE}/teams/${teamId}`);
    const data = await response.json();
    
    // Returns detailed team info including:
    // - Team stats
    // - Recent games
    // - Roster information
    // - Coaching staff
    
    return data;
  } catch (error) {
    console.error(`Error fetching team ${teamId} details:`, error);
    throw error;
  }
}

/**
 * Fetch team roster
 * @param {string} teamId - ESPN team ID
 */
async function getNFLTeamRoster(teamId) {
  try {
    const response = await fetch(`${NFL_BASE}/teams/${teamId}/roster`);
    const data = await response.json();
    
    // Structure:
    // {
    //   team: {...},
    //   athletes: [
    //     {
    //       id: "player_id",
    //       uid: "...",
    //       displayName: "Player Name",
    //       shortName: "P. Name",
    //       weight: 225,
    //       displayWeight: "225 lbs",
    //       height: 72,
    //       displayHeight: "6' 0\"",
    //       age: 25,
    //       dateOfBirth: "1999-01-01T08:00Z",
    //       debutYear: 2021,
    //       jersey: "12",
    //       position: {
    //         id: "1",
    //         name: "Quarterback",
    //         displayName: "Quarterback",
    //         abbreviation: "QB"
    //       },
    //       headshot: {...},
    //       college: {...},
    //       experience: {...}
    //     }
    //   ]
    // }
    
    return data;
  } catch (error) {
    console.error(`Error fetching team ${teamId} roster:`, error);
    throw error;
  }
}

/**
 * Fetch NFL standings
 * Returns current season standings by division
 */
async function getNFLStandings() {
  try {
    const response = await fetch(`${NFL_BASE}/standings`);
    const data = await response.json();
    
    // Structure includes divisions (AFC/NFC East, West, North, South)
    // with team records, win percentages, and playoff standings
    
    return data;
  } catch (error) {
    console.error('Error fetching NFL standings:', error);
    throw error;
  }
}

/**
 * Fetch NFL news
 * Returns latest news articles related to NFL
 */
async function getNFLNews() {
  try {
    const response = await fetch(`${NFL_BASE}/news`);
    const data = await response.json();
    
    // Structure:
    // {
    //   articles: [
    //     {
    //       id: "article_id",
    //       headline: "Article Title",
    //       description: "Article description...",
    //       published: "2024-01-01T12:00:00Z",
    //       type: "Story",
    //       premium: false,
    //       links: {...},
    //       images: [...],
    //       categories: [...]
    //     }
    //   ]
    // }
    
    return data;
  } catch (error) {
    console.error('Error fetching NFL news:', error);
    throw error;
  }
}

/**
 * Fetch specific game details with play-by-play data
 * @param {string} gameId - ESPN game/event ID
 */
async function getNFLGameDetails(gameId) {
  try {
    const response = await fetch(`${NFL_BASE}/summary?event=${gameId}`);
    const data = await response.json();
    
    // Returns comprehensive game data including:
    // - Box score
    // - Play-by-play data
    // - Team/player statistics
    // - Game timeline
    // - Scoring plays
    // - Drive summaries
    
    return data;
  } catch (error) {
    console.error(`Error fetching game ${gameId} details:`, error);
    throw error;
  }
}

/**
 * Fetch historical scoreboard for a specific date
 * @param {string} date - Date in YYYYMMDD format (e.g., "20240101")
 */
async function getNFLScoreboardByDate(date) {
  try {
    const response = await fetch(`${NFL_BASE}/scoreboard?dates=${date}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error(`Error fetching scoreboard for date ${date}:`, error);
    throw error;
  }
}

/**
 * OTHER SPORTS EXAMPLES
 * ESPN supports many other sports with similar endpoint structures
 */

// NBA Examples
const NBA_BASE = `${ESPN_BASE_URL}/basketball/nba`;
// const nbaScoreboard = await fetch(`${NBA_BASE}/scoreboard`);
// const nbaTeams = await fetch(`${NBA_BASE}/teams`);
// const nbaStandings = await fetch(`${NBA_BASE}/standings`);

// MLB Examples  
const MLB_BASE = `${ESPN_BASE_URL}/baseball/mlb`;
// const mlbScoreboard = await fetch(`${MLB_BASE}/scoreboard`);
// const mlbTeams = await fetch(`${MLB_BASE}/teams`);

// NHL Examples
const NHL_BASE = `${ESPN_BASE_URL}/hockey/nhl`;
// const nhlScoreboard = await fetch(`${NHL_BASE}/scoreboard`);
// const nhlTeams = await fetch(`${NHL_BASE}/teams`);

// College Football Examples
const CFB_BASE = `${ESPN_BASE_URL}/football/college-football`;
// const cfbScoreboard = await fetch(`${CFB_BASE}/scoreboard`);
// const cfbTeams = await fetch(`${CFB_BASE}/teams`);

/**
 * UTILITY FUNCTIONS
 * Helper functions to process and format ESPN API data
 */

/**
 * Extract simplified game data from ESPN scoreboard response
 * @param {Object} scoreboardData - Raw ESPN scoreboard response
 * @returns {Array} Simplified game objects
 */
function parseGameData(scoreboardData) {
  if (!scoreboardData.events) return [];
  
  return scoreboardData.events.map(event => {
    const competition = event.competitions[0];
    const homeTeam = competition.competitors.find(team => team.homeAway === 'home');
    const awayTeam = competition.competitors.find(team => team.homeAway === 'away');
    
    return {
      gameId: event.id,
      date: event.date,
      status: competition.status.type.name,
      completed: competition.status.type.completed,
      period: competition.status.period,
      clock: competition.status.displayClock,
      homeTeam: {
        id: homeTeam.team.id,
        name: homeTeam.team.displayName,
        abbreviation: homeTeam.team.abbreviation,
        score: parseInt(homeTeam.score) || 0,
        logo: homeTeam.team.logo
      },
      awayTeam: {
        id: awayTeam.team.id,
        name: awayTeam.team.displayName,
        abbreviation: awayTeam.team.abbreviation,
        score: parseInt(awayTeam.score) || 0,
        logo: awayTeam.team.logo
      }
    };
  });
}

/**
 * Extract team data from ESPN teams response
 * @param {Object} teamsData - Raw ESPN teams response
 * @returns {Array} Simplified team objects
 */
function parseTeamData(teamsData) {
  if (!teamsData.sports?.[0]?.leagues?.[0]?.teams) return [];
  
  return teamsData.sports[0].leagues[0].teams.map(teamObj => {
    const team = teamObj.team;
    return {
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      location: team.location,
      nickname: team.nickname,
      color: `#${team.color}`,
      alternateColor: `#${team.alternateColor}`,
      logo: team.logos?.[0]?.href,
      isActive: team.isActive
    };
  });
}

/**
 * EXAMPLE USAGE
 * Uncomment these functions to test the API calls
 */

/*
async function testESPNAPI() {
  try {
    console.log('Fetching NFL scoreboard...');
    const scoreboard = await getNFLScoreboard();
    const games = parseGameData(scoreboard);
    console.log('Current NFL games:', games);
    
    console.log('Fetching NFL teams...');
    const teamsData = await getNFLTeams();
    const teams = parseTeamData(teamsData);
    console.log('NFL teams:', teams);
    
    console.log('Fetching NFL standings...');
    const standings = await getNFLStandings();
    console.log('NFL standings:', standings);
    
  } catch (error) {
    console.error('Error testing ESPN API:', error);
  }
}

// Uncomment to run the test
// testESPNAPI();
*/

/**
 * INTEGRATION WITH EXISTING APP
 * These functions can be integrated with your existing React Native app
 */

// Example: Update your gameData.js with live ESPN data
/*
async function updateGameDataFromESPN(gameId) {
  try {
    const gameDetails = await getNFLGameDetails(gameId);
    
    // Transform ESPN data to match your existing gameData structure
    const transformedData = gameDetails.drives?.previous?.map(drive => ({
      homeScore: gameDetails.header.competitions[0].competitors[0].score,
      awayScore: gameDetails.header.competitions[0].competitors[1].score,
      qtr: drive.displayResult?.period || 1,
      down: drive.plays?.[0]?.start?.down,
      dist: drive.plays?.[0]?.start?.distance,
      time: drive.plays?.[0]?.clock?.displayValue,
      description: drive.plays?.[0]?.text,
      posteam: drive.team?.abbreviation,
      yardline: drive.plays?.[0]?.start?.yardLine,
      winProbability: Math.round(Math.random() * 100) // ESPN doesn't provide this directly
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error('Error updating game data from ESPN:', error);
    return [];
  }
}
*/

// Export functions for use in other parts of your app
module.exports = {
  getNFLScoreboard,
  getNFLTeams,
  getNFLTeamDetails,
  getNFLTeamRoster,
  getNFLStandings,
  getNFLNews,
  getNFLGameDetails,
  getNFLScoreboardByDate,
  parseGameData,
  parseTeamData,
  
  // Constants for easy access
  ESPN_BASE_URL,
  NFL_BASE,
  NBA_BASE,
  MLB_BASE,
  NHL_BASE,
  CFB_BASE
};
/**
 * NOTES:
 * 
 * 1. Rate Limiting: ESPN doesn't publish official rate limits, but be respectful
 *    and don't make excessive requests. Consider caching responses.
 * 
 * 2. CORS: When using in a web environment, you may need to proxy requests
 *    through your backend due to CORS restrictions.
 * 
 * 3. Data Freshness: Live game data updates frequently during games.
 *    Consider implementing polling or websockets for real-time updates.
 * 
 * 4. Error Handling: Always implement proper error handling as API endpoints
 *    can be temporarily unavailable or return unexpected data structures.
 * 
 * 5. Caching: Implement caching for data that doesn't change frequently
 *    (team info, historical games) to improve performance and reduce API calls.
 * 
 * 6. Alternative APIs: Consider ESPN's official API or other sports data providers
 *    like SportRadar, The Sports DB, or API-Football for more comprehensive data
 *    and better reliability for production applications.
 */
*/