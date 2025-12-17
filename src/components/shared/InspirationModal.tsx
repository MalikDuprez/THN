// components/InspirationModal.tsx
import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { useBookingStore } from "@stores/bookingStore";

const { width, height } = Dimensions.get("window");

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  error: "#C62828",
  errorLight: "#FFEBEE",
};

interface InspirationItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  image: string;
  price: number;
  description?: string;
}

// Type pour les données de succès
interface SuccessData {
  title: string;
  subtitle: string;
  recapImage?: string;
  recapTitle?: string;
  recapSubtitle?: string;
  recapItems?: { icon: string; text: string }[];
  priceLabel?: string;
  priceValue?: string;
  buttonText?: string;
}

interface InspirationModalProps {
  visible: boolean;
  item: InspirationItem | null;
  onClose: () => void;
  onBook: () => void;
  onSuccess?: (data: SuccessData) => void;
}

// Types pour les commentaires avec réponses
interface Reply {
  id: string;
  user: {
    name: string;
    image: string;
  };
  text: string;
  date: string;
  likes: number;
  isOwn: boolean;
  mentionedUser?: string; // @nom de la personne à qui on répond
}

interface Comment {
  id: string;
  user: {
    name: string;
    image: string;
  };
  text: string;
  date: string;
  likes: number;
  isOwn: boolean;
  replies: Reply[];
}

// Mock coiffeur data
const COIFFEUR = {
  id: "1",
  name: "Sophie Martin",
  salon: "Atelier Sophie",
  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  rating: 4.9,
  reviews: 127,
  distance: "0.8 km",
  isAvailable: true,
  // Options de lieu
  offersHomeService: true,   // Propose à domicile
  offersSalonService: true,  // Propose en salon
  homeServiceFee: 15,        // Frais de déplacement
};

// Mock stats inspiration
const INSPIRATION_STATS = {
  likes: 234,
  rating: 4.8,
  ratingCount: 47,
  saves: 89,
};

// Mock commentaires avec réponses
const INITIAL_COMMENTS: Comment[] = [
  {
    id: "1",
    user: {
      name: "Marie Dupont",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    },
    text: "Magnifique résultat ! Sophie a fait un travail incroyable sur mes cheveux. Je recommande vivement 💇‍♀️",
    date: "Il y a 2 jours",
    likes: 12,
    isOwn: false,
    replies: [
      {
        id: "1-1",
        user: {
          name: "Sophie Martin",
          image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
        },
        text: "Merci beaucoup Marie ! C'était un plaisir de travailler avec toi 🙏",
        date: "Il y a 2 jours",
        likes: 5,
        isOwn: false,
        mentionedUser: "Marie Dupont",
      },
      {
        id: "1-2",
        user: {
          name: "Julie Moreau",
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        },
        text: "Tu as trop de chance ! J'aimerais avoir le même résultat",
        date: "Il y a 1 jour",
        likes: 2,
        isOwn: false,
        mentionedUser: "Marie Dupont",
      },
    ],
  },
  {
    id: "2",
    user: {
      name: "Léa Bernard",
      image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100",
    },
    text: "J'adore cette coupe ! Est-ce que ça convient aux cheveux fins ?",
    date: "Il y a 5 jours",
    likes: 5,
    isOwn: false,
    replies: [],
  },
  {
    id: "3",
    user: {
      name: "Vous",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    },
    text: "Super inspiration, j'ai hâte d'essayer !",
    date: "Il y a 1 semaine",
    likes: 3,
    isOwn: true,
    replies: [],
  },
  {
    id: "4",
    user: {
      name: "Claire Martin",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
    },
    text: "Le balayage est parfait, très naturel. Combien de temps ça prend environ ?",
    date: "Il y a 2 semaines",
    likes: 8,
    isOwn: false,
    replies: [],
  },
];

// Mock disponibilités
const AVAILABLE_DATES = [
  { day: "Aujourd'hui", date: "15 Jan", slots: 3 },
  { day: "Demain", date: "16 Jan", slots: 5 },
  { day: "Jeu", date: "17 Jan", slots: 2 },
  { day: "Ven", date: "18 Jan", slots: 4 },
  { day: "Sam", date: "19 Jan", slots: 1 },
];

const AVAILABLE_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

type TabType = "reservation" | "commentaires";

// Composant pour afficher une réponse
interface ReplyItemProps {
  reply: Reply;
  onLike: () => void;
  onReply: () => void;
  onDelete: () => void;
  onReport: () => void;
  showMenu: boolean;
  onToggleMenu: () => void;
}

function ReplyItem({ reply, onLike, onReply, onDelete, onReport, showMenu, onToggleMenu }: ReplyItemProps) {
  return (
    <View style={styles.replyCard}>
      <Image source={{ uri: reply.user.image }} style={styles.replyAvatar} />
      <View style={styles.replyContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.replyAuthor}>{reply.user.name}</Text>
          <Text style={styles.commentDate}>{reply.date}</Text>
        </View>
        <Text style={styles.replyText}>
          {reply.mentionedUser && (
            <Text style={styles.mentionText}>@{reply.mentionedUser} </Text>
          )}
          {reply.text}
        </Text>
        <View style={styles.commentActions}>
          <Pressable style={styles.commentAction} onPress={onLike}>
            <Ionicons name="heart-outline" size={13} color={theme.textMuted} />
            <Text style={styles.replyActionText}>{reply.likes}</Text>
          </Pressable>
          <Pressable style={styles.commentAction} onPress={onReply}>
            <Text style={styles.replyActionText}>Répondre</Text>
          </Pressable>
          <Pressable style={styles.commentAction} onPress={onToggleMenu}>
            <Ionicons name="ellipsis-horizontal" size={13} color={theme.textMuted} />
          </Pressable>
        </View>
        
        {/* Menu déroulant */}
        {showMenu && (
          <View style={styles.reportMenu}>
            {reply.isOwn ? (
              <Pressable style={styles.reportMenuItem} onPress={onDelete}>
                <Ionicons name="trash-outline" size={16} color={theme.error} />
                <Text style={[styles.reportMenuText, { color: theme.error }]}>
                  Supprimer
                </Text>
              </Pressable>
            ) : (
              <Pressable style={styles.reportMenuItem} onPress={onReport}>
                <Ionicons name="flag-outline" size={16} color={theme.error} />
                <Text style={[styles.reportMenuText, { color: theme.error }]}>
                  Signaler
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function InspirationModal({ visible, item, onClose, onBook, onSuccess }: InspirationModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setCurrentBooking, confirmBooking } = useBookingStore();
  
  // États
  const [activeTab, setActiveTab] = useState<TabType>("reservation");
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(INSPIRATION_STATS.likes);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [showReportMenu, setShowReportMenu] = useState<string | null>(null);
  
  // États pour les réponses style Instagram
  const [replyingTo, setReplyingTo] = useState<{ 
    commentId: string; 
    userName: string;
    isReplyToReply?: boolean;
    replyId?: string;
  } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  
  // États pour le paiement
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"card" | "apple" | "google">("card");
  const [selectedLocation, setSelectedLocation] = useState<"salon" | "domicile">(
    COIFFEUR.offersSalonService ? "salon" : "domicile"
  );
  
  // États pour le calendrier
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  
  // Ref pour l'input
  const inputRef = useRef<TextInput>(null);
  
  // Animation pour le slide
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  // Swipe gesture
  const panY = useRef(new Animated.Value(0)).current;
  const lastGestureY = useRef(0);

  // Fonctions calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = dimanche
    
    const days: (number | null)[] = [];
    
    // Jours vides avant le 1er
    for (let i = 0; i < (startingDay === 0 ? 6 : startingDay - 1); i++) {
      days.push(null);
    }
    
    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const isDateAvailable = (day: number) => {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disponible si >= aujourd'hui et pas dimanche (exemple)
    return date >= today && date.getDay() !== 0;
  };

  const isDateSelected = (day: number) => {
    if (!selectedCalendarDate) return false;
    return (
      selectedCalendarDate.getDate() === day &&
      selectedCalendarDate.getMonth() === calendarMonth.getMonth() &&
      selectedCalendarDate.getFullYear() === calendarMonth.getFullYear()
    );
  };

  const handleCalendarDateSelect = (day: number) => {
    if (!isDateAvailable(day)) return;
    
    const newDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedCalendarDate(newDate);
    setSelectedTime(null);
    setShowCalendar(false);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    const today = new Date();
    if (newDate.getMonth() >= today.getMonth() || newDate.getFullYear() > today.getFullYear()) {
      setCalendarMonth(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarMonth(newDate);
  };

  const getSelectedDateDisplay = () => {
    if (selectedCalendarDate) {
      const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
      return selectedCalendarDate.toLocaleDateString("fr-FR", options);
    }
    if (selectedDate < AVAILABLE_DATES.length) {
      return `${AVAILABLE_DATES[selectedDate].day}, ${AVAILABLE_DATES[selectedDate].date}`;
    }
    return "";
  };

  // Ouvrir/Fermer avec animation
  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCloseWithAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset states
      setActiveTab("reservation");
      setSelectedDate(0);
      setSelectedTime(null);
      setShowReportMenu(null);
      setReplyingTo(null);
      panY.setValue(0);
    });
  };

  // Gestion du swipe manuel via responders
  const handleTouchStart = (e: any) => {
    lastGestureY.current = e.nativeEvent.pageY;
  };

  const handleTouchMove = (e: any) => {
    const currentY = e.nativeEvent.pageY;
    const diff = currentY - lastGestureY.current;
    
    if (diff > 0) {
      panY.setValue(diff);
    }
  };

  const handleTouchEnd = (e: any) => {
    const currentY = e.nativeEvent.pageY;
    const diff = currentY - lastGestureY.current;
    
    if (diff > 120) {
      handleCloseWithAnimation();
    } else {
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  };

  if (!item) return null;

  const handleCoiffeurPress = () => {
    handleCloseWithAnimation();
    setTimeout(() => {
      router.push(`/(app)/(shared)/coiffeur/${COIFFEUR.id}`);
    }, 300);
  };

  const handleBook = () => {
    if (selectedTime && item && !isProcessingPayment) {
      setIsProcessingPayment(true);
      
      // Déterminer la date à utiliser
      const dateDisplay = selectedCalendarDate 
        ? selectedCalendarDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })
        : AVAILABLE_DATES[selectedDate].day;
      const dateFormatted = selectedCalendarDate
        ? selectedCalendarDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : AVAILABLE_DATES[selectedDate].date;
      
      // Calculer le prix
      const fee = selectedLocation === "domicile" ? COIFFEUR.homeServiceFee : 0;
      const price = item.price + fee;
      
      // Stocker la réservation dans le store
      setCurrentBooking({
        inspiration: {
          id: item.id,
          title: item.title,
          image: item.image,
          category: item.category,
          duration: item.duration,
          price: price,
        },
        coiffeur: {
          id: COIFFEUR.id,
          name: COIFFEUR.name,
          salon: COIFFEUR.salon,
          image: COIFFEUR.image,
          rating: COIFFEUR.rating,
        },
        date: dateDisplay,
        dateFormatted: dateFormatted,
        time: selectedTime,
        location: selectedLocation,
      });
      
      // Simuler le paiement (2 sec)
      setTimeout(() => {
        confirmBooking();
        setIsProcessingPayment(false);
        
        // Préparer les données de succès
        const successData: SuccessData = {
          title: "Réservation confirmée !",
          subtitle: "Votre rendez-vous a été enregistré",
          recapImage: COIFFEUR.image,
          recapTitle: item.title,
          recapSubtitle: `avec ${COIFFEUR.name}`,
          recapItems: [
            { icon: "calendar-outline", text: `${dateDisplay}, ${dateFormatted}` },
            { icon: "time-outline", text: selectedTime },
            { icon: selectedLocation === "salon" ? "storefront" : "home", text: selectedLocation === "salon" ? "En salon" : "À domicile" },
          ],
          priceLabel: "Total payé",
          priceValue: `${price}€`,
          buttonText: "Voir mes réservations",
        };
        
        // Fermer la modale et appeler onSuccess
        handleCloseWithAnimation();
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(successData);
          }
        }, 300);
      }, 2000);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  // Ajouter un commentaire ou une réponse
  const handleAddComment = () => {
    if (newComment.trim()) {
      if (replyingTo) {
        // Ajouter une réponse
        const newReply: Reply = {
          id: `${replyingTo.commentId}-${Date.now()}`,
          user: {
            name: "Vous",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          },
          text: newComment.trim().replace(`@${replyingTo.userName} `, ""),
          date: "À l'instant",
          likes: 0,
          isOwn: true,
          mentionedUser: replyingTo.userName,
        };
        
        setComments(comments.map(comment => {
          if (comment.id === replyingTo.commentId) {
            return {
              ...comment,
              replies: [...comment.replies, newReply],
            };
          }
          return comment;
        }));
        
        // Déplier automatiquement les réponses de ce commentaire
        if (!expandedReplies.includes(replyingTo.commentId)) {
          setExpandedReplies([...expandedReplies, replyingTo.commentId]);
        }
        
        setReplyingTo(null);
      } else {
        // Ajouter un nouveau commentaire
        const comment: Comment = {
          id: Date.now().toString(),
          user: {
            name: "Vous",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          },
          text: newComment.trim(),
          date: "À l'instant",
          likes: 0,
          isOwn: true,
          replies: [],
        };
        setComments([comment, ...comments]);
      }
      setNewComment("");
    }
  };

  // Répondre à un commentaire
  const handleReplyToComment = (commentId: string, userName: string) => {
    setReplyingTo({ commentId, userName });
    setNewComment(`@${userName} `);
    inputRef.current?.focus();
  };

  // Répondre à une réponse (même commentaire parent)
  const handleReplyToReply = (commentId: string, userName: string) => {
    setReplyingTo({ commentId, userName, isReplyToReply: true });
    setNewComment(`@${userName} `);
    inputRef.current?.focus();
  };

  // Annuler la réponse
  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  // Afficher/masquer les réponses
  const toggleReplies = (commentId: string) => {
    if (expandedReplies.includes(commentId)) {
      setExpandedReplies(expandedReplies.filter(id => id !== commentId));
    } else {
      setExpandedReplies([...expandedReplies, commentId]);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
    setShowReportMenu(null);
  };

  const handleDeleteReply = (commentId: string, replyId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: comment.replies.filter(r => r.id !== replyId),
        };
      }
      return comment;
    }));
    setShowReportMenu(null);
  };

  const handleReportComment = (commentId: string) => {
    setShowReportMenu(null);
    // En production: envoyer le signalement au backend
  };

  const canBook = selectedTime !== null;

  // Calcul du prix total
  const homeServiceFee = selectedLocation === "domicile" ? COIFFEUR.homeServiceFee : 0;
  const totalPrice = item ? item.price + homeServiceFee : 0;

  // Options de lieu disponibles
  const hasBothOptions = COIFFEUR.offersHomeService && COIFFEUR.offersSalonService;
  const onlyHomeService = COIFFEUR.offersHomeService && !COIFFEUR.offersSalonService;
  const onlySalonService = !COIFFEUR.offersHomeService && COIFFEUR.offersSalonService;

  const translateY = Animated.add(slideAnim, panY);

  // Compter le total des commentaires + réponses
  const totalComments = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <View style={styles.container}>
        {/* Backdrop animé */}
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: backdropAnim }
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseWithAnimation} />
        </Animated.View>
        
        {/* Modal Content avec animation */}
        <Animated.View 
          style={[
            styles.modalContent, 
            { 
              transform: [{ translateY }],
            }
          ]}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Image avec handle intégré */}
              <View style={styles.imageContainer}>
                {/* Zone de swipe avec handle */}
                <View 
                  style={styles.handleZone}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <View style={styles.handle} />
                </View>
                
                <Image source={{ uri: item.image }} style={styles.image} />
                
                {/* Bouton fermer */}
                <Pressable style={styles.closeButton} onPress={handleCloseWithAnimation}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>
                
                {/* Stats en bas à gauche */}
                <View style={styles.statsOverlay}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={14} color="#FFF" />
                    <Text style={styles.statText}>{likesCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={styles.statText}>{INSPIRATION_STATS.rating}</Text>
                    <Text style={styles.statSubtext}>({INSPIRATION_STATS.ratingCount})</Text>
                  </View>
                </View>
                
                {/* Actions en bas à droite */}
                <View style={styles.actionsOverlay}>
                  <Pressable style={styles.actionButton} onPress={handleLike}>
                    <Ionicons 
                      name={isLiked ? "heart" : "heart-outline"} 
                      size={24} 
                      color={isLiked ? "#E53935" : "#FFF"} 
                    />
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={handleSave}>
                    <Ionicons 
                      name={isSaved ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={isSaved ? "#FFB800" : "#FFF"} 
                    />
                  </Pressable>
                </View>
              </View>

              {/* Titre et prix */}
              <View style={styles.titleSection}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.durationRow}>
                    <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.duration}>{item.duration}</Text>
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{item.price}€</Text>
                </View>
              </View>

              {/* Tags descriptifs */}
              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.category}</Text>
                </View>
                {item.category !== "Balayage" && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Balayage</Text>
                  </View>
                )}
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Naturel</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Tendance 2025</Text>
                </View>
              </View>

              {/* Onglets Réservation / Commentaires */}
              <View style={styles.tabsContainer}>
                <Pressable 
                  style={[styles.tab, activeTab === "reservation" && styles.tabActive]}
                  onPress={() => setActiveTab("reservation")}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={18} 
                    color={activeTab === "reservation" ? "#FFF" : theme.textMuted} 
                  />
                  <Text style={[styles.tabText, activeTab === "reservation" && styles.tabTextActive]}>
                    Réservation
                  </Text>
                </Pressable>
                <Pressable 
                  style={[styles.tab, activeTab === "commentaires" && styles.tabActive]}
                  onPress={() => setActiveTab("commentaires")}
                >
                  <Ionicons 
                    name="chatbubble-outline" 
                    size={18} 
                    color={activeTab === "commentaires" ? "#FFF" : theme.textMuted} 
                  />
                  <Text style={[styles.tabText, activeTab === "commentaires" && styles.tabTextActive]}>
                    Commentaires ({totalComments})
                  </Text>
                </Pressable>
              </View>

              {/* TAB RÉSERVATION */}
              {activeTab === "reservation" && (
                <View style={styles.content}>
                  {/* Coiffeur Card - Cliquable */}
                  <Pressable style={styles.coiffeurCard} onPress={handleCoiffeurPress}>
                    <Image source={{ uri: COIFFEUR.image }} style={styles.coiffeurImage} />
                    <View style={styles.coiffeurInfo}>
                      <View style={styles.coiffeurNameRow}>
                        <Text style={styles.coiffeurName}>{COIFFEUR.name}</Text>
                        {COIFFEUR.isAvailable && (
                          <View style={styles.availableBadge}>
                            <View style={styles.availableDot} />
                            <Text style={styles.availableText}>Disponible</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.coiffeurSalon}>{COIFFEUR.salon}</Text>
                      <View style={styles.coiffeurMeta}>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={12} color="#FFB800" />
                          <Text style={styles.ratingText}>{COIFFEUR.rating}</Text>
                          <Text style={styles.reviewsText}>({COIFFEUR.reviews})</Text>
                        </View>
                        <View style={styles.distanceContainer}>
                          <Ionicons name="location" size={12} color={theme.textMuted} />
                          <Text style={styles.distanceText}>{COIFFEUR.distance}</Text>
                        </View>
                      </View>
                      {/* Badges lieu */}
                      <View style={styles.locationBadges}>
                        {COIFFEUR.offersSalonService && (
                          <View style={styles.locationBadge}>
                            <Ionicons name="storefront" size={10} color={theme.textSecondary} />
                            <Text style={styles.locationBadgeText}>En salon</Text>
                          </View>
                        )}
                        {COIFFEUR.offersHomeService && (
                          <View style={styles.locationBadge}>
                            <Ionicons name="home" size={10} color={theme.textSecondary} />
                            <Text style={styles.locationBadgeText}>À domicile</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                  </Pressable>

                  {/* Sélection du lieu - AVANT date et heure */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lieu du rendez-vous</Text>
                    
                    {/* Si les deux options sont disponibles */}
                    {hasBothOptions && (
                      <View style={styles.locationOptions}>
                        <Pressable
                          style={[
                            styles.locationOption,
                            selectedLocation === "salon" && styles.locationOptionSelected,
                          ]}
                          onPress={() => setSelectedLocation("salon")}
                        >
                          <Ionicons 
                            name="storefront" 
                            size={16} 
                            color={selectedLocation === "salon" ? "#FFF" : theme.text} 
                          />
                          <Text style={[
                            styles.locationOptionText,
                            selectedLocation === "salon" && styles.locationOptionTextSelected,
                          ]}>
                            En salon
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.locationOption,
                            selectedLocation === "domicile" && styles.locationOptionSelected,
                          ]}
                          onPress={() => setSelectedLocation("domicile")}
                        >
                          <Ionicons 
                            name="home" 
                            size={16} 
                            color={selectedLocation === "domicile" ? "#FFF" : theme.text} 
                          />
                          <Text style={[
                            styles.locationOptionText,
                            selectedLocation === "domicile" && styles.locationOptionTextSelected,
                          ]}>
                            À domicile
                          </Text>
                          <Text style={[
                            styles.locationOptionFee,
                            selectedLocation === "domicile" && styles.locationOptionFeeSelected,
                          ]}>
                            +{COIFFEUR.homeServiceFee}€
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Si uniquement en salon */}
                    {onlySalonService && (
                      <View style={styles.locationOnlyInfo}>
                        <View style={styles.locationOnlyIcon}>
                          <Ionicons name="storefront" size={16} color={theme.text} />
                        </View>
                        <View>
                          <Text style={styles.locationOnlyTitle}>En salon uniquement</Text>
                          <Text style={styles.locationOnlySubtitle}>
                            Ce coiffeur ne se déplace pas à domicile
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Si uniquement à domicile */}
                    {onlyHomeService && (
                      <View style={styles.locationOnlyInfo}>
                        <View style={styles.locationOnlyIcon}>
                          <Ionicons name="home" size={16} color={theme.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.locationOnlyTitle}>À domicile uniquement</Text>
                          <Text style={styles.locationOnlySubtitle}>
                            Ce coiffeur se déplace uniquement chez vous
                          </Text>
                        </View>
                        <View style={styles.locationOnlyFee}>
                          <Text style={styles.locationOnlyFeeText}>+{COIFFEUR.homeServiceFee}€</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Sélection de date */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choisir une date</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.datesContainer}
                    >
                      {AVAILABLE_DATES.map((date, index) => (
                        <Pressable
                          key={index}
                          style={[
                            styles.dateCard,
                            selectedDate === index && !selectedCalendarDate && styles.dateCardSelected,
                          ]}
                          onPress={() => {
                            setSelectedDate(index);
                            setSelectedCalendarDate(null);
                            setSelectedTime(null);
                          }}
                        >
                          <Text style={[
                            styles.dateDay,
                            selectedDate === index && !selectedCalendarDate && styles.dateDaySelected,
                          ]}>
                            {date.day}
                          </Text>
                          <Text style={[
                            styles.dateNumber,
                            selectedDate === index && !selectedCalendarDate && styles.dateNumberSelected,
                          ]}>
                            {date.date}
                          </Text>
                          <Text style={[
                            styles.dateSlots,
                            selectedDate === index && !selectedCalendarDate && styles.dateSlotsSelected,
                          ]}>
                            {date.slots} dispo
                          </Text>
                        </Pressable>
                      ))}
                      
                      {/* Bouton Voir plus */}
                      <Pressable
                        style={styles.seeMoreDateButton}
                        onPress={() => setShowCalendar(true)}
                      >
                        <Ionicons name="calendar-outline" size={18} color={theme.textMuted} />
                        <Text style={styles.seeMoreDateText}>Voir plus</Text>
                      </Pressable>
                    </ScrollView>
                    
                    {/* Afficher la date sélectionnée du calendrier */}
                    {selectedCalendarDate && (
                      <View style={styles.selectedCalendarDateBadge}>
                        <Ionicons name="calendar" size={14} color={theme.text} />
                        <Text style={styles.selectedCalendarDateText}>
                          {selectedCalendarDate.toLocaleDateString("fr-FR", { 
                            weekday: "long", 
                            day: "numeric", 
                            month: "long" 
                          })}
                        </Text>
                        <Pressable 
                          onPress={() => {
                            setSelectedCalendarDate(null);
                            setSelectedDate(0);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Sélection d'heure */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choisir une heure</Text>
                    <View style={styles.timesGrid}>
                      {AVAILABLE_TIMES.map((time) => (
                        <Pressable
                          key={time}
                          style={[
                            styles.timeSlot,
                            selectedTime === time && styles.timeSlotSelected,
                          ]}
                          onPress={() => setSelectedTime(time)}
                        >
                          <Text style={[
                            styles.timeText,
                            selectedTime === time && styles.timeTextSelected,
                          ]}>
                            {time}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Section Paiement - Apparaît quand date + heure sélectionnées */}
                  {selectedTime && (
                    <>
                      {/* Récapitulatif */}
                      <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Date</Text>
                          <Text style={styles.summaryValue}>
                            {selectedCalendarDate 
                              ? selectedCalendarDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
                              : `${AVAILABLE_DATES[selectedDate].day}, ${AVAILABLE_DATES[selectedDate].date}`
                            }
                          </Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Heure</Text>
                          <Text style={styles.summaryValue}>{selectedTime}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Lieu</Text>
                          <View style={styles.summaryValueRow}>
                            <Ionicons 
                              name={selectedLocation === "salon" ? "storefront" : "home"} 
                              size={14} 
                              color={theme.textSecondary} 
                            />
                            <Text style={styles.summaryValue}>
                              {selectedLocation === "salon" ? "En salon" : "À domicile"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Durée</Text>
                          <Text style={styles.summaryValue}>{item.duration}</Text>
                        </View>
                      </View>

                      {/* Mode de paiement */}
                      <View style={styles.paymentSection}>
                        <Text style={styles.paymentSectionTitle}>Mode de paiement</Text>
                        
                        <Pressable 
                          style={[styles.paymentOption, selectedPayment === "card" && styles.paymentOptionSelected]}
                          onPress={() => setSelectedPayment("card")}
                        >
                          <View style={styles.paymentLeft}>
                            <View style={styles.paymentIcon}>
                              <Ionicons name="card-outline" size={20} color={theme.text} />
                            </View>
                            <View>
                              <Text style={styles.paymentTitle}>Carte bancaire</Text>
                              <Text style={styles.paymentSubtitle}>•••• •••• •••• 4242</Text>
                            </View>
                          </View>
                          <View style={[styles.radio, selectedPayment === "card" && styles.radioSelected]}>
                            {selectedPayment === "card" && <View style={styles.radioInner} />}
                          </View>
                        </Pressable>

                        <Pressable 
                          style={[styles.paymentOption, selectedPayment === "apple" && styles.paymentOptionSelected]}
                          onPress={() => setSelectedPayment("apple")}
                        >
                          <View style={styles.paymentLeft}>
                            <View style={styles.paymentIcon}>
                              <Ionicons name="logo-apple" size={20} color={theme.text} />
                            </View>
                            <Text style={styles.paymentTitle}>Apple Pay</Text>
                          </View>
                          <View style={[styles.radio, selectedPayment === "apple" && styles.radioSelected]}>
                            {selectedPayment === "apple" && <View style={styles.radioInner} />}
                          </View>
                        </Pressable>

                        <Pressable 
                          style={[styles.paymentOption, selectedPayment === "google" && styles.paymentOptionSelected]}
                          onPress={() => setSelectedPayment("google")}
                        >
                          <View style={styles.paymentLeft}>
                            <View style={styles.paymentIcon}>
                              <Ionicons name="logo-google" size={20} color={theme.text} />
                            </View>
                            <Text style={styles.paymentTitle}>Google Pay</Text>
                          </View>
                          <View style={[styles.radio, selectedPayment === "google" && styles.radioSelected]}>
                            {selectedPayment === "google" && <View style={styles.radioInner} />}
                          </View>
                        </Pressable>
                      </View>

                      {/* Détail prix + CTA Paiement */}
                      <View style={styles.paymentFooter}>
                        {/* Détail du prix */}
                        <View style={styles.priceBreakdown}>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>{item.title}</Text>
                            <Text style={styles.priceValue}>{item.price}€</Text>
                          </View>
                          {selectedLocation === "domicile" && (
                            <View style={styles.priceRow}>
                              <View style={styles.priceLabelRow}>
                                <Text style={styles.priceLabel}>Frais de déplacement</Text>
                                <Ionicons name="home" size={12} color={theme.textMuted} />
                              </View>
                              <Text style={styles.priceValue}>+{COIFFEUR.homeServiceFee}€</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Total</Text>
                          <Text style={styles.totalValue}>{totalPrice}€</Text>
                        </View>
                        
                        <Pressable 
                          style={[styles.payButton, isProcessingPayment && styles.payButtonDisabled]}
                          onPress={handleBook}
                          disabled={isProcessingPayment}
                        >
                          {isProcessingPayment ? (
                            <View style={styles.ctaLoadingContainer}>
                              <ActivityIndicator color="#FFF" size="small" />
                              <Text style={styles.payButtonText}>Paiement en cours...</Text>
                            </View>
                          ) : (
                            <>
                              <Text style={styles.payButtonText}>Payer {totalPrice}€</Text>
                              <Ionicons name="lock-closed" size={16} color="#FFF" />
                            </>
                          )}
                        </Pressable>
                        
                        <Text style={styles.secureText}>
                          <Ionicons name="shield-checkmark" size={12} color={theme.textMuted} /> Paiement sécurisé
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Message si pas encore sélectionné */}
                  {!selectedTime && (
                    <View style={styles.selectTimeHint}>
                      <Ionicons name="time-outline" size={20} color={theme.textMuted} />
                      <Text style={styles.selectTimeHintText}>
                        Sélectionnez une date et une heure pour continuer
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* TAB COMMENTAIRES */}
              {activeTab === "commentaires" && (
                <View style={styles.content}>
                  {/* Note moyenne */}
                  <View style={styles.ratingOverview}>
                    <View style={styles.ratingBig}>
                      <Ionicons name="star" size={28} color="#FFB800" />
                      <Text style={styles.ratingBigText}>{INSPIRATION_STATS.rating}</Text>
                    </View>
                    <Text style={styles.ratingSubtext}>
                      Basé sur {INSPIRATION_STATS.ratingCount} avis de clients ayant réalisé cette coupe
                    </Text>
                  </View>

                  {/* Input nouveau commentaire / réponse */}
                  <View style={styles.newCommentContainer}>
                    {/* Indicateur de réponse style Instagram */}
                    {replyingTo && (
                      <View style={styles.replyingToContainer}>
                        <Text style={styles.replyingToText}>
                          Réponse à <Text style={styles.replyingToName}>@{replyingTo.userName}</Text>
                        </Text>
                        <Pressable onPress={handleCancelReply} hitSlop={8}>
                          <Ionicons name="close" size={18} color={theme.textMuted} />
                        </Pressable>
                      </View>
                    )}
                    
                    <View style={styles.inputRow}>
                      <Image 
                        source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" }} 
                        style={styles.newCommentAvatar} 
                      />
                      <View style={styles.newCommentInputWrapper}>
                        <TextInput
                          ref={inputRef}
                          value={newComment}
                          onChangeText={setNewComment}
                          placeholder={replyingTo ? "Écrire une réponse..." : "Ajouter un commentaire..."}
                          placeholderTextColor={theme.textMuted}
                          style={styles.commentTextInput}
                          multiline
                        />
                        {newComment.trim().length > 0 && (
                          <Pressable style={styles.sendButton} onPress={handleAddComment}>
                            <Ionicons name="send" size={18} color="#FFF" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Liste des commentaires */}
                  <View style={styles.commentsList}>
                    {comments.map((comment) => (
                      <View key={comment.id}>
                        {/* Commentaire principal */}
                        <View style={styles.commentCard}>
                          <Image source={{ uri: comment.user.image }} style={styles.commentAvatar} />
                          <View style={styles.commentContent}>
                            <View style={styles.commentHeader}>
                              <Text style={styles.commentAuthor}>{comment.user.name}</Text>
                              <Text style={styles.commentDate}>{comment.date}</Text>
                            </View>
                            <Text style={styles.commentText}>{comment.text}</Text>
                            <View style={styles.commentActions}>
                              <Pressable style={styles.commentAction}>
                                <Ionicons name="heart-outline" size={14} color={theme.textMuted} />
                                <Text style={styles.commentActionText}>{comment.likes}</Text>
                              </Pressable>
                              
                              {/* Bouton Répondre */}
                              <Pressable 
                                style={styles.commentAction}
                                onPress={() => handleReplyToComment(comment.id, comment.user.name)}
                              >
                                <Text style={styles.commentActionText}>Répondre</Text>
                              </Pressable>
                              
                              {/* Menu actions (supprimer/signaler) */}
                              <Pressable 
                                style={styles.commentAction}
                                onPress={() => setShowReportMenu(
                                  showReportMenu === comment.id ? null : comment.id
                                )}
                              >
                                <Ionicons name="ellipsis-horizontal" size={14} color={theme.textMuted} />
                              </Pressable>
                            </View>
                            
                            {/* Menu déroulant */}
                            {showReportMenu === comment.id && (
                              <View style={styles.reportMenu}>
                                {comment.isOwn ? (
                                  <Pressable 
                                    style={styles.reportMenuItem}
                                    onPress={() => handleDeleteComment(comment.id)}
                                  >
                                    <Ionicons name="trash-outline" size={16} color={theme.error} />
                                    <Text style={[styles.reportMenuText, { color: theme.error }]}>
                                      Supprimer
                                    </Text>
                                  </Pressable>
                                ) : (
                                  <Pressable 
                                    style={styles.reportMenuItem}
                                    onPress={() => handleReportComment(comment.id)}
                                  >
                                    <Ionicons name="flag-outline" size={16} color={theme.error} />
                                    <Text style={[styles.reportMenuText, { color: theme.error }]}>
                                      Signaler
                                    </Text>
                                  </Pressable>
                                )}
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Bouton voir les réponses */}
                        {comment.replies.length > 0 && !expandedReplies.includes(comment.id) && (
                          <Pressable 
                            style={styles.viewRepliesButton}
                            onPress={() => toggleReplies(comment.id)}
                          >
                            <View style={styles.viewRepliesLine} />
                            <Text style={styles.viewRepliesText}>
                              Voir les {comment.replies.length} réponse{comment.replies.length > 1 ? "s" : ""}
                            </Text>
                          </Pressable>
                        )}

                        {/* Liste des réponses (si déplié) */}
                        {expandedReplies.includes(comment.id) && comment.replies.length > 0 && (
                          <View style={styles.repliesContainer}>
                            {comment.replies.map((reply) => (
                              <ReplyItem
                                key={reply.id}
                                reply={reply}
                                onLike={() => {}}
                                onReply={() => handleReplyToReply(comment.id, reply.user.name)}
                                onDelete={() => handleDeleteReply(comment.id, reply.id)}
                                onReport={() => handleReportComment(reply.id)}
                                showMenu={showReportMenu === reply.id}
                                onToggleMenu={() => setShowReportMenu(
                                  showReportMenu === reply.id ? null : reply.id
                                )}
                              />
                            ))}
                            
                            {/* Bouton masquer les réponses */}
                            <Pressable 
                              style={styles.hideRepliesButton}
                              onPress={() => toggleReplies(comment.id)}
                            >
                              <Text style={styles.hideRepliesText}>Masquer les réponses</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* MODAL CALENDRIER */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.calendarModalOverlay}>
          <Pressable 
            style={styles.calendarBackdrop} 
            onPress={() => setShowCalendar(false)} 
          />
          <View style={styles.calendarModal}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Choisir une date</Text>
              <Pressable onPress={() => setShowCalendar(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {/* Month Navigation */}
            <View style={styles.calendarMonthNav}>
              <Pressable onPress={goToPreviousMonth} style={styles.calendarNavButton}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <Text style={styles.calendarMonthText}>
                {formatMonthYear(calendarMonth)}
              </Text>
              <Pressable onPress={goToNextMonth} style={styles.calendarNavButton}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Days Header */}
            <View style={styles.calendarDaysHeader}>
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calendarGrid}>
              {getDaysInMonth(calendarMonth).map((day, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.calendarDay,
                    day && isDateSelected(day) && styles.calendarDaySelected,
                    day && !isDateAvailable(day) && styles.calendarDayDisabled,
                  ]}
                  onPress={() => day && handleCalendarDateSelect(day)}
                  disabled={!day || !isDateAvailable(day)}
                >
                  {day && (
                    <Text style={[
                      styles.calendarDayText,
                      isDateSelected(day) && styles.calendarDayTextSelected,
                      !isDateAvailable(day) && styles.calendarDayTextDisabled,
                    ]}>
                      {day}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.calendarLegend}>
              <View style={styles.calendarLegendItem}>
                <View style={[styles.calendarLegendDot, { backgroundColor: theme.text }]} />
                <Text style={styles.calendarLegendText}>Disponible</Text>
              </View>
              <View style={styles.calendarLegendItem}>
                <View style={[styles.calendarLegendDot, { backgroundColor: theme.border }]} />
                <Text style={styles.calendarLegendText}>Indisponible</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.92,
    minHeight: height * 0.7,
    overflow: "hidden",
  },
  
  // Image
  imageContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  handleZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 2,
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 20,
  },
  closeButton: {
    position: "absolute",
    top: 36,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  statSubtext: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  actionsOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Title Section
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 6,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  duration: {
    fontSize: 14,
    color: theme.textMuted,
  },
  priceContainer: {
    backgroundColor: theme.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
  },
  
  // Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: theme.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.card,
    paddingVertical: 12,
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: theme.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.textMuted,
  },
  tabTextActive: {
    color: "#FFF",
  },
  
  // Content
  content: {
    paddingHorizontal: 16,
  },
  
  // Coiffeur Card
  coiffeurCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  coiffeurImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  coiffeurInfo: {
    flex: 1,
  },
  coiffeurNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  coiffeurName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
  },
  availableText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.success,
  },
  coiffeurSalon: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  coiffeurMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
  },
  reviewsText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },
  
  // Dates
  datesContainer: {
    gap: 10,
    paddingRight: 16,
  },
  dateCard: {
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    minWidth: 85,
  },
  dateCardSelected: {
    backgroundColor: theme.text,
  },
  dateDay: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: "rgba(255,255,255,0.7)",
  },
  dateNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 4,
  },
  dateNumberSelected: {
    color: "#FFF",
  },
  dateSlots: {
    fontSize: 11,
    color: theme.success,
    fontWeight: "500",
  },
  dateSlotsSelected: {
    color: "rgba(255,255,255,0.8)",
  },
  
  // Times
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlot: {
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  timeSlotSelected: {
    backgroundColor: theme.text,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  timeTextSelected: {
    color: "#FFF",
  },
  
  // Summary
  summaryCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryRowTotal: {
    marginBottom: 0,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
  },
  
  // CTA
  ctaButton: {
    backgroundColor: theme.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 12,
  },
  ctaButtonDisabled: {
    backgroundColor: "#CCC",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  ctaPrice: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ctaPriceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
  },
  
  // Rating Overview (Commentaires tab)
  ratingOverview: {
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  ratingBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  ratingBigText: {
    fontSize: 36,
    fontWeight: "bold",
    color: theme.text,
  },
  ratingSubtext: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  
  // New Comment
  newCommentContainer: {
    marginBottom: 24,
  },
  replyingToContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  replyingToText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  replyingToName: {
    color: theme.text,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  newCommentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  newCommentInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.text,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Comments List
  commentsList: {
    gap: 20,
  },
  commentCard: {
    flexDirection: "row",
    gap: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  commentDate: {
    fontSize: 12,
    color: theme.textMuted,
  },
  commentText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  commentActionText: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: "500",
  },
  
  // View Replies Button (style Instagram)
  viewRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 52,
    marginTop: 12,
    gap: 12,
  },
  viewRepliesLine: {
    width: 24,
    height: 1,
    backgroundColor: theme.textMuted,
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textMuted,
  },
  
  // Replies Container
  repliesContainer: {
    marginLeft: 52,
    marginTop: 12,
    gap: 12,
  },
  
  // Reply Card (plus petit que commentaire)
  replyCard: {
    flexDirection: "row",
    gap: 10,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  replyContent: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 12,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
  },
  replyText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  replyActionText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: "500",
  },
  mentionText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  
  // Hide Replies Button
  hideRepliesButton: {
    paddingVertical: 8,
  },
  hideRepliesText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textMuted,
  },
  
  // Report Menu
  reportMenu: {
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  reportMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  reportMenuText: {
    fontSize: 14,
    fontWeight: "500",
  },
  
  // Payment Section Styles
  paymentSection: {
    marginTop: 16,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentOptionSelected: {
    borderColor: theme.text,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: theme.text,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.text,
  },
  
  // Location Badges (sur la card coiffeur)
  locationBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationBadgeText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  
  // Location Options (sélection du lieu) - Style chips compact
  locationOptions: {
    flexDirection: "row",
    gap: 10,
  },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  locationOptionSelected: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  locationOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
  },
  locationOptionTextSelected: {
    color: "#FFF",
  },
  locationOptionFee: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.textMuted,
  },
  locationOptionFeeSelected: {
    color: "rgba(255,255,255,0.7)",
  },
  
  // Location Only Info (quand une seule option) - Style compact
  locationOnlyInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
  },
  locationOnlyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  locationOnlyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.text,
  },
  locationOnlySubtitle: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 1,
  },
  locationOnlyFee: {
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationOnlyFeeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.text,
  },
  
  // Price Breakdown
  priceBreakdown: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  
  // Summary value row (pour le lieu)
  summaryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  
  paymentFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
  },
  payButton: {
    backgroundColor: theme.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#999",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  secureText: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
  selectTimeHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
    backgroundColor: theme.card,
    borderRadius: 14,
    marginTop: 8,
  },
  selectTimeHintText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  ctaLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  
  // Bouton "Voir plus" dates
  seeMoreDateButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
    minWidth: 70,
  },
  seeMoreDateText: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.textMuted,
  },
  
  // Badge date calendrier sélectionnée
  selectedCalendarDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.successLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  selectedCalendarDateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
    textTransform: "capitalize",
  },
  
  // Modal Calendrier
  calendarModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  calendarModal: {
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 360,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },
  calendarMonthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    textTransform: "capitalize",
  },
  calendarDaysHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: theme.textMuted,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDaySelected: {
    backgroundColor: theme.text,
    borderRadius: 20,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.text,
  },
  calendarDayTextSelected: {
    color: "#FFF",
  },
  calendarDayTextDisabled: {
    color: theme.textMuted,
  },
  calendarLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  calendarLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calendarLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendarLegendText: {
    fontSize: 12,
    color: theme.textMuted,
  },
});