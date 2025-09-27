import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import SettingsScreen from './SettingsScreen';
import LeaderboardScreen from './LeaderboardScreen';
import WatchPartiesScreen from './WatchPartiesScreen';
import { lightTheme, darkTheme } from './Theme';

// Navigation Bar Component
const NavigationBar = ({ currentScreen, setCurrentScreen, theme }) => {
  const navItems = [
    { key: 'home', icon: '⌂', label: 'Home' },
    { key: 'picks', icon: '◉', label: 'Picks' },
    { key: 'leaderboard', icon: '♔', label: 'Leaderboard' },
    { key: 'watchparties', icon: '▶', label: 'Watch' },
    { key: 'settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <View style={[styles.navigationBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.navItem,
            currentScreen === item.key && { backgroundColor: theme.primary + '20' }
          ]}
          onPress={() => setCurrentScreen(item.key)}
        >
          <Text style={[styles.navIcon, currentScreen === item.key && { opacity: 1 }]}>
            {item.icon}
          </Text>
          <Text style={[
            styles.navLabel,
            { color: currentScreen === item.key ? theme.primary : theme.textSecondary }
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Home Screen Component
const HomeScreen = ({ theme, isDarkMode }) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.logoContainer}>
          <Image source={require('./assets/image.png')} style={styles.logo} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>PrizePicks</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your Ultimate Sports Betting Experience</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Today's Games Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today's Games</Text>
          <View style={[styles.gameCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.gameHeader}>
              <Text style={[styles.gameTime, { color: theme.textSecondary }]}>8:00 PM EST</Text>
              <Text style={[styles.gameLeague, { color: theme.primary }]}>NFL</Text>
            </View>
            <View style={styles.gameTeams}>
              <Text style={[styles.teamName, { color: theme.textPrimary }]}>Chiefs vs Ravens</Text>
            </View>
            <TouchableOpacity style={[styles.pickButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.pickButtonText}>Make Pick</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.primary }]}>24</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Picks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.success }]}>68%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.primary }]}>$1,890</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Winnings</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.activityText, { color: theme.textPrimary }]}>You moved up 2 spots on the leaderboard!</Text>
            <Text style={[styles.activityTime, { color: theme.textSecondary }]}>2 hours ago</Text>
          </View>
          <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.activityText, { color: theme.textPrimary }]}>Your Ravens pick won!</Text>
            <Text style={[styles.activityTime, { color: theme.textSecondary }]}>Yesterday</Text>
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
  const theme = isDarkMode ? darkTheme : lightTheme;

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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Navigation Bar Styles
  navigationBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 34, // Extra padding for iPhone safe area
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Home Screen Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  
  // Game Card Styles
  gameCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  gameLeague: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  gameTeams: {
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
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

  // Stats Styles
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Activity Styles
  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
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