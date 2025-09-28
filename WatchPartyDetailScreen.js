import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
// Try to import real maps, fallback to simple map
let MapView, Marker, PROVIDER_GOOGLE;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('react-native-maps not available, using fallback');
  const simpleMap = require('./SimpleMapView');
  MapView = simpleMap.default;
  Marker = simpleMap.Marker;
  PROVIDER_GOOGLE = simpleMap.PROVIDER_GOOGLE;
}
import { supabase } from './supabaseClient';

const { width, height } = Dimensions.get('window');

const AttendeeBettingCard = ({ item, theme, watchPartyId, getTeamColor, calculateUserBettingStats }) => {
  const [bettingStats, setBettingStats] = useState({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalStaked: 0,
    netGain: 0,
    winRate: 0,
    pendingBets: 0
  });

  useEffect(() => {
    (async () => {
      const stats = await calculateUserBettingStats(item.id);
      setBettingStats(stats);
    })();
  }, [item.id, watchPartyId]);

  // Refresh stats every 5 seconds to pick up new bets
  useEffect(() => {
    const interval = setInterval(async () => {
      const stats = await calculateUserBettingStats(item.id);
      setBettingStats(stats);
    }, 5000);

    return () => clearInterval(interval);
  }, [item.id, watchPartyId]);

  return (
    <View style={[styles.attendeeBettingCard, { backgroundColor: theme.background }]}>
      <View style={styles.attendeeBettingInfo}>
        <View style={styles.attendeeBettingUser}>
          {item.avatar_url ? (
            <Image 
              source={{ uri: item.avatar_url }} 
              style={[styles.attendeeAvatar, { backgroundColor: theme.backgroundSecondary }]}
            />
          ) : (
            <View style={[styles.attendeeAvatar, { backgroundColor: getTeamColor(item.teamPreference) }]}>
              <Text style={styles.attendeeAvatarText}>
                {item.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.attendeeBettingDetails}>
            <Text style={[styles.attendeeName, { color: theme.textPrimary }]}>
              {item.username}
            </Text>
            <View style={styles.attendeeTeam}>
              <View style={[styles.teamDot, { backgroundColor: getTeamColor(item.teamPreference) }]} />
              <Text style={[styles.teamText, { color: theme.textSecondary }]}>
                {item.teamPreference === 'phi' ? 'Eagles Fan' : 
                 item.teamPreference === 'kc' ? 'Chiefs Fan' : 'Neutral'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bettingPerformance}>
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceValue, { color: theme.primary }]}>
              {bettingStats.totalBets}
            </Text>
            <Text style={[styles.performanceLabel, { color: theme.textTertiary }]}>Bets</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceValue, { 
              color: bettingStats.netGain >= 0 ? '#22c55e' : '#ef4444' 
            }]}>
              {bettingStats.netGain >= 0 ? '+' : ''}${bettingStats.netGain.toFixed(2)}
            </Text>
            <Text style={[styles.performanceLabel, { color: theme.textTertiary }]}>Net</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceValue, { 
              color: bettingStats.winRate >= 50 ? '#22c55e' : '#ef4444' 
            }]}>
              {bettingStats.winRate.toFixed(0)}%
            </Text>
            <Text style={[styles.performanceLabel, { color: theme.textTertiary }]}>Win Rate</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const WatchPartyDetailScreen = ({ watchParty, theme, isDarkMode, onBack }) => {
  const [attendees, setAttendees] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [bets, setBets] = useState([]);
  const [displayedBets, setDisplayedBets] = useState([]);
  const [bettingStats, setBettingStats] = useState({
    totalBets: 0,
    totalVolume: 0,
    mostRecentBet: null,
    totalWon: 0,
    totalLost: 0
  });
  const [liveBetIndex, setLiveBetIndex] = useState(0);
  const fadeAnim = useState(() => new Animated.Value(1))[0];
  const [selectedBet, setSelectedBet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [showBetModal, setShowBetModal] = useState(false);
  const [userBets, setUserBets] = useState([]);

  const scrollViewRef = React.useRef();

  useEffect(() => {
    getCurrentUser();
    fetchAttendees();
    fetchMessages();
    generateLiveBets();
    
    // Set up real-time subscriptions for messages and bets
    const messagesSubscription = supabase
      .channel('watch_party_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'watch_party_messages',
          filter: `watch_party_id=eq.${watchParty.id}`
        }, 
        (payload) => {
          console.log('Message subscription payload:', payload);
          if (payload.eventType === 'INSERT') {
            // Only add if it's not already in our local state (avoid duplicates)
            setMessages(prev => {
              const exists = prev.some(msg => 
                msg.id === payload.new.id || 
                (msg.text === payload.new.text && 
                 msg.user_id === payload.new.user_id && 
                 Math.abs(new Date(msg.created_at) - new Date(payload.new.created_at)) < 1000)
              );
              
              if (exists) {
                return prev;
              }
              
              return [...prev, payload.new];
            });
            
            // Auto scroll to bottom
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    const betsSubscription = supabase
      .channel('watch_party_bets')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watch_party_bets',
          filter: `watch_party_id=eq.${watchParty.id}`
        },
        (payload) => {
          console.log('Bet subscription payload:', payload);
          if (payload.eventType === 'INSERT') {
            // Update userBets if it's the current user's bet
            if (payload.new.user_id === currentUser?.id) {
              setUserBets(prev => [...prev, payload.new]);
            }
            // Force a re-render of attendee betting stats
            setAttendees(prev => [...prev]);
          }
          if (payload.eventType === 'UPDATE') {
            // Update userBets if it's the current user's bet
            if (payload.new.user_id === currentUser?.id) {
              setUserBets(prev => prev.map(bet => 
                bet.id === payload.new.id ? payload.new : bet
              ));
            }
            // Force a re-render of attendee betting stats
            setAttendees(prev => [...prev]);
          }
        }
      )
      .subscribe();

    // Set up real-time subscriptions for attendees
    const attendeesSubscription = supabase
      .channel('watch_party_members')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'watch_party_members',
          filter: `watch_party_id=eq.${watchParty.id}`
        }, 
        async (payload) => {
          console.log('New member joined:', payload);
          
          // Get current attendee count
          const { data: party } = await supabase
            .from('watch_parties')
            .select('attendee_count')
            .eq('id', watchParty.id)
            .single();
            
          if (party) {
            // Update the attendee count
            const { error: updateError } = await supabase
              .from('watch_parties')
              .update({ 
                attendee_count: party.attendee_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', watchParty.id);

            if (updateError) {
              console.error('Error updating attendee count:', updateError);
            }
          }
          
          // Refresh attendees list
          fetchAttendees();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'watch_party_members',
          filter: `watch_party_id=eq.${watchParty.id}`
        },
        async (payload) => {
          console.log('Member left:', payload);
          
          // Get current attendee count
          const { data: party } = await supabase
            .from('watch_parties')
            .select('attendee_count')
            .eq('id', watchParty.id)
            .single();
            
          if (party) {
            // Update the attendee count (ensure it doesn't go below 1)
            const newCount = Math.max(1, party.attendee_count - 1);
            const { error: updateError } = await supabase
              .from('watch_parties')
              .update({ 
                attendee_count: newCount,
                updated_at: new Date().toISOString()
              })
              .eq('id', watchParty.id);

            if (updateError) {
              console.error('Error updating attendee count:', updateError);
            }
          }
          
          // Refresh attendees list
          fetchAttendees();
        }
      )
      .subscribe();

    // Also listen for watch party updates (like attendee_count changes)
    const watchPartySubscription = supabase
      .channel('watch_party_updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'watch_parties',
          filter: `id=eq.${watchParty.id}`
        }, 
        (payload) => {
          console.log('Watch party updated:', payload);
          // Update the watch party data in state
          setWatchParty(prev => ({
            ...prev,
            ...payload.new
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(betsSubscription);
      supabase.removeChannel(attendeesSubscription);
      supabase.removeChannel(watchPartySubscription);
    };
  }, [watchParty.id]);

  // Rotate displayed bets every 5 seconds with fade animation
  useEffect(() => {
    if (bets.length === 0) return;

    const rotateBets = () => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Update bets while invisible
      setLiveBetIndex(prevIndex => {
        const newIndex = (prevIndex + 3) % bets.length;
        const nextBets = [];
        
        for (let i = 0; i < 3; i++) {
          const betIndex = (newIndex + i) % bets.length;
          nextBets.push(bets[betIndex]);
        }
        
        setDisplayedBets(nextBets);
        return newIndex;
      });

        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    };

    const interval = setInterval(rotateBets, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [bets]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
    }
  };

  const handleInlineJoin = async (teamPref) => {
    try {
      if (!currentUser) return;
      const teamMap = {
        phi: { id: 'phi', name: 'Eagles', color: '#22c55e' },
        kc: { id: 'kc', name: 'Chiefs', color: '#ef4444' },
        neutral: { id: 'neutral', name: 'Neutral', color: '#000000' },
      };

      const teamData = teamMap[teamPref] || teamMap.neutral;

      const { error } = await supabase
        .from('watch_party_members')
        .insert({
          watch_party_id: watchParty.id,
          user_id: currentUser.id,
          team_preference: teamData.id,
          team_data: teamData,
          status: 'approved'
        });

      if (error && error.code !== '23505') {
        console.error('Join error:', error);
        Alert.alert('Error', 'Could not join.');
        return;
      }

      setIsMember(true);

      // Optimistic attendee add
      setAttendees(prev => ([
        ...prev,
        {
          id: currentUser.id,
          username: currentUser.email?.split('@')[0] || 'You',
          avatar: '👤',
          teamPreference: teamData.id,
          teamData,
          realUser: true,
          location: null,
          joinedAt: new Date()
        }
      ]));

      await supabase
        .from('watch_parties')
        .update({ attendee_count: (watchParty.attendee_count || 1) + 1 })
        .eq('id', watchParty.id);

      fetchAttendees();
    } catch (e) {
      console.error('Unexpected join error:', e);
    }
  };

  const fetchAttendees = async () => {
    if (!watchParty?.id) return;
    
    try {
      // First get the members
      const { data: members, error: membersError } = await supabase
        .from('watch_party_members')
        .select('*')
        .eq('watch_party_id', watchParty.id)
        .eq('status', 'approved');

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
      }

      // Determine membership for current user
      if (currentUser && members) {
        setIsMember(members.some(m => m.user_id === currentUser.id));
      }

      // Get profile data for each member to get real usernames
      let realAttendees = [];
      if (members && members.length > 0) {
      const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
        .from('profiles')
          .select('id, username, avatar_url')
        .in('id', userIds);

        // Combine member data with profile data
        realAttendees = members.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        return {
          id: member.user_id,
            username: profile?.username || 'Anonymous',
            avatar_url: profile?.avatar_url,
            teamPreference: member.team_preference || 'neutral',
          teamData: member.team_data,
            realUser: true
        };
      });
      }

      // Generate locations around Atlanta for real attendees only
      const atlantaCenter = { lat: 33.7490, lng: -84.3880 };
      
      const attendeesList = realAttendees.map((realAttendee, index) => {
        // Generate random location within ~10 mile radius of Atlanta
        const radius = 0.15; // Roughly 10 miles in degrees
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;
        
        const lat = atlantaCenter.lat + (distance * Math.cos(angle));
        const lng = atlantaCenter.lng + (distance * Math.sin(angle));
        
        return {
          ...realAttendee,
          location: {
            latitude: lat,
            longitude: lng
          },
          joinedAt: new Date(Date.now() - Math.random() * 3600000)
        };
      });

      setAttendees(attendeesList);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('watch_party_messages')
        .select('id')
        .limit(1);

      if (tableCheckError && tableCheckError.code === 'PGRST205') {
        console.log('Messages table does not exist yet, skipping fetch');
        return;
      }

      const { data: existingMessages, error } = await supabase
        .from('watch_party_messages')
        .select('*')
        .eq('watch_party_id', watchParty.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(existingMessages || []);

      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const generateLiveBets = () => {
    const liveBets = [
      {
        id: 1,
        description: 'Will Patrick Mahomes throw for 300+ yards?',
        odds: 2.1,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 2,
        description: 'Will Eagles score on their next drive?',
        odds: 1.8,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 3,
        description: 'Will the next play be a pass?',
        odds: 1.5,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 4,
        description: 'Will there be a turnover this quarter?',
        odds: 3.0,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 5,
        description: 'Will A.J. Brown catch a TD this drive?',
        odds: 2.5,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 6,
        description: 'Will the next score be a touchdown?',
        odds: 1.7,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 7,
        description: 'Will Travis Kelce get a first down?',
        odds: 1.6,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 8,
        description: 'Will there be a sack this drive?',
        odds: 2.2,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 9,
        description: 'Will the next play gain yards?',
        odds: 1.9,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 10,
        description: 'Will Eagles convert this 3rd down?',
        odds: 2.0,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 11,
        description: 'Will Chiefs call a timeout this drive?',
        odds: 2.3,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 12,
        description: 'Will there be a penalty this drive?',
        odds: 1.8,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 13,
        description: 'Will Jalen Hurts rush for a TD?',
        odds: 2.8,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 14,
        description: 'Will this drive end in a score?',
        odds: 1.9,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      },
      {
        id: 15,
        description: 'Will there be a 20+ yard play this drive?',
        odds: 2.4,
        status: 'pending',
        stakeAmount: 0,
        potentialPayout: 0,
        placedAt: new Date()
      }
    ];

    setBets(liveBets);
    
    // Reset betting statistics
    setBettingStats({
      totalBets: 0,
      totalVolume: 0,
      mostRecentBet: null,
      totalWon: 0,
      totalLost: 0
    });

    // Set initial displayed bets
    setDisplayedBets(liveBets.slice(0, 3));
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { data: member } = await supabase
        .from('watch_party_members')
        .select('team_preference')
        .eq('watch_party_id', watchParty.id)
        .eq('user_id', currentUser.id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', currentUser.id)
        .single();

    const message = {
        watch_party_id: watchParty.id,
        user_id: currentUser.id,
        username: profile?.username || currentUser.email?.split('@')[0] || 'Anonymous',
        avatar_url: profile?.avatar_url,
      text: newMessage.trim(),
        created_at: new Date(),
        team_preference: member?.team_preference || 'neutral'
      };

      console.log('Sending message:', message);
      
      // Add message immediately to local state for instant display
      const localMessage = {
        ...message,
        id: Date.now(), // Temporary ID
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, localMessage]);
    setNewMessage('');
      
      // Auto scroll to bottom immediately
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      const { data, error } = await supabase
        .from('watch_party_messages')
        .insert(message)
        .select();

      if (error) {
        console.error('Error sending message:', error);
        // Remove the local message if there was an error
        setMessages(prev => prev.filter(msg => msg.id !== localMessage.id));
        return;
      }

      console.log('Message sent successfully:', data);
      
      // Update the local message with the real ID from database
      if (data && data[0]) {
        setMessages(prev => prev.map(msg => 
          msg.id === localMessage.id ? data[0] : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getTeamColor = (teamPreference) => {
    switch (teamPreference) {
      case 'phi':
        return '#004C54'; // Eagles green
      case 'kc':
        return '#E31837'; // Chiefs red
      default:
        return '#000000'; // Black for neutral
    }
  };

  const getTeamLogo = (teamPreference) => {
    switch (teamPreference) {
      case 'phi':
        return require('./philly.png');
      case 'kc':
        return require('./kansas.png');
      default:
        return null; // Will show emoji for neutral
    }
  };

  const getTeamEmoji = (teamPreference) => {
    switch (teamPreference) {
      case 'phi':
        return '🦅';
      case 'kc':
        return '🏆';
      default:
        return '⚪';
    }
  };

  const getBetStatusColor = (status) => {
    switch (status) {
      case 'won':
        return '#22c55e'; // Green
      case 'lost':
        return '#ef4444'; // Red
      case 'pending':
        return '#f59e0b'; // Yellow
      default:
        return '#000000'; // Black
    }
  };

  const getBetStatusEmoji = (status) => {
    switch (status) {
      case 'won':
        return '✅';
      case 'lost':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const calculateUserBettingStats = async (userId) => {
    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('watch_party_bets')
        .select('id')
        .limit(1);

      if (tableCheckError && tableCheckError.code === 'PGRST205') {
        console.log('Bets table does not exist yet, returning default stats');
        return {
          totalBets: 0,
          wonBets: 0,
          lostBets: 0,
          totalStaked: 0,
          netGain: 0,
          winRate: 0,
          pendingBets: 0
        };
      }

      // Only fetch bets for the specific user
      const { data: userBets, error } = await supabase
        .from('watch_party_bets')
        .select('*')
        .eq('watch_party_id', watchParty.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user bets:', error);
        return {
          totalBets: 0,
          wonBets: 0,
          lostBets: 0,
          totalStaked: 0,
          netGain: 0,
          winRate: 0,
          pendingBets: 0
        };
      }

      // Calculate completed bets (those with results)
      const completedBets = userBets.filter(bet => bet.result !== undefined);
      const wonBets = completedBets.filter(bet => bet.result === true);
      const lostBets = completedBets.filter(bet => bet.result === false);
      
      // Calculate financial stats
      const totalStaked = userBets.reduce((sum, bet) => sum + bet.amount, 0);
      const totalWon = wonBets.reduce((sum, bet) => sum + bet.payout, 0);
      const totalLost = lostBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    const netGain = totalWon - totalLost;
      const winRate = completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0;
    
    return {
      totalBets: userBets.length,
      wonBets: wonBets.length,
      lostBets: lostBets.length,
      totalStaked,
      netGain,
        winRate: isNaN(winRate) ? 0 : winRate,
        pendingBets: userBets.length - completedBets.length
      };
    } catch (error) {
      console.error('Error calculating user betting stats:', error);
      return {
        totalBets: 0,
        wonBets: 0,
        lostBets: 0,
        totalStaked: 0,
        netGain: 0,
        winRate: 0,
        pendingBets: 0
      };
    }
  };

  const renderAttendeeCard = ({ item }) => (
    <View style={[styles.attendeeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.attendeeInfo}>
        {item.avatar_url ? (
          <Image 
            source={{ uri: item.avatar_url }} 
            style={[styles.attendeeAvatar, { backgroundColor: theme.backgroundSecondary }]}
            onError={() => (
              <Text style={styles.attendeeAvatarText}>👤</Text>
            )}
          />
        ) : (
          <Text style={styles.attendeeAvatarText}>👤</Text>
        )}
        <View style={styles.attendeeDetails}>
          <Text style={[styles.attendeeName, { color: theme.textPrimary }]}>{item.username}</Text>
          <View style={styles.attendeeTeam}>
            <View style={[styles.teamDot, { backgroundColor: getTeamColor(item.teamPreference) }]} />
            <Text style={[styles.teamText, { color: theme.textSecondary }]}>
              {item.teamPreference === 'phi' ? 'Eagles Fan' : 
               item.teamPreference === 'kc' ? 'Chiefs Fan' : 'Neutral'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.locationStatus}>
        {item.location ? (
          <View style={styles.locationIndicator}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[styles.locationText, { color: theme.success }]}>Live</Text>
          </View>
        ) : (
          <Text style={[styles.noLocationText, { color: theme.textTertiary }]}>No location</Text>
        )}
      </View>
    </View>
  );

  const renderMessage = ({ item }) => {
    const isSystemMessage = item.username === 'System' || item.is_system_message;
    const teamColor = getTeamColor(item.team_preference);
    
    return (
      <View style={[
        styles.messageCard,
        { 
          backgroundColor: isSystemMessage ? 'rgba(139, 92, 246, 0.1)' : theme.surface,
          borderLeftWidth: !isSystemMessage ? 4 : 0,
          borderLeftColor: teamColor,
        }
      ]}>
      <View style={styles.messageHeader}>
        <View style={styles.messageUser}>
            {!isSystemMessage && (
              <>
                {item.avatar_url ? (
                  <Image 
                    source={{ uri: item.avatar_url }} 
                    style={[styles.messageAvatar, { backgroundColor: theme.backgroundSecondary }]}
                  />
                ) : (
                  <View style={[styles.messageAvatar, { backgroundColor: teamColor }]}>
                    <Text style={[styles.messageAvatarText, { color: '#ffffff' }]}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.messageUsername, { color: theme.textPrimary }]}>
                  {item.username}
                </Text>
                {item.type === 'bet' && (
                  <View style={[styles.messageBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.messageBadgeText, { color: theme.primaryText || '#ffffff' }]}>BET</Text>
                  </View>
                )}
                {item.type === 'bet_result' && (
                  <View style={[styles.messageBadge, { 
                    backgroundColor: item.text.includes('WON') ? theme.success : theme.error 
                  }]}>
                    <Text style={[styles.messageBadgeText, { color: theme.primaryText || '#ffffff' }]}>
                      {item.text.includes('WON') ? 'WIN' : 'LOSS'}
                    </Text>
                  </View>
                )}
              </>
            )}
        </View>
        <Text style={[styles.messageTime, { color: theme.textTertiary }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
        {item.type === 'bet' || item.type === 'bet_result' ? (
          <View style={[styles.betMessageCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.betMessageHeader}>
              <Text style={[styles.betMessageTitle, { color: theme.textPrimary }]}>
                {item.type === 'bet_result' ? 
                  (item.result ? 'Bet Won! 🎉' : 'Bet Lost 😔') : 
                  'New Bet Placed!'}
              </Text>
              <View style={[styles.betAmountBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.betAmountText, { color: theme.primaryText || '#ffffff' }]}>
                  ${item.bet_amount}
                </Text>
    </View>
            </View>
            <Text style={[styles.betMessageQuestion, { color: theme.textSecondary }]}>
              {item.text}
            </Text>
            <View style={styles.betMessageFooter}>
              <View style={[styles.betChoiceBadge, { 
                backgroundColor: item.bet_choice === 'Yes' ? 
                  (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)') : 
                  (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                borderColor: item.bet_choice === 'Yes' ? 
                  (isDarkMode ? '#4ade80' : '#22c55e') : 
                  (isDarkMode ? '#f87171' : '#ef4444')
              }]}>
                <Text style={[styles.betChoiceText, { 
                  color: item.bet_choice === 'Yes' ? 
                    (isDarkMode ? '#4ade80' : '#22c55e') : 
                    (isDarkMode ? '#f87171' : '#ef4444')
                }]}>
                  {item.bet_choice}
                </Text>
              </View>
              <Text style={[styles.betOddsText, { color: theme.textTertiary }]}>
                {item.odds}x Odds
              </Text>
            </View>
            {item.type === 'bet_result' && (
              <View style={styles.betResultDetails}>
                <Text style={[styles.betResultLabel, { color: theme.textSecondary }]}>
                  {item.result ? 'Payout:' : 'Loss:'}
                </Text>
                <Text style={[styles.betResultValue, { color: item.result ? '#22c55e' : '#ef4444' }]}>
                  {item.result ? '+' : '-'}${item.payout ? item.payout.toFixed(2) : '0.00'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            { 
              color: isSystemMessage ? theme.primary : theme.textSecondary,
              fontWeight: isSystemMessage ? '600' : '400'
            }
          ]}>
            {item.text.split(/(\[PHI\]|\[KC\])/).map((part, index) => {
              if (part === '[PHI]') {
                return (
                  <Text key={index} style={[styles.teamTag, { backgroundColor: 'rgba(0, 76, 84, 0.1)', color: '#004C54' }]}>
                    PHI
                  </Text>
                );
              } else if (part === '[KC]') {
                return (
                  <Text key={index} style={[styles.teamTag, { backgroundColor: 'rgba(227, 24, 55, 0.1)', color: '#E31837' }]}>
                    KC
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        )}
      </View>
    );
  };

  const renderBetCard = ({ item }) => {
    const userHasBet = userBets.some(bet => bet.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.betCard, { 
          backgroundColor: theme.background, 
          borderColor: theme.border,
          opacity: userHasBet ? 0.7 : 1
        }]}
        onPress={() => {
          if (!userHasBet && item.status === 'pending') {
            setSelectedBet(item);
            setShowBetModal(true);
          }
        }}
        disabled={userHasBet || item.status !== 'pending'}
      >
      <View style={styles.betHeader}>
        <View style={styles.betUser}>
          <Text style={[styles.betUsername, { color: theme.textPrimary }]}>{item.username}</Text>
          <Text style={styles.betStatusEmoji}>{getBetStatusEmoji(item.status)}</Text>
        </View>
        <View style={styles.betAmount}>
          <Text style={[styles.betStake, { color: theme.textSecondary }]}>${item.stakeAmount}</Text>
          <Text style={[styles.betStatus, { color: getBetStatusColor(item.status) }]}>
              {userHasBet ? 'PLACED' : item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.betDescription, { color: theme.textPrimary }]}>{item.description}</Text>
        <View style={styles.betOptions}>
          <TouchableOpacity 
            style={[
              styles.betOptionButton, 
              { backgroundColor: theme.backgroundSecondary },
              userHasBet && { opacity: 0.5 }
            ]}
            disabled={userHasBet}
            onPress={() => {
              setSelectedBet({...item, selectedOption: 'Yes'});
              setShowBetModal(true);
            }}
          >
            <Text style={[styles.betOptionText, { color: theme.success }]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.betOptionButton, 
              { backgroundColor: theme.backgroundSecondary },
              userHasBet && { opacity: 0.5 }
            ]}
            disabled={userHasBet}
            onPress={() => {
              setSelectedBet({...item, selectedOption: 'No'});
              setShowBetModal(true);
            }}
          >
            <Text style={[styles.betOptionText, { color: theme.error }]}>No</Text>
          </TouchableOpacity>
        </View>
      <View style={styles.betFooter}>
        <Text style={[styles.betOdds, { color: theme.textTertiary }]}>
          Odds: {item.odds}x • Potential: ${item.potentialPayout.toFixed(2)}
        </Text>
        <Text style={[styles.betTime, { color: theme.textTertiary }]}>
          {item.placedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {item.actualOutcome && (
        <Text style={[styles.betOutcome, { color: theme.textSecondary }]}>
          Result: {item.actualOutcome}
        </Text>
      )}
        {userHasBet && (
          <View style={[styles.placedBetBadge, { backgroundColor: theme.success }]}>
            <Text style={[styles.placedBetText, { color: theme.primaryText || '#ffffff' }]}>Bet Placed!</Text>
    </View>
        )}
      </TouchableOpacity>
  );
  };

  const renderAttendeeBettingCard = ({ item }) => {
    // Only calculate stats for the current user
    const isCurrentUser = item.id === currentUser?.id;
    const bettingStats = isCurrentUser ? calculateUserBettingStats(currentUser.id) : {
      totalBets: 0,
      wonBets: 0,
      lostBets: 0,
      totalStaked: 0,
      netGain: 0,
      winRate: 0,
      pendingBets: 0
    };
    
    return (
      <View style={[styles.attendeeBettingCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={styles.attendeeBettingInfo}>
          <View style={styles.attendeeBettingUser}>
            <Text style={styles.attendeeAvatar}>{item.avatar}</Text>
            <View style={styles.attendeeBettingDetails}>
              <Text style={[styles.attendeeName, { color: theme.textPrimary }]}>{item.username}</Text>
              <View style={styles.attendeeTeam}>
                <View style={[styles.teamDot, { backgroundColor: getTeamColor(item.teamPreference) }]} />
                <Text style={[styles.teamText, { color: theme.textSecondary }]}>
                  {item.teamPreference === 'phi' ? 'Eagles Fan' : 
                   item.teamPreference === 'kc' ? 'Chiefs Fan' : 'Neutral'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.bettingPerformance}>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.primary }]}>{bettingStats.totalBets}</Text>
              <Text style={[styles.performanceLabel, { color: theme.textTertiary }]}>Bets</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { 
                color: bettingStats.netGain >= 0 ? '#22c55e' : '#ef4444' 
              }]}>
                {bettingStats.netGain >= 0 ? '+' : ''}${bettingStats.netGain.toFixed(2)}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.textTertiary }]}>Net</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { 
                color: bettingStats.winRate >= 50 ? '#22c55e' : '#ef4444' 
              }]}>
                {bettingStats.winRate.toFixed(0)}%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.textTertiary }]}>Win Rate</Text>
            </View>
          </View>
        </View>
        <View style={styles.bettingRecord}>
          <Text style={[styles.recordText, { color: theme.textSecondary }]}>
            {bettingStats.wonBets}W • {bettingStats.lostBets}L • ${bettingStats.totalStaked.toFixed(2)} staked
          </Text>
        </View>
      </View>
    );
  };

  // Calculate map region based on attendee locations
  const getMapRegion = () => {
    const locationsWithCoords = attendees.filter(a => a.location);
    
    if (locationsWithCoords.length === 0) {
      // Default to Atlanta if no locations
      return {
        latitude: 33.7490,
        longitude: -84.3880,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const lats = locationsWithCoords.map(a => a.location.latitude);
    const lngs = locationsWithCoords.map(a => a.location.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max(maxLat - minLat, 0.01) * 1.5;
    const deltaLng = Math.max(maxLng - minLng, 0.01) * 1.5;
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
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
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{watchParty.name}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {attendees.length} watching • Eagles vs Chiefs
            </Text>
            {!isMember && currentUser && (
              <View style={styles.joinRow}>
                <TouchableOpacity
                  style={[styles.joinChoice, { borderColor: '#22c55e' }]}
                  onPress={() => handleInlineJoin('phi')}
                >
                  <Image source={require('./philly.png')} style={styles.joinLogo} />
                  <Text style={[styles.joinChoiceText, { color: '#22c55e' }]}>Join as Eagles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.joinChoice, { borderColor: '#ef4444' }]}
                  onPress={() => handleInlineJoin('kc')}
                >
                  <Image source={require('./kansas.png')} style={styles.joinLogo} />
                  <Text style={[styles.joinChoiceText, { color: '#ef4444' }]}>Join as Chiefs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.joinChoice, { borderColor: '#8b5cf6' }]}
                  onPress={() => handleInlineJoin('neutral')}
                >
                  <Text style={[styles.joinChoiceText, { color: '#8b5cf6' }]}>Join Neutral</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
        <View style={styles.headerRight} />
          </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Info */}
        <View style={[styles.gameCard, { backgroundColor: theme.surface }]}>
          <LinearGradient
            colors={['#004C54', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 0 }}
            style={styles.leftTeamGradient}
          />
          <LinearGradient
            colors={['transparent', '#E31837']}
            start={{ x: 0.6, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rightTeamGradient}
          />
          
          <View style={styles.gameHeader}>
            <View style={styles.gameTimeContainer}>
              <Text style={[styles.gameTime, { color: theme.textPrimary }]}>
                4th Quarter • 6:37
              </Text>
              <View style={[styles.liveIndicator, { backgroundColor: theme.error }]}>
                <Text style={styles.liveText}>● LIVE</Text>
              </View>
            </View>
            <View style={styles.gameStats}>
              <Text style={[styles.gameStat, { color: theme.textSecondary }]}>
                2nd & 11 • PHI Ball • KC 27
              </Text>
            </View>
          </View>

          <View style={styles.gameTeams}>
            <View style={styles.gameTeam}>
              <View style={[styles.teamLogoContainer, { backgroundColor: 'rgba(0, 76, 84, 0.1)' }]}>
              <Image 
                source={require('./philly.png')} 
                style={styles.gameTeamLogo}
                resizeMode="contain"
              />
              </View>
              <View style={styles.gameTeamInfo}>
              <Text style={[styles.gameTeamName, { color: theme.textPrimary }]}>Eagles</Text>
                <Text style={[styles.gameTeamRecord, { color: theme.textSecondary }]}>(13-4)</Text>
                <Text style={[styles.gameScore, { color: '#22c55e' }]}>40</Text>
            </View>
            </View>

            <View style={styles.gameMiddle}>
              <View style={[styles.gameScoreDivider, { backgroundColor: theme.border }]} />
            <Text style={[styles.gameVs, { color: theme.textSecondary }]}>VS</Text>
              <View style={[styles.gameScoreDivider, { backgroundColor: theme.border }]} />
            </View>

            <View style={[styles.gameTeam, styles.gameTeamRight]}>
              <View style={[styles.teamLogoContainer, { backgroundColor: 'rgba(227, 24, 55, 0.1)' }]}>
              <Image 
                source={require('./kansas.png')} 
                style={styles.gameTeamLogo}
                resizeMode="contain"
              />
              </View>
              <View style={styles.gameTeamInfo}>
              <Text style={[styles.gameTeamName, { color: theme.textPrimary }]}>Chiefs</Text>
                <Text style={[styles.gameTeamRecord, { color: theme.textSecondary }]}>(14-3)</Text>
                <Text style={[styles.gameScore, { color: '#ef4444' }]}>22</Text>
              </View>
            </View>
          </View>

          <View style={[styles.gameFooter, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.gameFooterLeft}>
              <Text style={[styles.gameDate, { color: theme.textPrimary }]}>September 27, 2025</Text>
              <Text style={[styles.gameLocation, { color: theme.textSecondary }]}>Lincoln Financial Field</Text>
            </View>
            <View style={[styles.gameStatus, { backgroundColor: theme.success }]}>
              <Text style={styles.gameStatusText}>LIVE</Text>
          </View>
        </View>
          </View>

        {/* Live Map */}
        <View style={[styles.mapSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🗺️ Live User Locations</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            See where everyone is watching from
          </Text>
          
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={getMapRegion()}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {attendees
                .filter(attendee => attendee.location)
                .map((attendee) => (
                <Marker
                  key={attendee.id}
                  coordinate={attendee.location}
                    title={attendee.username}
                    description={`${attendee.teamPreference === 'phi' ? 'Eagles' : 
                                  attendee.teamPreference === 'kc' ? 'Chiefs' : 'Neutral'} Fan`}
                >
                  <View style={[
                    styles.userMarker,
                      { borderColor: getTeamColor(attendee.teamPreference) }
                    ]}>
                      {getTeamLogo(attendee.teamPreference) ? (
                        <Image 
                          source={getTeamLogo(attendee.teamPreference)} 
                          style={styles.teamLogoImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.userMarkerText}>{getTeamEmoji(attendee.teamPreference)}</Text>
                    )}
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>
          
          <View style={styles.mapLegend}>
            <Text style={[styles.legendTitle, { color: theme.textPrimary }]}>Legend:</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, { borderColor: '#004C54' }]}>
                  <Image 
                    source={require('./philly.png')} 
                    style={styles.legendLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>Eagles Fans</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, { borderColor: '#E31837' }]}>
                  <Image 
                    source={require('./kansas.png')} 
                    style={styles.legendLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>Chiefs Fans</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendMarker, { borderColor: '#000000' }]}>
                  <Text style={styles.legendEmoji}>⚪</Text>
                </View>
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>Neutral</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Betting Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              AI Live Betting
                      </Text>
            <View style={[styles.attendeeCount, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.attendeeCountText, { color: theme.textPrimary }]}>
                {attendees.length} Watching
              </Text>
            </View>
                    </View>
          
          {/* Betting Stats */}
          <View style={styles.bettingStats}>
                <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{bettingStats.totalBets}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Bets</Text>
                </View>
                <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>${bettingStats.totalVolume.toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Volume</Text>
                </View>
                <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {bettingStats.mostRecentBet ? bettingStats.mostRecentBet.username : 'None'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Most Recent</Text>
            </View>
          </View>
          
          {/* Live Rotating Bets */}
          <Animated.View style={{ opacity: fadeAnim }}>
          <FlatList
            data={displayedBets}
            renderItem={renderBetCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
          </Animated.View>

          {/* Attendees with Betting Stats */}
          <Text style={[styles.subsectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>
            Party Performance
                </Text>
          <FlatList
            data={attendees}
            renderItem={({ item }) => (
              <AttendeeBettingCard 
                item={item} 
                theme={theme} 
                watchPartyId={watchParty.id}
                getTeamColor={getTeamColor}
                calculateUserBettingStats={calculateUserBettingStats}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>

        {/* Chat Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>💬 Chat</Text>
          
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            showsVerticalScrollIndicator={true}
          >
            {messages.map((item) => (
              <View key={item.id} style={{ marginBottom: 8 }}>
                {renderMessage({ item })}
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.chatInputContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={[styles.emojiBar, { backgroundColor: theme.backgroundSecondary }]}
              contentContainerStyle={styles.emojiBarContent}
            >
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setNewMessage(prev => prev + "🔥")}
              >
                <Text style={styles.emojiText}>🔥</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setNewMessage(prev => prev + "👏")}
              >
                <Text style={styles.emojiText}>👏</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.emojiButton, { backgroundColor: 'rgba(0, 76, 84, 0.1)' }]}
                onPress={() => setNewMessage(prev => prev + " [PHI] ")}
              >
                <Text style={[styles.teamEmojiText, { color: '#004C54' }]}>PHI</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.emojiButton, { backgroundColor: 'rgba(227, 24, 55, 0.1)' }]}
                onPress={() => setNewMessage(prev => prev + " [KC] ")}
              >
                <Text style={[styles.teamEmojiText, { color: '#E31837' }]}>KC</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setNewMessage(prev => prev + "💪")}
              >
                <Text style={styles.emojiText}>💪</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setNewMessage(prev => prev + "🎯")}
              >
                <Text style={styles.emojiText}>🎯</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setNewMessage(prev => prev + "🎉")}
              >
                <Text style={styles.emojiText}>🎉</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emojiButton}
                onPress={() => setNewMessage(prev => prev + "🙌")}
              >
                <Text style={styles.emojiText}>🙌</Text>
              </TouchableOpacity>
            </ScrollView>
          
          <View style={styles.messageInput}>
            <TextInput
              style={[styles.messageTextInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border,
                color: theme.textPrimary 
              }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.textTertiary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={200}
            />
              <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Text style={[styles.sendButtonText, { color: theme.primaryText || '#ffffff' }]}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bet Placement Modal */}
      <Modal
        visible={showBetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowBetModal(false);
          setSelectedBet(null);
          setBetAmount('');
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Place Bet</Text>
              <TouchableOpacity onPress={() => {
                setShowBetModal(false);
                setSelectedBet(null);
                setBetAmount('');
              }}>
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
            <View style={[styles.betCard, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.betQuestion, { color: theme.textPrimary }]}>
                {selectedBet?.description}
              </Text>
              
              <View style={styles.betOptions}>
                <View style={[styles.betOption, { backgroundColor: theme.background }]}>
                  <Text style={[styles.betOptionLabel, { color: theme.textSecondary }]}>Your Choice</Text>
                  <View style={[styles.betChoiceTag, { 
                    backgroundColor: selectedBet?.selectedOption === 'Yes' ? 
                      (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)') : 
                      (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                    borderColor: selectedBet?.selectedOption === 'Yes' ? 
                      (isDarkMode ? '#4ade80' : '#22c55e') : 
                      (isDarkMode ? '#f87171' : '#ef4444')
                  }]}>
                    <Text style={[styles.betChoiceText, { 
                      color: selectedBet?.selectedOption === 'Yes' ? 
                        (isDarkMode ? '#4ade80' : '#22c55e') : 
                        (isDarkMode ? '#f87171' : '#ef4444')
                    }]}>
                      {selectedBet?.selectedOption}
                    </Text>
                  </View>
                </View>

                <View style={[styles.betOption, { backgroundColor: theme.background }]}>
                  <Text style={[styles.betOptionLabel, { color: theme.textSecondary }]}>Odds</Text>
                  <Text style={[styles.betOptionValue, { color: theme.textPrimary }]}>
                    {selectedBet?.odds}x
                  </Text>
                </View>
              </View>

              <View style={styles.betAmountSection}>
                <Text style={[styles.betAmountLabel, { color: theme.textSecondary }]}>
                  Bet Amount
                </Text>
                <View style={styles.betAmountRow}>
                  <Text style={[styles.currencySymbol, { color: theme.textPrimary }]}>$</Text>
                  <TextInput
                    style={[styles.betAmountInput, { 
                      color: theme.textPrimary,
                    }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textTertiary}
                    value={betAmount}
                    onChangeText={setBetAmount}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <Text style={[styles.potentialWin, { color: theme.success }]}>
                  Potential Win: ${((parseFloat(betAmount) || 0) * (selectedBet?.odds || 1)).toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.placeBetButton, { 
                backgroundColor: theme.primary,
                opacity: !betAmount || parseFloat(betAmount) <= 0 ? 0.5 : 1
              }]}
              onPress={async () => {
                if (!betAmount || parseFloat(betAmount) <= 0) return;
                
                const amount = parseFloat(betAmount);
                const newBet = {
                  ...selectedBet,
                  userId: currentUser.id,
                  userBetAmount: amount,
                  userChoice: selectedBet.selectedOption,
                  created_at: new Date(),
                  // Predetermined result (random for demo)
                  willWin: Math.random() > 0.5
                };
                
                setUserBets(prev => [...prev, newBet]);
                
                // Update betting stats
                setBettingStats(prev => ({
                  totalBets: prev.totalBets + 1,
                  totalVolume: prev.totalVolume + amount,
                  mostRecentBet: newBet
                }));

                // Add bet to chat
                // Insert bet into database
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('username, avatar_url')
                  .eq('id', currentUser.id)
                  .single();

                const { data: member } = await supabase
                  .from('watch_party_members')
                  .select('team_preference')
                  .eq('watch_party_id', watchParty.id)
                  .eq('user_id', currentUser.id)
                  .single();

                const betMessage = {
                  watch_party_id: watchParty.id,
                  user_id: currentUser.id,
                  username: profile?.username || currentUser?.email?.split('@')[0] || 'Anonymous',
                  avatar_url: profile?.avatar_url,
                  text: selectedBet.description,
                  bet_amount: amount,
                  bet_choice: selectedBet.selectedOption,
                  odds: selectedBet.odds,
                  created_at: new Date(),
                  team_preference: member?.team_preference || 'neutral',
                  type: 'bet',
                  is_system_message: false
                };

                console.log('Sending bet message:', betMessage);
                
                // Add bet message immediately to local state for instant display
                const localBetMessage = {
                  ...betMessage,
                  id: Date.now(), // Temporary ID
                  created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, localBetMessage]);
                
                // Auto scroll to bottom immediately
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
                
                const { data: betData, error: betError } = await supabase
                  .from('watch_party_messages')
                  .insert(betMessage)
                  .select();

                if (betError) {
                  console.error('Error saving bet message:', betError);
                  // Remove the local message if there was an error
                  setMessages(prev => prev.filter(msg => msg.id !== localBetMessage.id));
                  return;
                }

                console.log('Bet message sent successfully:', betData);
                
                // Update the local message with the real ID from database
                if (betData && betData[0]) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === localBetMessage.id ? betData[0] : msg
                  ));
                }

                // Also save to bets table
                const { error: saveBetError } = await supabase
                  .from('watch_party_bets')
                  .insert({
                    watch_party_id: watchParty.id,
                    user_id: currentUser.id,
                    description: selectedBet.description,
                    amount: amount,
                    choice: selectedBet.selectedOption,
                    odds: selectedBet.odds,
                    created_at: new Date()
                  });

                if (saveBetError) {
                  console.error('Error saving bet:', saveBetError);
                  return;
                }

                // Close modal and reset
                setShowBetModal(false);
                setSelectedBet(null);
                setBetAmount('');

                // Schedule result after 5 seconds
                setTimeout(async () => {
                  const result = newBet.willWin;
                  
                  // Update user bet with result
                  setUserBets(prev => prev.map(bet => 
                    bet.id === newBet.id ? { ...bet, result } : bet
                  ));

                  // Update betting stats
                  setBettingStats(prev => ({
                    ...prev,
                    totalWon: result ? prev.totalWon + (amount * selectedBet.odds) : prev.totalWon,
                    totalLost: result ? prev.totalLost : prev.totalLost + amount
                  }));

                  const username = profile?.username || currentUser?.email?.split('@')[0] || 'Anonymous';
                  const resultText = result 
                    ? `🎉 ${username} won their bet!` 
                    : `😔 ${username}'s bet didn't pay off`;

                  const resultMessage = {
                    watch_party_id: watchParty.id,
                    user_id: null,
                    username: 'System',
                    text: resultText,
                    bet_amount: amount,
                    bet_choice: selectedBet.selectedOption,
                    odds: selectedBet.odds,
                    result: result,
                    payout: amount * (result ? selectedBet.odds : 1),
                    created_at: new Date(),
                    type: 'bet_result',
                    original_user: username,
                    is_system_message: true
                  };

                  console.log('Sending bet result message:', resultMessage);

                  // Add result message immediately to local state for instant display
                  const localResultMessage = {
                    ...resultMessage,
                    id: Date.now(), // Temporary ID
                    created_at: new Date().toISOString()
                  };
                  setMessages(prev => [...prev, localResultMessage]);
                  
                  // Auto scroll to bottom immediately
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);

                  const { data: resultData, error: resultError } = await supabase
                    .from('watch_party_messages')
                    .insert(resultMessage)
                    .select();

                  if (resultError) {
                    console.error('Error saving result message:', resultError);
                    // Remove the local message if there was an error
                    setMessages(prev => prev.filter(msg => msg.id !== localResultMessage.id));
                    return;
                  }

                  console.log('Bet result message sent successfully:', resultData);
                  
                  // Update the local message with the real ID from database
                  if (resultData && resultData[0]) {
                    setMessages(prev => prev.map(msg => 
                      msg.id === localResultMessage.id ? resultData[0] : msg
                    ));
                  }

                  // Update bet result in bets table
                  const { error: updateBetError } = await supabase
                    .from('watch_party_bets')
                    .update({
                      result: result,
                      payout: amount * (result ? selectedBet.odds : 1)
                    })
                    .eq('watch_party_id', watchParty.id)
                    .eq('user_id', currentUser.id)
                    .eq('description', selectedBet.description);

                  if (updateBetError) {
                    console.error('Error updating bet result:', updateBetError);
                    return;
                  }
                }, 5000);
              }}
              disabled={!betAmount || parseFloat(betAmount) <= 0}
            >
              <Text style={[styles.placeBetButtonText, { color: theme.primaryText || '#ffffff' }]}>Place Bet</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: {
    width: 60,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  joinChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  joinLogo: {
    width: 16,
    height: 16,
  },
  joinChoiceText: {
    fontWeight: '700',
    fontSize: 12,
  },
  
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Game Card
  gameCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  leftTeamGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    opacity: 0.3,
  },
  rightTeamGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    opacity: 0.3,
  },
  gameHeader: {
    marginBottom: 24,
  },
  gameTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  gameTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  gameStats: {
    alignItems: 'center',
  },
  gameStat: {
    fontSize: 14,
    fontWeight: '500',
  },
  gameTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  gameTeam: {
    alignItems: 'center',
    flex: 1,
  },
  gameTeamRight: {
    alignItems: 'center',
  },
  teamLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameTeamLogo: {
    width: 60,
    height: 60,
  },
  gameTeamInfo: {
    alignItems: 'center',
  },
  gameTeamName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  gameTeamRecord: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  gameScore: {
    fontSize: 32,
    fontWeight: '800',
  },
  gameMiddle: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  gameScoreDivider: {
    width: 40,
    height: 1,
    marginVertical: 8,
  },
  gameVs: {
    fontSize: 16,
    fontWeight: '700',
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  gameFooterLeft: {
    flex: 1,
  },
  gameDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  gameLocation: {
    fontSize: 12,
    fontWeight: '500',
  },
  gameStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gameStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Map Section
  mapSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 16,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarkerText: {
    fontSize: 18,
  },
  teamLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  mapLegend: {
    marginTop: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLogo: {
    width: 16,
    height: 16,
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Section
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  attendeeCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  attendeeCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  liveBetsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  liveBetsSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Attendee Card
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  attendeeAvatarText: {
    fontSize: 24,
    marginRight: 12,
  },
  attendeeDetails: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  attendeeTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  teamText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationStatus: {
    alignItems: 'flex-end',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noLocationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Messages
  messagesList: {
    maxHeight: 500,
    marginBottom: 16,
  },
  messageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputContainer: {
    marginTop: 12,
  },
  emojiBar: {
    borderRadius: 12,
    marginBottom: 12,
  },
  emojiBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    flexDirection: 'row',
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emojiText: {
    fontSize: 24,
  },
  teamEmojiText: {
    fontSize: 16,
    fontWeight: '800',
  },
  teamTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '700',
    fontSize: 14,
  },
  betMessageCard: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  betMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  betMessageTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  betAmountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  betMessageQuestion: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  betMessageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betChoiceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  betChoiceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  betOddsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  messageTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Betting Styles
  bettingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Bet Card
  betCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  betUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  betUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  betStatusEmoji: {
    fontSize: 16,
  },
  betAmount: {
    alignItems: 'flex-end',
  },
  betStake: {
    fontSize: 14,
    fontWeight: '600',
  },
  betStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  betDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  betOption: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betOdds: {
    fontSize: 12,
    fontWeight: '500',
  },
  betTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  betOutcome: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    fontStyle: 'italic',
  },
  betOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    gap: 12,
  },
  betOptionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  betOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placedBetBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placedBetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  betCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  betQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  betOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  betOption: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  betOptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  betOptionValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  betChoiceTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  betChoiceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  betAmountSection: {
    alignItems: 'center',
  },
  betAmountLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  betAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 4,
  },
  betAmountInput: {
    fontSize: 24,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
  },
  potentialWin: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeBetButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeBetButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Attendee Betting Card
  attendeeBettingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  attendeeBettingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendeeBettingUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attendeeBettingDetails: {
    flex: 1,
    marginLeft: 12,
  },
  bettingPerformance: {
    flexDirection: 'row',
    gap: 16,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  performanceLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  bettingRecord: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  recordText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  betResultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  betResultLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  betResultValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WatchPartyDetailScreen;
