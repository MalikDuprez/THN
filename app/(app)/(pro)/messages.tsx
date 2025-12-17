// app/(app)/(pro)/messages.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

// ============================================
// THEME
// ============================================
const theme = {
  black: "#000000",
  white: "#FFFFFF",
  card: "#F8FAFC",
  text: "#000000",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  accent: "#3B82F6",
  accentLight: "#EFF6FF",
  success: "#10B981",
  border: "#E2E8F0",
};

// ============================================
// DONNÉES MOCK
// ============================================
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    client: "Marie L.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    lastMessage: "Parfait, à tout à l'heure !",
    time: "Il y a 5 min",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    client: "Thomas D.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    lastMessage: "Est-ce que vous faites les dégradés américains ?",
    time: "Il y a 1h",
    unread: 1,
    online: false,
  },
  {
    id: "3",
    client: "Julie M.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    lastMessage: "Merci pour la coloration, je suis ravie !",
    time: "Hier",
    unread: 0,
    online: false,
  },
  {
    id: "4",
    client: "Lucas P.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    lastMessage: "D'accord, je serai là à 10h",
    time: "Hier",
    unread: 0,
    online: true,
  },
];

// ============================================
// COMPOSANTS
// ============================================
const ConversationItem = ({ conversation, onPress }: {
  conversation: typeof MOCK_CONVERSATIONS[0];
  onPress: () => void;
}) => (
  <Pressable style={styles.conversationItem} onPress={onPress}>
    <View style={styles.avatarContainer}>
      <Image source={{ uri: conversation.image }} style={styles.avatar} />
      {conversation.online && <View style={styles.onlineDot} />}
    </View>
    <View style={styles.conversationContent}>
      <View style={styles.conversationHeader}>
        <Text style={[styles.conversationName, conversation.unread > 0 && styles.conversationNameUnread]}>
          {conversation.client}
        </Text>
        <Text style={styles.conversationTime}>{conversation.time}</Text>
      </View>
      <View style={styles.conversationFooter}>
        <Text 
          style={[styles.conversationMessage, conversation.unread > 0 && styles.conversationMessageUnread]} 
          numberOfLines={1}
        >
          {conversation.lastMessage}
        </Text>
        {conversation.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{conversation.unread}</Text>
          </View>
        )}
      </View>
    </View>
  </Pressable>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = MOCK_CONVERSATIONS.filter(conv =>
    conv.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    router.back();
  };

  const handleConversationPress = (id: string) => {
    // TODO: Navigate to conversation detail
    console.log("Open conversation:", id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv, index) => (
              <View key={conv.id}>
                <ConversationItem 
                  conversation={conv} 
                  onPress={() => handleConversationPress(conv.id)} 
                />
                {index < filteredConversations.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptySubtitle}>
                Vos conversations avec les clients apparaîtront ici
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.black,
  },

  // Header
  header: {
    backgroundColor: theme.black,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.white,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.white,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: theme.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollView: {
    flex: 1,
    paddingTop: 10,
  },

  // Conversation Item
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.success,
    borderWidth: 2,
    borderColor: theme.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.text,
  },
  conversationNameUnread: {
    fontWeight: "700",
  },
  conversationTime: {
    fontSize: 13,
    color: theme.textMuted,
  },
  conversationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conversationMessage: {
    fontSize: 14,
    color: theme.textMuted,
    flex: 1,
    marginRight: 10,
  },
  conversationMessageUnread: {
    color: theme.textSecondary,
    fontWeight: "500",
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.white,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 88,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});