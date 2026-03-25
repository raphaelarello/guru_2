import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

// Telas
import HomeScreen from './screens/HomeScreen';
import ArtilheirosScreen from './screens/ArtilheirosScreen';
import AlertasScreen from './screens/AlertasScreen';
import ConfigScreen from './screens/ConfigScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Configurar notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'RAPHA GURU' }}
      />
    </Stack.Navigator>
  );
}

function ArtilheirosStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ArtilheirosTab"
        component={ArtilheirosScreen}
        options={{ title: 'Artilheiros' }}
      />
    </Stack.Navigator>
  );
}

function AlertasStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="AlertasTab"
        component={AlertasScreen}
        options={{ title: 'Alertas' }}
      />
    </Stack.Navigator>
  );
}

function ConfigStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ConfigTab"
        component={ConfigScreen}
        options={{ title: 'Configurações' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    // Registrar para notificações push
    registerForPushNotifications();

    // Listener para notificações recebidas
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      setNotification(response.notification);
    });

    return () => subscription.remove();
  }, []);

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permissão de notificações negada');
        return;
      }

      // Obter token de push
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
    } catch (error) {
      console.error('Erro ao registrar notificações:', error);
    }
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#64748b',
          tabBarIcon: ({ color, size }) => {
            let iconName: any;

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Artilheiros') {
              iconName = 'stats-chart';
            } else if (route.name === 'Alertas') {
              iconName = 'notifications';
            } else if (route.name === 'Config') {
              iconName = 'settings';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ title: 'Início' }}
        />
        <Tab.Screen
          name="Artilheiros"
          component={ArtilheirosStackNavigator}
          options={{ title: 'Artilheiros' }}
        />
        <Tab.Screen
          name="Alertas"
          component={AlertasStackNavigator}
          options={{ title: 'Alertas' }}
        />
        <Tab.Screen
          name="Config"
          component={ConfigStackNavigator}
          options={{ title: 'Configurações' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
