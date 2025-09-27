import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import supabase from './supabaseClient';

export default function SettingsScreen({ navigation, theme, isDarkMode, setIsDarkMode }) {
  const [selectedLeague, setSelectedLeague] = useState('NFL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState({
    twitter: { connected: false, username: '' },
    discord: { connected: false, username: '' },
  });
  const [showSocialInputs, setShowSocialInputs] = useState({
    twitter: false,
    discord: false,
  });
  const [socialInputValues, setSocialInputValues] = useState({
    twitter: '',
    discord: '',
  });

  const [searchResults, setSearchResults] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      
      // Get incoming requests with sender profile info
      const { data: incoming } = await supabase
        .from('friend_requests')
        .select(`
          *,
          from_profile:profiles!friend_requests_from_user_fkey(username, email)
        `)
        .eq('to_user', uid)
        .eq('status', 'pending');
      
      // Get outgoing requests with receiver profile info
      const { data: outgoing } = await supabase
        .from('friend_requests')
        .select(`
          *,
          to_profile:profiles!friend_requests_to_user_fkey(username, email)
        `)
        .eq('from_user', uid)
        .eq('status', 'pending');
      
      setIncomingRequests(incoming || []);
      setOutgoingRequests(outgoing || []);
    };
    loadRequests();
  }, []);

  const handleLeagueSelection = (league) => {
    setSelectedLeague(league);
    Alert.alert('League Updated', `Now following ${league} games and picks!`);
  };

  const handleFindFriends = () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }
    Alert.alert('Finding Friends', `Searching for friends with number ending in ${phoneNumber.slice(-4)}...`);
  };

  const searchByEmailOrPhone = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      const email = emailQuery.trim();
      const phone = phoneNumber.trim();
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
      setOutgoingRequests((prev) => prev.concat([{ id: Date.now().toString(), from_user: uid, to_user: toUserId, status: 'pending' }]));
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
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSocialMediaLink = (platform) => {
    if (linkedAccounts[platform].connected) {
      // Disconnect
      setLinkedAccounts(prev => ({
        ...prev,
        [platform]: { connected: false, username: '' }
      }));
      Alert.alert(
        platform === 'twitter' ? 'Twitter' : 'Discord',
        'Account unlinked successfully'
      );
    } else {
      // Show input field
      setShowSocialInputs(prev => ({
        ...prev,
        [platform]: true
      }));
    }
  };

  const handleSocialMediaConnect = (platform) => {
    const username = socialInputValues[platform];
    if (!username.trim()) {
      Alert.alert('Invalid Username', 'Please enter a valid username');
      return;
    }
    
    setLinkedAccounts(prev => ({
      ...prev,
      [platform]: { connected: true, username: username.trim() }
    }));
    setShowSocialInputs(prev => ({
      ...prev,
      [platform]: false
    }));
    setSocialInputValues(prev => ({
      ...prev,
      [platform]: ''
    }));
    Alert.alert(
      platform === 'twitter' ? 'Twitter' : 'Discord',
      `Successfully linked @${username.trim()}!`
    );
  };

  const handleSocialMediaCancel = (platform) => {
    setShowSocialInputs(prev => ({
      ...prev,
      [platform]: false
    }));
    setSocialInputValues(prev => ({
      ...prev,
      [platform]: ''
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.logoContainer}>
          <Image source={require('./assets/image.png')} style={styles.logo} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Theme Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isDarkMode ? '#ffffff' : theme.textSecondary}
            />
          </View>
        </View>
        
        {/* League Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>League Preferences</Text>
          <View style={styles.leagueContainer}>
            <TouchableOpacity
              style={[
                styles.leagueButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                selectedLeague === 'NFL' && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => handleLeagueSelection('NFL')}
            >
              <Text style={[
                styles.leagueButtonText,
                { color: theme.textSecondary },
                selectedLeague === 'NFL' && { color: theme.textInverse }
              ]}>
                NFL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.leagueButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                selectedLeague === 'NBA' && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => handleLeagueSelection('NBA')}
            >
              <Text style={[
                styles.leagueButtonText,
                { color: theme.textSecondary },
                selectedLeague === 'NBA' && { color: theme.textInverse }
              ]}>
                NBA
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.leagueNote, { color: theme.textTertiary }]}>
            Currently pulling NFL data only. NBA support coming soon!
          </Text>
        </View>

        {/* Friends & Social */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Friends & Social</Text>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Show Online Status</Text>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={showOnlineStatus ? '#ffffff' : theme.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Find Friends by Email or Phone</Text>
            <TextInput
              style={[styles.phoneInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Enter email"
              placeholderTextColor={theme.textTertiary}
              value={emailQuery}
              onChangeText={setEmailQuery}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.phoneInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Enter phone number"
              placeholderTextColor={theme.textTertiary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={[styles.findButton, { backgroundColor: theme.primary }]} onPress={searchByEmailOrPhone}>
              <Text style={styles.findButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Results</Text>
              {searchResults.map((u) => (
                <View key={u.id} style={styles.resultRow}>
                  <Text style={[styles.resultText, { color: theme.textPrimary }]}>{u.username || u.email || u.phone}</Text>
                  <TouchableOpacity style={[styles.resultButton, { backgroundColor: theme.primary }]} onPress={() => sendFriendRequest(u.id)}>
                    <Text style={styles.resultButtonText}>Request</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {incomingRequests.length > 0 && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Incoming Requests</Text>
              {incomingRequests.map((r) => (
                <View key={r.id} style={styles.resultRow}>
                  <Text style={[styles.resultText, { color: theme.textPrimary }]}>From: {r.from_user.slice(0,8)}…</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={[styles.resultButton, { backgroundColor: theme.success }]} onPress={() => respondToRequest(r.id, 'accepted')}>
                      <Text style={styles.resultButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.resultButton, { backgroundColor: theme.error }]} onPress={() => respondToRequest(r.id, 'declined')}>
                      <Text style={styles.resultButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Social Media Linking */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Social Media</Text>
          
          {/* Twitter */}
          <View style={styles.socialItem}>
            <View style={styles.socialInfo}>
              <Text style={styles.socialIcon}>🐦</Text>
              <View style={styles.socialDetails}>
                <Text style={[styles.socialName, { color: theme.textPrimary }]}>Twitter</Text>
                <Text style={[styles.socialStatus, { color: theme.textSecondary }]}>
                  {linkedAccounts.twitter.connected 
                    ? `Connected as ${linkedAccounts.twitter.username}` 
                    : 'Not connected'
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.socialToggle,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                linkedAccounts.twitter.connected && { backgroundColor: theme.error, borderColor: theme.error }
              ]}
              onPress={() => handleSocialMediaLink('twitter')}
            >
              <Text style={styles.socialToggleText}>
                {linkedAccounts.twitter.connected ? 'DISCONNECT' : 'CONNECT'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Twitter Input */}
          {showSocialInputs.twitter && (
            <View style={[styles.socialInputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Text style={[styles.socialInputLabel, { color: theme.textPrimary }]}>Enter your Twitter username:</Text>
              <TextInput
                style={[styles.socialInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="@username"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                value={socialInputValues.twitter}
                onChangeText={(text) => setSocialInputValues(prev => ({ ...prev, twitter: text }))}
                onSubmitEditing={() => handleSocialMediaConnect('twitter')}
              />
              <View style={styles.socialInputButtons}>
                <TouchableOpacity 
                  style={[styles.socialInputButton, { backgroundColor: theme.surfaceSecondary }]}
                  onPress={() => handleSocialMediaCancel('twitter')}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialInputButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleSocialMediaConnect('twitter')}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Discord */}
          <View style={styles.socialItem}>
            <View style={styles.socialInfo}>
              <Text style={styles.socialIcon}>💬</Text>
              <View style={styles.socialDetails}>
                <Text style={[styles.socialName, { color: theme.textPrimary }]}>Discord</Text>
                <Text style={[styles.socialStatus, { color: theme.textSecondary }]}>
                  {linkedAccounts.discord.connected 
                    ? `Connected as ${linkedAccounts.discord.username}` 
                    : 'Not connected'
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.socialToggle,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                linkedAccounts.discord.connected && { backgroundColor: theme.error, borderColor: theme.error }
              ]}
              onPress={() => handleSocialMediaLink('discord')}
            >
              <Text style={styles.socialToggleText}>
                {linkedAccounts.discord.connected ? 'DISCONNECT' : 'CONNECT'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Discord Input */}
          {showSocialInputs.discord && (
            <View style={[styles.socialInputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Text style={[styles.socialInputLabel, { color: theme.textPrimary }]}>Enter your Discord username:</Text>
              <TextInput
                style={[styles.socialInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="username#1234"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                value={socialInputValues.discord}
                onChangeText={(text) => setSocialInputValues(prev => ({ ...prev, discord: text }))}
                onSubmitEditing={() => handleSocialMediaConnect('discord')}
              />
              <View style={styles.socialInputButtons}>
                <TouchableOpacity 
                  style={[styles.socialInputButton, { backgroundColor: theme.surfaceSecondary }]}
                  onPress={() => handleSocialMediaCancel('discord')}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialInputButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleSocialMediaConnect('discord')}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>App Info</Text>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>Version</Text>
            <Text style={[styles.infoValue, { color: theme.textSecondary }]}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>Build</Text>
            <Text style={[styles.infoValue, { color: theme.textSecondary }]}>HackGT12</Text>
          </View>
          <View style={styles.infoItem}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await supabase.auth.signOut();
                  Alert.alert('Signed out', 'You have been signed out');
                } catch (e) {
                  Alert.alert('Error', e.message);
                }
              }}
              style={[styles.findButton, { backgroundColor: theme.error }]}
            >
              <Text style={styles.findButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  leagueContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  leagueButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  leagueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  leagueNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  phoneInput: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  findButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  findButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  socialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  socialDetails: {
    flex: 1,
  },
  socialName: {
    fontSize: 16,
    fontWeight: '500',
  },
  socialStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  socialToggle: {
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  socialToggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  socialInputContainer: {
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
  },
  socialInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  socialInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  socialInputButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  socialInputButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  resultText: {
    fontSize: 14,
  },
  resultButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  resultButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
