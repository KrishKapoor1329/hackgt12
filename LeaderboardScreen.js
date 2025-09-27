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
    avatar: '🏈',
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
    avatar: '⚡',
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
    avatar: '👑',
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
    avatar: '🎯',
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
    avatar: '💪',
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
    avatar: '🚀',
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
    avatar: '⚔️',
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
    avatar: '🏆',
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
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
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
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NFL • {selectedFilter === 'all' ? 'All Time' : filters.find(f => f.key === selectedFilter)?.label}</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              { backgroundColor: theme.surface, borderColor: theme.border },
              selectedFilter === filter.key && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              { color: theme.textSecondary },
              selectedFilter === filter.key && { color: theme.textInverse }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
                  🔥 {user.streak} streak
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

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
});

export default LeaderboardScreen;
