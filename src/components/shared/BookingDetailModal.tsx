// src/components/shared/BookingDetailModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  acceptBooking,
  declineBooking,
  completeBooking,
  markNoShow,
  cancelBooking,
} from "@/api/bookings";
import { getOrCreateConversation, getOrCreateConversationAsCoiffeur } from "@/api/messaging";
import type { BookingWithDetails } from "@/types/database";
import { getUserAvatar } from "@/constants/images";

const { height } = Dimensions.get("window");

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
  successLight: "#ECFDF5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEF2F2",
  border: "#E2E8F0",
};

// ============================================
// HELPERS
// ============================================
const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending":
      return { color: theme.warning, bg: theme.warningLight, label: "En attente" };
    case "confirmed":
      return { color: theme.success, bg: theme.successLight, label: "Confirmé" };
    case "in_progress":
      return { color: theme.accent, bg: theme.accentLight, label: "En cours" };
    case "completed":
      return { color: "#6B7280", bg: "#F3F4F6", label: "Terminé" };
    case "cancelled":
      return { color: theme.error, bg: theme.errorLight, label: "Annulé" };
    case "no_show":
      return { color: theme.error, bg: theme.errorLight, label: "Absent" };
    case "disputed":
      return { color: "#DC2626", bg: "#FEE2E2", label: "En litige" };
    default:
      return { color: theme.textMuted, bg: theme.card, label: status };
  }
};

const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const formatPrice = (cents: number): string => {
  return `${(cents / 100).toFixed(0)}€`;
};

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Demain";
  } else {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }
};

// ============================================
// TYPES
// ============================================
interface BookingDetailModalProps {
  visible: boolean;
  onClose: () => void;
  booking: BookingWithDetails | null;
  onAction?: () => void;
  /** "client" pour afficher les actions client, "coiffeur" pour les actions pro */
  viewMode?: "client" | "coiffeur";
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export function BookingDetailModal({
  visible,
  onClose,
  booking,
  onAction,
  viewMode = "coiffeur",
}: BookingDetailModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  // PanResponder pour le drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Animation d'ouverture
  useEffect(() => {
    if (visible) {
      translateY.setValue(height);
      backdropAnim.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Fermeture avec animation
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // ========== ACTIONS COIFFEUR ==========

  const handleAccept = async () => {
    if (!booking) return;
    setLoading(true);
    const success = await acceptBooking(booking.id);
    setLoading(false);
    if (success) {
      Alert.alert("Succès", "Réservation confirmée !");
      handleClose();
      onAction?.();
    } else {
      Alert.alert("Erreur", "Impossible de confirmer la réservation");
    }
  };

  const handleDecline = async () => {
    if (!booking) return;

    Alert.alert(
      "Refuser la réservation",
      "Êtes-vous sûr de vouloir refuser cette réservation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Refuser",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await declineBooking(booking.id, "Refusé par le coiffeur");
            setLoading(false);
            if (success) {
              Alert.alert("Succès", "Réservation refusée");
              handleClose();
              onAction?.();
            } else {
              Alert.alert("Erreur", "Impossible de refuser la réservation");
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!booking) return;
    setLoading(true);
    const success = await completeBooking(booking.id);
    setLoading(false);
    if (success) {
      Alert.alert("Succès", "Prestation terminée !");
      handleClose();
      onAction?.();
    } else {
      Alert.alert("Erreur", "Impossible de terminer la prestation");
    }
  };

  const handleNoShow = async () => {
    if (!booking) return;

    Alert.alert(
      "Client absent",
      "Marquer ce client comme absent ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await markNoShow(booking.id);
            setLoading(false);
            if (success) {
              Alert.alert("Noté", "Client marqué comme absent");
              handleClose();
              onAction?.();
            } else {
              Alert.alert("Erreur", "Impossible de mettre à jour le statut");
            }
          },
        },
      ]
    );
  };

  // ========== ACTIONS CLIENT ==========

  const handleCancelBooking = async () => {
    if (!booking) return;

    Alert.alert(
      "Annuler le rendez-vous",
      "Êtes-vous sûr de vouloir annuler ce rendez-vous ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await cancelBooking(booking.id);
            setLoading(false);
            if (success) {
              Alert.alert("Succès", "Votre rendez-vous a été annulé");
              handleClose();
              onAction?.();
            } else {
              Alert.alert("Erreur", "Impossible d'annuler le rendez-vous");
            }
          },
        },
      ]
    );
  };

  // ========== ACTIONS COMMUNES ==========

  const handleMessage = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      let conversation;
      
      if (viewMode === "coiffeur") {
        // En mode coiffeur, on contacte le CLIENT
        conversation = await getOrCreateConversationAsCoiffeur(booking.client_id, booking.id);
      } else {
        // En mode client, on contacte le COIFFEUR
        conversation = await getOrCreateConversation(booking.coiffeur_id, booking.id);
      }
      
      setLoading(false);
      handleClose();

      if (conversation) {
        if (viewMode === "coiffeur") {
          router.push(`/(app)/(pro)/conversation/${conversation.id}`);
        } else {
          router.push(`/(app)/(client)/conversation/${conversation.id}`);
        }
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Erreur", "Impossible d'ouvrir la conversation");
    }
  };

  // ========== RENDER ==========

  if (!booking) return null;

  const status = getStatusStyle(booking.status);
  
  // Infos selon le mode de vue
  const personName = viewMode === "coiffeur"
    ? booking.client?.full_name ||
      `${booking.client?.first_name || ""} ${booking.client?.last_name || ""}`.trim() ||
      "Client"
    : booking.coiffeur?.display_name ||
      booking.coiffeur?.profile?.full_name ||
      "Coiffeur";

  const personImage = viewMode === "coiffeur"
    ? getUserAvatar(booking.client?.avatar_url, personName)
    : getUserAvatar(
        booking.coiffeur?.avatar_url || booking.coiffeur?.profile?.avatar_url,
        personName
      );

  const services = booking.items || [];
  const dateLabel = formatDate(booking.start_at);

  // Déterminer si on peut annuler (pas déjà annulé, pas terminé, pas absent)
  const canCancel = !["cancelled", "completed", "no_show"].includes(booking.status);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Drag Handle */}
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.content}>
              {/* Header - Photo & Nom */}
              <View style={styles.headerSection}>
                <Image source={{ uri: personImage }} style={styles.avatar} />
                <Text style={styles.personName}>{personName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              {/* Détails */}
              <View style={styles.detailsSection}>
                {/* Date */}
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailText}>{dateLabel}</Text>
                </View>

                {/* Heure */}
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color={theme.textMuted} />
                  <Text style={styles.detailText}>
                    {formatTime(booking.start_at)} - {formatTime(booking.end_at)} (
                    {booking.total_duration_minutes} min)
                  </Text>
                </View>

                {/* Services */}
                {services.map((service, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Ionicons name="cut-outline" size={20} color={theme.textMuted} />
                    <Text style={styles.detailText}>{service.service_name}</Text>
                    <Text style={styles.detailPrice}>
                      {formatPrice(service.price_cents)}
                    </Text>
                  </View>
                ))}

                {/* Total */}
                <View style={[styles.detailRow, styles.totalRow]}>
                  <Ionicons name="cash-outline" size={20} color={theme.text} />
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalPrice}>
                    {formatPrice(booking.total_cents)}
                  </Text>
                </View>

                {/* Lieu */}
                {booking.location === "domicile" && (
                  <View style={styles.detailRow}>
                    <Ionicons name="home-outline" size={20} color={theme.textMuted} />
                    <Text style={styles.detailText}>À domicile</Text>
                  </View>
                )}

                {booking.location === "salon" && booking.coiffeur?.address && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={20} color={theme.textMuted} />
                    <Text style={styles.detailText} numberOfLines={2}>
                      {booking.coiffeur.address}
                    </Text>
                  </View>
                )}

                {/* Notes */}
                {booking.client_notes && (
                  <View style={styles.detailRow}>
                    <Ionicons name="chatbubble-outline" size={20} color={theme.textMuted} />
                    <Text style={styles.detailText} numberOfLines={3}>
                      {booking.client_notes}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Message */}
              <Pressable style={styles.messageButton} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
                <Text style={styles.messageButtonText}>Envoyer un message</Text>
              </Pressable>

              {/* Actions principales */}
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={theme.accent}
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <View style={styles.mainActions}>
                  {/* ===== VUE COIFFEUR ===== */}
                  {viewMode === "coiffeur" && (
                    <>
                      {/* RDV en attente */}
                      {booking.status === "pending" && (
                        <View style={styles.actionRow}>
                          <Pressable
                            style={styles.declineButton}
                            onPress={handleDecline}
                          >
                            <Text style={styles.declineButtonText}>Refuser</Text>
                          </Pressable>
                          <Pressable
                            style={styles.acceptButton}
                            onPress={handleAccept}
                          >
                            <Text style={styles.acceptButtonText}>Accepter</Text>
                          </Pressable>
                        </View>
                      )}

                      {/* RDV confirmé */}
                      {booking.status === "confirmed" && (
                        <>
                          <Pressable
                            style={styles.completeButton}
                            onPress={handleComplete}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={theme.white}
                            />
                            <Text style={styles.completeButtonText}>
                              Marquer comme terminé
                            </Text>
                          </Pressable>
                          <Pressable
                            style={styles.noShowButton}
                            onPress={handleNoShow}
                          >
                            <Ionicons
                              name="person-remove-outline"
                              size={18}
                              color={theme.error}
                            />
                            <Text style={styles.noShowButtonText}>Client absent</Text>
                          </Pressable>
                        </>
                      )}
                    </>
                  )}

                  {/* ===== VUE CLIENT ===== */}
                  {viewMode === "client" && canCancel && (
                    <Pressable
                      style={styles.cancelButton}
                      onPress={handleCancelBooking}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={theme.error} />
                      <Text style={styles.cancelButtonText}>Annuler le rendez-vous</Text>
                    </Pressable>
                  )}

                  {/* ===== BOUTON FEEDBACK (après completed) ===== */}
                  {booking.status === "completed" && (
                    <Pressable
                      style={styles.feedbackButton}
                      onPress={() => {
                        handleClose();
                        router.push(`/(app)/(shared)/feedback/${booking.id}` as any);
                      }}
                    >
                      <Ionicons name="star-outline" size={20} color={theme.accent} />
                      <Text style={styles.feedbackButtonText}>Donner mon avis</Text>
                    </Pressable>
                  )}

                  {/* ===== BOUTON SIGNALER UN PROBLÈME ===== */}
                  {!["cancelled", "disputed"].includes(booking.status) && (
                    <Pressable
                      style={styles.disputeButton}
                      onPress={() => {
                        handleClose();
                        router.push(`/(app)/(shared)/dispute/${booking.id}` as any);
                      }}
                    >
                      <Ionicons name="warning-outline" size={18} color={theme.error} />
                      <Text style={styles.disputeButtonText}>Signaler un problème</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.92,
    minHeight: height * 0.75,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Header
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  personName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Details
  detailsSection: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  detailText: {
    fontSize: 15,
    color: theme.text,
    flex: 1,
  },
  detailPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textSecondary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    flex: 1,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
  },

  // Message Button
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.card,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },

  // Main Actions
  mainActions: {
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },

  // Coiffeur buttons
  declineButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.errorLight,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.error,
  },
  acceptButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.success,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.white,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.accent,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.white,
  },
  noShowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.errorLight,
  },
  noShowButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.error,
  },

  // Client buttons
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.errorLight,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.error,
  },

  // Feedback button
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.accentLight,
    marginTop: 8,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.accent,
  },

  // Dispute button
  disputeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
  },
  disputeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.error,
  },
});

export default BookingDetailModal;