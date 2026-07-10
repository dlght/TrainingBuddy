import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { theme } from "@/components/theme";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { profileService } from "@/features/profile/profileService";
import type { UserProfile } from "@/models/user";
import { useProfileSetupStore } from "@/state/profileSetupStore";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const resetDraft = useProfileSetupStore((state) => state.resetDraft);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }
});
