/**
 * SitePro — Login Screen
 */

import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@store/authStore';
import { borderRadius, fontSize, fontWeight, iconSize, shadows, spacing } from '@theme/tokens';
import { isValidEmail, isValidPassword } from '@utils/index';
import { router } from 'expo-router';
import { Building2, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoading } = useAuthStore();

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'El email es requerido';
    else if (!isValidEmail(email)) newErrors.email = 'Formato de email inválido';

    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (!isValidPassword(password))
      newErrors.password = 'Mínimo 8 caracteres';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await login({ email, password, rememberMe });
      router.replace('/(app)/(tabs)/home');
    } catch (error) {
      setErrors({ email: 'Credenciales inválidas' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Building2 size={iconSize['2xl']} color={colors.white} strokeWidth={1.5} />
        </View>

        {/* Título */}
        <Text style={styles.title}>SitePro</Text>
        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>

        {/* Formulario */}
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon={<Mail size={iconSize.md} color={colors.gray[400]} />}
            error={errors.email}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={iconSize.md} color={colors.gray[400]} />}
            error={errors.password}
          />

          {/* Recordarme + ¿Olvidaste contraseña? */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxActive]}
              >
                {rememberMe && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.rememberText}>Recordarme</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Botón principal */}
          <Button
            label="Iniciar Sesión"
            onPress={handleLogin}
            isLoading={isLoading}
            fullWidth
            style={styles.loginButton}
          />

          {/* Divisor */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botones sociales */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Text style={styles.socialText}>🔵 Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Text style={styles.socialText}>🍎 Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Registro */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.registerLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.black,
    color: '#0F0F0F',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: '#525252',
    marginBottom: spacing.xl,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#A3A3A3',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#EAAB00',
    borderColor: '#EAAB00',
  },
  checkmark: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  rememberText: {
    fontSize: fontSize.body,
    color: '#333333',
  },
  forgotText: {
    fontSize: fontSize.body,
    color: '#EAAB00',
    fontWeight: fontWeight.medium,
  },
  loginButton: {
    marginBottom: spacing.base,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4D4D4',
  },
  dividerText: {
    fontSize: fontSize.body,
    color: '#737373',
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  socialText: {
    fontSize: fontSize.body,
    color: '#333333',
    fontWeight: fontWeight.medium,
  },
  registerRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  registerText: {
    fontSize: fontSize.base,
    color: '#525252',
  },
  registerLink: {
    fontSize: fontSize.base,
    color: '#EAAB00',
    fontWeight: fontWeight.semibold,
  },
});