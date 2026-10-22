import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

type MetricCardProps = {
  title: string;
  value: string;
  change: number | null;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
};

export const MetricCard = ({ title, value, change, icon, iconColor, onPress }: MetricCardProps) => {
  const { colors, isDark } = useTheme();
  
  const CardContainer = onPress ? TouchableOpacity : View;
  
  return (
    <CardContainer 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          shadowColor: isDark ? '#fff' : '#000',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor ? `${iconColor}20` : `${colors.primary}20` }]}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={iconColor || colors.primary} 
          />
        </View>
        <Text style={[styles.change, { color: change == null ? colors.muted : change >= 0 ? colors.success : colors.error }]}>
          {change == null ? 'Sem base' : `${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%`}
        </Text>
      </View>
      
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.muted }]}>{title}</Text>
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: '45%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
});
