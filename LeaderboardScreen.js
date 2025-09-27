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
  {
    id: 3,
    username: 'You',
    avatar: 'ME',
    totalPicks: 38,
    correctPicks: 24,
    winRate: 63.2,
    totalWinnings: 1890,
    streak: 3,
    rank: 3,
    isCurrentUser: true,
  },
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

const LeaderboardScreen = ({ onBack, theme, isDarkMode }) => {
  const [selectedTab, setSelectedTab] = useState('city'); // city, groups
  const [selectedLeague, setSelectedLeague] = useState('NFL'); // NFL, NBA
  const [cityLeaderboard, setCityLeaderboard] = useState([]);
  const [friendGroups, setFriendGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupLeaderboard, setGroupLeaderboard] = useState([]);
  const [userCity, setUserCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
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
  }, [selectedTab, selectedGroup]);

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

      // Get user's city first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', uid)
        .single();

      if (!userProfile?.city) {
        // Use mock data if no city set
        setCityLeaderboard(mockLeaderboardData);
        return;
      }

      // Get city leaderboard
      const { data: cityData } = await supabase
        .from('profiles')
        .select('id, username, email, total_winnings, total_picks, correct_picks, win_rate, current_streak, best_streak')
        .eq('city', userProfile.city)
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
      setCityLeaderboard(mockLeaderboardData);
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
          friend_groups(id, name, description, owner_id, invite_code)
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
        .select('id, name, description, owner_id, invite_code')
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

  const joinGroupWithCode = async () => {
    try {
      if (!joinCode.trim()) {
        Alert.alert('Error', 'Please enter an invite code');
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

      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from('friend_groups')
        .select('id, name, description, owner_id, invite_code')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (groupError || !group) {
        Alert.alert('Error', 'Invalid invite code. Please check and try again.');
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: uid
        });

      if (joinError) throw joinError;

      // Update local state
      setFriendGroups([group]);
      setSelectedGroup(group);
      setShowJoinModal(false);
      setJoinCode('');

      Alert.alert('Success!', `Welcome to "${group.name}"!`);
      loadGroupLeaderboard();
    } catch (error) {
      Alert.alert('Error', error.message);
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
        <View style={styles.logoContainer}>
          <Image source={require('./assets/image.png')} style={styles.logo} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>Leaderboard</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {selectedTab === 'city' ? `${userCity || 'Your City'}` : selectedGroup?.name || 'Friend Groups'} • NFL
        </Text>
      </View>

      {/* Main Tabs */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            { backgroundColor: theme.surface, borderColor: theme.border },
            selectedTab === 'city' && { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={() => setSelectedTab('city')}
        >
          <Text style={[
            styles.mainTabText,
            { color: theme.textSecondary },
            selectedTab === 'city' && { color: theme.textInverse }
          ]}>
            🏙️ Your City
          </Text>
        </TouchableOpacity>
          <TouchableOpacity
            style={[
            styles.mainTab,
              { backgroundColor: theme.surface, borderColor: theme.border },
            selectedTab === 'groups' && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
          onPress={() => setSelectedTab('groups')}
          >
            <Text style={[
            styles.mainTabText,
              { color: theme.textSecondary },
            selectedTab === 'groups' && { color: theme.textInverse }
            ]}>
            👥 Friend Groups
            </Text>
          </TouchableOpacity>
      </View>


      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>1,247</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Players</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>$2.8K</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Top Winnings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>68.1%</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best Win Rate</Text>
        </View>
      </View>

      {/* Leaderboard List */}
      {selectedTab === 'groups' && friendGroups.length === 0 ? (
        <View style={styles.emptyGroupState}>
          <Text style={styles.emptyGroupIcon}>👥</Text>
          <Text style={[styles.emptyGroupTitle, { color: theme.textPrimary }]}>You're not in a group yet</Text>
          <Text style={[styles.emptyGroupText, { color: theme.textSecondary }]}>
            Either create your own group or ask your friends to invite you to theirs
          </Text>
          <View style={styles.emptyGroupActions}>
            <TouchableOpacity 
              style={[styles.emptyGroupButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowCreateGroupModal(true)}
            >
              <Text style={styles.emptyGroupButtonText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.emptyGroupButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => setShowJoinModal(true)}
            >
              <Text style={[styles.emptyGroupButtonText, { color: theme.textPrimary }]}>Join with Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
      <ScrollView style={styles.leaderboardContainer} showsVerticalScrollIndicator={false}>
          {(selectedTab === 'city' ? cityLeaderboard : groupLeaderboard).map((user, index) => (
          <View key={user.id} style={[
            styles.leaderboardItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
            user.isCurrentUser && { borderColor: theme.primary, backgroundColor: theme.backgroundSecondary }
          ]}>
            <View style={styles.rankContainer}>
              <Text style={styles.rankIcon}>{getRankIcon(user.rank)}</Text>
            </View>
            
            <View style={styles.userInfo}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatar}>{user.avatar}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[
                  styles.username,
                  { color: theme.textPrimary },
                  user.isCurrentUser && { color: theme.primary }
                ]}>
                  {user.username}
                </Text>
                <Text style={[styles.picksText, { color: theme.textSecondary }]}>
                  {user.totalPicks} picks • {user.correctPicks} correct
                </Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={[
                  styles.winRate,
                  { color: getWinRateColor(user.winRate) }
                ]}>
                  {user.winRate}%
                </Text>
                <Text style={[styles.winnings, { color: theme.success }]}>
                  {formatCurrency(user.totalWinnings)}
                </Text>
              </View>
              <View style={styles.streakContainer}>
                <Text style={[
                  styles.streakText,
                  { color: getStreakColor(user.streak) }
                ]}>
                  {user.streak} game streak
                </Text>
              </View>
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
          <>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>View My Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>Make Pick</Text>
            </TouchableOpacity>
          </>
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
              autoCapitalize="characters"
              maxLength={8}
              autoCorrect={false}
            />

            <Text style={[styles.modalNote, { color: theme.textSecondary }]}>
              • Ask your friend for their group's invite code{'\n'}
              • You can only be in one group at a time{'\n'}
              • Once you join, you'll compete on their leaderboard
            </Text>

            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={joinGroupWithCode}
            >
              <Text style={styles.createButtonText}>Join Group</Text>
            </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    marginTop: 10,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
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
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  leaderboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  picksText: {
    fontSize: 12,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statRow: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  winRate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  winnings: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakContainer: {
    alignItems: 'flex-end',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '500',
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
  // Empty group state styles
  emptyGroupState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyGroupIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyGroupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyGroupText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyGroupActions: {
    gap: 12,
    width: '100%',
  },
  emptyGroupButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyGroupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    borderRadius: 12,
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
    borderRadius: 10,
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
    borderRadius: 6,
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
