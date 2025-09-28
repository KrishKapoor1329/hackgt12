import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BetGenerator from './BetGenerator';

const GameDetailScreen = ({ onBack, theme, isDarkMode }) => {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBets, setSelectedBets] = useState({});
  const [betAmounts, setBetAmounts] = useState({});
  const [showBetAmountModal, setShowBetAmountModal] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isGeneratingBets, setIsGeneratingBets] = useState(false);

  const generateAdvancedBets = () => {
    const advancedBets = [
      { id: 1, question: "Will Jalen Hurts throw for 10+ yards?", options: ["Yes", "No"] },
      { id: 2, question: "Will the Eagles convert 3rd down?", options: ["Yes", "No"] },
      { id: 3, question: "Will there be a sack on this play?", options: ["Yes", "No"] },
      { id: 4, question: "Will A.J. Brown catch the next pass?", options: ["Yes", "No"] },
      { id: 5, question: "Will the play result in a turnover?", options: ["Yes", "No"] },
      { id: 6, question: "Will Eagles score a touchdown this drive?", options: ["Yes", "No"] },
      { id: 7, question: "Will the next play be a screen pass?", options: ["Yes", "No"] },
      { id: 8, question: "Will Hurts scramble for 5+ yards?", options: ["Yes", "No"] },
      { id: 9, question: "Will the Chiefs call a timeout?", options: ["Yes", "No"] },
      { id: 10, question: "Will the play clock go under 5 seconds?", options: ["Yes", "No"] }
    ];
    
    // Randomly select 3 different advanced bets
    const shuffled = advancedBets.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const fetchGameData = async () => {
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

    // Generate AI-powered bets
    setIsGeneratingBets(true);
    try {
      const aiBets = await BetGenerator.generateLiveBets(baseGameData);
      setGameData({
        ...baseGameData,
        liveBets: aiBets
      });
    } catch (error) {
      console.log('Using fallback bets');
      setGameData({
        ...baseGameData,
        liveBets: BetGenerator.getFallbackBets()
      });
    }
    
    setIsGeneratingBets(false);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchGameData();
    const interval = setInterval(fetchGameData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGameData();
  };

  const betAmountOptions = [5, 10, 25, 50, 100];

  const selectBetOption = (betId, option) => {
    // If already selected, unselect it
    if (selectedBets[betId] === option) {
      const newSelectedBets = { ...selectedBets };
      delete newSelectedBets[betId];
      setSelectedBets(newSelectedBets);
      return;
    }

    // Select new option with smooth animation
    setSelectedBets(prev => ({
      ...prev,
      [betId]: option
    }));

    // Show amount modal with slight delay for better UX
    setTimeout(() => {
      setShowBetAmountModal({ betId, option });
    }, 200);
  };

  const placeBet = (betId, option, amount) => {
    setBetAmounts(prev => ({
      ...prev,
      [betId]: amount
    }));
    setShowBetAmountModal(null);
    setCustomAmount('');
    Alert.alert('Bet Placed! 🎯', `You bet "${option}" for $${amount}\n\nGood luck!`);
  };

  const placeCustomBet = () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount < 1) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount ($1 minimum)');
      return;
    }
    if (amount > 1000) {
      Alert.alert('Amount Too High', 'Maximum bet amount is $1000');
      return;
    }
    placeBet(showBetAmountModal.betId, showBetAmountModal.option, amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.error }]}>Failed to load game data</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchGameData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Live Game</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ESPN-style Game Header */}
        <View style={[styles.espnGameHeader, { backgroundColor: theme.surface }]}>
          <View style={styles.headerTop}>
            <View style={[styles.liveIndicator, { backgroundColor: '#ff4444' }]}>
              <Text style={styles.liveText}>● LIVE</Text>
            </View>
            <Text style={[styles.gameTitle, { color: theme.textPrimary }]}>{gameData.gameTitle}</Text>
          </View>
          
          {/* Scoreboard */}
          <View style={styles.espnScoreboard}>
            <View style={styles.teamRow}>
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, { color: theme.textPrimary }]}>PHI</Text>
                <Text style={[styles.teamRecord, { color: theme.textSecondary }]}>Eagles (11-1)</Text>
              </View>
              <Text style={[styles.teamScore, { color: theme.textPrimary }]}>{gameData.awayScore}</Text>
            </View>
            <View style={styles.teamRow}>
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, { color: theme.textPrimary }]}>KC</Text>
                <Text style={[styles.teamRecord, { color: theme.textSecondary }]}>Chiefs (9-3)</Text>
              </View>
              <Text style={[styles.teamScore, { color: theme.textPrimary }]}>{gameData.homeScore}</Text>
            </View>
          </View>

          {/* Game Situation */}
          <View style={[styles.gameSituation, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.situationInfo}>
              <Text style={[styles.timeInfo, { color: theme.textPrimary }]}>
                Q{gameData.quarter} {gameData.clock}
              </Text>
              <Text style={[styles.downDistance, { color: theme.textSecondary }]}>
                {gameData.down}nd & {gameData.distance} at {gameData.yardLine}
              </Text>
              <Text style={[styles.possessionInfo, { color: theme.primary }]}>
                {gameData.possession} Ball
              </Text>
            </View>
            <View style={styles.probContainer}>
              <Text style={[styles.probLabel, { color: theme.textSecondary }]}>WIN PROB</Text>
              <Text style={[styles.probValue, { color: '#00AA00' }]}>{gameData.winProbability}%</Text>
              <Text style={[styles.probTeam, { color: theme.textSecondary }]}>PHI</Text>
            </View>
          </View>
        </View>

        {/* Last Play */}
        <View style={[styles.lastPlayCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.lastPlayTitle, { color: theme.textSecondary }]}>LAST PLAY</Text>
          <Text style={[styles.lastPlayText, { color: theme.textPrimary }]}>
            {gameData.lastPlay}
          </Text>
        </View>

        {/* Win Probability */}
        <View style={[styles.probCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.probTitle, { color: theme.textPrimary }]}>Win Probability</Text>
          <View style={styles.probContainer}>
            <View style={[styles.probBar, { backgroundColor: theme.backgroundSecondary }]}>
              <View 
                style={[
                  styles.probFill, 
                  { 
                    backgroundColor: theme.success,
                    width: `${gameData.winProbability}%` 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.probText, { color: theme.textPrimary }]}>
              {gameData.awayTeam} {gameData.winProbability}%
            </Text>
          </View>
        </View>

        {/* Live AI-Powered Micro Bets */}
        <View style={[styles.cleanBetsSection, { backgroundColor: theme.surface }]}>
          <View style={styles.cleanBetsHeader}>
            <View style={styles.betsHeaderContent}>
              <Text style={[styles.cleanBetsTitle, { color: theme.textPrimary }]}>
                🤖 AI Live Bets
              </Text>
              {isGeneratingBets && (
                <View style={styles.generatingIndicator}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.generatingText, { color: theme.textSecondary }]}>
                    Generating...
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.cleanBetsSubtitle, { color: theme.textSecondary }]}>
              AI-generated based on game situation
            </Text>
          </View>
          
          {gameData.liveBets?.map((bet, index) => (
            <View key={bet.id} style={[styles.cleanBetCard, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.betCardHeader}>
                <Text style={[styles.betNumber, { color: theme.primary }]}>#{index + 1}</Text>
                <Text style={[styles.cleanBetQuestion, { color: theme.textPrimary }]}>
                  {bet.question}
                </Text>
              </View>
              
              <View style={styles.cleanBetOptions}>
                {bet.options.map((option, optionIndex) => (
                  <TouchableOpacity
                    key={optionIndex}
                    style={[
                      styles.cleanBetOption,
                      { 
                        backgroundColor: selectedBets[bet.id] === option ? theme.primary : 'transparent',
                        borderColor: selectedBets[bet.id] === option ? theme.primary : theme.border,
                        borderWidth: 2
                      }
                    ]}
                    onPress={() => selectBetOption(bet.id, option)}
                  >
                    <Text style={[
                      styles.cleanBetOptionText,
                      { 
                        color: selectedBets[bet.id] === option ? '#ffffff' : theme.textPrimary,
                        fontWeight: selectedBets[bet.id] === option ? '700' : '600'
                      }
                    ]}>
                      {option}
                    </Text>
                    {betAmounts[bet.id] && selectedBets[bet.id] === option && (
                      <View style={styles.betAmountBadge}>
                        <Text style={styles.betAmountBadgeText}>
                          ${betAmounts[bet.id]}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Modern Betting Modal */}
        {showBetAmountModal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalDismiss} 
              onPress={() => {
                setShowBetAmountModal(null);
                setCustomAmount('');
              }}
            />
            <View style={[styles.modernBetModal, { backgroundColor: theme.surface }]}>
              {/* Bet Info */}
              <View style={styles.betInfoSection}>
                <View style={[styles.betTypeIndicator, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.betTypeText, { color: theme.primary }]}>MICRO BET</Text>
                </View>
                <Text style={[styles.betQuestion, { color: theme.textPrimary }]}>
                  {gameData.liveBets.find(b => b.id === showBetAmountModal.betId)?.question}
                </Text>
                <View style={[styles.selectedOption, { backgroundColor: theme.backgroundSecondary }]}>
                  <Text style={[styles.selectedOptionText, { color: theme.textPrimary }]}>
                    Your Pick: {showBetAmountModal.option}
                  </Text>
                </View>
              </View>

              {/* Quick Amounts */}
              <View style={styles.quickAmountsSection}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  QUICK BET
                </Text>
                <View style={styles.modernAmountGrid}>
                  {betAmountOptions.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={[
                        styles.modernAmount,
                        { 
                          backgroundColor: theme.backgroundSecondary,
                          borderColor: theme.border,
                          transform: [{ scale: customAmount === amount.toString() ? 1.05 : 1 }]
                        }
                      ]}
                      onPress={() => placeBet(showBetAmountModal.betId, showBetAmountModal.option, amount)}
                    >
                      <Text style={[styles.modernAmountText, { color: theme.textPrimary }]}>
                        ${amount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Amount */}
              <View style={styles.customAmountSection}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  CUSTOM AMOUNT
                </Text>
                <View style={styles.modernInputContainer}>
                  <Text style={[styles.currencySymbol, { color: theme.textPrimary }]}>$</Text>
                  <TextInput
                    style={[styles.modernInput, { 
                      color: theme.textPrimary,
                      borderBottomColor: theme.border
                    }]}
                    value={customAmount}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9.]/g, '');
                      const parts = numericText.split('.');
                      if (parts.length <= 2) {
                        setCustomAmount(numericText);
                      }
                    }}
                    placeholder="Enter amount"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="decimal-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.cancelAction, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => {
                    setShowBetAmountModal(null);
                    setCustomAmount('');
                  }}
                >
                  <Text style={[styles.actionText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmAction, { 
                    backgroundColor: customAmount ? theme.primary : theme.backgroundSecondary,
                    opacity: customAmount ? 1 : 0.5
                  }]}
                  onPress={placeCustomBet}
                  disabled={!customAmount}
                >
                  <Text style={[styles.actionText, { 
                    color: customAmount ? '#ffffff' : theme.textTertiary 
                  }]}>Place Bet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Player Stats */}
        <View style={[styles.statsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>Key Player Stats</Text>
          
          <View style={styles.playerStat}>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: theme.textPrimary }]}>J. Hurts</Text>
              <Text style={[styles.playerTeam, { color: theme.textSecondary }]}>PHI QB</Text>
            </View>
            <View style={styles.statNumbers}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>342 YDS</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Passing</Text>
            </View>
          </View>

          <View style={styles.playerStat}>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: theme.textPrimary }]}>P. Mahomes</Text>
              <Text style={[styles.playerTeam, { color: theme.textSecondary }]}>KC QB</Text>
            </View>
            <View style={styles.statNumbers}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>195 YDS</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Passing</Text>
            </View>
          </View>

          <View style={styles.playerStat}>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: theme.textPrimary }]}>S. Barkley</Text>
              <Text style={[styles.playerTeam, { color: theme.textSecondary }]}>PHI RB</Text>
            </View>
            <View style={styles.statNumbers}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>118 YDS</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rushing</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // ESPN-style Game Header
  espnGameHeader: {
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  espnScoreboard: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  teamRecord: {
    fontSize: 14,
    fontWeight: '500',
  },
  teamScore: {
    fontSize: 36,
    fontWeight: '800',
  },
  gameSituation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  situationInfo: {
    flex: 1,
  },
  timeInfo: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  downDistance: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  possessionInfo: {
    fontSize: 14,
    fontWeight: '600',
  },
  probContainer: {
    alignItems: 'flex-end',
  },
  probLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  probValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  probTeam: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Last Play Card
  lastPlayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lastPlayTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  lastPlayText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  
  // Clean Modern Betting Styles
  cleanBetsSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cleanBetsHeader: {
    marginBottom: 20,
  },
  betsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cleanBetsTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  generatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generatingText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  cleanBetsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  cleanBetCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  betCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  betNumber: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
    width: 30,
  },
  cleanBetQuestion: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  cleanBetOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  cleanBetOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cleanBetOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  betAmountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#00AA00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  betAmountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Bet Amount Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Modern Modal Styles
  modalDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modernBetModal: {
    borderRadius: 24,
    width: '94%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
    zIndex: 1000,
  },
  betInfoSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  betTypeIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  betTypeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  betQuestion: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 28,
  },
  selectedOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  selectedOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cleanModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  cleanModalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickAmountsSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  modernAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  modernAmount: {
    width: '30%',
    aspectRatio: 2,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernAmountText: {
    fontSize: 20,
    fontWeight: '700',
  },
  customAmountSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingBottom: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  modernInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelAction: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmAction: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Legacy modal styles (keep for compatibility)
  betAmountModal: {
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountOption: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickAmountsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  customAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  customAmountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  customBetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  customBetButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  gameCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  matchup: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  score: {
    fontSize: 32,
    fontWeight: '700',
  },
  vs: {
    fontSize: 24,
    fontWeight: '400',
    marginHorizontal: 20,
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  quarter: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  possession: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastPlay: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  probCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  probTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  probContainer: {
    alignItems: 'center',
  },
  probBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  probFill: {
    height: '100%',
    borderRadius: 4,
  },
  probText: {
    fontSize: 16,
    fontWeight: '600',
  },
  betsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  betsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  betsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  betCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  betQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  betOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  betOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  betOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  playerStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerTeam: {
    fontSize: 13,
    fontWeight: '500',
  },
  statNumbers: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GameDetailScreen;
