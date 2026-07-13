import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { theme } from "@/components/theme";
import { useAuthStore } from "@/state/authStore";

export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: signUpError } = await signUp(email.trim(), password);

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TrainingBuddy</Text>
        <Text style={styles.title}>Create account</Text>
      </View>

      {error ? <ErrorState message={error} title="Couldn't create account" /> : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          style={styles.input}
          value={email}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="password-new"
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          accessibilityLabel="Confirm password"
          autoCapitalize="none"
          autoComplete="password-new"
          onChangeText={setConfirmPassword}
          placeholder="Type it again"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
        />
      </View>

      <Pressable
        accessibilityLabel="Create account"
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={[styles.primaryButton, isSubmitting ? styles.disabled : null]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.primaryText} />
        ) : (
          <Text style={styles.primaryButtonText}>Create account</Text>
        )}
      </Pressable>

      <Pressable
        accessibilityLabel="Already have an account? Sign in"
        accessibilityRole="button"
        onPress={() => router.push("/sign-in")}
      >
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  root: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800"
  },
  fieldGroup: {
    gap: theme.spacing.sm
  },
  label: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.7
  },
  link: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  }
});
