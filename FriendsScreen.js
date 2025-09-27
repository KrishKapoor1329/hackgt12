import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import supabase from './supabaseClient';

const FriendsScreen = ({ onBack, theme, isDarkMode }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [emailQuery, setEmailQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      // Get friends list first
      const { data: friendsData, error } = await supabase
        .from('friends')
        .select('friend_id, created_at')
        .eq('user_id', uid);

      if (error) throw error;

      if (friendsData && friendsData.length > 0) {
        // Get profile info for all friends
        const friendIds = friendsData.map(f => f.friend_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email, phone, avatar_url')
          .in('id', friendIds);

        if (profilesError) throw profilesError;

        // Combine friends data with profile data
        const combinedData = friendsData.map(friend => ({
          ...friend,
          friend_profile: profilesData?.find(p => p.id === friend.friend_id)
        }));

        setFriends(combinedData);
      } else {
        setFriends([]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const uid = sessionData?.session?.user?.id;
              if (!uid) return;

              // Remove both directions of friendship
              await supabase
                .from('friends')
                .delete()
                .or(`and(user_id.eq.${uid},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${uid})`);

              // Refresh friends list
              loadFriends();
              Alert.alert('Removed', 'Friend has been removed');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const loadRequests = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      
      const { data: incoming } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('to_user', uid)
        .eq('status', 'pending');
      
      setIncomingRequests(incoming || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const searchByEmailOrPhone = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      
      const email = emailQuery.trim();
      const phone = phoneQuery.trim();
      if (!email && !phone) {
        Alert.alert('Enter a query', 'Provide email or phone');
        return;
      }
      
      let query = supabase.from('profiles').select('id, username, email, phone');
      if (email) {
        query = query.eq('email', email);
      } else if (phone) {
        query = query.ilike('phone', `%${phone}%`);
      }
      
      const { data, error } = await query.limit(10);
      if (error) throw error;
      
      setSearchResults((data || []).filter((r) => r.id !== uid));
    } catch (e) {
      Alert.alert('Search error', e.message);
    }
  };

  const sendFriendRequest = async (toUserId) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      
      const { error } = await supabase.from('friend_requests').insert({ from_user: uid, to_user: toUserId });
      if (error) throw error;
      
      Alert.alert('Request sent', 'Friend request has been sent');
      setSearchResults([]);
      setEmailQuery('');
      setPhoneQuery('');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const respondToRequest = async (requestId, status) => {
    try {
      const { error } = await supabase.from('friend_requests').update({ status }).eq('id', requestId);
      if (error) throw error;
      
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      Alert.alert('Updated', `Request ${status}`);
      
      if (status === 'accepted') {
        loadFriends(); // Refresh friends list
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const renderFriendCard = ({ item }) => {
    const profile = item.friend_profile;
    const displayName = profile?.username || profile?.email?.split('@')[0] || 'Unknown User';
    const friendSince = new Date(item.created_at).toLocaleDateString();

    return (
      <View style={[styles.friendCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.friendInfo}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          
          <View style={styles.friendDetails}>
            <Text style={[styles.friendName, { color: theme.textPrimary }]}>
              {displayName}
            </Text>
            <Text style={[styles.friendEmail, { color: theme.textSecondary }]}>
              {profile?.email}
            </Text>
            <Text style={[styles.friendSince, { color: theme.textTertiary }]}>
              Friends since {friendSince}
            </Text>
          </View>
        </View>

        <View style={styles.friendActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => Alert.alert('Message', `Message ${displayName} - Feature coming soon!`)}
          >
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error, borderColor: theme.error }]}
            onPress={() => removeFriend(profile?.id)}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Friends</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Incoming Requests Badge */}
      {incomingRequests.length > 0 && (
        <View style={[styles.requestsBanner, { backgroundColor: theme.success }]}>
          <Text style={styles.requestsBannerText}>
            {incomingRequests.length} pending friend request{incomingRequests.length > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Text style={styles.requestsBannerAction}>View</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Friends List */}
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading friends...</Text>
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Friends Yet</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Add friends in Settings to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendCard}
          keyExtractor={(item) => item.friend_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Friend Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Add Friends</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.modalClose, { color: theme.textSecondary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Search by Email or Phone</Text>
              
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="Enter email"
                placeholderTextColor={theme.textTertiary}
                value={emailQuery}
                onChangeText={setEmailQuery}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="Enter phone number"
                placeholderTextColor={theme.textTertiary}
                value={phoneQuery}
                onChangeText={setPhoneQuery}
                keyboardType="phone-pad"
              />
              
              <TouchableOpacity 
                style={[styles.searchButton, { backgroundColor: theme.primary }]} 
                onPress={searchByEmailOrPhone}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.searchSection}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Search Results</Text>
                {searchResults.map((user) => (
                  <View key={user.id} style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.resultName, { color: theme.textPrimary }]}>
                      {user.username || user.email || user.phone}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.requestButton, { backgroundColor: theme.primary }]}
                      onPress={() => sendFriendRequest(user.id)}
                    >
                      <Text style={styles.requestButtonText}>Send Request</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <View style={styles.searchSection}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pending Requests</Text>
                {incomingRequests.map((request) => (
                  <View key={request.id} style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.resultName, { color: theme.textPrimary }]}>
                      From: {request.from_user.slice(0,8)}...
                    </Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={[styles.requestButton, { backgroundColor: theme.success }]}
                        onPress={() => respondToRequest(request.id, 'accepted')}
                      >
                        <Text style={styles.requestButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.requestButton, { backgroundColor: theme.error, marginLeft: 8 }]}
                        onPress={() => respondToRequest(request.id, 'declined')}
                      >
                        <Text style={styles.requestButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  requestsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  requestsBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  requestsBannerAction: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 20,
  },
  friendCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  friendSince: {
    fontSize: 12,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  addFriendButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addFriendButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
  },
  searchSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    flex: 1,
  },
  requestButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
  },
});

export default FriendsScreen;
