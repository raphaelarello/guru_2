import React from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Artilheiro {
  id: string;
  nome: string;
  gols: number;
  eficiencia: number;
  forma: string;
  time: string;
}

const mockArtilheiros: Artilheiro[] = [
  { id: '1', nome: 'Erling Haaland', gols: 22, eficiencia: 52.3, forma: 'excelente', time: 'Manchester City' },
  { id: '2', nome: 'Vinícius Júnior', gols: 18, eficiencia: 45.5, forma: 'boa', time: 'Real Madrid' },
  { id: '3', nome: 'Kylian Mbappé', gols: 16, eficiencia: 48.2, forma: 'boa', time: 'PSG' },
  { id: '4', nome: 'Phil Foden', gols: 14, eficiencia: 44.8, forma: 'normal', time: 'Manchester City' },
  { id: '5', nome: 'Rodrygo', gols: 12, eficiencia: 42.1, forma: 'normal', time: 'Real Madrid' },
];

export default function ArtilheirosScreen() {
  const renderArtilheiro = ({ item }: { item: Artilheiro }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.ranking}>
          <MaterialCommunityIcons name="medal" size={20} color="#fbbf24" />
          <Text style={styles.rankingText}>{item.id}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.nome}</Text>
          <Text style={styles.playerTeam}>{item.time}</Text>
        </View>
        <View style={[styles.formaBadge, { backgroundColor: getFormaColor(item.forma) }]}>
          <Text style={styles.formaText}>{item.forma}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="soccer" size={16} color="#10b981" />
          <Text style={styles.statValue}>{item.gols}</Text>
          <Text style={styles.statLabel}>Gols</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="percent" size={16} color="#3b82f6" />
          <Text style={styles.statValue}>{item.eficiencia.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Eficiência</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="trending-up" size={16} color="#a855f7" />
          <Text style={styles.statValue}>85%</Text>
          <Text style={styles.statLabel}>Consistência</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockArtilheiros}
        renderItem={renderArtilheiro}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </View>
  );
}

function getFormaColor(forma: string): string {
  switch (forma) {
    case 'excelente':
      return '#10b98180';
    case 'boa':
      return '#3b82f680';
    case 'normal':
      return '#f59e0b80';
    default:
      return '#ef444480';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ranking: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playerTeam: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  formaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
