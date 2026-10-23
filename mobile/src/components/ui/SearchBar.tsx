import { View, TextInput, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  rightElement?: React.ReactNode;
};

const SearchBar = ({ value, onChangeText, placeholder, rightElement }: Props) => {
  const { colors } = useTheme();
  const isDark = colors.background !== '#ffffff';

  const bgColor = isDark ? '#e7e7e728' : '#e7e7e7a8';
  const textColor = isDark ? '#ffffff' : '#000000';
  const placeholderColor = isDark ? '#94a3b8' : '#2f2f2f';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Ionicons
        name="search"
        size={22}
        color={placeholderColor}
        style={styles.icon}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        style={[styles.input, { color: textColor }]}
      />
      {rightElement}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,

    marginHorizontal: 10,
    marginBottom: 10,
  },

  icon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },
});
