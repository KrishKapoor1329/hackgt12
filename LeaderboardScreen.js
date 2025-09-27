import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

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
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, week, month, season
  const [selectedLeague, setSelectedLeague] = useState('NFL'); // NFL, NBA

  const filters = [
    { key: 'all', label: 'All Time' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'season', label: 'This Season' },
  ];

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
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Leaderboard</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NFL • {selectedFilter === 'all' ? 'All Time' : filters.find(f => f.key === selectedFilter)?.label}</Text>
      </View>

      {/* Modern Horizontal Toggle Bar */}
      <View style={styles.toggleContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toggleContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.toggleButton,
                { 
                  backgroundColor: selectedFilter === filter.key ? theme.primary : 'transparent',
                  borderColor: selectedFilter === filter.key ? theme.primary : theme.border,
                  transform: [{ scale: selectedFilter === filter.key ? 1.05 : 1 }]
                }
              ]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.toggleText,
                { 
                  color: selectedFilter === filter.key ? theme.textInverse : theme.textSecondary,
                  fontWeight: selectedFilter === filter.key ? '700' : '600'
                }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>1,247</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Players</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>$2.8K</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Top Winnings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.primary + '30' }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>68.1%</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best Win Rate</Text>
        </View>
      </View>

      {/* Leaderboard List */}
      <ScrollView style={styles.leaderboardContainer} showsVerticalScrollIndicator={false}>
        {mockLeaderboardData.map((user, index) => (
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

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>View My Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
          <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
            Make Pick
          </Text>
        </TouchableOpacity>
      </View>
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
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  toggleContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  toggleContent: {
    paddingHorizontal: 20,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LeaderboardScreen;
