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

// Modern Navigation Bar Component
const NavigationBar = ({ currentScreen, setCurrentScreen, theme }) => {
  const navItems = [
    { key: 'home', icon: '●', label: 'Home' },
    { key: 'picks', icon: '◉', label: 'Picks' },
    { key: 'friends', icon: '👥', label: 'Friends' },
    { key: 'leaderboard', icon: '♔', label: 'Leaderboard' },
    { key: 'watchparties', icon: '▶', label: 'Watch' },
    { key: 'settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <View style={[styles.navigationBar, { backgroundColor: theme.surface }]}>
      <View style={[styles.navContainer, { backgroundColor: theme.surface }]}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navItem,
              currentScreen === item.key && { 
                backgroundColor: theme.primary + '15',
                transform: [{ scale: 1.05 }]
              }
            ]}
            onPress={() => setCurrentScreen(item.key)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.navIconContainer,
              currentScreen === item.key && { 
                backgroundColor: theme.primary + '20',
                transform: [{ scale: 1.1 }]
              }
            ]}>
              <Text style={[
                styles.navIcon,
                { color: currentScreen === item.key ? theme.primary : theme.textSecondary }
              ]}>
                {item.icon}
              </Text>
            </View>
            <Text style={[
              styles.navLabel,
              { 
                color: currentScreen === item.key ? theme.primary : theme.textSecondary,
                fontWeight: currentScreen === item.key ? '600' : '500'
              }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Modern Home Screen Component
const HomeScreen = ({ theme, isDarkMode }) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>PickWise</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your Ultimate Sports Betting Experience</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Today's Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today's Games</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionAction, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.gameCard, { backgroundColor: theme.surface }]}>
            <View style={styles.gameHeader}>
              <View style={styles.gameTimeContainer}>
                <Text style={[styles.gameTime, { color: theme.textSecondary }]}>8:00 PM EST</Text>
                <View style={[styles.liveIndicator, { backgroundColor: theme.success }]} />
              </View>
              <View style={[styles.leagueBadge, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.gameLeague, { color: theme.primary }]}>NFL</Text>
              </View>
            </View>
            <View style={styles.gameTeams}>
              <Text style={[styles.teamName, { color: theme.textPrimary }]}>Chiefs vs Ravens</Text>
              <Text style={[styles.gameStatus, { color: theme.textSecondary }]}>Live • 2nd Quarter</Text>
            </View>
            <TouchableOpacity style={[styles.pickButton, { backgroundColor: theme.primary }]} activeOpacity={0.8}>
              <Text style={styles.pickButtonText}>Make Pick</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Performance</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.primary + '25' }]}>
                <Text style={[styles.statIconText, { color: theme.primary }]}>●</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.primary }]}>24</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Picks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.primary + '25' }]}>
                <Text style={[styles.statIconText, { color: theme.primary }]}>▲</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.primary }]}>68%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.primary + '25' }]}>
                <Text style={[styles.statIconText, { color: theme.primary }]}>$</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.primary }]}>$1,890</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Winnings</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.primary + '20' }]}>
            <View style={styles.activityHeader}>
              <View style={[styles.activityIcon, { backgroundColor: theme.primary + '25' }]}>
                <Text style={[styles.activityIconText, { color: theme.primary }]}>▲</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: theme.textPrimary }]}>You moved up 2 spots on the leaderboard!</Text>
                <Text style={[styles.activityTime, { color: theme.textSecondary }]}>2 hours ago</Text>
              </View>
            </View>
          </View>
          <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.primary + '20' }]}>
            <View style={styles.activityHeader}>
              <View style={[styles.activityIcon, { backgroundColor: theme.primary + '25' }]}>
                <Text style={[styles.activityIconText, { color: theme.primary }]}>✓</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: theme.textPrimary }]}>Your Ravens pick won!</Text>
                <Text style={[styles.activityTime, { color: theme.textSecondary }]}>Yesterday</Text>
              </View>
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
        <Text style={[styles.placeholderTitle, { color: theme.textPrimary }]}>Make Picks</Text>
        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
          Place your bets and compete with friends
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [session, setSession] = useState(null);
  const [selectedWatchParty, setSelectedWatchParty] = useState(null);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) setCurrentScreen('home');
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
        return <HomeScreen theme={theme} isDarkMode={isDarkMode} />;
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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
    resizeMode: 'contain',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Modern Navigation Bar Styles
  navigationBar: {
    paddingTop: 8,
    paddingBottom: 34, // Extra padding for iPhone safe area
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  navContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  navIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Modern Home Screen Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Modern Game Card Styles
  gameCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gameLeague: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gameTeams: {
    marginBottom: 16,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  gameStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Modern Stats Styles
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Modern Activity Styles
  activityCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  activityTime: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Placeholder Screen Styles
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});