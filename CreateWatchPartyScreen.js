import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './supabaseClient';
import { Image } from 'react-native';
import { getTeamLogoUrl } from './nflTeams';

const { width, height } = Dimensions.get('window');

const CreateWatchPartyScreen = ({ onBack, theme, isDarkMode, onWatchPartyCreated }) => {
  // Fixed match data - Only Philly vs Kansas for hackathon
  const availableMatches = [
    {
      id: 'philly_vs_kansas',
      title: 'Philadelphia Eagles vs Kansas City Chiefs',
      teams: {
        home: { 
          name: 'Kansas City Chiefs', 
          shortName: 'KC', 
          color: '#E31837',
          logoUrl: getTeamLogoUrl('KC')
        },
        away: { 
          name: 'Philadelphia Eagles', 
          shortName: 'PHI', 
          color: '#004C54',
          logoUrl: getTeamLogoUrl('PHI')
        }
      },
      gameTime: 'September 27, 2025 4:25 PM EST',
      location: 'Hackathon Demo',
      isLive: true,
      description: 'The ultimate showdown - Eagles vs Chiefs!'
    }
  ];

  const [watchPartyData, setWatchPartyData] = useState({
    name: '',
    description: '',
    selectedMatch: availableMatches[0], // Auto-select the only available match
  });
  
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Confirmation
  const [creating, setCreating] = useState(false);

  const nextStep = () => {
    if (step === 1) {
      if (!watchPartyData.name.trim()) {
        Alert.alert('Missing Information', 'Please enter a watch party name');
        return;
      }
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const createWatchParty = async () => {
    if (!watchPartyData.name.trim() || !watchPartyData.selectedMatch) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        Alert.alert('Error', 'You must be logged in to create a watch party.');
        return;
      }
      const host_id = session.user.id;

      // Ensure a profile exists for the host (FK requirement)
      await supabase.from('profiles').upsert([{ id: host_id }], { onConflict: 'id' });

      // Safely parse game time
      const parsedMs = Date.parse(watchPartyData.selectedMatch.gameTime);
      const gameTimeIso = Number.isNaN(parsedMs)
        ? new Date().toISOString()
        : new Date(parsedMs).toISOString();

      const newWatchPartyData = {
        name: watchPartyData.name.trim(),
        description: watchPartyData.description.trim() || 'Come watch the Eagles vs Chiefs with us!',
        host_id,
        game_title: watchPartyData.selectedMatch.title,
        game_time: gameTimeIso,
      };

      const { data: inserted, error } = await supabase
        .from('watch_parties')
        .insert(newWatchPartyData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating watch party:', error);
        Alert.alert('Error', error.message || 'Could not create the watch party. Please try again.');
        return;
      }

      // Load the newly created row with joined host fields for UI
      let createdParty = null;
      if (inserted?.id) {
        const { data: fullParty } = await supabase
          .from('watch_parties')
          .select('*, host:profiles ( username, avatar_url )')
          .eq('id', inserted.id)
          .single();
        createdParty = fullParty || inserted;
      }

      Alert.alert(
        'Watch Party Created! 🎉',
        `Your watch party "${watchPartyData.name}" has been created successfully!`,
        [
          {
            text: 'View Party',
            onPress: () => {
              onWatchPartyCreated && onWatchPartyCreated(createdParty || newWatchPartyData);
              onBack();
            }
          }
        ]
      );
    } catch (e) {
      console.error('Unexpected error creating watch party:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2].map((stepNum) => (
        <View key={stepNum} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            {
              backgroundColor: step >= stepNum ? theme.primary : theme.border,
            }
          ]}>
            <Text style={[
              styles.stepNumber,
              { color: step >= stepNum ? '#ffffff' : theme.textSecondary }
            ]}>
              {stepNum}
            </Text>
          </View>
          {stepNum < 2 && (
            <View style={[
              styles.stepLine,
              { backgroundColor: step > stepNum ? theme.primary : theme.border }
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Basic Information
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Set up the details for your watch party
      </Text>

      {/* Game Info Display */}
      <View style={styles.gameInfoSection}>
        <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>
          Selected Game
        </Text>
        <View style={[styles.gameInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.teamsDisplay}>
            <View style={styles.teamInfo}>
              <Image 
                source={watchPartyData.selectedMatch.teams.away.logoUrl}
                style={styles.teamLogo}
                resizeMode="contain"
              />
              <View style={[styles.teamAccent, { backgroundColor: watchPartyData.selectedMatch.teams.away.color }]} />
              <Text style={[styles.teamName, { color: theme.textPrimary }]}>
                {watchPartyData.selectedMatch.teams.away.name}
              </Text>
              <Text style={[styles.teamRecord, { color: theme.textSecondary }]}>
                (13-4)
              </Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={[styles.vsText, { color: theme.textSecondary }]}>VS</Text>
              <View style={[styles.gameTimeContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Text style={[styles.gameTime, { color: theme.textPrimary }]}>
                  4:25 PM EST
                </Text>
                <Text style={[styles.gameDate, { color: theme.textSecondary }]}>
                  September 27
                </Text>
              </View>
            </View>
            <View style={styles.teamInfo}>
              <Image 
                source={watchPartyData.selectedMatch.teams.home.logoUrl}
                style={styles.teamLogo}
                resizeMode="contain"
              />
              <View style={[styles.teamAccent, { backgroundColor: watchPartyData.selectedMatch.teams.home.color }]} />
              <Text style={[styles.teamName, { color: theme.textPrimary }]}>
                {watchPartyData.selectedMatch.teams.home.name}
              </Text>
              <Text style={[styles.teamRecord, { color: theme.textSecondary }]}>
                (14-3)
              </Text>
            </View>
          </View>
          <View style={[styles.gameStatusContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={[styles.liveIndicator, { backgroundColor: theme.success }]} />
            <Text style={[styles.gameStatusText, { color: theme.textPrimary }]}>
              Live Game Available
            </Text>
          </View>
        </View>
      </View>

      {/* Watch Party Name */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>
          Watch Party Name *
        </Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: theme.surface, 
            borderColor: theme.border,
            color: theme.textPrimary 
          }]}
          placeholder="Enter your watch party name..."
          placeholderTextColor={theme.textTertiary}
          value={watchPartyData.name}
          onChangeText={(text) => setWatchPartyData(prev => ({ ...prev, name: text }))}
          maxLength={50}
        />
        <Text style={[styles.charCount, { color: theme.textTertiary }]}>
          {watchPartyData.name.length}/50
        </Text>
      </View>

      {/* Description */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>
          Description
        </Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: theme.surface, 
            borderColor: theme.border,
            color: theme.textPrimary 
          }]}
          placeholder="Tell people what to expect at your watch party..."
          placeholderTextColor={theme.textTertiary}
          value={watchPartyData.description}
          onChangeText={(text) => setWatchPartyData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
          maxLength={200}
        />
        <Text style={[styles.charCount, { color: theme.textTertiary }]}>
          {watchPartyData.description.length}/200
        </Text>
      </View>

      {/* Info Note */}
      <View style={[styles.infoNote, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={[styles.infoIconContainer, { backgroundColor: theme.primary }]}>
          <Text style={[styles.infoIcon, { color: theme.primaryText || '#ffffff' }]}>i</Text>
        </View>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          This watch party is for the Eagles vs Chiefs game. Users will join virtually and their locations will be shown on the map!
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        Confirmation
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Review your watch party details
      </Text>

      {/* Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.primary }]}>
            <Text style={[styles.summaryIconText, { color: theme.primaryText || '#ffffff' }]}>✓</Text>
          </View>
          <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
            Watch Party Summary
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Name:</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {watchPartyData.name || 'Not set'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Description:</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {watchPartyData.description || 'Come watch the Eagles vs Chiefs with us!'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Game:</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {watchPartyData.selectedMatch?.title || 'Not selected'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Time:</Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {watchPartyData.selectedMatch?.gameTime || 'Not set'}
          </Text>
        </View>
      </View>

      {/* Features Info */}
      <View style={[styles.featuresContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.featuresTitle, { color: theme.textPrimary }]}>
          What to Expect
        </Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📍</Text>
          <Text style={[styles.featureText, { color: theme.textSecondary }]}>
            Users' locations will appear as pins on the map
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🏈</Text>
          <Text style={[styles.featureText, { color: theme.textSecondary }]}>
            Users can choose their team (Eagles or Chiefs) before joining
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={[styles.featureText, { color: theme.textSecondary }]}>
            No maximum attendees - anyone can join your watch party!
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🌍</Text>
          <Text style={[styles.featureText, { color: theme.textSecondary }]}>
            Virtual watch party - no physical location needed
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Create Watch Party
        </Text>
        <View style={styles.headerRight} />
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </View>

      {/* Footer Navigation */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <View style={styles.footerButtons}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.footerButton, styles.backFooterButton, { borderColor: theme.border }]}
              onPress={prevStep}
              disabled={creating}
            >
              <Text style={[styles.backFooterButtonText, { color: theme.textPrimary }]}>
                Back
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.nextFooterButton,
              { backgroundColor: theme.primary, opacity: creating ? 0.7 : 1 },
              step === 1 && { flex: 1 }
            ]}
            onPress={step === 2 ? createWatchParty : nextStep}
            disabled={creating}
          >
            <Text style={[styles.nextFooterButtonText, { color: theme.primaryText || '#ffffff' }]}>
              {step === 2 ? (creating ? 'Creating…' : '🎉 Create Watch Party') : 'Next Step'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 80,
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  
  // Game Info Section
  gameInfoSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  gameInfoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  teamsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  teamAccent: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamRecord: {
    fontSize: 12,
    fontWeight: '500',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  gameTimeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  gameTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  gameDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  gameStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  gameStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Input Section
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  
  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  
  // Summary
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  
  // Features
  featuresContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  
  // Footer
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFooterButton: {
    borderWidth: 2,
  },
  nextFooterButton: {
    // backgroundColor handled dynamically
  },
  backFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextFooterButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateWatchPartyScreen;