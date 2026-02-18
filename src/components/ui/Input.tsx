/**
 * SitePro — Componente Input
 * Campo de texto con ícono izquierdo y opción para contraseña
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { fontSize, fontWeight, borderRadius, spacing, iconSize, touchSize } from '@theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  leftIcon?: React.ReactNode;
  error?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  leftIcon,
  error,
  isPassword = false,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            isPassword ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={colors.gray[400]}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...textInputProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeOff size={iconSize.md} color={colors.gray[400]} />
            ) : (
              <Eye size={iconSize.md} color={colors.gray[400]} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    minHeight: touchSize.input,
  },
  inputFocused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  leftIcon: {
    paddingLeft: spacing.base,
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  rightIcon: {
    paddingRight: spacing.base,
    position: 'absolute',
    right: 0,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  errorText: {
    fontSize: fontSize.small,
    color: colors.error[500],
    marginTop: spacing.xs,
  },
});
