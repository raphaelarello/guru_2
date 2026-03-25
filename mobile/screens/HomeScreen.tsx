import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="lightning-bolt" size={32} color="#10b981" />
        <Text style={styles.title}>RAPHA GURU</Text>
        <Text style={styles.subtitle}>Plataforma de Apostas com IA</Text>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="target" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>92%</Text>
          <Text style={styles.statLabel}>Taxa de Acerto</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="trending-up" size={24} color="#10b981" />
          <Text style={styles.statValue}>+12.5%</Text>
          <Text style={styles.statLabel}>ROI Médio</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Alertas Hoje</Text>
        </View>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="star" size={24} color="#fbbf24" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Top Artilheiros</Text>
            <Text style={styles.actionDesc}>Veja os melhores em forma</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="bell" size={24} color="#ef4444" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Alertas Ativos</Text>
            <Text style={styles.actionDesc}>5 notificações pendentes</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="brain" size={24} color="#a855f7" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Recomendações ML</Text>
            <Text style={styles.actionDesc}>3 apostas recomendadas</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="zap" size={24} color="#fbbf24" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Value Betting</Text>
            <Text style={styles.actionDesc}>2 oportunidades encontradas</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Últimos Alertas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimos Alertas</Text>

        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="soccer" size={20} color="#10b981" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Erling Haaland em Forma</Text>
            <Text style={styles.alertDesc}>92% de confiança para gols totais</Text>
            <Text style={styles.alertTime}>há 5 minutos</Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#3b82f6" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Value Betting Detectado</Text>
            <Text style={styles.alertDesc}>Pinnacle: Vinícius Júnior 2.80</Text>
            <Text style={styles.alertTime}>há 15 minutos</Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="brain" size={20} color="#a855f7" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Recomendação ML</Text>
            <Text style={styles.alertDesc}>Mbappé - Gols 1º Tempo (88% confiança)</Text>
            <Text style={styles.alertTime}>há 30 minutos</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  alertDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  alertTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
});
