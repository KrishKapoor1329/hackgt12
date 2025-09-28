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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CreateWatchPartyScreen from './CreateWatchPartyScreen';
import TeamSelectionScreen from './TeamSelectionScreen';
import { supabase } from './supabaseClient';

const { width, height } = Dimensions.get('window');

const WatchPartiesScreen = ({ onBack, onWatchPartySelect, theme, isDarkMode }) => {
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'friends', 'nearby'
  const [userLocation, setUserLocation] = useState({
    latitude: 33.7490,
    longitude: -84.3880,
  });
  const [watchParties, setWatchParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedWatchParty, setSelectedWatchParty] = useState(null);

  useEffect(() => {
    getCurrentLocation();
    fetchWatchParties();
    
    // Set up real-time subscription for watch party updates
    const watchPartiesSubscription = supabase
      .channel('watch_parties_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'watch_parties'
        }, 
        () => {
          console.log('Watch party updated, refreshing...');
          fetchWatchParties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(watchPartiesSubscription);
    };
  }, []);

  const fetchWatchParties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('watch_parties')
      .select(`
        *,
        host:profiles ( username, avatar_url )
      `);

    if (error) {
      console.error('Error fetching watch parties', error);
      Alert.alert('Error', 'Could not fetch watch parties.');
    } else {
      setWatchParties(data);
    }
    setLoading(false);
  };

  const getCurrentLocation = () => {
    // Mock location for demo
    setUserLocation({
      latitude: 33.7490,
      longitude: -84.3880,
    });
  };

  const getFilteredParties = () => {
    switch (selectedFilter) {
      case 'friends':
        return watchParties.filter(party => party.isFriend);
      case 'nearby':
        return watchParties; // All parties are virtual, so show all for nearby
      default:
        return watchParties;
    }
  };

  const joinWatchParty = async (partyId) => {
    const party = watchParties.find(p => p.id === partyId);
    
    // Check if user is already a member
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Error', 'Please log in to join a watch party.');
      return;
    }

    const { data: existingMember } = await supabase
      .from('watch_party_members')
      .select('*')
      .eq('watch_party_id', partyId)
      .eq('user_id', session.user.id)
      .single();

    if (existingMember) {
      Alert.alert('Already Joined', 'You are already a member of this watch party!');
      return;
    }
    
    setSelectedWatchParty(party);
    setShowTeamSelection(true);
  };

  const handleTeamSelected = async (team) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Error', 'Please log in to join a watch party.');
        return;
      }

      // Check if user is the host (hosts can't join their own party)
      if (selectedWatchParty.host_id === session.user.id) {
        Alert.alert('Already Joined', 'You are the host of this watch party!');
        setShowTeamSelection(false);
        setSelectedWatchParty(null);
        return;
      }

      // Join the watch party with team preference
      const { error } = await supabase
        .from('watch_party_members')
        .insert({
          watch_party_id: selectedWatchParty.id,
          user_id: session.user.id,
          team_preference: team.id.toLowerCase(), // 'phi' or 'kc'
          team_data: team,
          status: 'approved'
        });

      if (error) {
        console.error('Error joining watch party:', error);
        if (error.code === '23505') { // Unique constraint violation
          Alert.alert('Already Joined', 'You are already a member of this watch party!');
        } else {
          Alert.alert('Error', 'Failed to join watch party. Please try again.');
        }
        return;
      }

      // The database trigger will handle incrementing the attendee count
      Alert.alert(
        'Joined Successfully! 🎉',
        `You've joined the watch party as a ${team.name} fan!`
      );

      // Optimistic UI: bump attendee_count locally
      setWatchParties(prev => prev.map(p =>
        p.id === selectedWatchParty.id
          ? { ...p, attendee_count: (p.attendee_count || 1) + 1 }
          : p
      ));

      setShowTeamSelection(false);
      setSelectedWatchParty(null);
    } catch (error) {
      console.error('Unexpected error joining watch party:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleTeamSkipped = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Error', 'Please log in to join a watch party.');
        return;
      }

      // Check if user is the host (hosts can't join their own party)
      if (selectedWatchParty.host_id === session.user.id) {
        Alert.alert('Already Joined', 'You are the host of this watch party!');
        setShowTeamSelection(false);
        setSelectedWatchParty(null);
        return;
      }

      // Join the watch party without team preference
      const { error } = await supabase
        .from('watch_party_members')
        .insert({
          watch_party_id: selectedWatchParty.id,
          user_id: session.user.id,
          team_preference: 'neutral',
          team_data: null,
          status: 'approved'
        });

      if (error) {
        console.error('Error joining watch party:', error);
        if (error.code === '23505') { // Unique constraint violation
          Alert.alert('Already Joined', 'You are already a member of this watch party!');
        } else {
          Alert.alert('Error', 'Failed to join watch party. Please try again.');
        }
        return;
      }

      // The database trigger will handle incrementing the attendee count
      Alert.alert(
        'Joined Successfully! 🎉',
        'You\'ve joined the watch party as a neutral fan!'
      );

      // Optimistic UI: bump attendee_count locally
      setWatchParties(prev => prev.map(p =>
        p.id === selectedWatchParty.id
          ? { ...p, attendee_count: (p.attendee_count || 1) + 1 }
          : p
      ));

      setShowTeamSelection(false);
      setSelectedWatchParty(null);
    } catch (error) {
      console.error('Unexpected error joining watch party:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const createWatchParty = () => {
    setShowCreateScreen(true);
  };

  const handleWatchPartyCreated = (newWatchParty) => {
    setWatchParties(prev => [newWatchParty, ...prev]);
    setShowCreateScreen(false);
  };

  const renderWatchPartyCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.partyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => onWatchPartySelect && onWatchPartySelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.partyHeader}>
        <View style={styles.hostInfo}>
          {item.host?.avatar_url ? (
            <Image 
              source={{ uri: item.host.avatar_url }} 
              style={styles.hostAvatar}
            />
          ) : (
            <Text style={styles.hostAvatarText}>👤</Text>
          )}
          <View>
            <Text style={[styles.hostName, { color: theme.textPrimary }]}>{item.host?.username || 'A Fan'}</Text>
            <Text style={[styles.gameTitle, { color: theme.primary }]}>{item.game_title}</Text>
          </View>
        </View>
        <View style={styles.partyMeta}>
          <Text style={[styles.gameTime, { color: theme.textSecondary }]}>{new Date(item.game_time).toLocaleTimeString()}</Text>
          {item.isFriend && (
            <View style={[styles.badge, { backgroundColor: theme.success }]}>
              <Text style={styles.badgeText}>Friend</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.partyDetails}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={[styles.locationText, { color: theme.textSecondary }]}>
            Virtual Watch Party
          </Text>
          {item.distance && (
            <Text style={[styles.distanceText, { color: theme.textTertiary }]}>
              {item.distance} mi away
            </Text>
          )}
        </View>

        <View style={styles.attendeesInfo}>
          <Text style={[styles.attendeesText, { color: theme.textSecondary }]}>
            {item.attendee_count} attending
          </Text>
          <View style={styles.reactionsContainer}>
            {/* Show team preferences */}
            <Image 
              source={require('./philly.png')} 
              style={styles.reactionLogo}
              resizeMode="contain"
            />
            <Image 
              source={require('./kansas.png')} 
              style={styles.reactionLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.tapToJoinText, { color: theme.textTertiary }]}>
          Tap to join watch party
        </Text>
        <Text style={[styles.statusText, { color: theme.success }]}>
          Available
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filteredParties = getFilteredParties();

  if (showCreateScreen) {
    return (
      <CreateWatchPartyScreen
        onBack={() => setShowCreateScreen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        onWatchPartyCreated={handleWatchPartyCreated}
      />
    );
  }

  if (showTeamSelection) {
    return (
      <TeamSelectionScreen
        watchParty={selectedWatchParty}
        theme={theme}
        isDarkMode={isDarkMode}
        onTeamSelected={handleTeamSelected}
        onSkip={handleTeamSkipped}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Watch Parties</Text>
        </View>
        <TouchableOpacity onPress={createWatchParty} style={styles.createButton}>
          <Text style={[styles.createButtonText, { color: theme.primary }]}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All Parties', icon: '●' },
          { key: 'friends', label: 'Friends', icon: '◉' },
          { key: 'nearby', label: 'Atlanta Parties', icon: '◆' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              { 
                backgroundColor: theme.surface, 
                borderColor: theme.border,
                transform: [{ scale: selectedFilter === filter.key ? 1.05 : 1 }]
              },
              selectedFilter === filter.key && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => setSelectedFilter(filter.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterIcon}>{filter.icon}</Text>
            <Text style={[
              styles.filterLabel,
              { color: theme.textSecondary },
              selectedFilter === filter.key && { color: '#ffffff' }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>



      {/* Watch Parties List */}
      <View style={styles.listContainer}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {selectedFilter === 'friends' ? 'Friends\' Watch Parties' : 
           selectedFilter === 'nearby' ? 'All Watch Parties' : 
           'All Watch Parties'} ({filteredParties.length})
        </Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
        ) : filteredParties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No watch parties found.
            </Text>
            <TouchableOpacity onPress={createWatchParty} style={[styles.emptyCreateButton, { backgroundColor: theme.primary }]}>
              <Text style={[styles.emptyCreateButtonText, { color: theme.primaryText || '#ffffff' }]}>+ Create a Watch Party</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredParties}
            renderItem={renderWatchPartyCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  createButton: {
    padding: 5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Info Card
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  teamColors: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  teamColorItem: {
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  partyCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  partyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  hostAvatarText: {
    fontSize: 24,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  partyMeta: {
    alignItems: 'flex-end',
  },
  gameTime: {
    fontSize: 12,
    marginBottom: 5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  partyDetails: {
    marginBottom: 15,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 5,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
  },
  attendeesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 14,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  reactionLogo: {
    width: 24,
    height: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  tapToJoinText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  emptyCreateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  emptyCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WatchPartiesScreen;