import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

type Props = {
  label?: string;
  value?: string;
  width?: DimensionValue;
  onPress?: (event: GestureResponderEvent) => void;
  placeholder?: string;
  disabled?: boolean;
};

const ClickableTextCard = ({
  label = 'Campo',
  value = '',
  width = '100%',
  onPress,
  placeholder = 'Selecionar...',
  disabled = false,
}: Props) => {
  const isEmpty = !value;
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={disabled ? undefined : onPress} activeOpacity={0.7} disabled={disabled}>
      <View style={[styles.container, disabled && styles.containerDisabled, { width, backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.textContainer}>
          <View>
            <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
            <Text style={[styles.valueText, { color: colors.text }, isEmpty && { color: colors.muted, fontWeight: 'normal' }]}>
              {value || placeholder}
            </Text>
          </View>
          {!disabled && <MaterialIcons name="arrow-drop-down" size={28} color={colors.muted} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ClickableTextCard;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  containerDisabled: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  label: {
    fontSize: 13,
    color: '#6e6e6e',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  placeholderText: {
    color: '#999',
    fontWeight: 'normal',
  },
});
