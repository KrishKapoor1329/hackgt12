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
import * as SpeechRecognition from 'expo-speech-recognition';

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
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceMode, setVoiceMode] = useState('message'); // 'message' or 'bet'
  const [voiceInput, setVoiceInput] = useState('');
  const [parsedBetCommand, setParsedBetCommand] = useState(null);
  const [animationsInitialized, setAnimationsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);

  
  // Animation values for reactions
  const animatedValues = useRef({});
  const positionAnimations = useRef({});
  const sound = useRef(null);

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
    // Initialize text-to-speech
    Speech.getAvailableVoicesAsync().then(voices => {
      console.log('Available voices:', voices.length);
    }).catch(error => {
      console.log('Text-to-speech not available:', error);
    });

    // Setup audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    }).catch(error => {
      console.log('Audio setup error:', error);
    });

    // Check if speech recognition is available
    const checkSpeechRecognition = async () => {
      try {
        const available = await SpeechRecognition.getAvailableLanguagesAsync();
        setRecognitionAvailable(available.length > 0);
        console.log('Speech recognition available:', available.length > 0);
      } catch (error) {
        console.log('Speech recognition not available:', error);
        setRecognitionAvailable(false);
      }
    };
    
    checkSpeechRecognition();
    
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
      
      // Cleanup recording
      if (recording.current) {
        recording.current.stopAndUnloadAsync().catch(console.error);
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      
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

  // Handle transcript changes
  useEffect(() => {
    if (transcript && isListening) {
      // Auto-stop after getting some text and user stops speaking
      const timer = setTimeout(() => {
        if (transcript.trim()) {
          stopVoiceInput();
        }
      }, 2000); // Wait 2 seconds after last speech

      return () => clearTimeout(timer);
    }
  }, [transcript, isListening, voiceMode]);

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

  const startVoiceInput = async (mode) => {
    try {
      console.log('🎤 Starting live speech recognition...');
      
      if (!recognitionAvailable) {
        Alert.alert('Not Available', 'Speech recognition is not available on this device. Please type your message instead.');
        setVoiceMode(mode);
        setShowVoiceInput(true);
        return;
      }

      // Request speech recognition permissions
      const permissionResponse = await SpeechRecognition.requestPermissionsAsync();
      if (!permissionResponse.granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access to use voice input.',
          [
            { text: 'Cancel' },
            { 
              text: 'Type Instead', 
              onPress: () => {
                setVoiceMode(mode);
                setShowVoiceInput(true);
              }
            }
          ]
        );
        return;
      }

      setVoiceMode(mode);
      setTranscript('');
      setVoiceInput('');
      setParsedBetCommand(null);
      setIsListening(true);

      // Configure speech recognition options
      const options = {
        language: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
        requiresOnDeviceRecognition: false,
      };

      // Start speech recognition
      await SpeechRecognition.start(options);
      
      // Set up result listeners
      const resultListener = SpeechRecognition.addRecognitionResultListener((result) => {
        console.log('🎯 Speech result received:', result);
        if (result.transcription) {
          setTranscript(result.transcription);
          setVoiceInput(result.transcription);
          
          // Parse bet command if in bet mode
          if (mode === 'bet') {
            const parsed = parseBetCommand(result.transcription);
            setParsedBetCommand(parsed);
          }
        }
      });

      const errorListener = SpeechRecognition.addRecognitionErrorListener((error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        Alert.alert('Recognition Error', 'Voice recognition failed. Please try again.');
      });

      // Show speech recognition UI
      setShowVoiceInput(true);

      // Show helpful message
      const message = mode === 'bet' 
        ? '🎤 Listening for Your Voice!\n\n� Say something like: "50 dollars on Chiefs win"\n� Speaking now - your words will appear as you talk\n🛑 Tap "Stop Listening" when done'
        : '🎤 Listening for Your Voice!\n\n� Speak your message clearly\n🔴 Your words will appear as you talk\n🛑 Tap "Stop Listening" when done';
      
      setTimeout(() => {
        Alert.alert('🎙️ Voice Recognition Active', message, [{ text: 'Got it!' }]);
      }, 500);

      // Auto-stop after 30 seconds
      setTimeout(async () => {
        if (isListening) {
          await stopVoiceInput();
        }
        resultListener?.remove();
        errorListener?.remove();
      }, 30000);

    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      Alert.alert(
        'Speech Recognition Error',
        'Failed to start voice recognition. Please try typing your message instead.',
        [
          { text: 'Cancel' },
          { 
            text: 'Type Instead', 
            onPress: () => {
              setVoiceMode(mode);
              setShowVoiceInput(true);
            }
          }
        ]
      );
      setIsListening(false);
    }
  };

  const stopVoiceInput = async () => {
    try {
      console.log('🛑 Stopping speech recognition...');
      setIsListening(false);
      
      // Stop speech recognition
      await SpeechRecognition.stop();
      
      console.log('✅ Speech recognition stopped');
      
      // Show completion message if we have transcript
      if (transcript && transcript.trim()) {
        Alert.alert(
          '✅ Voice Input Complete', 
          `Captured: "${transcript}"\n\nReview your message and send when ready.`,
          [{ text: 'Review' }]
        );
      } else {
        Alert.alert(
          '⚠️ No Speech Detected', 
          'No speech was captured. Please try again or type your message.',
          [
            { text: 'Try Again', onPress: () => startVoiceInput(voiceMode) },
            { text: 'Type Instead' }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
      Alert.alert('Error', 'Failed to stop voice recognition. Please try again.');
      setIsListening(false);
    }
  };





  const confirmVoiceInput = () => {
    const textToUse = transcript.trim() || voiceInput.trim();
    if (!textToUse) {
      Alert.alert('Empty Input', 'Please speak or type something before confirming.');
      return;
    }
    
    if (voiceMode === 'message') {
      const comment = {
        id: Date.now(),
        user: 'You',
        reaction: 'VOICE',
        text: textToUse,
        timestamp: Date.now(),
        intensity: 'medium'
      };
      setReactions(prev => [comment, ...prev.slice(0, 9)]);
      
      // Text-to-speech announcement
      Speech.speak(`Message sent: ${textToUse}`, { rate: 1.2 });
    } else if (voiceMode === 'bet') {
      // Use parsed bet command or parse again
      const betCommand = parsedBetCommand || parseBetCommand(textToUse);
      if (betCommand) {
        setSelectedBet(betCommand.bet);
        setBetAmount(betCommand.amount);
        
        // Text-to-speech announcement
        Speech.speak(`Bet prepared: $${betCommand.amount} on ${betCommand.bet.option}`, { rate: 1.2 });
      } else {
        Alert.alert('Invalid Bet', 'Could not understand the bet command. Please try again.');
        return;
      }
    }
    
    setShowVoiceInput(false);
    setTranscript('');
    setVoiceInput('');
    setParsedBetCommand(null);
  };

  const cancelVoiceInput = async () => {
    setShowVoiceInput(false);
    setTranscript('');
    setVoiceInput('');
    setParsedBetCommand(null);
    
    // Stop speech recognition if active
    if (isListening) {
      try {
        await SpeechRecognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
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
      
      {/* Enhanced Header with Gradient */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerGradient}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.textInverse }]}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.textInverse }]}>{watchParty.title}</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveText, { color: theme.textInverse }]}>LIVE</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.memberBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[styles.memberCount, { color: theme.textInverse }]}>
                👥 {attendees.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Voice Controls */}
        <View style={[styles.voiceControls, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Voice Commands
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Record audio messages and bets
            </Text>
          </View>

          <View style={styles.voiceButtonsRow}>
            {!isListening ? (
              <>
                <TouchableOpacity 
                  style={[
                    styles.voiceButton, 
                    styles.messageButton,
                    { 
                      backgroundColor: theme.primary
                    }
                  ]}
                  onPress={() => startVoiceInput('message')}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>💬</Text>
                    <Text style={[styles.voiceButtonText, { color: theme.textInverse }]}>💬 Quick Message</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.voiceButton, 
                    styles.betButton,
                    { 
                      backgroundColor: '#ef4444'
                    }
                  ]}
                  onPress={() => startVoiceInput('bet')}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>💰</Text>
                    <Text style={[styles.voiceButtonText, { color: theme.textInverse }]}>💰 Quick Bet</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.listeningContainer}>
                <View style={[styles.listeningIndicator, { backgroundColor: theme.primary }]}>
                  <View style={styles.listeningContent}>
                    <View style={styles.pulseContainer}>
                      <View style={[styles.pulseRing, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                      <Text style={styles.microphoneIcon}>🎤</Text>
                    </View>
                    <Text style={[styles.listeningText, { color: theme.textInverse }]}>
                      Listening for {voiceMode === 'message' ? 'message' : 'bet'}...
                    </Text>
                    <Text style={[styles.listeningSubtext, { color: 'rgba(255,255,255,0.8)' }]}>
                      Speak clearly or tap to stop
                    </Text>
                  </View>
                </View>
                <View style={styles.listeningStatus}>
                  <Text style={[styles.listeningText, { color: theme.primary }]}>
                    {transcript ? '🎯 Processing...' : '🎤 Listening...'}
                  </Text>
                  <Text style={[styles.listeningSubtext, { color: theme.textSecondary }]}>
                    Speak clearly into your microphone
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.stopButton, { backgroundColor: '#ef4444' }]}
                  onPress={stopVoiceInput}
                >
                  <Text style={styles.stopButtonText}>⏹️ Stop Listening</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Enhanced Reactions Area */}
        <View style={[styles.reactionsArea, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🎉 Live Watch Party</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Watch reactions in real-time</Text>
          </View>
          
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
            <Text style={[styles.commentsTitle, { color: theme.textPrimary }]}>Recent Comments</Text>
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
                  <Text style={[styles.commentText, { color: theme.textPrimary }]}>
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

        {/* ENHANCED LIVE BETTING SECTION */}
        <View style={[styles.bettingSection, { backgroundColor: theme.surface }]}>
          <View style={[styles.bettingHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.bettingHeaderContent}>
              <Text style={[styles.bettingSectionTitle, { color: theme.textInverse }]}>🚀 LIVE BETTING</Text>
              <Text style={[styles.bettingSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>Place your bets in real-time</Text>
              <View style={styles.betStatsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.textInverse }]}>$2.4K</Text>
                  <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Volume</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.textInverse }]}>12</Text>
                  <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Active Bets</Text>
                </View>
              </View>
            </View>
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
                  { color: selectedBet?.id === bet.id ? '#fff' : theme.textPrimary }
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
              <Text style={[styles.selectedBetText, { color: theme.textPrimary }]}>
                {selectedBet.option}
              </Text>
              <View style={styles.betInputRow}>
                <TextInput
                  style={[styles.enhancedBetInput, { backgroundColor: theme.cardBackground, color: theme.textPrimary, borderColor: theme.primary }]}
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

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <View style={styles.voiceModal}>
          <View style={[styles.voiceModalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.voiceModalTitle, { color: theme.textPrimary }]}>
              {voiceMode === 'message' ? '💬 Confirm Voice Message' : '💰 Confirm Voice Bet'}
            </Text>
            
            {isListening && (
              <View style={styles.recordingIndicator}>
                <Text style={[styles.recordingText, { color: '#ef4444' }]}>
                  🎤 Listening... Speak now!
                </Text>
                <Text style={[styles.recordingSubtext, { color: theme.textSecondary }]}>
                  Your words will appear as you speak
                </Text>
              </View>
            )}
            
            {transcript && !isListening && (
              <View style={styles.transcriptContainer}>
                <Text style={[styles.transcriptLabel, { color: theme.textSecondary }]}>
                  Transcribed:
                </Text>
                <Text style={[styles.transcriptText, { color: theme.textPrimary }]}>
                  "{transcript}"
                </Text>

              </View>
            )}
            
            {!isListening && (
              <TextInput
                style={[styles.voiceTextInput, { 
                  borderColor: theme.border, 
                  backgroundColor: theme.inputBackground,
                  color: theme.textPrimary 
                }]}
                placeholder={transcript ? 'Edit the text above or type here...' : (voiceMode === 'message' ? 'Type your message...' : 'Type your bet command...')}
                placeholderTextColor={theme.textSecondary}
                value={voiceInput}
                onChangeText={(text) => {
                  setVoiceInput(text);
                  if (voiceMode === 'bet' && text.trim()) {
                    const parsed = parseBetCommand(text);
                    setParsedBetCommand(parsed);
                  } else if (voiceMode === 'bet') {
                    setParsedBetCommand(null);
                  }
                }}
                multiline={voiceMode === 'message'}
                numberOfLines={voiceMode === 'message' ? 3 : 1}
                autoFocus={!transcript}
              />
            )}
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
                <Text style={[styles.betPreviewText, { color: theme.textPrimary }]}>
                  Amount: ${parsedBetCommand.amount}
                </Text>
                <Text style={[styles.betPreviewText, { color: theme.textPrimary }]}>
                  Bet: {parsedBetCommand.bet.option}
                </Text>
                <Text style={[styles.betPreviewText, { color: theme.textPrimary }]}>
                  Odds: {parsedBetCommand.bet.odds}
                </Text>
              </View>
            )}
            <View style={styles.voiceModalButtons}>
              <TouchableOpacity 
                style={[styles.voiceModalButton, { backgroundColor: '#ef4444' }]}
                onPress={cancelVoiceInput}
              >
                <Text style={styles.voiceModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              {!isListening && (transcript.trim() || voiceInput.trim()) && (
                <TouchableOpacity 
                  style={[styles.voiceModalButton, { backgroundColor: theme.primary }]}
                  onPress={confirmVoiceInput}
                >
                  <Text style={styles.voiceModalButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}
              {isListening && (
                <TouchableOpacity 
                  style={[styles.voiceModalButton, { backgroundColor: '#ef4444' }]}
                  onPress={stopVoiceInput}
                >
                  <Text style={styles.voiceModalButtonText}>🛑 Stop Listening</Text>
                </TouchableOpacity>
              )}
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
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  memberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  warningBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Voice Controls
  voiceControls: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  voiceButton: {
    flex: 0.48,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  messageButton: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  betButton: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  voiceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
  voiceTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 50,
    textAlignVertical: 'top',
    width: '100%',
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  listeningContent: {
    alignItems: 'center',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.6,
  },
  microphoneIcon: {
    fontSize: 32,
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
  listeningStatus: {
    alignItems: 'center',
    marginBottom: 12,
  },
  listeningText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  listeningSubtext: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Enhanced Reactions Area
  reactionsArea: {
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    height: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  roamingContainer: {
    height: 160,
    position: 'relative',
    marginBottom: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 16,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  roamingAttendee: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  attendeeInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userInitial: {
    fontSize: 10,
    fontWeight: '700',
  },
  speakButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionIntensity: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  intensityText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
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

  // Enhanced Betting Section
  bettingSection: {
    marginTop: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
    minHeight: 260,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  bettingHeader: {
    marginBottom: 0,
    borderRadius: 20,
    marginHorizontal: -24,
    marginTop: -24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bettingHeaderContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  betStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
    marginTop: 2,
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
  
  // Voice recognition styles
  listeningIndicator: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 16,
  },
  listeningText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  transcriptContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  listeningIndicator: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 16,
    alignItems: 'center',
  },
  listeningText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  voiceTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 20,
    padding: 10,
    marginTop: 10,
  },
  recordingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default WatchPartyDetailScreen;