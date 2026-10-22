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
import { useTheme } from '@context/ThemeContext';
import { useFormCanEdit } from '@context/FormAccessContext';

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
  const { colors } = useTheme();
  const formCanEdit = useFormCanEdit();
  const fieldEditable = editable && formCanEdit;

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
    if (fieldEditable) {
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
        !fieldEditable && styles.containerDisabled,
        {
          backgroundColor: fieldEditable ? colors.surface : colors.background,
          borderColor: isEditing ? colors.primary : (colors.background === '#ffffff' ? '#D5DCE5' : '#8794A7'),
        },
        { width },
      ]}
    >
      <Text
        style={[
          styles.label,
          !fieldEditable && styles.labelDisabled,
          { color: colors.muted },
        ]}
      >
        {label}
      </Text>

      <View style={styles.inputWrapper}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.inputContainer}
          onPress={() => {
            if (fieldEditable) {
              inputRef.current?.focus();
            }
          }}
          disabled={!fieldEditable}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              !isEditing && styles.inputReadOnly,
              !fieldEditable && styles.inputDisabled,
              { color: colors.text },
            ]}
            value={internalValue}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            secureTextEntry={isPassword && secureText}
            editable={fieldEditable}
            autoCapitalize={isPassword ? 'none' : 'sentences'}
            autoCorrect={!isPassword}
          />
        </TouchableOpacity>

        {isPassword && (
          <TouchableOpacity
            onPress={toggleSecureText}
            style={styles.iconWrapper}
            disabled={!fieldEditable}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={colors.text}
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
    borderColor: '#D5DCE5',
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
    fontSize: 18,
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
