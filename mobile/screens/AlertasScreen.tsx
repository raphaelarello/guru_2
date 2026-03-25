import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AlertasScreen() {
  const [notificacoesAtivas, setNotificacoesAtivas] = React.useState(true);

  return (
    <ScrollView style={styles.container}>
      {/* Configurações de Notificações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações de Notificações</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="bell" size={24} color="#10b981" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notificações Push</Text>
              <Text style={styles.settingDesc}>Receba alertas em tempo real</Text>
            </View>
          </View>
          <Switch
            value={notificacoesAtivas}
            onValueChange={setNotificacoesAtivas}
            trackColor={{ false: '#475569', true: '#10b98180' }}
            thumbColor={notificacoesAtivas ? '#10b981' : '#94a3b8'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="star" size={24} color="#fbbf24" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Alertas de Artilheiros</Text>
              <Text style={styles.settingDesc}>Quando top 5 entram em forma</Text>
            </View>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#475569', true: '#10b98180' }}
            thumbColor="#10b981"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="zap" size={24} color="#fbbf24" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Alertas de Value Betting</Text>
              <Text style={styles.settingDesc}>Oportunidades com value > 5%</Text>
            </View>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#475569', true: '#10b98180' }}
            thumbColor="#10b981"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <MaterialCommunityIcons name="brain" size={24} color="#a855f7" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Alertas de Recomendações ML</Text>
              <Text style={styles.settingDesc}>Apostas recomendadas pelo modelo</Text>
            </View>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#475569', true: '#10b98180' }}
            thumbColor="#10b981"
          />
        </View>
      </View>

      {/* Histórico de Alertas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico de Alertas</Text>

        <View style={styles.alertItem}>
          <View style={[styles.alertIcon, { backgroundColor: '#10b98120' }]}>
            <MaterialCommunityIcons name="soccer" size={20} color="#10b981" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Erling Haaland em Forma</Text>
            <Text style={styles.alertDesc}>92% de confiança para gols totais</Text>
            <Text style={styles.alertTime}>há 5 minutos</Text>
          </View>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>✓</Text>
          </View>
        </View>

        <View style={styles.alertItem}>
          <View style={[styles.alertIcon, { backgroundColor: '#3b82f620' }]}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#3b82f6" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Value Betting Detectado</Text>
            <Text style={styles.alertDesc}>Pinnacle: Vinícius Júnior 2.80</Text>
            <Text style={styles.alertTime}>há 15 minutos</Text>
          </View>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>✓</Text>
          </View>
        </View>

        <View style={styles.alertItem}>
          <View style={[styles.alertIcon, { backgroundColor: '#a855f720' }]}>
            <MaterialCommunityIcons name="brain" size={20} color="#a855f7" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Recomendação ML</Text>
            <Text style={styles.alertDesc}>Mbappé - Gols 1º Tempo (88% confiança)</Text>
            <Text style={styles.alertTime}>há 30 minutos</Text>
          </View>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>✓</Text>
          </View>
        </View>

        <View style={styles.alertItem}>
          <View style={[styles.alertIcon, { backgroundColor: '#f59e0b20' }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#f59e0b" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Indisciplinado Recebeu Cartão</Text>
            <Text style={styles.alertDesc}>Sergio Ramos - Cartão Amarelo</Text>
            <Text style={styles.alertTime}>há 1 hora</Text>
          </View>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>✓</Text>
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
  settingItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  settingDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  alertItem: {
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
  alertBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
