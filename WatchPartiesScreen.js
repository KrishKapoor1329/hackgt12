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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Mock data for watch parties
const mockWatchParties = [
  {
    id: 1,
    hostName: 'GridironGuru',
    hostAvatar: 'GG',
    gameTitle: 'Chiefs vs Bills',
    gameTime: '8:15 PM EST',
    location: {
      latitude: 33.7490,
      longitude: -84.3880,
      address: 'Downtown Atlanta',
    },
    attendees: 8,
    maxAttendees: 12,
    reactions: ['FIRE', 'HYPE', 'WIN'],
    liveReactions: [
      { id: 1, user: 'GridironGuru', reaction: 'FIRE', text: 'TOUCHDOWN!!! LET\'S GO!!!', timestamp: Date.now() - 5000 },
      { id: 2, user: 'Mike_ATL', reaction: 'NICE', text: 'What a throw by Mahomes!', timestamp: Date.now() - 15000 },
      { id: 3, user: 'ChiefsNation', reaction: 'HYPE', text: 'Bills defense looking weak', timestamp: Date.now() - 30000 },
    ],
    distance: 0.5,
    isFriend: true,
    isOnline: false,
  },
  {
    id: 2,
    hostName: 'TouchdownTom',
    hostAvatar: 'TT',
    gameTitle: 'Cowboys vs Eagles',
    gameTime: '4:25 PM EST',
    location: {
      latitude: 33.7510,
      longitude: -84.3900,
      address: 'Midtown Atlanta',
    },
    attendees: 5,
    maxAttendees: 8,
    reactions: ['FLY', 'STAR', 'STRONG'],
    liveReactions: [
      { id: 4, user: 'TouchdownTom', reaction: 'FLY', text: 'Eagles soaring! Fly Eagles Fly!', timestamp: Date.now() - 8000 },
      { id: 5, user: 'PhillyFan', reaction: 'STAR', text: 'Dak looking shaky today', timestamp: Date.now() - 20000 },
      { id: 6, user: 'CowboyKiller', reaction: '💪', text: 'Defense stepping up big time!', timestamp: Date.now() - 45000 },
    ],
    distance: 1.2,
    isFriend: false,
    isOnline: true,
  },
  {
    id: 3,
    hostName: 'EndZoneExpert',
    hostAvatar: 'EZ',
    gameTitle: 'Falcons vs Saints',
    gameTime: '1:00 PM EST',
    location: {
      latitude: 33.7470,
      longitude: -84.3860,
      address: 'Georgia Tech Campus',
    },
    attendees: 15,
    maxAttendees: 20,
    reactions: ['🔴', '⚫', '🏈'],
    liveReactions: [
      { id: 7, user: 'EndZoneExpert', reaction: '🔴', text: 'RISE UP!!! Falcons TD!', timestamp: Date.now() - 3000 },
      { id: 8, user: 'ATLFalcon', reaction: '⚫', text: 'Our defense is on fire today!', timestamp: Date.now() - 12000 },
      { id: 9, user: 'TechStudent', reaction: '🏈', text: 'Saints looking confused out there', timestamp: Date.now() - 25000 },
      { id: 10, user: 'DirtyBird', reaction: '🔥', text: 'This is our year!!!', timestamp: Date.now() - 40000 },
    ],
    distance: 0.8,
    isFriend: true,
    isOnline: false,
  },
  {
    id: 4,
    hostName: 'VirtualVibes',
    hostAvatar: '📺',
    gameTitle: 'Packers vs Bears',
    gameTime: '8:20 PM EST',
    location: null, // Online only
    attendees: 23,
    maxAttendees: 50,
    reactions: ['🧀', '🐻', '❄️'],
    liveReactions: [
      { id: 11, user: 'VirtualVibes', reaction: '🧀', text: 'Rodgers with another perfect pass!', timestamp: Date.now() - 6000 },
      { id: 12, user: 'CheeseHead', reaction: '❄️', text: 'Cold weather = Packers weather!', timestamp: Date.now() - 18000 },
      { id: 13, user: 'BearsDown', reaction: '🐻', text: 'We need a miracle here...', timestamp: Date.now() - 35000 },
    ],
    distance: null,
    isFriend: true,
    isOnline: true,
  },
];

const WatchPartiesScreen = ({ onBack, onWatchPartySelect, theme, isDarkMode }) => {
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'friends', 'nearby'
  const [userLocation, setUserLocation] = useState({
    latitude: 33.7490,
    longitude: -84.3880,
  });
  const [watchParties, setWatchParties] = useState(mockWatchParties);
  const [selectedParty, setSelectedParty] = useState(null);

  useEffect(() => {
    // Simulate getting user location
    // In a real app, you'd use Expo Location API
    getCurrentLocation();
    
    // Simulate real-time reactions
    const interval = setInterval(() => {
      addRandomReaction();
    }, 8000); // New reaction every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const addRandomReaction = () => {
    const reactions = [
      { reaction: '🔥', texts: ['FIRE!!!', 'LET\'S GOOO!', 'AMAZING PLAY!', 'ON FIRE!'] },
      { reaction: '😤', texts: ['Come on ref!', 'That was a foul!', 'Terrible call!', 'No way!'] },
      { reaction: '🏆', texts: ['CHAMPIONS!', 'Winner winner!', 'Trophy time!', 'We got this!'] },
      { reaction: '💪', texts: ['STRONG!', 'Power move!', 'Beast mode!', 'Flexing on em!'] },
      { reaction: '⚡', texts: ['LIGHTNING FAST!', 'Speed demon!', 'Quick as flash!', 'Zoom zoom!'] },
    ];

    const usernames = ['GameFan23', 'SportsMaster', 'MVP_Player', 'ChampionVibes', 'EliteWatcher'];
    
    setWatchParties(prev => {
      const updatedParties = [...prev];
      const randomPartyIndex = Math.floor(Math.random() * updatedParties.length);
      const party = updatedParties[randomPartyIndex];
      
      if (party.location) { // Only add reactions to parties with locations (visible on map)
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        const randomText = randomReaction.texts[Math.floor(Math.random() * randomReaction.texts.length)];
        const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
        
        const newReaction = {
          id: Date.now(),
          user: randomUser,
          reaction: randomReaction.reaction,
          text: randomText,
          timestamp: Date.now(),
        };

        updatedParties[randomPartyIndex] = {
          ...party,
          liveReactions: [newReaction, ...party.liveReactions.slice(0, 4)] // Keep only latest 5 reactions
        };
      }
      
      return updatedParties;
    });
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
        return watchParties.filter(party => 
          party.location && party.distance && party.distance <= 2
        );
      default:
        return watchParties;
    }
  };

  const joinWatchParty = (partyId) => {
    Alert.alert(
      'Join Watch Party',
      'Would you like to join this watch party?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: () => {
            setWatchParties(prev => 
              prev.map(party => 
                party.id === partyId 
                  ? { ...party, attendees: party.attendees + 1 }
                  : party
              )
            );
            Alert.alert('Success!', 'You\'ve joined the watch party! 🎉');
          }
        },
      ]
    );
  };

  const createWatchParty = () => {
    Alert.alert(
      'Create Watch Party',
      'Create a new watch party for upcoming games!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create', onPress: () => Alert.alert('Coming Soon!', 'Watch party creation feature coming soon!') },
      ]
    );
  };

  const renderWatchPartyCard = ({ item }) => (
    <TouchableOpacity 
      style={[styles.partyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => onWatchPartySelect && onWatchPartySelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.partyHeader}>
        <View style={styles.hostInfo}>
          <Text style={styles.hostAvatar}>{item.hostAvatar}</Text>
          <View>
            <Text style={[styles.hostName, { color: theme.textPrimary }]}>{item.hostName}</Text>
            <Text style={[styles.gameTitle, { color: theme.primary }]}>{item.gameTitle}</Text>
          </View>
        </View>
        <View style={styles.partyMeta}>
          <Text style={[styles.gameTime, { color: theme.textSecondary }]}>{item.gameTime}</Text>
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
            {item.isOnline ? 'Online Watch Party' : item.location?.address}
          </Text>
          {item.distance && (
            <Text style={[styles.distanceText, { color: theme.textTertiary }]}>
              {item.distance} mi away
            </Text>
          )}
        </View>

        <View style={styles.attendeesInfo}>
          <Text style={[styles.attendeesText, { color: theme.textSecondary }]}>
            {item.attendees}/{item.maxAttendees} attending
          </Text>
          <View style={styles.reactionsContainer}>
            {item.reactions.map((reaction, index) => (
              <Text key={index} style={styles.reaction}>{reaction}</Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.tapToJoinText, { color: theme.textTertiary }]}>
          Tap to join watch party
        </Text>
        <Text style={[styles.statusText, { 
          color: item.attendees >= item.maxAttendees ? theme.error : theme.success 
        }]}>
          {item.attendees >= item.maxAttendees ? 'Full' : 'Available'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filteredParties = getFilteredParties();
  const mapParties = filteredParties.filter(party => party.location);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
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
          { key: 'nearby', label: 'Nearby (2mi)', icon: '◆' },
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

      {/* Google Map with Live Reactions */}
      {mapParties.length > 0 && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            customMapStyle={isDarkMode ? darkMapStyle : []}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* Watch Party Locations with Reaction Bubbles */}
            {mapParties.map((party) => (
              <Marker
                key={party.id}
                coordinate={party.location}
                onPress={() => setSelectedParty(party.id)}
              >
                <View style={[styles.partyMarker, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                  <Text style={styles.markerEmoji}>{party.hostAvatar}</Text>
                  <Text style={[styles.markerCount, { color: theme.textPrimary }]}>{party.attendees}</Text>
                  
                  {/* Live Reaction Indicator */}
                  {party.liveReactions.length > 0 && (
                    <View style={[styles.reactionIndicator, { backgroundColor: theme.success }]}>
                      <Text style={styles.reactionIndicatorText}>LIVE</Text>
                    </View>
                  )}
                </View>

                {/* Custom Callout with Live Reactions */}
                <Callout 
                  style={styles.calloutContainer}
                  onPress={() => joinWatchParty(party.id)}
                >
                  <View style={[styles.callout, { backgroundColor: theme.background }]}>
                    <View style={styles.calloutHeader}>
                      <Text style={[styles.calloutTitle, { color: theme.textPrimary }]}>{party.gameTitle}</Text>
                      <Text style={[styles.calloutHost, { color: theme.textSecondary }]}>by {party.hostName}</Text>
                    </View>
                    
                    {/* Live Reactions Bubble */}
                    <View style={styles.reactionsContainer}>
                      <Text style={[styles.reactionsTitle, { color: theme.primary }]}>🔴 LIVE REACTIONS</Text>
                      {party.liveReactions.slice(0, 3).map((reaction, index) => (
                        <View key={reaction.id} style={[styles.reactionBubble, { backgroundColor: theme.surface }]}>
                          <View style={styles.reactionHeader}>
                            <Text style={styles.reactionEmoji}>{reaction.reaction}</Text>
                            <Text style={[styles.reactionUser, { color: theme.textSecondary }]}>{reaction.user}</Text>
                            <Text style={[styles.reactionTime, { color: theme.textTertiary }]}>
                              {Math.floor((Date.now() - reaction.timestamp) / 1000)}s ago
                            </Text>
                          </View>
                          <Text style={[styles.reactionText, { color: theme.textPrimary }]}>{reaction.text}</Text>
                        </View>
                      ))}
                      
                      <TouchableOpacity 
                        style={[styles.joinFromMapButton, { backgroundColor: theme.primary }]}
                        onPress={() => onWatchPartySelect && onWatchPartySelect(party)}
                      >
                        <Text style={styles.joinFromMapButtonText}>Join Party ({party.attendees}/{party.maxAttendees})</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      )}

      {/* Watch Parties List */}
      <View style={styles.listContainer}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {selectedFilter === 'friends' ? 'Friends\' Watch Parties' : 
           selectedFilter === 'nearby' ? 'Watch Parties Near You' : 
           'All Watch Parties'} ({filteredParties.length})
        </Text>
        
        <FlatList
          data={filteredParties}
          renderItem={renderWatchPartyCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
};

// Dark map style for Google Maps with purple theme
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1e1b4b' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c4b5fd' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1e1b4b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#312e81' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#4c1d95' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#6b21a8' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#312e81' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#8b5cf6' }],
  },
];

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
  mapContainer: {
    height: height * 0.3,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 20,
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  mapLegend: {
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  userMarker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  markerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  partyMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    position: 'relative',
  },
  markerEmoji: {
    fontSize: 18,
  },
  markerCount: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  reactionIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  reactionIndicatorText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  calloutContainer: {
    width: 280,
  },
  callout: {
    borderRadius: 12,
    padding: 12,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutHeader: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  calloutHost: {
    fontSize: 12,
  },
  reactionsContainer: {
    flex: 1,
  },
  reactionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  reactionBubble: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionUser: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  reactionTime: {
    fontSize: 9,
  },
  reactionText: {
    fontSize: 12,
    lineHeight: 16,
  },
  joinFromMapButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  joinFromMapButtonText: {
    color: '#ffffff',
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
    fontSize: 24,
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
  reaction: {
    fontSize: 16,
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
});

export default WatchPartiesScreen;