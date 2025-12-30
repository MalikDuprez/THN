// app/(app)/(pro)/conversation/[id].tsx
import { 
  View, 
  Text, 
  FlatList,
  TextInput,
  Pressable, 
  StyleSheet, 
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { 
  getConversationById,
  getMessages,
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  getOtherParticipantName,
  getOtherParticipantAvatar,
  type ConversationWithDetails,
  type MessageWithSender,
} from "@/api/messaging";

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
  success: "#10B981",
  messageSent: "#3B82F6",
  messageReceived: "#F1F5F9",
};

// ============================================
// COMPOSANTS
// ============================================

const MessageBubble = ({ 
  message, 
  isOwn,
  showAvatar,
  avatarUrl,
}: { 
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  avatarUrl: string;
}) => {
  const time = new Date(message.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Statut du message pour les messages envoyés
  const renderStatus = () => {
    if (!isOwn) return null;
    
    if (message.is_read) {
      // Lu = deux coches vertes
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-done" size={16} color="#22C55E" />
        </View>
      );
    } else {
      // Envoyé/Distribué = deux coches grises
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.6)" />
        </View>
      );
    }
  };

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {!isOwn && showAvatar ? (
        <Image source={{ uri: avatarUrl }} style={styles.messageAvatar} />
      ) : !isOwn ? (
        <View style={styles.messageAvatarPlaceholder} />
      ) : null}
      
      <View style={[
        styles.messageBubble,
        isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther
      ]}>
        <Text style={[
          styles.messageText,
          isOwn ? styles.messageTextOwn : styles.messageTextOther
        ]}>
          {message.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isOwn ? styles.messageTimeOwn : styles.messageTimeOther
          ]}>
            {time}
          </Text>
          {renderStatus()}
        </View>
      </View>
    </View>
  );
};

const DateSeparator = ({ date }: { date: string }) => (
  <View style={styles.dateSeparator}>
    <View style={styles.dateLine} />
    <Text style={styles.dateText}>{date}</Text>
    <View style={styles.dateLine} />
  </View>
);

const TypingIndicator = () => (
  <View style={styles.typingContainer}>
    <View style={styles.typingBubble}>
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, { opacity: 0.4 }]} />
        <View style={[styles.typingDot, { opacity: 0.7 }]} />
        <View style={[styles.typingDot, { opacity: 1 }]} />
      </View>
    </View>
  </View>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);
  
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Récupérer l'utilisateur courant
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Charger la conversation et les messages
  const loadData = useCallback(async () => {
    if (!id) return;
    
    try {
      const [conv, msgs] = await Promise.all([
        getConversationById(id),
        getMessages(id),
      ]);
      
      setConversation(conv);
      setMessages(msgs);
      
      // Marquer comme lu
      await markConversationAsRead(id);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // S'abonner aux nouveaux messages en temps réel
  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToMessages(
      id, 
      // onNewMessage
      (newMsg) => {
        setMessages(prev => {
          // Éviter les doublons
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        // Marquer comme lu si ce n'est pas notre message
        if (newMsg.sender_id !== currentUserId) {
          markConversationAsRead(id);
        }
        
        // Scroll vers le bas
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      // onMessageUpdated - pour les coches de lecture en temps réel
      (updatedMsg) => {
        setMessages(prev => 
          prev.map(m => m.id === updatedMsg.id ? updatedMsg : m)
        );
      }
    );

    return unsubscribe;
  }, [id, currentUserId]);

  // Envoyer un message
  const handleSend = async () => {
    if (!newMessage.trim() || !id || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const sent = await sendMessage(id, content);
      if (sent) {
        // Le message sera ajouté via le subscription realtime
        // Mais on peut l'ajouter immédiatement pour un feedback instantané
        setMessages(prev => {
          if (prev.some(m => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remettre le message en cas d'erreur
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  // Formater la date pour les séparateurs
  const formatDateSeparator = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
  };

  // Préparer les données avec séparateurs de date
  const getMessagesWithDates = () => {
    const result: (MessageWithSender | { type: "date"; date: string })[] = [];
    let lastDate = "";

    messages.forEach((message, index) => {
      const msgDate = new Date(message.created_at).toDateString();
      
      if (msgDate !== lastDate) {
        result.push({ type: "date", date: formatDateSeparator(message.created_at) });
        lastDate = msgDate;
      }
      
      result.push(message);
    });

    return result;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Conversation introuvable</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const otherName = getOtherParticipantName(conversation, true);
  const otherAvatar = getOtherParticipantAvatar(conversation, true);
  const messagesWithDates = getMessagesWithDates();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.white} />
        </Pressable>
        
        <Pressable style={styles.headerProfile}>
          <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{otherName}</Text>
            <Text style={styles.headerStatus}>Client</Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerActionButton}>
            <Ionicons name="call-outline" size={22} color={theme.white} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messagesWithDates}
          keyExtractor={(item, index) => 
            "type" in item ? `date-${index}` : item.id
          }
          renderItem={({ item, index }) => {
            if ("type" in item && item.type === "date") {
              return <DateSeparator date={item.date} />;
            }
            
            const message = item as MessageWithSender;
            const isOwn = message.sender_id === currentUserId;
            
            // Déterminer si on doit afficher l'avatar
            const prevItem = messagesWithDates[index - 1];
            const showAvatar = !prevItem || 
              "type" in prevItem || 
              (prevItem as MessageWithSender).sender_id !== message.sender_id;

            return (
              <MessageBubble 
                message={message} 
                isOwn={isOwn}
                showAvatar={showAvatar}
                avatarUrl={otherAvatar}
              />
            );
          }}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />
      </View>

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Votre message..."
            placeholderTextColor={theme.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <Pressable 
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Ionicons name="send" size={20} color={theme.white} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.white 
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: theme.textMuted,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "600",
  },

  // Header
  header: {
    backgroundColor: theme.black,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  headerBack: {
    padding: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.white,
  },
  headerStatus: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerActionButton: {
    padding: 8,
  },

  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: theme.white,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Message Row
  messageRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-end",
  },
  messageRowOwn: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageAvatarPlaceholder: {
    width: 28,
    marginRight: 8,
  },

  // Message Bubble
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleOwn: {
    backgroundColor: theme.messageSent,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: theme.messageReceived,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: theme.white,
  },
  messageTextOther: {
    color: theme.text,
  },
  messageTime: {
    fontSize: 11,
  },
  messageTimeOwn: {
    color: "rgba(255,255,255,0.7)",
  },
  messageTimeOther: {
    color: theme.textMuted,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  statusContainer: {
    marginLeft: 2,
  },

  // Date Separator
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dateText: {
    fontSize: 12,
    color: theme.textMuted,
    marginHorizontal: 12,
    textTransform: "capitalize",
  },

  // Typing Indicator
  typingContainer: {
    flexDirection: "row",
    marginBottom: 8,
    marginLeft: 36,
  },
  typingBubble: {
    backgroundColor: theme.messageReceived,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.textMuted,
  },

  // Input
  inputContainer: {
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.card,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: theme.textMuted,
  },
});