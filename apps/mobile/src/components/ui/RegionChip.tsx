import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { theme } from '@/lib/theme';

export type RegionType =
  | 'DFW'
  | 'Houston'
  | 'Austin'
  | 'San Antonio'
  | 'El Paso'
  | 'RGV';

interface RegionChipProps {
  region: string;
  selected?: boolean;
  onPress?: () => void;
}

const regionColors: Record<RegionType, string> = {
  DFW: theme.colors.regions.dfw,
  Houston: theme.colors.regions.houston,
  Austin: theme.colors.regions.austin,
  'San Antonio': theme.colors.regions.sanAntonio,
  'El Paso': theme.colors.regions.elPaso,
  RGV: theme.colors.regions.rgv,
};

export const RegionChip: React.FC<RegionChipProps> = ({
  region,
  selected = false,
  onPress,
}) => {
  const color = regionColors[region as RegionType] ?? theme.colors.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
        },
        selected && styles.selected,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{region}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  selected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  icon: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
});
