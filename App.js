import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useState } from 'react';
import SettingsScreen from './SettingsScreen';
import { lightTheme, darkTheme } from './Theme';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [count, setCount] = useState(0);

  // add dark mode state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen 
        navigation={{ goBack: () => setCurrentScreen('home') }} 
        theme={theme}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>PrizePicks 🏆</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your Ultimate Sports Betting Experience</Text>
        <TouchableOpacity 
          style={[styles.settingsButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setCurrentScreen('settings')}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.featuresContainer}>
          <TouchableOpacity style={[styles.featureCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.featureIcon}>🔥</Text>
            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Get Hyped</Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>Join the excitement with live game updates and community hype</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Find Friends</Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>Connect with friends and discover people in your area</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Make Picks</Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>Place your bets and compete with friends</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.featureIcon}>📺</Text>
            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Watch Parties</Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>Join virtual watch parties and cheer together</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Counter */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Demo Counter</Text>
          <Text style={[styles.counterText, { color: theme.primary }]}>{count}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.success }]} 
              onPress={() => setCount(count + 1)}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.error }]} 
              onPress={() => setCount(count - 1)}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]} 
            onPress={() => setCount(0)}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>🏈 NFL Games</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>👥 Find Friends</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Built for HackGT12 🚀</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
  },
  settingsButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 20,
  },
  counterText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  incrementButton: {
    backgroundColor: '#10b981',
  },
  decrementButton: {
    backgroundColor: '#ef4444',
  },
  resetButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 40,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickActionText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
});
