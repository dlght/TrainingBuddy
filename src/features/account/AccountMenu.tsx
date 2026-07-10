import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/components/theme";
import { useAuthStore } from "@/state/authStore";

export function AccountMenu() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [isOpen, setIsOpen] = useState(false);

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  const openProfile = () => {
    setIsOpen(false);
    router.push("/profile/setup");
  };

  const handleSignOut = () => {
    setIsOpen(false);
    void signOut();
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Account menu"
        onPress={() => setIsOpen(true)}
        style={styles.avatarButton}
      >
        <Text style={styles.avatarButtonText}>{initial}</Text>
      </Pressable>

      {isOpen ? (
        <Modal animationType="fade" transparent visible onRequestClose={() => setIsOpen(false)}>
          <Pressable
            accessibilityLabel="Close account menu"
            accessibilityRole="button"
            onPress={() => setIsOpen(false)}
            style={styles.backdrop}
          >
            <View style={styles.menuCard}>
              {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Profile"
                onPress={openProfile}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Profile</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                onPress={handleSignOut}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Sign out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary
  },
  avatarButtonText: {
    color: theme.colors.primaryText,
    fontSize: 14,
    fontWeight: "800"
  },
  backdrop: {
    flex: 1,
    alignItems: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    paddingTop: 60,
    paddingRight: theme.spacing.lg
  },
  menuCard: {
    minWidth: 200,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  email: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: theme.spacing.xs
  },
  menuItem: {
    minHeight: 40,
    justifyContent: "center"
  },
  menuItemText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  }
});
