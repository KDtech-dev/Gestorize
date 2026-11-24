import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardTypeOptions,  
  Dimensions,
  TouchableOpacity,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  tipo?: 'string' | 'number' | 'password';
  value?: string | number;
  onlyView?: boolean;
  label?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  multiline?: boolean;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  accessibilityLabel?: string;
  width?: DimensionValue;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  keyboardType?: KeyboardTypeOptions;
  placeholderTextColor?: string;
};

const { height } = Dimensions.get('window');

const InputCard = ({
  tipo = 'string',
  value = '',
  onlyView = false,
  label = '',
  placeholder = '',
  onChangeText,
  maxLength,
  editable = true,
  multiline = false,
  textAlignVertical,
  accessibilityLabel,
  width = '100%',
  containerStyle,
  inputStyle,
  labelStyle,
  keyboardType: keyboardTypeProp,
  placeholderTextColor = '#cccccc9d',
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const keyboardType: KeyboardTypeOptions =
    keyboardTypeProp ?? (tipo === 'number' ? 'numeric' : 'default');

  const isPassword = tipo === 'password';

  return (
    <View
      style={[
        styles.container,
        { width },
        onlyView && { backgroundColor: '#B0B0B0' },
        containerStyle,
      ]}
    >
      {!!label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            onlyView && { color: '#ddd' },
            isFocused && styles.inputFocused,
            inputStyle,
          ]}
          keyboardType={keyboardType}
          editable={!onlyView && editable}
          multiline={multiline}
          textAlignVertical={textAlignVertical}
          accessibilityLabel={accessibilityLabel ?? label}
          secureTextEntry={isPassword && secureText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={typeof value === 'number' ? value.toString() : value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          maxLength={maxLength}
        />

        {isPassword && !onlyView && (
          <TouchableOpacity
            onPress={() => setSecureText(!secureText)}
            style={styles.iconWrapper}
          >
            <Ionicons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#cccccc9d"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: '110%',
    height: height * 0.08,
    backgroundColor: '#7294CA',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 15,
    justifyContent: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconWrapper: {
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 13,
    color: '#0f3164',
    fontWeight: '600',
    marginBottom: 7,
    marginTop: 5,
  },
  input: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 10,
    color: '#fff',
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: '#ffffff70',
    borderRadius: 10,
    marginTop: -5,
    padding: 2,
  },
});
export default InputCard;
