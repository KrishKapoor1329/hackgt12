import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { LineChart } from 'react-native-chart-kit';
import SettingsScreen from './SettingsScreen';
import LeaderboardScreen from './LeaderboardScreen';
import WatchPartiesScreen from './WatchPartiesScreen';
import FriendsScreen from './FriendsScreen';
import WatchPartyDetailScreen from './WatchPartyDetailScreen';
import GameDetailScreen from './GameDetailScreen';
import { lightTheme, darkTheme } from './Theme';
import AuthScreen from './AuthScreen';
import supabase from './supabaseClient';
import LocationService from './LocationService';
import BetGenerator from './BetGenerator';

// PrizePicks-style Navigation Bar
const NavigationBar = ({ currentScreen, setCurrentScreen, theme }) => {
  const navItems = [
    { key: 'home', label: 'Home' },
    { key: 'friends', label: 'Friends' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'watchparties', label: 'Watch Parties' },
  ];

  return (
    <View style={[styles.navigationBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {navItems.map((item, index) => (
        <View key={item.key} style={styles.navItemContainer}>
          <TouchableOpacity
            style={[
              styles.navItem,
              currentScreen === item.key && styles.navItemActive
            ]}
            onPress={() => setCurrentScreen(item.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.navIcon,
              { color: currentScreen === item.key ? theme.primary : theme.textTertiary }
            ]}>
              {item.icon}
            </Text>
            <Text style={[
              styles.navLabel,
              { 
                color: currentScreen === item.key ? theme.primary : theme.textTertiary,
                fontWeight: currentScreen === item.key ? '600' : '500'
              }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
          {index < navItems.length - 1 && (
            <View style={[styles.navDivider, { backgroundColor: theme.border }]} />
          )}
        </View>
      ))}
    </View>
  );
};

// Helper function for ordinal suffixes
const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j == 1 && k != 11) return "st";
  if (j == 2 && k != 12) return "nd";
  if (j == 3 && k != 13) return "rd";
  return "th";
};

// PrizePicks-style Home Screen
const HomeScreen = ({ theme, isDarkMode, userStats, setCurrentScreen }) => {
  const [liveGame, setLiveGame] = useState(null);

  const generateLiveBets = () => {
    const betOptions = [
      { id: 1, question: "Will the next play gain 5+ yards?", options: ["Yes", "No"] },
      { id: 2, question: "Will the next play be a PASS or RUSH?", options: ["Pass", "Rush"] },
      { id: 3, question: "Will Jalen Hurts throw to A.J. Brown?", options: ["Yes", "No"] },
      { id: 4, question: "Will the Eagles score on this drive?", options: ["Yes", "No"] },
      { id: 5, question: "Will the next play be incomplete?", options: ["Yes", "No"] },
      { id: 6, question: "Will there be a penalty on next play?", options: ["Yes", "No"] },
      { id: 7, question: "Will the Eagles get a first down?", options: ["Yes", "No"] },
      { id: 8, question: "Will the play go to the left or right?", options: ["Left", "Right"] }
    ];
    
    // Randomly select 3 different bets
    const shuffled = betOptions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const fetchLiveGame = async () => {
    const baseGameData = {
      gameTitle: "Super Bowl LVII",
      homeTeam: "Kansas City Chiefs",
      awayTeam: "Philadelphia Eagles",
      homeScore: 22,
      awayScore: 40,
      quarter: 4,
      clock: "6:37",
      possession: "PHI",
      down: 2,
      distance: 11,
      yardLine: "KC 27",
      lastPlay: "J.Hurts pass to D.Smith for 20 yards to the KC 27.",
      winProbability: 88,
      gameOver: false
    };

    try {
      // Try to get AI-generated bets
      const aiBets = await BetGenerator.generateLiveBets(baseGameData);
      setLiveGame({
        ...baseGameData,
        liveBets: aiBets
      });
    } catch (error) {
      // Fallback to simple bets
      setLiveGame({
        ...baseGameData,
        liveBets: generateLiveBets()
      });
    }
  };

  useEffect(() => {
    fetchLiveGame();
    const interval = setInterval(fetchLiveGame, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>FanZone</Text>
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: theme.surfaceSecondary }]}
            onPress={() => setCurrentScreen('settings')}
          >
            <Text style={[styles.settingsIcon, { color: theme.textSecondary }]}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Make your picks and compete
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      </View>


      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: theme.success }]}>
                ${userStats?.totalWinnings?.toLocaleString() || '0'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Winnings</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {userStats?.winRate?.toFixed(1) || '0.0'}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                {userStats?.totalPicks || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Picks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statValue, { color: theme.warning }]}>
                {userStats?.currentStreak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current Streak</Text>
            </View>
          </View>
        </View>

        {/* Performance Graph */}
        <View style={[styles.graphContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.graphTitle, { color: theme.textPrimary }]}>Performance</Text>
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                data: [
                  userStats?.totalWinnings * 0.7,
                  userStats?.totalWinnings * 0.8,
                  userStats?.totalWinnings * 0.75,
                  userStats?.totalWinnings * 0.9,
                  userStats?.totalWinnings * 0.85,
                  userStats?.totalWinnings * 0.95,
                  userStats?.totalWinnings || 1890,
                ]
              }]
            }}
            width={Dimensions.get('window').width - 72}
            height={180}
            chartConfig={{
              backgroundColor: theme.surface,
              backgroundGradientFrom: theme.surface,
              backgroundGradientTo: theme.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.primary,
              labelColor: (opacity = 1) => theme.textSecondary,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.primary
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
          <View style={styles.graphLegend}>
            <View style={styles.legendItem}>
              <Text style={[styles.legendValue, { color: theme.success }]}>+$290</Text>
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Past Week</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendValue, { color: theme.success }]}>+15.3%</Text>
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Growth</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Live Games */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Live Games</Text>
          
          {liveGame && (
            <TouchableOpacity 
              style={[styles.espnGameCard, { backgroundColor: theme.surface }]}
              onPress={() => setCurrentScreen('gamedetail')}
              activeOpacity={0.8}
            >
              {/* ESPN-style Header */}
              <View style={[styles.espnHeader, { borderBottomColor: theme.border }]}>
                <View style={styles.headerLeft}>
                  <View style={[styles.liveIndicator, { backgroundColor: '#ff4444' }]}>
                    <Text style={styles.liveText}>● LIVE</Text>
                  </View>
                  <Text style={[styles.gameTitle, { color: theme.textPrimary }]}>{liveGame.gameTitle}</Text>
                </View>
                <View style={[styles.leagueBadge, { backgroundColor: '#013369' }]}>
                  <Text style={styles.leagueText}>NFL</Text>
                </View>
              </View>

              {/* Main Game Display */}
              <View style={styles.espnGameBody}>
                {/* Away Team */}
                <View style={styles.espnTeam}>
                  <View style={styles.teamIdentity}>
                    <Image source={require('./philly.png')} style={styles.espnTeamLogo} />
                    <View style={styles.teamDetails}>
                      <Text style={[styles.espnTeamName, { color: theme.textPrimary }]}>Philadelphia</Text>
                      <Text style={[styles.espnTeamRecord, { color: theme.textSecondary }]}>Eagles • 11-1</Text>
                    </View>
                  </View>
                  <Text style={[styles.espnScore, { color: theme.textPrimary }]}>{liveGame.awayScore}</Text>
                </View>

                {/* Home Team */}
                <View style={styles.espnTeam}>
                  <View style={styles.teamIdentity}>
                    <Image source={require('./kansas.png')} style={styles.espnTeamLogo} />
                    <View style={styles.teamDetails}>
                      <Text style={[styles.espnTeamName, { color: theme.textPrimary }]}>Kansas City</Text>
                      <Text style={[styles.espnTeamRecord, { color: theme.textSecondary }]}>Chiefs • 9-3</Text>
                    </View>
                  </View>
                  <Text style={[styles.espnScore, { color: theme.textPrimary }]}>{liveGame.homeScore}</Text>
                </View>
              </View>

              {/* Game Situation */}
              <View style={[styles.gameSituation, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={styles.situationLeft}>
                  <Text style={[styles.timeAndDown, { color: theme.textPrimary }]}>
                    Q{liveGame.quarter} {liveGame.clock} • {liveGame.down}{getOrdinalSuffix(liveGame.down)} & {liveGame.distance}
                  </Text>
                  <Text style={[styles.possession, { color: theme.primary }]}>
                    {liveGame.possession} Ball at {liveGame.yardLine}
                  </Text>
                </View>
                <View style={styles.winProbSection}>
                  <Text style={[styles.winProbLabel, { color: theme.textSecondary }]}>WIN PROB</Text>
                  <Text style={[styles.winProbValue, { color: '#00AA00' }]}>{liveGame.winProbability}%</Text>
                </View>
              </View>

              {/* Action Button */}
              <View style={[styles.actionButton, { backgroundColor: theme.primary }]}>
                <Text style={[styles.actionButtonText, { color: theme.primaryText || '#ffffff' }]}>🎯 Place Live Bets</Text>
              </View>
            </TouchableOpacity>
          )}
         </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
          
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              No recent activity yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
              Start placing bets to see your activity here
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// Picks Screen Placeholder
const PicksScreen = ({ theme, isDarkMode }) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.centerContent}>
        <Text style={styles.comingSoonEmoji}>🎯</Text>
        <Text style={[styles.comingSoonTitle, { color: theme.textPrimary }]}>Make Picks</Text>
        <Text style={[styles.comingSoonText, { color: theme.textSecondary }]}>
          Place your bets and compete with friends
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [session, setSession] = useState(null);
  const [selectedWatchParty, setSelectedWatchParty] = useState(null);
  const [userStats, setUserStats] = useState({
    totalPicks: 0,
    correctPicks: 0,
    winRate: 0,
    totalWinnings: 0,
    currentStreak: 0,
    bestStreak: 0
  });
  const [userLocation, setUserLocation] = useState({
    city: null,
    state: null,
    country: null,
    displayName: null,
    isLoading: true
  });
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Detect and update user location
  const detectAndUpdateUserLocation = async (userId) => {
    try {
      setUserLocation(prev => ({ ...prev, isLoading: true }));

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('city, state, country')
        .eq('id', userId)
        .single();

      if (existingProfile?.city && existingProfile.city !== 'Unknown City') {
        setUserLocation({
          city: existingProfile.city,
          state: existingProfile.state,
          country: existingProfile.country,
          displayName: `${existingProfile.city}${existingProfile.state ? ', ' + existingProfile.state : ''}`,
          isLoading: false
        });
        return;
      }

      const locationInfo = await LocationService.getLocationWithFallback();
      
      if (locationInfo) {
        const formattedLocation = LocationService.formatCityForDatabase(locationInfo);
        
        const { error } = await supabase
          .from('profiles')
          .update({
            city: formattedLocation.city,
            state: formattedLocation.state,
            country: formattedLocation.country
          })
          .eq('id', userId);

        if (!error) {
          setUserLocation({
            city: formattedLocation.city,
            state: formattedLocation.state,
            country: formattedLocation.country,
            displayName: formattedLocation.displayName,
            isLoading: false
          });
        } else {
          console.error('Error updating user location:', error);
          setUserLocation(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setUserLocation({
          city: existingProfile?.city || 'Atlanta',
          state: existingProfile?.state || 'GA',
          country: existingProfile?.country || 'US',
          displayName: existingProfile?.city ? `${existingProfile.city}${existingProfile.state ? ', ' + existingProfile.state : ''}` : 'Atlanta, GA',
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error detecting user location:', error);
      setUserLocation({
        city: 'Atlanta',
        state: 'GA',
        country: 'US',
        displayName: 'Atlanta, GA',
        isLoading: false
      });
    }
  };

  // Load user stats from Supabase
  const loadUserStats = async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_picks, correct_picks, win_rate, total_winnings, current_streak, best_streak')
        .eq('id', userId)
        .single();

      if (profile) {
        setUserStats({
          totalPicks: profile.total_picks || 0,
          correctPicks: profile.correct_picks || 0,
          winRate: profile.win_rate || 0,
          totalWinnings: profile.total_winnings || 0,
          currentStreak: profile.current_streak || 0,
          bestStreak: profile.best_streak || 0
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set sample data for development
      setUserStats({
        totalPicks: 38,
        correctPicks: 24,
        winRate: 63.2,
        totalWinnings: 1890,
        currentStreak: 3,
        bestStreak: 8
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        if (data.session?.user) {
          loadUserStats(data.session.user.id);
          detectAndUpdateUserLocation(data.session.user.id);
        }
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setCurrentScreen('home');
        loadUserStats(newSession.user.id);
        detectAndUpdateUserLocation(newSession.user.id);
      }
    });
    return () => {
      mounted = false;
      listener.subscription?.unsubscribe?.();
    };
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'settings':
        return (
          <SettingsScreen 
            navigation={{ goBack: () => setCurrentScreen('home') }} 
            theme={theme}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        );
      case 'friends':
        return (
          <FriendsScreen 
            onBack={() => setCurrentScreen('home')}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardScreen 
            onBack={() => setCurrentScreen('home')}
            theme={theme}
            isDarkMode={isDarkMode}
            userStats={userStats}
            session={session}
            userLocation={userLocation}
          />
        );
      case 'watchparties':
        return (
          <WatchPartiesScreen 
            onBack={() => setCurrentScreen('home')}
            onWatchPartySelect={(party) => {
              setSelectedWatchParty(party);
              setCurrentScreen('watchpartydetail');
            }}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        );
      case 'watchpartydetail':
        return (
          <WatchPartyDetailScreen 
            onBack={() => {
              setCurrentScreen('watchparties');
              setSelectedWatchParty(null);
            }}
            watchParty={selectedWatchParty}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        );
      case 'picks':
        return <PicksScreen theme={theme} isDarkMode={isDarkMode} />;
      case 'gamedetail':
        return (
          <GameDetailScreen 
            onBack={() => setCurrentScreen('home')}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return <HomeScreen theme={theme} isDarkMode={isDarkMode} userStats={userStats} setCurrentScreen={setCurrentScreen} />;
    }
  };

  if (!session) {
    return (
      <AuthScreen 
        theme={theme}
        isDarkMode={isDarkMode}
        onAuthenticated={(s) => setSession(s)}
      />
    );
  }

  return (
    <View style={styles.appContainer}>
      {renderScreen()}
      <NavigationBar 
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Timeframe Toggle Styles
  timeframeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeframeScroll: {
    paddingRight: 20,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    height: 36,
    justifyContent: 'center',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },

  // Graph Styles
  graphContainer: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  graphLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Dividers
  divider: {
    height: 1,
    marginVertical: 12,
  },

  // Game Card Styles
  gameCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTime: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  liveIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  leagueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leagueText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  gameMatchup: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  pickButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // ESPN-style Game Card
  espnGameCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  espnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  espnGameBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  espnTeam: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  espnTeamLogo: {
    width: 50,
    height: 50,
    marginRight: 12,
    resizeMode: 'contain',
  },
  teamDetails: {
    flex: 1,
  },
  espnTeamName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  espnTeamRecord: {
    fontSize: 14,
    fontWeight: '500',
  },
  espnScore: {
    fontSize: 32,
    fontWeight: '800',
  },
  gameSituation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  situationLeft: {
    flex: 1,
  },
  timeAndDown: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  possession: {
    fontSize: 13,
    fontWeight: '600',
  },
  winProbSection: {
    alignItems: 'flex-end',
  },
  winProbLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  winProbValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Original Team Logo Styles (for other components)
  teamLogos: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    fontSize: 32,
    marginBottom: 4,
  },
  teamLogoImage: {
    width: 40,
    height: 40,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamScore: {
    fontSize: 20,
    fontWeight: '700',
  },
  vs: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
  },

  // Empty State Styles
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },

  // Activity Card Styles
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Navigation Bar Styles
  navigationBar: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  navItemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    transform: [{ scale: 1.05 }],
  },
  navDivider: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Placeholder Screen Styles
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoonEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});