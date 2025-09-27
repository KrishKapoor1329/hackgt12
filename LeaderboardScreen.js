import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import supabase from './supabaseClient';

const { width } = Dimensions.get('window');

// Mock data for leaderboard
const mockLeaderboardData = [
  {
    id: 1,
    username: 'GridironGuru',
    avatar: 'GG',
    totalPicks: 47,
    correctPicks: 32,
    winRate: 68.1,
    totalWinnings: 2840,
    streak: 8,
    rank: 1,
    isCurrentUser: false,
  },
  {
    id: 2,
    username: 'TouchdownTom',
    avatar: 'TT',
    totalPicks: 52,
    correctPicks: 34,
    winRate: 65.4,
    totalWinnings: 2150,
    streak: 5,
    rank: 2,
    isCurrentUser: false,
  },
  // Current user data will be dynamically inserted
  {
    id: 4,
    username: 'EndZoneExpert',
    avatar: 'EZ',
    totalPicks: 41,
    correctPicks: 25,
    winRate: 61.0,
    totalWinnings: 1650,
    streak: 2,
    rank: 4,
    isCurrentUser: false,
  },
  {
    id: 5,
    username: 'FirstDownFrank',
    avatar: 'FF',
    totalPicks: 35,
    correctPicks: 21,
    winRate: 60.0,
    totalWinnings: 1420,
    streak: 1,
    rank: 5,
    isCurrentUser: false,
  },
  {
    id: 6,
    username: 'HailMaryHero',
    avatar: 'HM',
    totalPicks: 29,
    correctPicks: 17,
    winRate: 58.6,
    totalWinnings: 1180,
    streak: 0,
    rank: 6,
    isCurrentUser: false,
  },
  {
    id: 7,
    username: 'BlitzBoss',
    avatar: 'BB',
    totalPicks: 33,
    correctPicks: 19,
    winRate: 57.6,
    totalWinnings: 950,
    streak: 1,
    rank: 7,
    isCurrentUser: false,
  },
  {
    id: 8,
    username: 'SackMaster',
    avatar: 'SM',
    totalPicks: 26,
    correctPicks: 14,
    winRate: 53.8,
    totalWinnings: 720,
    streak: 0,
    rank: 8,
    isCurrentUser: false,
  },
];

const LeaderboardScreen = ({ onBack, theme, isDarkMode, userStats, session, userLocation }) => {
  const [selectedTab, setSelectedTab] = useState('city'); // city, groups
  const [selectedLeague, setSelectedLeague] = useState('NFL'); // NFL, NBA
  const [cityLeaderboard, setCityLeaderboard] = useState([]);
  const [friendGroups, setFriendGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupLeaderboard, setGroupLeaderboard] = useState([]);
  const [userCity, setUserCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Helper function to create current user leaderboard entry
  const getCurrentUserEntry = () => {
    if (!userStats || !session?.user) return null;
    
    return {
      id: session.user.id,
      username: 'You',
      avatar: 'ME',
      totalPicks: userStats.totalPicks,
      correctPicks: userStats.correctPicks,
      winRate: userStats.winRate,
      totalWinnings: userStats.totalWinnings,
      streak: userStats.currentStreak,
      rank: 0, // Will be calculated based on position
      isCurrentUser: true,
    };
  };

  // Helper function to merge current user into leaderboard and sort
  const mergeUserIntoLeaderboard = (leaderboardData) => {
    const currentUser = getCurrentUserEntry();
    if (!currentUser) return leaderboardData;

    // Remove any existing current user entries and add the real one
    const filteredData = leaderboardData.filter(user => !user.isCurrentUser);
    const allUsers = [...filteredData, currentUser];
    
    // Sort by total winnings (descending)
    const sortedUsers = allUsers.sort((a, b) => b.totalWinnings - a.totalWinnings);
    
    // Update ranks
    return sortedUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  };
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadUserProfile();
    loadCityLeaderboard();
    loadFriendGroups();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getSession();
    setCurrentUserId(data?.session?.user?.id);
  };

  useEffect(() => {
    if (selectedTab === 'city') {
      loadCityLeaderboard();
    } else if (selectedGroup) {
      loadGroupLeaderboard();
    }
  }, [selectedTab, selectedGroup, userLocation?.city]);

  // Update leaderboard when userStats change
  useEffect(() => {
    if (userStats && selectedTab === 'city' && cityLeaderboard.length > 0) {
      setCityLeaderboard(prevLeaderboard => mergeUserIntoLeaderboard(
        prevLeaderboard.filter(user => !user.isCurrentUser)
      ));
    }
  }, [userStats]);

  const loadUserProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('city, state')
        .eq('id', uid)
        .single();

      if (profile) {
        setUserCity(profile.city || 'Unknown City');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadCityLeaderboard = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      // Use the detected user location first, fallback to database
      let userCity = userLocation?.city;
      
      if (!userCity || userLocation?.isLoading) {
        // Fallback: Get user's city from database
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('city')
          .eq('id', uid)
          .single();
        
        userCity = userProfile?.city;
      }

      if (!userCity || userCity === 'Unknown City') {
        // Use mock data if no city available
        setCityLeaderboard(mergeUserIntoLeaderboard(mockLeaderboardData));
        setUserCity(userLocation?.displayName || 'Unknown City');
        return;
      }

      // Update the displayed city name
      setUserCity(userLocation?.displayName || userCity);

      // Get city leaderboard using detected city
      const { data: cityData } = await supabase
        .from('profiles')
        .select('id, username, email, total_winnings, total_picks, correct_picks, win_rate, current_streak, best_streak')
        .eq('city', userCity)
        .order('total_winnings', { ascending: false })
        .limit(50);

      const leaderboardData = (cityData || []).map((user, index) => ({
        id: user.id,
        username: user.username || user.email?.split('@')[0] || 'Unknown',
        totalPicks: user.total_picks || 0,
        correctPicks: user.correct_picks || 0,
        winRate: user.win_rate || 0,
        totalWinnings: user.total_winnings || 0,
        streak: user.current_streak || 0,
        bestStreak: user.best_streak || 0,
        rank: index + 1,
        isCurrentUser: user.id === uid,
      }));

      setCityLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading city leaderboard:', error);
      setCityLeaderboard(mergeUserIntoLeaderboard(mockLeaderboardData));
    } finally {
      setLoading(false);
    }
  };

  const loadFriendGroups = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      // User can only be in one group, so get their single group
      const { data: membership } = await supabase
        .from('group_members')
        .select(`
          group_id,
          friend_groups(id, name, description, owner_id, invite_code, is_private)
        `)
        .eq('user_id', uid)
        .single();

      if (membership?.friend_groups) {
        const userGroup = membership.friend_groups;
        setFriendGroups([userGroup]);
        setSelectedGroup(userGroup);
      } else {
        setFriendGroups([]);
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Error loading friend groups:', error);
      setFriendGroups([]);
      setSelectedGroup(null);
    }
  };

  const loadGroupLeaderboard = async () => {
    if (!selectedGroup) return;
    
    try {
      setLoading(true);
      const { data: members } = await supabase
        .from('group_members')
        .select(`
          user_id,
          profiles!inner(id, username, email, total_winnings, total_picks, correct_picks, win_rate, current_streak, best_streak)
        `)
        .eq('group_id', selectedGroup.id);

      const leaderboardData = (members || []).map((member, index) => {
        const profile = member.profiles;
        return {
          id: profile.id,
          username: profile.username || profile.email?.split('@')[0] || 'Unknown',
          totalPicks: profile.total_picks || 0,
          correctPicks: profile.correct_picks || 0,
          winRate: profile.win_rate || 0,
          totalWinnings: profile.total_winnings || 0,
          streak: profile.current_streak || 0,
          bestStreak: profile.best_streak || 0,
          rank: index + 1,
          isCurrentUser: profile.id === member.user_id,
        };
      }).sort((a, b) => b.totalWinnings - a.totalWinnings)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setGroupLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading group leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    try {
      if (!groupName.trim()) {
        Alert.alert('Error', 'Please enter a group name');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      // Check if user is already in a group
      const { data: existingMembership } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', uid)
        .single();

      if (existingMembership) {
        Alert.alert('Error', 'You can only be in one group at a time. Leave your current group first.');
        return;
      }

      // Create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('friend_groups')
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim(),
          owner_id: uid
        })
        .select('id, name, description, owner_id, invite_code, is_private')
        .single();

      if (groupError) throw groupError;

      // Add creator as first member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: uid
        });

      if (memberError) throw memberError;

      // Update local state
      setFriendGroups([newGroup]);
      setSelectedGroup(newGroup);
      setShowCreateGroupModal(false);
      setGroupName('');
      setGroupDescription('');

      Alert.alert('Success!', `Group "${newGroup.name}" created! Your invite code: ${newGroup.invite_code}`);
      loadGroupLeaderboard();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const inviteFriendToGroup = async () => {
    try {
      if (!inviteEmail.trim()) {
        Alert.alert('Error', 'Please enter an email address');
        return;
      }

      if (!selectedGroup) {
        Alert.alert('Error', 'No group selected');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      // Find user by email
      const { data: inviteeProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim())
        .single();

      if (profileError || !inviteeProfile) {
        Alert.alert('Error', 'User not found with that email address');
        return;
      }

      // Check if user is already in a group
      const { data: existingMembership } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', inviteeProfile.id)
        .single();

      if (existingMembership) {
        Alert.alert('Error', 'This user is already in a group');
        return;
      }

      // Send invitation
      const { error: inviteError } = await supabase
        .from('group_invitations')
        .insert({
          group_id: selectedGroup.id,
          from_user: uid,
          to_user: inviteeProfile.id
        });

      if (inviteError) {
        if (inviteError.code === '23505') { // Unique constraint violation
          Alert.alert('Error', 'Invitation already sent to this user');
        } else {
          throw inviteError;
        }
        return;
      }

      setInviteEmail('');
      setShowInviteModal(false);
      Alert.alert('Success!', 'Invitation sent!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Debug function to test group lookup
  const testGroupLookup = async (testCode) => {
    try {
      console.log('Testing group lookup for code:', testCode);
      
      const { data: groups, error } = await supabase
        .from('friend_groups')
        .select('id, name, invite_code, owner_id, is_private, created_at')
        .eq('invite_code', testCode.trim()); // Remove toUpperCase()
        
      console.log('Test result:', { groups, error });
      
      // Also try a general query to see all groups (for debugging)
      const { data: allGroups, error: allError } = await supabase
        .from('friend_groups')
        .select('id, name, invite_code, owner_id, is_private')
        .limit(10);
        
      console.log('All groups (first 10):', { allGroups, allError });
      
      // Test the exact code from the user's data (case sensitive)
      const { data: specificGroup, error: specificError } = await supabase
        .from('friend_groups')
        .select('*')
        .eq('invite_code', '4af615d4');
        
      console.log('Specific test for 4af615d4:', { specificGroup, specificError });
      
      Alert.alert(
        'Debug Result', 
        `Found ${groups?.length || 0} group(s) with code ${testCode}\n\nTotal groups visible: ${allGroups?.length || 0}\n\nSpecific 4af615d4 test: ${specificGroup?.length || 0} found\n\nCheck console for details.`
      );
      
      return { groups, error };
    } catch (err) {
      console.error('Test error:', err);
      return { groups: null, error: err };
    }
  };

  const joinGroupWithCode = async () => {
    try {
      if (!joinCode.trim()) {
        Alert.alert('Error', 'Please enter an invite code');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) {
        Alert.alert('Error', 'You must be logged in to join a group');
        return;
      }

      // Check if user is already in a group (handle case where no membership exists)
      const { data: existingMembership, error: membershipError } = await supabase
        .from('group_members')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record exists

      // Only block if there's actually an existing membership
      if (existingMembership && !membershipError) {
        Alert.alert('Error', 'You can only be in one group at a time. Leave your current group first.');
        return;
      }

      const cleanCode = joinCode.trim(); // Remove toUpperCase() - codes are case sensitive
      console.log('Searching for group with invite code:', cleanCode);

      // Find group by invite code with better error handling
      const { data: groups, error: groupError } = await supabase
        .from('friend_groups')
        .select('id, name, description, owner_id, invite_code, is_private')
        .eq('invite_code', cleanCode);

      console.log('Group search result:', { groups, groupError });

      if (groupError) {
        console.error('Database error searching for group:', groupError);
        Alert.alert('Error', 'Database error occurred. Please try again.');
        return;
      }

      if (!groups || groups.length === 0) {
        Alert.alert('Invalid Code', 'No group found with this invite code. Please check the code and try again.');
        return;
      }

      const group = groups[0];
      console.log('Found group:', group);

      // Check if user is trying to join their own group
      if (group.owner_id === uid) {
        Alert.alert('Error', 'You cannot join your own group.');
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: uid
        });

      if (joinError) {
        console.error('Error joining group:', joinError);
        if (joinError.code === '23505') { // Unique constraint violation
          Alert.alert('Error', 'You are already a member of this group.');
        } else {
          Alert.alert('Error', `Failed to join group: ${joinError.message}`);
        }
        return;
      }

      // Update local state
      setFriendGroups([group]);
      setSelectedGroup(group);
      setShowJoinModal(false);
      setJoinCode('');

      Alert.alert('Success!', `Welcome to "${group.name}"!`);
      loadGroupLeaderboard();
    } catch (error) {
      console.error('Unexpected error joining group:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message}`);
    }
  };

  const disbandGroup = async () => {
    try {
      if (!selectedGroup) {
        Alert.alert('Error', 'No group selected');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      // Check if user is the group owner
      if (selectedGroup.owner_id !== uid) {
        Alert.alert('Error', 'Only the group owner can disband the group');
        return;
      }

      Alert.alert(
        'Disband Group',
        `Are you sure you want to disband "${selectedGroup.name}"? This will remove all members and cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disband',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete the group (cascade will handle members and invitations)
                const { error } = await supabase
                  .from('friend_groups')
                  .delete()
                  .eq('id', selectedGroup.id);

                if (error) throw error;

                // Stay on the groups tab and reload the data.
                // The reload will find no groups and automatically show the empty state.
                setSelectedTab('groups');
                await loadFriendGroups();
                
              } catch (error) {
                Alert.alert('Error', `Error disbanding group: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const leaveGroup = async () => {
    try {
      if (!selectedGroup) {
        Alert.alert('Error', 'No group selected');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      Alert.alert(
        'Leave Group',
        `Are you sure you want to leave "${selectedGroup.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                // Remove user from group
                const { error } = await supabase
                  .from('group_members')
                  .delete()
                  .eq('group_id', selectedGroup.id)
                  .eq('user_id', uid);

                if (error) throw error;

                // Stay on the groups tab and reload the data.
                // The reload will find no groups and automatically show the empty state.
                setSelectedTab('groups');
                await loadFriendGroups();

              } catch (error) {
                Alert.alert('Error', `Error leaving group: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const getRankIcon = (rank) => {
    return `#${rank}`;
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return '#10b981';
    if (winRate >= 60) return '#f59e0b';
    if (winRate >= 50) return '#ef4444';
    return '#6b7280';
  };

  const getStreakColor = (streak) => {
    if (streak >= 5) return '#10b981';
    if (streak >= 3) return '#f59e0b';
    if (streak >= 1) return '#ef4444';
    return '#6b7280';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Leaderboard</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {selectedTab === 'city' ? `${userCity || 'Your City'}` : selectedGroup?.name || 'Friend Groups'}
        </Text>
      </View>

      {/* Timeframe Toggle */}
      <View style={styles.timeframeContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeframeScroll}
        >
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All Time' },
          ].map((timeframe) => (
            <TouchableOpacity
              key={timeframe.key}
              style={[
                styles.timeframeButton,
                { 
                  backgroundColor: selectedTab === timeframe.key ? theme.primary : 'transparent',
                  borderColor: selectedTab === timeframe.key ? theme.primary : theme.border,
                }
              ]}
              onPress={() => setSelectedTab(timeframe.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timeframeText,
                { 
                  color: selectedTab === timeframe.key ? theme.textInverse : theme.textSecondary,
                  fontWeight: selectedTab === timeframe.key ? '600' : '500'
                }
              ]}>
                {timeframe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Tabs */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            { backgroundColor: selectedTab === 'city' ? theme.primary : theme.surface, borderColor: theme.border }
          ]}
          onPress={() => setSelectedTab('city')}
        >
          <Text style={[
            styles.mainTabText,
            { color: selectedTab === 'city' ? theme.textInverse : theme.textSecondary }
          ]}>
            🏙️ {userLocation?.isLoading ? 'Detecting...' : (userLocation?.city || 'Your City')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTab,
            { backgroundColor: selectedTab === 'groups' ? theme.primary : theme.surface, borderColor: theme.border }
          ]}
          onPress={() => setSelectedTab('groups')}
        >
          <Text style={[
            styles.mainTabText,
            { color: selectedTab === 'groups' ? theme.textInverse : theme.textSecondary }
          ]}>
            👥 Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard List */}
      {selectedTab === 'groups' && friendGroups.length === 0 ? (
        <View style={styles.emptyGroupState}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Join the Competition!</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Create or join a friend group to compete with people you know.
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowCreateGroupModal(true)}
            >
              <Text style={styles.primaryButtonText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setShowJoinModal(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Join with Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
      <ScrollView style={styles.leaderboardContainer} showsVerticalScrollIndicator={false}>
          {(selectedTab === 'city' ? cityLeaderboard : groupLeaderboard).map((user, index) => (
          <View key={user.id} style={[
            styles.leaderboardItem,
            { backgroundColor: theme.surface },
            user.isCurrentUser && { borderLeftWidth: 4, borderLeftColor: theme.primary }
          ]}>
            <View style={styles.userRank}>
              <Text style={[styles.rankText, { color: user.rank <= 3 ? theme.primary : theme.textSecondary }]}>
                #{user.rank}
              </Text>
            </View>
            
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>{user.username?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.userMeta}>
                <Text style={[
                  styles.username,
                  { color: theme.textPrimary },
                  user.isCurrentUser && { fontWeight: '600' }
                ]}>
                  {user.username}{user.isCurrentUser ? ' (You)' : ''}
                </Text>
                <Text style={[styles.userStats, { color: theme.textSecondary }]}>
                  {user.totalPicks || 0} picks • {((user.correctPicks || 0) / Math.max(user.totalPicks || 1, 1) * 100).toFixed(0)}% win rate
                </Text>
              </View>
            </View>

            <View style={styles.userStats}>
              <Text style={[styles.winnings, { color: theme.success }]}>
                {formatCurrency(user.totalWinnings || 0)}
              </Text>
              <Text style={[styles.streak, { color: theme.textSecondary }]}>
                {user.streak || 0} streak
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      )}

      {/* Group Management Options */}
      {selectedTab === 'groups' && selectedGroup && (
        <View style={[styles.groupManagement, { backgroundColor: theme.backgroundSecondary, borderTopColor: theme.border }]}>
          <Text style={[styles.managementTitle, { color: theme.textPrimary }]}>Group Management</Text>
          <View style={styles.managementButtons}>
            <TouchableOpacity 
              style={[styles.managementButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => Alert.alert('Invite Code', `Share this code: ${selectedGroup.invite_code}`)}
            >
              <Text style={[styles.managementButtonText, { color: theme.textPrimary }]}>📋 Share Code</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.managementButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowInviteModal(true)}
            >
              <Text style={[styles.managementButtonText, { color: theme.textPrimary }]}>➕ Invite Friends</Text>
            </TouchableOpacity>
            {selectedGroup.owner_id === currentUserId ? (
              <TouchableOpacity 
                style={[styles.managementButton, { backgroundColor: theme.error, borderColor: theme.error }]}
                onPress={disbandGroup}
              >
                <Text style={[styles.managementButtonText, { color: '#ffffff' }]}>🗑️ Disband Group</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.managementButton, { backgroundColor: theme.error, borderColor: theme.error }]}
                onPress={leaveGroup}
              >
                <Text style={[styles.managementButtonText, { color: '#ffffff' }]}>🚪 Leave Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {selectedTab === 'groups' && selectedGroup ? (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowInviteModal(true)}
            >
              <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>Invite Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => Alert.alert('Invite Code', `Share this code: ${selectedGroup.invite_code}`)}
            >
              <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>Share Code</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.singleActionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          >
            <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>🎯 Make Pick</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Create Group</Text>
            <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
              <Text style={[styles.modalClose, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Group Name *</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Enter group name"
              placeholderTextColor={theme.textTertiary}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />

            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.descriptionInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="What's this group about?"
              placeholderTextColor={theme.textTertiary}
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              maxLength={200}
            />

            <Text style={[styles.modalNote, { color: theme.textSecondary }]}>
              • You can only be in one group at a time{'\n'}
              • You'll get a unique invite code to share with friends{'\n'}
              • Track betting stats and compete privately
          </Text>

            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={createGroup}
            >
              <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>
        </SafeAreaView>
      </Modal>

      {/* Invite Friends Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Invite to {selectedGroup?.name}</Text>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={[styles.modalClose, { color: theme.textSecondary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Friend's Email</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Enter email address"
              placeholderTextColor={theme.textTertiary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={inviteFriendToGroup}
            >
              <Text style={styles.createButtonText}>Send Invitation</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Or Share Invite Code</Text>
            <View style={[styles.codeContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Text style={[styles.inviteCode, { color: theme.textPrimary }]}>{selectedGroup?.invite_code}</Text>
              <TouchableOpacity 
                style={[styles.copyButton, { backgroundColor: theme.primary }]}
                onPress={() => Alert.alert('Copied!', 'Invite code copied to clipboard')}
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalNote, { color: theme.textSecondary }]}>
              Share this code with friends so they can join your group
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Join with Code Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Join Group</Text>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <Text style={[styles.modalClose, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Invite Code</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Enter 8-character code"
              placeholderTextColor={theme.textTertiary}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="none"
              maxLength={8}
              autoCorrect={false}
            />

            <Text style={[styles.modalNote, { color: theme.textSecondary }]}>
              • Ask your friend for their group's invite code{'\n'}
              • You can only be in one group at a time{'\n'}
              • Once you join, you'll compete on their leaderboard
            </Text>

            <View style={styles.joinButtonContainer}>
              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => testGroupLookup(joinCode)}
              >
                <Text style={[styles.testButtonText, { color: theme.textSecondary }]}>Test Code</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={joinGroupWithCode}
              >
                <Text style={styles.createButtonText}>Join Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Timeframe Toggle Styles
  timeframeContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeframeScroll: {
    paddingRight: 20,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    height: 28,
    justifyContent: 'center',
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '500',
  },

  mainTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '600',
  },

  leaderboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  leaderboardItem: {
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
  userRank: {
    width: 32,
    alignItems: 'flex-start',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userMeta: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userStats: {
    fontSize: 12,
    fontWeight: '500',
  },
  userStats: {
    alignItems: 'flex-end',
  },
  winnings: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  streak: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty State Styles
  emptyGroupState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActions: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  singleActionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  joinButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  testButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalNote: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  inviteCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  groupManagement: {
    padding: 16,
    borderTopWidth: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  managementButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  managementButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  managementButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LeaderboardScreen;
