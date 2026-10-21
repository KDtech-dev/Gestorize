import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney, formatMoneyInput } from '@core/utils/format';

type Props = {
  label?: string;
  value?: string;
  tipo?: 'string' | 'number' | 'password';
  onChangeText?: (text: string) => void;
  width?: DimensionValue;
  placeholder?: string;
  editable?: boolean;
  money?: boolean;
};

const EditableTextCard = ({
  label = 'Campo',
  value = '',
  tipo = 'string',
  onChangeText,
  width = '100%',
  placeholder = '',
  editable = true,
  money = false,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [internalValue, setInternalValue] = useState(
    money ? formatMoney(value) : value,
  );
  const [secureText, setSecureText] = useState(true);

  const inputRef = useRef<TextInput>(null);

  const isPassword = tipo === 'password';

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setInternalValue(money ? formatMoney(value) : value);
  }, [value, money, isEditing]);

  const keyboardType: KeyboardTypeOptions =
    tipo === 'number' ? 'numeric' : 'default';

  const handleFocus = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChangeText?.(internalValue);
  };

  const handleChangeText = (text: string) => {
    if (money) {
      const formattedValue = formatMoneyInput(text);

      setInternalValue(formattedValue);
      onChangeText?.(formattedValue);

      return;
    }

    setInternalValue(text);
    onChangeText?.(text);
  };

  const toggleSecureText = () => {
    setSecureText((previous) => !previous);
  };

  return (
    <View
      style={[
        styles.container,
        !editable && styles.containerDisabled,
        { width },
      ]}
    >
      <Text
        style={[
          styles.label,
          !editable && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>

      <View style={styles.inputWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.inputContainer}
          onPress={() => {
            if (editable) {
              inputRef.current?.focus();
            }
          }}
          disabled={!editable}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              !isEditing && styles.inputReadOnly,
              !editable && styles.inputDisabled,
            ]}
            value={internalValue}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor={editable ? '#999' : '#aaa'}
            secureTextEntry={isPassword && secureText}
            editable={editable}
            autoCapitalize={isPassword ? 'none' : 'sentences'}
            autoCorrect={!isPassword}
          />
        </TouchableOpacity>

        {isPassword && (
          <TouchableOpacity
            onPress={toggleSecureText}
            style={styles.iconWrapper}
            disabled={!editable}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={editable ? '#000' : '#999'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default EditableTextCard;

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

  containerDisabled: {
    backgroundColor: '#F2F3F5',
    borderColor: '#C9CDD2',
  },

  label: {
    fontSize: 13,
    color: '#6e6e6e',
    fontWeight: 'bold',
    marginBottom: 5,
  },

  labelDisabled: {
    color: '#8A8F98',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
  },

  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 30,
  },

  input: {
    width: '100%',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    padding: 0,
    margin: 0,
    minHeight: 30,
    textAlignVertical: 'center',
  },

  inputReadOnly: {},

  inputDisabled: {
    color: '#666B73',
  },

  iconWrapper: {
    width: 34,
    height: 34,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});