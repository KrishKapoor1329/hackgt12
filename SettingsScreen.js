import React, { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import { decode } from 'base64-arraybuffer';
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
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import supabase from './supabaseClient';
import { NFL_TEAMS, getSortedTeams, getTeamByAbbreviation, getTeamLogo, getTeamLogoUrl, getTeamName } from './nflTeams';

// TeamLogo component with fallback for Settings
const TeamLogoComponent = ({ teamAbbr, style, fallbackStyle }) => {
  const logoSource = getTeamLogoUrl(teamAbbr);
  
  if (!logoSource) {
    return (
      <Text style={fallbackStyle}>
        {getTeamLogo(teamAbbr)}
      </Text>
    );
  }
  
  return (
    <Image
      source={logoSource}
      style={style}
      resizeMode="contain"
    />
  );
};

export default function SettingsScreen({ navigation, theme, isDarkMode, setIsDarkMode }) {
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
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
  
  // NFL team selection
  const [selectedNFLTeam, setSelectedNFLTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Load profile picture
  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData?.session?.user?.id;
        if (!uid) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', uid)
          .single();

        if (profile?.avatar_url) {
          setProfilePicture(profile.avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };
    loadProfilePicture();
  }, []);

  const pickImage = async () => {
    try {
      // Request camera permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' && libraryStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera and photo library permissions to change your profile picture.');
        return;
      }

      // Show action sheet to choose between camera and photo library
      Alert.alert(
        'Select Photo',
        'Choose how you want to select your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => takePhoto(),
            style: 'default'
          },
          {
            text: 'Photo Library',
            onPress: () => selectFromLibrary(),
            style: 'default'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera or photo library');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const selectFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const uploadProfilePicture = async (uri) => {
    try {
      setUploading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) throw new Error('Not authenticated');

      // Convert uri to base64
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString('base64');
      
      // Upload to Supabase Storage
      const fileExt = uri.split('.').pop();
      const fileName = `${uid}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64String), {
          contentType: `image/${fileExt}`
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', uid);

      if (updateError) throw updateError;

      setProfilePicture(publicUrl);
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

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

  useEffect(() => {
    const loadFavoriteTeam = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData?.session?.user?.id;
        if (!uid) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('favorite_nfl_team')
          .eq('id', uid)
          .single();

        if (profile?.favorite_nfl_team) {
          setSelectedNFLTeam(profile.favorite_nfl_team);
        }
      } catch (error) {
        console.error('Error loading favorite team:', error);
      }
    };
    loadFavoriteTeam();
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

  const handleTeamSelection = async (teamAbbr) => {
    try {
      setLoadingTeam(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;

      const { error } = await supabase
        .from('profiles')
        .update({ favorite_nfl_team: teamAbbr })
        .eq('id', uid);

      if (error) throw error;

      setSelectedNFLTeam(teamAbbr);
      setShowTeamModal(false);
      
      const teamName = getTeamName(teamAbbr);
      Alert.alert('Team Updated!', `You're now representing ${teamName}!`);
    } catch (error) {
      Alert.alert('Error', `Failed to update favorite team: ${error.message}`);
    } finally {
      setLoadingTeam(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Picture */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity 
              style={[styles.profilePictureWrapper, { backgroundColor: theme.backgroundSecondary }]} 
              onPress={pickImage}
              disabled={uploading}
            >
              {profilePicture ? (
                <Image 
                  source={{ uri: profilePicture }} 
                  style={styles.profilePicture}
                />
              ) : (
                <Text style={[styles.profilePicturePlaceholder, { color: theme.textSecondary }]}>
                  📷
                </Text>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={theme.primary} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.changePhotoButton, { backgroundColor: theme.primary }]}
              onPress={pickImage}
              disabled={uploading}
            >
              <Text style={[styles.changePhotoText, { color: theme.primaryText || '#ffffff' }]}>
                {profilePicture ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
                { 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border,
                  transform: [{ scale: selectedLeague === 'NFL' ? 1.05 : 1 }]
                },
                selectedLeague === 'NFL' && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => handleLeagueSelection('NFL')}
              activeOpacity={0.8}
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
                { 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border,
                  transform: [{ scale: selectedLeague === 'NBA' ? 1.05 : 1 }]
                },
                selectedLeague === 'NBA' && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => handleLeagueSelection('NBA')}
              activeOpacity={0.8}
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

        {/* NFL Team Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Favorite NFL Team</Text>
          <TouchableOpacity
            style={[styles.teamSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowTeamModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.teamSelectorContent}>
              {selectedNFLTeam ? (
                <TeamLogoComponent
                  teamAbbr={selectedNFLTeam}
                  style={styles.teamSelectorLogo}
                  fallbackStyle={styles.teamSelectorEmoji}
                />
              ) : (
                <Text style={styles.teamSelectorEmoji}>🏈</Text>
              )}
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, { color: theme.textPrimary }]}>
                  {selectedNFLTeam ? getTeamName(selectedNFLTeam) : 'Select Your Team'}
                </Text>
                <Text style={[styles.teamSubtext, { color: theme.textSecondary }]}>
                  {selectedNFLTeam ? 'Tap to change' : 'Choose your favorite NFL team'}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.leagueNote, { color: theme.textTertiary }]}>
            Your team logo will appear next to your name on the leaderboard
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
              <Text style={[styles.findButtonText, { color: theme.primaryText || '#ffffff' }]}>Search</Text>
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Results</Text>
              {searchResults.map((u) => (
                <View key={u.id} style={styles.resultRow}>
                  <Text style={[styles.resultText, { color: theme.textPrimary }]}>{u.username || u.email || u.phone}</Text>
                  <TouchableOpacity style={[styles.resultButton, { backgroundColor: theme.primary }]} onPress={() => sendFriendRequest(u.id)}>
                    <Text style={[styles.resultButtonText, { color: theme.primaryText || '#ffffff' }]}>Request</Text>
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
              <Text style={styles.socialIcon}>T</Text>
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
                  <Text style={[styles.connectButtonText, { color: theme.primaryText || '#ffffff' }]}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Discord */}
          <View style={styles.socialItem}>
            <View style={styles.socialInfo}>
              <Text style={styles.socialIcon}>D</Text>
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
                  <Text style={[styles.connectButtonText, { color: theme.primaryText || '#ffffff' }]}>Connect</Text>
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

      {/* NFL Team Selection Modal */}
      <Modal
        visible={showTeamModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTeamModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Your NFL Team</Text>
            <TouchableOpacity onPress={() => setShowTeamModal(false)}>
              <Text style={[styles.modalClose, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={getSortedTeams()}
            keyExtractor={(item) => item.abbreviation}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.teamOption,
                  { backgroundColor: theme.surface, borderBottomColor: theme.border },
                  selectedNFLTeam === item.abbreviation && { backgroundColor: theme.backgroundSecondary }
                ]}
                onPress={() => handleTeamSelection(item.abbreviation)}
                disabled={loadingTeam}
              >
                <TeamLogoComponent
                  teamAbbr={item.abbreviation}
                  style={styles.teamOptionLogoImage}
                  fallbackStyle={styles.teamOptionLogo}
                />
                <View style={styles.teamOptionInfo}>
                  <Text style={[styles.teamOptionName, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.teamOptionConference, { color: theme.textSecondary }]}>
                    {item.conference} {item.division}
                  </Text>
                </View>
                {selectedNFLTeam === item.abbreviation && (
                  <Text style={[styles.checkmark, { color: theme.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.teamList}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Profile Picture Styles
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePictureWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePicturePlaceholder: {
    fontSize: 40,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  findButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  findButtonText: {
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
    fontSize: 18,
    fontWeight: '800',
    marginRight: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 12,
    fontWeight: '600',
  },
  // NFL Team Selection Styles
  teamSelector: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  teamSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    marginRight: 12,
  },
  teamSelectorLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  teamSelectorEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamSubtext: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  // Modal Styles
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
  teamList: {
    flex: 1,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  teamOptionLogo: {
    fontSize: 24,
    marginRight: 12,
  },
  teamOptionLogoImage: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  teamOptionInfo: {
    flex: 1,
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  teamOptionConference: {
    fontSize: 14,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
