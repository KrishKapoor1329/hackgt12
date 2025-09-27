import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// Safely import speech recognition with fallback
let SpeechRecognition = null;
try {
  SpeechRecognition = require('expo-speech-recognition');
} catch (error) {
  console.warn('Speech recognition not available:', error);
}

const { width, height } = Dimensions.get('window');

const WatchPartyDetailScreen = ({ watchParty, theme, onBack }) => {
  const [reactions, setReactions] = useState([
    { id: 1, user: 'Mike', reaction: 'TOUCHDOWN!', text: 'What a throw by Mahomes!', timestamp: Date.now() - 5000, intensity: 'high' },
    { id: 2, user: 'Sarah', reaction: 'DEFENSE!', text: 'Great defensive play!', timestamp: Date.now() - 3000, intensity: 'medium' },
    { id: 3, user: 'Alex', reaction: 'INTERCEPTION!', text: 'Did you see that pick?!', timestamp: Date.now() - 1000, intensity: 'high' },
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [selectedBet, setSelectedBet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [isGameDataExpanded, setIsGameDataExpanded] = useState(false);
  const [attendeesPositions, setAttendeesPositions] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState('message'); // 'message' or 'bet'
  const [voiceInput, setVoiceInput] = useState('');
  const [showVoiceConfirmation, setShowVoiceConfirmation] = useState(false);
  const [parsedBetCommand, setParsedBetCommand] = useState(null);
  const [recognitionError, setRecognitionError] = useState(null);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [animationsInitialized, setAnimationsInitialized] = useState(false);
  
  // Animation values for reactions
  const animatedValues = useRef({});
  const positionAnimations = useRef({});
  const recording = useRef(null);

  const attendees = [
    { id: 1, name: 'Mike Johnson', avatar: 'MJ' },
    { id: 2, name: 'Sarah Davis', avatar: 'SD' },
    { id: 3, name: 'Alex Chen', avatar: 'AC' },
    { id: 4, name: 'Emily Rodriguez', avatar: 'ER' },
    { id: 5, name: 'David Kim', avatar: 'DK' },
  ];

  const mockBettingOptions = [
    { id: 1, option: 'Mahomes Next TD', odds: '+150', payout: '$150 on $100' },
    { id: 2, option: 'Chiefs Win', odds: '-110', payout: '$91 on $100' },
    { id: 3, option: 'Bills Field Goal', odds: '+200', payout: '$200 on $100' },
    { id: 4, option: 'Kelce 100+ Yds', odds: '+180', payout: '$180 on $100' },
    { id: 5, option: 'Over 24.5 Pts', odds: '-105', payout: '$95 on $100' },
  ];

  const mockGameData = {
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    score: { home: 21, away: 17 },
    quarter: '3rd Quarter',
    timeRemaining: '8:45',
    players: {
      chiefs: [
        { name: 'Patrick Mahomes', pos: 'QB', stats: { Yds: 245, TD: 2, INT: 0 }, trend: 'up' },
        { name: 'Travis Kelce', pos: 'TE', stats: { Rec: 6, Yds: 89, TD: 1 }, trend: 'up' },
        { name: 'Tyreek Hill', pos: 'WR', stats: { Rec: 4, Yds: 78, TD: 0 }, trend: 'stable' },
      ],
      bills: [
        { name: 'Josh Allen', pos: 'QB', stats: { Yds: 198, TD: 1, INT: 1 }, trend: 'down' },
        { name: 'Stefon Diggs', pos: 'WR', stats: { Rec: 5, Yds: 67, TD: 1 }, trend: 'up' },
        { name: 'Dawson Knox', pos: 'TE', stats: { Rec: 3, Yds: 34, TD: 0 }, trend: 'stable' },
      ]
    }
  };

  useEffect(() => {
    // Check speech recognition support
    checkSpeechRecognitionSupport();
    
    // Initialize attendee positions
    const initialPositions = {};
    attendees.forEach((attendee, index) => {
      initialPositions[attendee.id] = {
        x: Math.random() * (width - 150) + 20,
        y: Math.random() * 120 + 20,
      };
      
      // Initialize animation values with proper cleanup
      if (animatedValues.current[attendee.id]) {
        animatedValues.current[attendee.id].stopAnimation();
      }
      if (positionAnimations.current[attendee.id]) {
        positionAnimations.current[attendee.id].translateX?.stopAnimation();
        positionAnimations.current[attendee.id].translateY?.stopAnimation();
      }
      
      animatedValues.current[attendee.id] = new Animated.Value(1);
      positionAnimations.current[attendee.id] = {
        translateX: new Animated.Value(initialPositions[attendee.id].x),
        translateY: new Animated.Value(initialPositions[attendee.id].y),
      };
    });
    setAttendeesPositions(initialPositions);
    setAnimationsInitialized(true);
    
    // Start roaming animation
    startRoamingAnimation();
    
    // Add new reactions periodically
    const reactionInterval = setInterval(() => {
      addRandomReaction();
    }, 8000);

    return () => {
      clearInterval(reactionInterval);
      // Cleanup animations
      attendees.forEach(attendee => {
        if (animatedValues.current[attendee.id]) {
          animatedValues.current[attendee.id].stopAnimation();
        }
        if (positionAnimations.current[attendee.id]) {
          positionAnimations.current[attendee.id].translateX?.stopAnimation();
          positionAnimations.current[attendee.id].translateY?.stopAnimation();
        }
      });
    };
  }, []);

  useEffect(() => {
    // Animate reactions based on intensity with safety checks
    reactions.forEach(reaction => {
      const attendee = attendees.find(a => a.name === reaction.user);
      const animatedValue = animatedValues.current[attendee?.id];
      
      if (attendee && animatedValue && animatedValue._value !== undefined) {
        const intensity = reaction.intensity;
        const scale = intensity === 'high' ? 1.5 : intensity === 'medium' ? 1.2 : 1.1;
        
        // Stop any existing animation first
        animatedValue.stopAnimation();
        
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: scale,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [reactions]);

  const startRoamingAnimation = () => {
    const animateAttendee = (attendeeId) => {
      const newX = Math.random() * (width - 150) + 20;
      const newY = Math.random() * 120 + 20;
      
      // Safety checks to prevent stopTracking errors
      const animations = positionAnimations.current[attendeeId];
      if (animations && animations.translateX && animations.translateY) {
        Animated.parallel([
          Animated.timing(animations.translateX, {
            toValue: newX,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animations.translateY, {
            toValue: newY,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]).start((finished) => {
          // Only continue if animation completed successfully
          if (finished && animations.translateX && animations.translateY) {
            setTimeout(() => animateAttendee(attendeeId), 1000 + Math.random() * 2000);
          }
        });
      }
    };

    attendees.forEach(attendee => {
      setTimeout(() => animateAttendee(attendee.id), Math.random() * 2000);
    });
  };

  const addRandomReaction = () => {
    const reactionTypes = [
      { reaction: 'TOUCHDOWN!', text: 'Amazing play!', intensity: 'high' },
      { reaction: 'FIRST DOWN!', text: 'Great drive!', intensity: 'medium' },
      { reaction: 'DEFENSE!', text: 'Solid defense!', intensity: 'medium' },
      { reaction: 'PENALTY!', text: 'Come on refs!', intensity: 'low' },
      { reaction: 'TIMEOUT!', text: 'Good timeout call', intensity: 'low' },
    ];
    
    const randomReaction = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
    const randomAttendee = attendees[Math.floor(Math.random() * attendees.length)];
    
    const newReaction = {
      id: Date.now(),
      user: randomAttendee.name,
      reaction: randomReaction.reaction,
      text: randomReaction.text,
      timestamp: Date.now(),
      intensity: randomReaction.intensity
    };
    
    setReactions(prevReactions => [newReaction, ...prevReactions.slice(0, 9)]);
  };

  const handleSendComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        user: 'You',
        reaction: 'COMMENT',
        text: newComment,
        timestamp: Date.now(),
        intensity: 'medium'
      };
      setReactions([comment, ...reactions.slice(0, 9)]);
      setNewComment('');
    }
  };

  const handlePlaceBet = () => {
    if (selectedBet && betAmount) {
      Alert.alert(
        'Bet Placed!',
        `$${betAmount} on ${selectedBet.option}\nPotential payout: ${selectedBet.payout}`,
        [{ text: 'OK', onPress: () => { setSelectedBet(null); setBetAmount(''); } }]
      );
    } else {
      Alert.alert('Invalid Bet', 'Please select a bet and enter an amount');
    }
  };

  const checkSpeechRecognitionSupport = async () => {
    try {
      if (!SpeechRecognition) {
        console.warn('Speech recognition module not available');
        setIsRecognitionSupported(false);
        return;
      }
      
      const isSupported = await SpeechRecognition.getAvailableVoiceRecognitionServicesAsync();
      setIsRecognitionSupported(isSupported.length > 0);
      
      if (isSupported.length === 0) {
        console.warn('Speech recognition not supported on this device');
      }
    } catch (error) {
      console.error('Error checking speech recognition support:', error);
      setIsRecognitionSupported(false);
    }
  };

  const startListening = async (mode) => {
    try {
      setVoiceMode(mode);
      setIsListening(true);
      setVoiceInput('');
      setRecognitionError(null);
      
      // Check if speech recognition is available
      if (!SpeechRecognition || !isRecognitionSupported) {
        Alert.alert(
          'Speech Recognition Unavailable', 
          'Speech recognition is not supported on this device. Please type your message instead.'
        );
        setIsListening(false);
        return;
      }

      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable microphone access for voice commands');
        setIsListening(false);
        return;
      }

      // Request speech recognition permissions
      const speechStatus = await SpeechRecognition.requestPermissionsAsync();
      if (speechStatus.status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable speech recognition permissions');
        setIsListening(false);
        return;
      }

      // Start speech recognition
      const recognitionOptions = {
        language: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
      };

      const result = await SpeechRecognition.start(recognitionOptions);
      
      result.addEventListener('result', (event) => {
        const transcript = event.results[0]?.transcript || '';
        if (transcript) {
          handleVoiceResult(transcript, mode);
        }
      });

      result.addEventListener('error', (event) => {
        console.error('Speech recognition error:', event.error);
        setRecognitionError(event.error);
        setIsListening(false);
        Alert.alert('Recognition Error', 'Could not understand speech. Please try again.');
      });

      result.addEventListener('end', () => {
        setIsListening(false);
      });

      // Stop listening after 10 seconds
      setTimeout(() => {
        if (isListening) {
          SpeechRecognition.stop();
          setIsListening(false);
        }
      }, 10000);

    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
    }
  };

  const handleVoiceResult = (transcript, mode) => {
    setVoiceInput(transcript);
    
    if (mode === 'bet') {
      const parsed = parseBetCommand(transcript);
      setParsedBetCommand(parsed);
    }
    
    setShowVoiceConfirmation(true);
    setIsListening(false);
  };

  const stopListening = () => {
    try {
      if (SpeechRecognition) {
        SpeechRecognition.stop();
      }
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsListening(false);
    }
  };

  const parseBetCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    let amount = '0';
    let betOption = null;
    
    // Extract amount with better patterns
    const amountPatterns = [
      /(\d+)\s*dollars?/i,
      /\$(\d+)/i,
      /(\d+)\s*bucks?/i,
      /(\d+)/
    ];
    
    for (const pattern of amountPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        amount = match[1];
        break;
      }
    }
    
    // Enhanced bet option matching
    const betKeywords = {
      'mahomes': ['mahomes', 'patrick'],
      'touchdown': ['touchdown', 'td', 'score'],
      'chiefs': ['chiefs', 'kansas city', 'kc'],
      'bills': ['bills', 'buffalo'],
      'field goal': ['field goal', 'fg', 'kick'],
      'kelce': ['kelce', 'travis'],
      'yards': ['yards', 'yds', 'passing', 'receiving'],
      'win': ['win', 'victory', 'beat']
    };
    
    // Find best matching bet option
    let bestMatch = null;
    let maxScore = 0;
    
    mockBettingOptions.forEach(bet => {
      let score = 0;
      const betText = bet.option.toLowerCase();
      
      // Direct text matching
      Object.entries(betKeywords).forEach(([key, synonyms]) => {
        synonyms.forEach(synonym => {
          if (lowerCommand.includes(synonym)) {
            if (betText.includes(key) || synonyms.some(s => betText.includes(s))) {
              score += 2;
            }
          }
        });
      });
      
      // Boost score for exact matches
      if (lowerCommand.includes(betText.split(' ')[0])) {
        score += 3;
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = bet;
      }
    });
    
    return {
      amount,
      bet: bestMatch || mockBettingOptions[0],
      originalCommand: command,
      confidence: maxScore > 0 ? 'high' : 'low'
    };
  };

  const confirmVoiceAction = () => {
    if (voiceMode === 'message') {
      const comment = {
        id: Date.now(),
        user: 'You',
        reaction: 'VOICE',
        text: voiceInput,
        timestamp: Date.now(),
        intensity: 'medium'
      };
      setReactions(prev => [comment, ...prev.slice(0, 9)]);
      
      // Text-to-speech announcement
      Speech.speak(`Message sent: ${voiceInput}`, { rate: 1.2 });
    } else if (voiceMode === 'bet' && parsedBetCommand) {
      setSelectedBet(parsedBetCommand.bet);
      setBetAmount(parsedBetCommand.amount);
      
      // Text-to-speech announcement
      Speech.speak(`Bet prepared: $${parsedBetCommand.amount} on ${parsedBetCommand.bet.option}`, { rate: 1.2 });
    }
    
    setShowVoiceConfirmation(false);
    setVoiceInput('');
    setParsedBetCommand(null);
  };

  const cancelVoiceAction = () => {
    setShowVoiceConfirmation(false);
    setVoiceInput('');
    setParsedBetCommand(null);
  };

  const speakMessage = (message) => {
    Speech.speak(message, { rate: 1.1, pitch: 1.0 });
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#4ade80';
      case 'down': return '#ef4444';
      default: return '#fbbf24';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBarStyle} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{watchParty.title}</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.memberCount, { color: theme.textSecondary }]}>
            {attendees.length} members
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Voice Controls */}
        <View style={[styles.voiceControls, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {isRecognitionSupported ? 'Voice Commands' : 'Quick Actions'}
          </Text>
          {!isRecognitionSupported && (
            <Text style={[styles.errorText, { color: '#fbbf24' }]}>
              💬 Speech recognition not available - using text input mode
            </Text>
          )}
          <View style={styles.voiceButtonsRow}>
            {!isListening ? (
              <>
                <TouchableOpacity 
                  style={[
                    styles.voiceButton, 
                    { 
                      backgroundColor: isRecognitionSupported ? theme.primary : '#94a3b8',
                      opacity: isRecognitionSupported ? 1 : 0.6 
                    }
                  ]}
                  onPress={() => startListening('message')}
                  disabled={!isRecognitionSupported}
                >
                  <Text style={styles.voiceButtonText}>💬 Voice Message</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.voiceButton, 
                    { 
                      backgroundColor: isRecognitionSupported ? '#ff6b6b' : '#94a3b8',
                      opacity: isRecognitionSupported ? 1 : 0.6 
                    }
                  ]}
                  onPress={() => startListening('bet')}
                  disabled={!isRecognitionSupported}
                >
                  <Text style={styles.voiceButtonText}>💰 Voice Bet</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.listeningContainer}>
                <View style={[styles.listeningIndicator, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.listeningText}>
                    🎤 Listening for {voiceMode === 'message' ? 'message' : 'bet'}...
                  </Text>
                  <Text style={[styles.listeningSubtext, { color: theme.textSecondary }]}>
                    Speak now or tap to stop
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.stopButton, { backgroundColor: '#ef4444' }]}
                  onPress={stopListening}
                >
                  <Text style={styles.stopButtonText}>⏹️ Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Reactions Area with Bubble Comments */}
        <View style={[styles.reactionsArea, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Live Watch Party</Text>
          
          {/* Roaming Attendees */}
          <View style={styles.roamingContainer}>
            {animationsInitialized && attendees.map((attendee) => {
              const position = attendeesPositions[attendee.id] || { x: 50, y: 50 };
              const reaction = reactions.find(r => r.user === attendee.name);
              const intensity = reaction?.intensity || 'low';
              
              // Only render if animated values are properly initialized
              const translateX = positionAnimations.current[attendee.id]?.translateX;
              const translateY = positionAnimations.current[attendee.id]?.translateY;
              const scaleValue = animatedValues.current[attendee.id];
              
              if (!translateX || !translateY || !scaleValue) {
                return null; // Skip rendering until animations are ready
              }
              
              return (
                <Animated.View
                  key={attendee.id}
                  style={[
                    styles.roamingAttendee,
                    {
                      transform: [
                        { translateX },
                        { translateY },
                        { scale: scaleValue }
                      ],
                      backgroundColor: intensity === 'high' ? '#ff6b6b' : 
                                     intensity === 'medium' ? '#ffd93d' : theme.primary,
                    }
                  ]}
                >
                  <Text style={styles.attendeeInitial}>
                    {attendee.name.charAt(0)}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
          
          {/* Recent Comments with Speech Bubbles */}
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsTitle, { color: theme.textColor }]}>Recent Comments</Text>
            <ScrollView style={styles.commentsScroll} showsVerticalScrollIndicator={false}>
              {reactions.slice(0, 3).map((reaction, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.commentBubble, { backgroundColor: theme.surface }]}
                  onPress={() => speakMessage(reaction.text)}
                >
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUser, { color: theme.primary }]}>
                      {reaction.user}
                    </Text>
                    <Text style={[styles.speakIcon, { color: theme.secondaryText }]}>🔊</Text>
                  </View>
                  <Text style={[styles.commentText, { color: theme.textColor }]}>
                    {reaction.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Comment Input */}
          <View style={styles.commentInput}>
            <TextInput
              style={[styles.commentTextInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Add your reaction..."
              placeholderTextColor={theme.textTertiary}
              value={newComment}
              onChangeText={setNewComment}
              onSubmitEditing={handleSendComment}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={handleSendComment}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LIVE BETTING SECTION - ENHANCED AND PROMINENT */}
        <View style={[styles.bettingSection, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
          <View style={styles.bettingHeader}>
            <Text style={[styles.bettingSectionTitle, { color: theme.primary }]}>🚀 LIVE BETTING</Text>
            <Text style={[styles.bettingSubtitle, { color: theme.textColor }]}>Place your bets in real-time</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bettingOptions}>
            {mockBettingOptions.map((bet, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.enhancedBetOption,
                  {
                    backgroundColor: selectedBet?.id === bet.id ? theme.primary : theme.surface,
                    borderColor: selectedBet?.id === bet.id ? '#fff' : theme.primary,
                    shadowColor: selectedBet?.id === bet.id ? theme.primary : 'transparent',
                  }
                ]}
                onPress={() => setSelectedBet(bet)}
              >
                <Text style={[
                  styles.enhancedBetOptionText,
                  { color: selectedBet?.id === bet.id ? '#fff' : theme.textColor }
                ]}>
                  {bet.option}
                </Text>
                <Text style={[
                  styles.enhancedBetOdds,
                  { color: selectedBet?.id === bet.id ? '#fff' : theme.primary }
                ]}>
                  {bet.odds}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {selectedBet && (
            <View style={[styles.enhancedBetDetails, { backgroundColor: theme.surface }]}>
              <Text style={[styles.selectedBetTitle, { color: theme.primary }]}>
                🎯 SELECTED BET
              </Text>
              <Text style={[styles.selectedBetText, { color: theme.textColor }]}>
                {selectedBet.option}
              </Text>
              <View style={styles.betInputRow}>
                <TextInput
                  style={[styles.enhancedBetInput, { backgroundColor: theme.cardBackground, color: theme.textColor, borderColor: theme.primary }]}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  placeholder="Enter bet amount ($)"
                  placeholderTextColor={theme.secondaryText}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.enhancedPlaceBetButton, { backgroundColor: theme.primary }]}
                  onPress={handlePlaceBet}
                >
                  <Text style={styles.enhancedPlaceBetText}>🚀 PLACE BET</Text>
                </TouchableOpacity>
              </View>
              {betAmount && (
                <View style={styles.payoutDisplay}>
                  <Text style={[styles.potentialPayoutLabel, { color: theme.secondaryText }]}>Potential Payout:</Text>
                  <Text style={[styles.potentialPayoutAmount, { color: '#4ade80' }]}>
                    {selectedBet.payout}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Collapsible Game Data */}
        <TouchableOpacity
          style={[styles.gameDataHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setIsGameDataExpanded(!isGameDataExpanded)}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Game Data & Stats</Text>
          <Text style={[styles.expandIcon, { color: theme.textSecondary }]}>
            {isGameDataExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isGameDataExpanded && (
          <View style={[styles.gameDataContent, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            {/* Score & Game Info */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreBoard}>
                <Text style={[styles.teamName, { color: theme.textPrimary }]}>{mockGameData.homeTeam}</Text>
                <Text style={[styles.score, { color: theme.primary }]}>{mockGameData.score.home}</Text>
              </View>
              <View style={styles.gameInfo}>
                <Text style={[styles.quarter, { color: theme.textSecondary }]}>{mockGameData.quarter}</Text>
                <Text style={[styles.timeRemaining, { color: theme.textSecondary }]}>{mockGameData.timeRemaining}</Text>
              </View>
              <View style={styles.scoreBoard}>
                <Text style={[styles.teamName, { color: theme.textPrimary }]}>{mockGameData.awayTeam}</Text>
                <Text style={[styles.score, { color: theme.primary }]}>{mockGameData.score.away}</Text>
              </View>
            </View>

            {/* Player Stats */}
            <View style={styles.playerStats}>
              <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>Key Players</Text>
              
              <Text style={[styles.teamHeader, { color: theme.primary }]}>Kansas City Chiefs</Text>
              {mockGameData.players.chiefs.map((player, index) => (
                <View key={index} style={styles.playerRow}>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: theme.textPrimary }]}>{player.name}</Text>
                    <Text style={[styles.playerPos, { color: theme.textSecondary }]}>{player.pos}</Text>
                  </View>
                  <View style={styles.playerStatsContainer}>
                    {Object.entries(player.stats).map(([key, value]) => (
                      <Text key={key} style={[styles.statText, { color: theme.textSecondary }]}>
                        {key}: {value}
                      </Text>
                    ))}
                  </View>
                  <Text style={[styles.trendIcon, { color: getTrendColor(player.trend) }]}>
                    {getTrendIcon(player.trend)}
                  </Text>
                </View>
              ))}

              <Text style={[styles.teamHeader, { color: theme.primary }]}>Buffalo Bills</Text>
              {mockGameData.players.bills.map((player, index) => (
                <View key={index} style={styles.playerRow}>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: theme.textPrimary }]}>{player.name}</Text>
                    <Text style={[styles.playerPos, { color: theme.textSecondary }]}>{player.pos}</Text>
                  </View>
                  <View style={styles.playerStatsContainer}>
                    {Object.entries(player.stats).map(([key, value]) => (
                      <Text key={key} style={[styles.statText, { color: theme.textSecondary }]}>
                        {key}: {value}
                      </Text>
                    ))}
                  </View>
                  <Text style={[styles.trendIcon, { color: getTrendColor(player.trend) }]}>
                    {getTrendIcon(player.trend)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Voice Confirmation Modal */}
      {showVoiceConfirmation && (
        <View style={styles.voiceModal}>
          <View style={[styles.voiceModalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.voiceModalTitle, { color: theme.textColor }]}>
              {voiceMode === 'message' ? '💬 Confirm Message' : '💰 Confirm Bet'}
            </Text>
            <Text style={[styles.voiceInputDisplay, { color: theme.primary }]}>
              "{voiceInput}"
            </Text>
            {parsedBetCommand && (
              <View style={styles.betPreview}>
                <View style={styles.confidenceIndicator}>
                  <Text style={[styles.confidenceText, { 
                    color: parsedBetCommand.confidence === 'high' ? '#4ade80' : '#fbbf24' 
                  }]}>
                    {parsedBetCommand.confidence === 'high' ? '✅ High Confidence' : '⚠️ Please Verify'}
                  </Text>
                </View>
                <Text style={[styles.betPreviewLabel, { color: theme.textSecondary }]}>
                  Parsed Command:
                </Text>
                <Text style={[styles.betPreviewText, { color: theme.textColor }]}>
                  Amount: ${parsedBetCommand.amount}
                </Text>
                <Text style={[styles.betPreviewText, { color: theme.textColor }]}>
                  Bet: {parsedBetCommand.bet.option}
                </Text>
                <Text style={[styles.betPreviewText, { color: theme.textColor }]}>
                  Odds: {parsedBetCommand.bet.odds}
                </Text>
              </View>
            )}
            <View style={styles.voiceModalButtons}>
              <TouchableOpacity 
                style={[styles.voiceModalButton, { backgroundColor: '#ef4444' }]}
                onPress={cancelVoiceAction}
              >
                <Text style={styles.voiceModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.voiceModalButton, { backgroundColor: theme.primary }]}
                onPress={confirmVoiceAction}
              >
                <Text style={styles.voiceModalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Voice Controls
  voiceControls: {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  voiceButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  voiceButton: {
    flex: 0.48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  voiceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  voiceModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  voiceModalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  voiceInputDisplay: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  betPreview: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  betPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 2,
  },
  betPreviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  confidenceIndicator: {
    marginBottom: 12,
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  voiceModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  voiceModalButton: {
    flex: 0.45,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  voiceModalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  listeningContainer: {
    width: '100%',
    alignItems: 'center',
  },
  listeningIndicator: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  listeningText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listeningSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  stopButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Reactions Area
  reactionsArea: {
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    height: 320,
  },
  roamingContainer: {
    height: 160,
    position: 'relative',
    marginBottom: 16,
  },
  roamingAttendee: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  attendeeInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  speechBubble: {
    position: 'absolute',
    left: 45,
    top: -15,
    maxWidth: 160,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  bubbleTail: {
    position: 'absolute',
    left: -8,
    top: 12,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: '#fff',
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: 'transparent',
  },
  speakHint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  commentsSection: {
    marginTop: 16,
    flex: 1,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentsScroll: {
    maxHeight: 80,
  },
  commentBubble: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '600',
  },
  speakIcon: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 12,
    lineHeight: 16,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Betting Section - Enhanced and Larger
  bettingSection: {
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    minHeight: 220,
  },
  bettingHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  bettingSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  bettingSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  bettingOptions: {
    marginBottom: 16,
  },
  enhancedBetOption: {
    marginRight: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 140,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  enhancedBetOptionText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  enhancedBetOdds: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  enhancedBetDetails: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  selectedBetTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedBetText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  betInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedBetInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  enhancedPlaceBetButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  enhancedPlaceBetText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  payoutDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  potentialPayoutLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  potentialPayoutAmount: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Game Data Section
  gameDataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameDataContent: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 20,
  },
  
  // Score Section
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  scoreBoard: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
  },
  gameInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  quarter: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Player Stats
  playerStats: {
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  teamHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerPos: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  playerStatsContainer: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'space-around',
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default WatchPartyDetailScreen;