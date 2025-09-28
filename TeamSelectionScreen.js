import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const TeamSelectionScreen = ({ watchParty, theme, isDarkMode, onTeamSelected, onSkip }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [animationValues] = useState({
    eagles: new Animated.Value(1),
    chiefs: new Animated.Value(1),
  });

  // Super Bowl teams data
  const teams = {
    eagles: {
      id: 'PHI',
      name: 'Philadelphia Eagles',
      shortName: 'Eagles',
      colors: ['#004C54', '#A5ACAF', '#000000'],
      primaryColor: '#004C54',
      logo: '🦅',
      emoji: '🟢',
      chant: 'Fly Eagles Fly!',
      description: 'The pride of Philadelphia',
      stats: {
        wins: 14,
        losses: 3,
        offense: 'Elite',
        defense: 'Strong'
      }
    },
    chiefs: {
      id: 'KC',
      name: 'Kansas City Chiefs',
      shortName: 'Chiefs',
      colors: ['#E31837', '#FFB612', '#000000'],
      primaryColor: '#E31837',
      logo: '🏆',
      emoji: '🔴',
      chant: 'Chiefs Kingdom!',
      description: 'Defending Champions',
      stats: {
        wins: 14,
        losses: 3,
        offense: 'Explosive',
        defense: 'Opportunistic'
      }
    }
  };

  const handleTeamSelect = (teamKey) => {
    setSelectedTeam(teamKey);
    
    // Animate selected team
    Animated.sequence([
      Animated.timing(animationValues[teamKey], {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationValues[teamKey], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate non-selected team
    const otherTeam = teamKey === 'eagles' ? 'chiefs' : 'eagles';
    Animated.timing(animationValues[otherTeam], {
      toValue: 0.9,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const confirmTeamSelection = () => {
    if (!selectedTeam) {
      Alert.alert('Select a Team', 'Please choose which team you\'re supporting!');
      return;
    }

    const team = teams[selectedTeam];
    onTeamSelected(team);
  };

  const skipTeamSelection = () => {
    Alert.alert(
      'Skip Team Selection?',
      'You can always choose your team later in the watch party.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => onSkip() }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          🏈 Choose Your Team
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Pick the team you're rooting for in the Super Bowl
        </Text>
      </View>

      {/* Watch Party Info */}
      <View style={[styles.watchPartyInfo, { backgroundColor: theme.surface }]}>
        <Text style={[styles.joinigText, { color: theme.textSecondary }]}>
          Joining
        </Text>
        <Text style={[styles.watchPartyName, { color: theme.primary }]}>
          {watchParty?.title || 'Super Bowl Watch Party'}
        </Text>
      </View>

      {/* Teams Selection */}
      <View style={styles.teamsContainer}>
        {Object.entries(teams).map(([teamKey, team]) => (
          <Animated.View
            key={teamKey}
            style={[
              styles.teamOption,
              {
                transform: [{ scale: animationValues[teamKey] }],
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.teamCard,
                {
                  backgroundColor: selectedTeam === teamKey ? team.primaryColor : theme.surface,
                  borderColor: selectedTeam === teamKey ? team.primaryColor : theme.border,
                  shadowColor: selectedTeam === teamKey ? team.primaryColor : '#000',
                }
              ]}
              onPress={() => handleTeamSelect(teamKey)}
              activeOpacity={0.8}
            >
              {/* Team Logo */}
              <View style={[
                styles.teamLogoContainer,
                { backgroundColor: selectedTeam === teamKey ? 'rgba(255,255,255,0.2)' : team.primaryColor }
              ]}>
                <Text style={styles.teamLogo}>{team.logo}</Text>
              </View>

              {/* Team Name */}
              <Text style={[
                styles.teamName,
                { color: selectedTeam === teamKey ? '#ffffff' : theme.textPrimary }
              ]}>
                {team.name}
              </Text>

              {/* Team Chant */}
              <Text style={[
                styles.teamChant,
                { color: selectedTeam === teamKey ? 'rgba(255,255,255,0.9)' : theme.textSecondary }
              ]}>
                "{team.chant}"
              </Text>

              {/* Team Stats */}
              <View style={styles.teamStats}>
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statValue,
                    { color: selectedTeam === teamKey ? '#ffffff' : theme.textPrimary }
                  ]}>
                    {team.stats.wins}-{team.stats.losses}
                  </Text>
                  <Text style={[
                    styles.statLabel,
                    { color: selectedTeam === teamKey ? 'rgba(255,255,255,0.8)' : theme.textSecondary }
                  ]}>
                    Record
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statValue,
                    { color: selectedTeam === teamKey ? '#ffffff' : theme.textPrimary }
                  ]}>
                    {team.stats.offense}
                  </Text>
                  <Text style={[
                    styles.statLabel,
                    { color: selectedTeam === teamKey ? 'rgba(255,255,255,0.8)' : theme.textSecondary }
                  ]}>
                    Offense
                  </Text>
                </View>
              </View>

              {/* Selection Indicator */}
              {selectedTeam === teamKey && (
                <View style={styles.selectionIndicator}>
                  <Text style={styles.selectionIcon}>✓</Text>
                  <Text style={styles.selectionText}>SELECTED</Text>
                </View>
              )}

              {/* Team Color Indicator */}
              <View style={[styles.teamColorIndicator, { backgroundColor: team.primaryColor }]}>
                <Text style={styles.teamEmoji}>{team.emoji}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* VS Divider */}
      <View style={styles.vsContainer}>
        <View style={[styles.vsLine, { backgroundColor: theme.border }]} />
        <View style={[styles.vsBadge, { backgroundColor: theme.surface }]}>
          <Text style={[styles.vsText, { color: theme.textPrimary }]}>VS</Text>
        </View>
        <View style={[styles.vsLine, { backgroundColor: theme.border }]} />
      </View>

      {/* Selection Preview */}
      {selectedTeam && (
        <View style={[styles.selectionPreview, { backgroundColor: teams[selectedTeam].primaryColor }]}>
          <Text style={styles.previewText}>
            You're supporting the {teams[selectedTeam].name}! {teams[selectedTeam].emoji}
          </Text>
          <Text style={styles.previewSubtext}>
            Your profile will show in {teams[selectedTeam].name === 'Philadelphia Eagles' ? 'GREEN' : 'RED'} on the map
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: theme.border }]}
          onPress={skipTeamSelection}
        >
          <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
            Skip for Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              backgroundColor: selectedTeam ? teams[selectedTeam].primaryColor : theme.border,
              opacity: selectedTeam ? 1 : 0.5
            }
          ]}
          onPress={confirmTeamSelection}
          disabled={!selectedTeam}
        >
          <Text style={styles.confirmButtonText}>
            {selectedTeam ? `Join as ${teams[selectedTeam].shortName} Fan 🎉` : 'Select a Team'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.backgroundCircle, styles.circle1, { backgroundColor: 'rgba(0, 76, 84, 0.1)' }]} />
        <View style={[styles.backgroundCircle, styles.circle2, { backgroundColor: 'rgba(227, 24, 55, 0.1)' }]} />
        <View style={[styles.backgroundCircle, styles.circle3, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  
  watchPartyInfo: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  joinigText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  watchPartyName: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  teamsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  teamOption: {
    marginBottom: 20,
  },
  teamCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 3,
    alignItems: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  teamLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  teamLogo: {
    fontSize: 40,
  },
  teamName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  teamChant: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'center',
  },
  selectionIcon: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 4,
  },
  selectionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  
  teamColorIndicator: {
    position: 'absolute',
    top: -10,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  teamEmoji: {
    fontSize: 20,
  },
  
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  vsLine: {
    flex: 1,
    height: 2,
  },
  vsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  
  selectionPreview: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  previewText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  skipButton: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  circle1: {
    width: 200,
    height: 200,
    top: 100,
    left: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    top: 300,
    right: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: 200,
    left: 50,
  },
});

export default TeamSelectionScreen;
