import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/auth';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { LoadingScreen } from '@/screens/common/LoadingScreen';
import { UnsupportedRoleScreen } from '@/screens/common/UnsupportedRoleScreen';
import { OperatorDashboard } from '@/screens/operator/OperatorDashboard';
import { OperatorSlotsScreen } from '@/screens/operator/OperatorSlotsScreen';
import { OperatorOffersScreen } from '@/screens/operator/OperatorOffersScreen';
import { OperatorBookingsScreen } from '@/screens/operator/OperatorBookingsScreen';
import { BrokerDashboard } from '@/screens/broker/BrokerDashboard';
import { BrokerRequestsScreen } from '@/screens/broker/BrokerRequestsScreen';
import { BrokerMarketplaceScreen } from '@/screens/broker/BrokerMarketplaceScreen';
import { BrokerOffersScreen } from '@/screens/broker/BrokerOffersScreen';
import { BrokerBookingsScreen } from '@/screens/broker/BrokerBookingsScreen';
import { DriverDashboard } from '@/screens/driver/DriverDashboard';
import { DriverRunsScreen } from '@/screens/driver/DriverRunsScreen';
import { DriverProofCaptureScreen } from '@/screens/driver/DriverProofCaptureScreen';
import { DriverLocationScreen } from '@/screens/driver/DriverLocationScreen';
import { theme } from '@/lib/theme';

type RootStackParamList = {
  Auth: undefined;
  OperatorApp: undefined;
  BrokerApp: undefined;
  DriverApp: undefined;
  UnsupportedRole: undefined;
};

type OperatorTabParamList = {
  Overview: undefined;
  Slots: undefined;
  Offers: undefined;
  Bookings: undefined;
};

type BrokerTabParamList = {
  Overview: undefined;
  Requests: undefined;
  Marketplace: undefined;
  Offers: undefined;
  Bookings: undefined;
};

type DriverTabParamList = {
  Overview: undefined;
  Runs: undefined;
  Proof: undefined;
  Location: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OperatorTabs = createBottomTabNavigator<OperatorTabParamList>();
const BrokerTabs = createBottomTabNavigator<BrokerTabParamList>();
const DriverTabs = createBottomTabNavigator<DriverTabParamList>();

const defaultTabScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.foreground,
  tabBarStyle: {
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.mutedForeground,
};

const OperatorTabsNavigator = () => {
  return (
    <OperatorTabs.Navigator screenOptions={defaultTabScreenOptions}>
      <OperatorTabs.Screen name="Overview" component={OperatorDashboard} />
      <OperatorTabs.Screen name="Slots" component={OperatorSlotsScreen} />
      <OperatorTabs.Screen name="Offers" component={OperatorOffersScreen} />
      <OperatorTabs.Screen name="Bookings" component={OperatorBookingsScreen} />
    </OperatorTabs.Navigator>
  );
};

const BrokerTabsNavigator = () => {
  return (
    <BrokerTabs.Navigator screenOptions={defaultTabScreenOptions}>
      <BrokerTabs.Screen name="Overview" component={BrokerDashboard} />
      <BrokerTabs.Screen name="Requests" component={BrokerRequestsScreen} />
      <BrokerTabs.Screen name="Marketplace" component={BrokerMarketplaceScreen} />
      <BrokerTabs.Screen name="Offers" component={BrokerOffersScreen} />
      <BrokerTabs.Screen name="Bookings" component={BrokerBookingsScreen} />
    </BrokerTabs.Navigator>
  );
};

const DriverTabsNavigator = () => {
  return (
    <DriverTabs.Navigator screenOptions={defaultTabScreenOptions}>
      <DriverTabs.Screen name="Overview" component={DriverDashboard} />
      <DriverTabs.Screen name="Runs" component={DriverRunsScreen} />
      <DriverTabs.Screen name="Proof" component={DriverProofCaptureScreen} />
      <DriverTabs.Screen name="Location" component={DriverLocationScreen} />
    </DriverTabs.Navigator>
  );
};

export const AppNavigator = () => {
  const { session, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        ) : session.user.primaryRole === 'operator' ? (
          <RootStack.Screen name="OperatorApp" component={OperatorTabsNavigator} />
        ) : session.user.primaryRole === 'broker' ? (
          <RootStack.Screen name="BrokerApp" component={BrokerTabsNavigator} />
        ) : session.user.primaryRole === 'driver' ? (
          <RootStack.Screen name="DriverApp" component={DriverTabsNavigator} />
        ) : (
          <RootStack.Screen name="UnsupportedRole" component={UnsupportedRoleScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
