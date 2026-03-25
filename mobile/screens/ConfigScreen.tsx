import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ConfigScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Perfil */}
      <View style={styles.profileSection}>
        <View style={styles.profileAvatar}>
          <MaterialCommunityIcons name="account" size={40} color="#10b981" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Luiz Arello Junior</Text>
          <Text style={styles.profileEmail}>raphael.arello@consult.com.br</Text>
        </View>
      </View>

      {/* Configurações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações da Conta</Text>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="account-circle" size={24} color="#3b82f6" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Editar Perfil</Text>
            <Text style={styles.menuDesc}>Atualize suas informações</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="lock" size={24} color="#a855f7" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Alterar Senha</Text>
            <Text style={styles.menuDesc}>Atualize sua senha</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="bell" size={24} color="#f59e0b" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Notificações</Text>
            <Text style={styles.menuDesc}>Gerencie suas notificações</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Integrações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrações</Text>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="telegram" size={24} color="#0ea5e9" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Telegram</Text>
            <Text style={styles.menuDesc}>Conectado</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="email" size={24} color="#ef4444" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Email</Text>
            <Text style={styles.menuDesc}>Conectado</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="wallet" size={24} color="#fbbf24" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Carteira</Text>
            <Text style={styles.menuDesc}>Não conectado</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Sobre */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="information" size={24} color="#3b82f6" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Versão do App</Text>
            <Text style={styles.menuDesc}>1.0.0</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="file-document" size={24} color="#a855f7" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Termos de Serviço</Text>
            <Text style={styles.menuDesc}>Leia nossos termos</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#10b981" />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Política de Privacidade</Text>
            <Text style={styles.menuDesc}>Leia nossa política</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  menuDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ef444420',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});
