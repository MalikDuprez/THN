// app/(app)/(client)/(tabs)/messages.tsx
import { 
  View, 
  Text, 
  FlatList,
  Pressable, 
  StyleSheet, 
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { 
  getMyConversations,
  subscribeToConversations,
  formatMessageTime,
  getOtherParticipantName,
  getOtherParticipantAvatar,
  type ConversationWithDetails,
} from "@/api/messaging";
import { supabase } from "@/lib/supabase";
import { useMessageStore } from "@/stores/messageStore";

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
  border: "#E2E8F0",
};

// ============================================
// COMPOSANTS
// ============================================

const ConversationItem = ({ 
  conversation, 
  onPress,
  currentUserId,
}: { 
  conversation: ConversationWithDetails;
  onPress: () => void;
  currentUserId: string | null;
}) => {
  const name = getOtherParticipantName(conversation, false); // false = isClient
  const avatar = getOtherParticipantAvatar(conversation, false);
  const unreadCount = conversation.client_unread_count || 0;
  
  // Ne montrer en gras que si :
  // 1. Il y a des messages non lus
  // 2. ET le dernier message n'a pas été envoyé par moi
  const lastMessageIsFromMe = conversation.last_message_sender_id === currentUserId;
  const hasUnread = unreadCount > 0 && !lastMessageIsFromMe;

  return (
    <Pressable style={styles.conversationItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, hasUnread && styles.conversationNameUnread]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.conversationTime, hasUnread && styles.conversationTimeUnread]}>
            {formatMessageTime(conversation.last_message_at)}
          </Text>
        </View>
        
        <View style={styles.previewRow}>
          {lastMessageIsFromMe && (
            <Text style={styles.youPrefix}>Vous : </Text>
          )}
          <Text 
            style={[styles.conversationPreview, hasUnread && styles.conversationPreviewUnread]} 
            numberOfLines={1}
          >
            {conversation.last_message_preview || "Nouvelle conversation"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Ionicons name="chatbubbles-outline" size={64} color={theme.textMuted} />
    <Text style={styles.emptyStateTitle}>Aucune conversation</Text>
    <Text style={styles.emptyStateText}>
      Vos conversations avec les coiffeurs apparaîtront ici
    </Text>
  </View>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fetchUnreadCounts } = useMessageStore();
  
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getMyConversations();
      setConversations(data);
      // Rafraîchir les compteurs du store
      fetchUnreadCounts();
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUnreadCounts]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const unsubscribe = subscribeToConversations((updatedConv) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === updatedConv.id);
        if (index >= 0) {
          const newConvs = [...prev];
          newConvs[index] = { ...newConvs[index], ...updatedConv };
          return newConvs.sort((a, b) => 
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );
        }
        return prev;
      });
      // Rafraîchir les compteurs du store
      fetchUnreadCounts();
    });

    return unsubscribe;
  }, [fetchUnreadCounts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  const handleConversationPress = (conversation: ConversationWithDetails) => {
    router.push({
      pathname: "/(app)/(client)/conversation/[id]",
      params: { id: conversation.id }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : conversations.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationItem 
                conversation={item} 
                onPress={() => handleConversationPress(item)}
                currentUserId={currentUserId}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
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
    backgroundColor: theme.black 
  },
  header: { 
    backgroundColor: theme.black, 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: theme.white 
  },
  content: { 
    flex: 1, 
    backgroundColor: theme.white, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28 
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: theme.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: theme.white,
  },
  unreadBadgeText: {
    color: theme.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  conversationContent: {
    flex: 1,
    marginLeft: 14,
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
    flex: 1,
    marginRight: 8,
  },
  conversationNameUnread: {
    fontWeight: "700",
  },
  conversationTime: {
    fontSize: 13,
    color: theme.textMuted,
  },
  conversationTimeUnread: {
    color: theme.accent,
    fontWeight: "600",
  },
  conversationPreview: {
    fontSize: 14,
    color: theme.textSecondary,
    flex: 1,
  },
  conversationPreviewUnread: {
    color: theme.text,
    fontWeight: "500",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  youPrefix: {
    fontSize: 14,
    color: theme.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 90,
  },
});