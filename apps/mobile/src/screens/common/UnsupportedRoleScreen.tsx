import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/auth';
import { theme } from '@/lib/theme';

export const UnsupportedRoleScreen = () => {
  const { session, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Role Not Yet Available on Mobile</Text>
        <Text style={styles.description}>
          Signed in as `{session?.user.primaryRole}`. This role is planned for a later
          phase.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => void logout()}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  description: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: 22,
  },
  button: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.base,
  },
});
