import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import SettingsScreen from './SettingsScreen';
import LeaderboardScreen from './LeaderboardScreen';
import WatchPartiesScreen from './WatchPartiesScreen';
import FriendsScreen from './FriendsScreen';
import WatchPartyDetailScreen from './WatchPartyDetailScreen';
import { lightTheme, darkTheme } from './Theme';
import AuthScreen from './AuthScreen';
import supabase from './supabaseClient';
import LocationService from './LocationService';

// PrizePicks-style Navigation Bar
const NavigationBar = ({ currentScreen, setCurrentScreen, theme }) => {
  const navItems = [
    { key: 'home', icon: '🏠', label: 'Home' },
    { key: 'picks', icon: '🎯', label: 'Picks' },
    { key: 'friends', icon: '👥', label: 'Friends' },
    { key: 'leaderboard', icon: '🏆', label: 'Board' },
    { key: 'watchparties', icon: '📺', label: 'Watch' },
  ];

  return (
    <View style={[styles.navigationBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
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
      ))}
    </View>
  );
};

// PrizePicks-style Home Screen
const HomeScreen = ({ theme, isDarkMode, userStats, setCurrentScreen }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  
  const timeframes = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>PickWise</Text>
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

      {/* Timeframe Toggle */}
      <View style={styles.timeframeContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeframeScroll}
        >
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe.key}
              style={[
                styles.timeframeButton,
                { 
                  backgroundColor: selectedTimeframe === timeframe.key ? theme.primary : 'transparent',
                  borderColor: selectedTimeframe === timeframe.key ? theme.primary : theme.border,
                }
              ]}
              onPress={() => setSelectedTimeframe(timeframe.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timeframeText,
                { 
                  color: selectedTimeframe === timeframe.key ? theme.textInverse : theme.textSecondary,
                  fontWeight: selectedTimeframe === timeframe.key ? '600' : '500'
                }
              ]}>
                {timeframe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

        {/* Today's Games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today's Games</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionAction, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.gameCard, { backgroundColor: theme.surface }]}>
            <View style={styles.gameHeader}>
              <View style={styles.gameInfo}>
                <Text style={[styles.gameTime, { color: theme.textSecondary }]}>8:15 PM EST</Text>
                <View style={[styles.liveIndicator, { backgroundColor: theme.error }]}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <View style={[styles.leagueBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.leagueText}>NFL</Text>
              </View>
            </View>
            
            <Text style={[styles.gameMatchup, { color: theme.textPrimary }]}>Chiefs vs Ravens</Text>
            <Text style={[styles.gameStatus, { color: theme.textSecondary }]}>2nd Quarter • 14-7</Text>
            
            <TouchableOpacity 
              style={[styles.pickButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.pickButtonText}>Make Pick</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.gameCard, { backgroundColor: theme.surface }]}>
            <View style={styles.gameHeader}>
              <View style={styles.gameInfo}>
                <Text style={[styles.gameTime, { color: theme.textSecondary }]}>4:25 PM EST</Text>
              </View>
              <View style={[styles.leagueBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.leagueText}>NFL</Text>
              </View>
            </View>
            
            <Text style={[styles.gameMatchup, { color: theme.textPrimary }]}>Cowboys vs Eagles</Text>
            <Text style={[styles.gameStatus, { color: theme.textSecondary }]}>Starting Soon</Text>
            
            <TouchableOpacity 
              style={[styles.pickButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.pickButtonText}>Make Pick</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
          
          <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.activityIcon, { backgroundColor: theme.success + '20' }]}>
              <Text style={styles.activityEmoji}>✅</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: theme.textPrimary }]}>
                Your Ravens pick won!
              </Text>
              <Text style={[styles.activityTime, { color: theme.textSecondary }]}>2 hours ago</Text>
            </View>
            <Text style={[styles.activityAmount, { color: theme.success }]}>+$125</Text>
          </View>

          <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.activityIcon, { backgroundColor: theme.primary + '20' }]}>
              <Text style={styles.activityEmoji}>📈</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: theme.textPrimary }]}>
                Moved up 3 spots on leaderboard
              </Text>
              <Text style={[styles.activityTime, { color: theme.textSecondary }]}>Yesterday</Text>
            </View>
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
    paddingBottom: 34,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    transform: [{ scale: 1.05 }],
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
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