import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { profileService } from "@/features/profile/profileService";
import type { UserProfile } from "@/models/user";
import { useAuthStore } from "@/state/authStore";
import { useProfileSetupStore } from "@/state/profileSetupStore";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const resetDraft = useProfileSetupStore((state) => state.resetDraft);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    // The root layout's auth gate redirects to /sign-in once the session clears.
  };

  useEffect(() => {
    let mounted = true;

    profileService
      .getProfile()
      .then((loadedProfile) => {
        if (mounted) {
          setProfile(loadedProfile);
        }
      })
      .catch((error) => {
        console.error("Profile could not be loaded.", error);

        if (mounted) {
          setError("Profile could not be loaded.");
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading profile" title="Profile" />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.accountSection}>
        {user?.email ? <Text style={styles.accountEmail}>Signed in as {user.email}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={[styles.signOutButton, isSigningOut ? styles.disabled : null]}
        >
          {isSigningOut ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <Text style={styles.signOutButtonText}>Sign out</Text>
          )}
        </Pressable>
      </View>

      {error ? <ErrorState message={error} title="Profile" /> : null}
      <ProfileForm
        initialProfile={profile}
        isSaving={isSaving}
        submitLabel={profile ? "Update profile" : "Save profile"}
        onSubmit={async (values) => {
          setIsSaving(true);
          setError(null);

          try {
            await profileService.saveProfile(values);
            resetDraft();
            router.replace("/");
          } catch (error) {
            console.error("Profile could not be saved.", error);
            setError("Profile could not be saved.");
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm
  },
  accountSection: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  accountEmail: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: "600"
  },
  signOutButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md
  },
  signOutButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.7
  }
});
