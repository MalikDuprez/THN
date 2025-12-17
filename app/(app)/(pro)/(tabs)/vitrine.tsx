// app/(app)/(pro)/(tabs)/vitrine.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";

const { height, width } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_PADDING = 12; // Padding des bords
const GRID_SPACING = 2; // Espacement entre images
const AVAILABLE_WIDTH = width - (GRID_PADDING * 2);
const IMAGE_SIZE = Math.floor((AVAILABLE_WIDTH - (GRID_SPACING * (NUM_COLUMNS - 1))) / NUM_COLUMNS);

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
  error: "#EF4444",
  errorLight: "#FEF2F2",
  border: "#E2E8F0",
};

// ============================================
// DONNÉES MOCK
// ============================================
const MOCK_PUBLICATIONS = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400",
    likes: 124,
    comments: 8,
    description: "Dégradé américain avec ligne 🔥",
    service: "Dégradé",
    date: "Il y a 2h",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400",
    likes: 89,
    comments: 5,
    description: "Coloration blonde cendrée ✨",
    service: "Coloration",
    date: "Hier",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1620122830785-a06b8383e6c9?w=400",
    likes: 156,
    comments: 12,
    description: "Coupe courte texturée",
    service: "Coupe femme",
    date: "Il y a 2 jours",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400",
    likes: 203,
    comments: 15,
    description: "Barbe taillée avec dégradé",
    service: "Barbe",
    date: "Il y a 3 jours",
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400",
    likes: 78,
    comments: 4,
    description: "Coupe classique homme",
    service: "Coupe homme",
    date: "Il y a 4 jours",
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1560869713-da86a9ec0744?w=400",
    likes: 145,
    comments: 9,
    description: "Brushing wavy 🌊",
    service: "Brushing",
    date: "Il y a 5 jours",
  },
  {
    id: "7",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400",
    likes: 92,
    comments: 6,
    description: "Tresse africaine",
    service: "Tresses",
    date: "Il y a 1 semaine",
  },
  {
    id: "8",
    image: "https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=400",
    likes: 167,
    comments: 11,
    description: "Balayage caramel 🍯",
    service: "Coloration",
    date: "Il y a 1 semaine",
  },
  {
    id: "9",
    image: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=400",
    likes: 134,
    comments: 7,
    description: "Fondu bas avec design",
    service: "Dégradé",
    date: "Il y a 2 semaines",
  },
];

const SERVICES_TAGS = [
  "Coupe homme",
  "Coupe femme",
  "Dégradé",
  "Coloration",
  "Barbe",
  "Brushing",
  "Tresses",
  "Lissage",
];

const MOCK_PRODUCTS = [
  {
    id: "p1",
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400",
    name: "Shampoing Hydratant",
    price: 24.90,
    description: "Shampoing professionnel pour cheveux secs et abîmés. Formule enrichie en kératine.",
    stock: 12,
  },
  {
    id: "p2",
    image: "https://images.unsplash.com/photo-1597854710119-ebeee43f7d42?w=400",
    name: "Huile de Barbe",
    price: 18.50,
    description: "Huile nourrissante pour barbe. Parfum boisé subtil.",
    stock: 8,
  },
  {
    id: "p3",
    image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400",
    name: "Cire Coiffante Mat",
    price: 16.00,
    description: "Cire à tenue forte, finition mate naturelle.",
    stock: 15,
  },
  {
    id: "p4",
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400",
    name: "Spray Texturisant",
    price: 22.00,
    description: "Spray sel de mer pour un effet beach waves naturel.",
    stock: 6,
  },
  {
    id: "p5",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400",
    name: "Masque Réparateur",
    price: 32.00,
    description: "Masque intensif pour cheveux très abîmés. À utiliser 1x/semaine.",
    stock: 4,
  },
];

// ============================================
// COMPOSANTS
// ============================================
const PublicationThumbnail = ({ publication, onPress }: {
  publication: typeof MOCK_PUBLICATIONS[0];
  onPress: () => void;
}) => (
  <Pressable style={styles.thumbnail} onPress={onPress}>
    <Image source={{ uri: publication.image }} style={styles.thumbnailImage} />
    <View style={styles.thumbnailOverlay}>
      <View style={styles.thumbnailStats}>
        <Ionicons name="heart" size={14} color={theme.white} />
        <Text style={styles.thumbnailStatText}>{publication.likes}</Text>
      </View>
    </View>
  </Pressable>
);

const ProductThumbnail = ({ product, onPress }: {
  product: typeof MOCK_PRODUCTS[0];
  onPress: () => void;
}) => (
  <Pressable style={styles.thumbnail} onPress={onPress}>
    <Image source={{ uri: product.image }} style={styles.thumbnailImage} />
    <View style={styles.productOverlay}>
      <Text style={styles.productPrice}>{product.price.toFixed(2)}€</Text>
    </View>
  </Pressable>
);

// ============================================
// MODALE AJOUTER (Publication ou Produit)
// ============================================
const AddModal = ({ visible, onClose, type }: {
  visible: boolean;
  onClose: () => void;
  type: "realisations" | "produits";
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [description, setDescription] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");

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
          Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setDescription("");
      setSelectedService(null);
      setProductName("");
      setProductPrice("");
      setProductStock("");
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handlePublish = () => {
    if (type === "realisations") {
      console.log("Publish:", { description, selectedService });
    } else {
      console.log("Add product:", { productName, productPrice, productStock, description });
    }
    handleClose();
  };

  const isPublication = type === "realisations";

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.addModal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isPublication ? "Nouvelle réalisation" : "Nouveau produit"}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.addModalScroll} showsVerticalScrollIndicator={false}>
            {/* Image Picker */}
            <Pressable style={styles.imagePicker}>
              <Ionicons name="camera-outline" size={40} color={theme.textMuted} />
              <Text style={styles.imagePickerText}>Ajouter une photo</Text>
              <Text style={styles.imagePickerSubtext}>
                {isPublication ? "Montrez votre réalisation" : "Photo du produit"}
              </Text>
            </Pressable>

            {/* Champs spécifiques aux produits */}
            {!isPublication && (
              <>
                <Text style={styles.inputLabel}>Nom du produit</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Shampoing hydratant"
                  placeholderTextColor={theme.textMuted}
                  value={productName}
                  onChangeText={setProductName}
                />

                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Prix (€)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="24.90"
                      placeholderTextColor={theme.textMuted}
                      value={productPrice}
                      onChangeText={setProductPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Stock</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="10"
                      placeholderTextColor={theme.textMuted}
                      value={productStock}
                      onChangeText={setProductStock}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Description */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder={isPublication ? "Décrivez votre réalisation..." : "Décrivez le produit..."}
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />

            {/* Service Tag (uniquement pour les réalisations) */}
            {isPublication && (
              <>
                <Text style={styles.inputLabel}>Service associé</Text>
                <View style={styles.tagsContainer}>
                  {SERVICES_TAGS.map((service) => (
                    <Pressable
                      key={service}
                      style={[styles.tagChip, selectedService === service && styles.tagChipActive]}
                      onPress={() => setSelectedService(selectedService === service ? null : service)}
                    >
                      <Text style={[styles.tagChipText, selectedService === service && styles.tagChipTextActive]}>
                        {service}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Publish Button */}
            <Pressable style={styles.publishButton} onPress={handlePublish}>
              <Text style={styles.publishButtonText}>
                {isPublication ? "Publier" : "Ajouter le produit"}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// MODALE DÉTAIL PUBLICATION
// ============================================
const PublicationDetailModal = ({ visible, onClose, publication }: {
  visible: boolean;
  onClose: () => void;
  publication: typeof MOCK_PUBLICATIONS[0] | null;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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
          Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!publication) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.detailModal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image */}
            <Image source={{ uri: publication.image }} style={styles.detailImage} />

            {/* Stats */}
            <View style={styles.detailStats}>
              <View style={styles.detailStatItem}>
                <Ionicons name="heart" size={22} color={theme.error} />
                <Text style={styles.detailStatValue}>{publication.likes}</Text>
              </View>
              <View style={styles.detailStatItem}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} />
                <Text style={styles.detailStatValue}>{publication.comments}</Text>
              </View>
              <Text style={styles.detailDate}>{publication.date}</Text>
            </View>

            {/* Description */}
            <View style={styles.detailContent}>
              <Text style={styles.detailDescription}>{publication.description}</Text>
              <View style={styles.detailServiceTag}>
                <Ionicons name="pricetag-outline" size={14} color={theme.accent} />
                <Text style={styles.detailServiceText}>{publication.service}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.detailActions}>
              <Pressable style={styles.detailActionButton}>
                <Ionicons name="create-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionText}>Modifier</Text>
              </Pressable>
              <Pressable style={[styles.detailActionButton, styles.detailActionDelete]}>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
                <Text style={[styles.detailActionText, { color: theme.error }]}>Supprimer</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// MODALE DÉTAIL PRODUIT
// ============================================
const ProductDetailModal = ({ visible, onClose, product }: {
  visible: boolean;
  onClose: () => void;
  product: typeof MOCK_PRODUCTS[0] | null;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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
          Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.detailModal, { transform: [{ translateY }], paddingBottom: insets.bottom + 20 }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image */}
            <Image source={{ uri: product.image }} style={styles.detailImage} />

            {/* Info produit */}
            <View style={styles.productDetailHeader}>
              <Text style={styles.productDetailName}>{product.name}</Text>
              <Text style={styles.productDetailPrice}>{product.price.toFixed(2)}€</Text>
            </View>

            {/* Stock */}
            <View style={styles.productStockBadge}>
              <Ionicons name="cube-outline" size={16} color={theme.success} />
              <Text style={styles.productStockText}>{product.stock} en stock</Text>
            </View>

            {/* Description */}
            <View style={styles.detailContent}>
              <Text style={styles.detailDescription}>{product.description}</Text>
            </View>

            {/* Actions */}
            <View style={styles.detailActions}>
              <Pressable style={styles.detailActionButton}>
                <Ionicons name="create-outline" size={20} color={theme.text} />
                <Text style={styles.detailActionText}>Modifier</Text>
              </Pressable>
              <Pressable style={[styles.detailActionButton, styles.detailActionDelete]}>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
                <Text style={[styles.detailActionText, { color: theme.error }]}>Supprimer</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function VitrineScreen() {
  const insets = useSafeAreaInsets();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<typeof MOCK_PUBLICATIONS[0] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<typeof MOCK_PRODUCTS[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"realisations" | "produits">("realisations");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Ma vitrine</Text>
          <Pressable style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Ionicons name="add" size={24} color={theme.white} />
          </Pressable>
        </View>

        {/* Onglets dans le header */}
        <View style={styles.headerTabs}>
          <Pressable 
            style={[styles.headerTab, activeTab === "realisations" && styles.headerTabActive]} 
            onPress={() => setActiveTab("realisations")}
          >
            <Ionicons 
              name="images-outline" 
              size={18} 
              color={activeTab === "realisations" ? theme.white : "rgba(255,255,255,0.5)"} 
            />
            <Text style={[styles.headerTabText, activeTab === "realisations" && styles.headerTabTextActive]}>
              Réalisations
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.headerTab, activeTab === "produits" && styles.headerTabActive]} 
            onPress={() => setActiveTab("produits")}
          >
            <Ionicons 
              name="bag-outline" 
              size={18} 
              color={activeTab === "produits" ? theme.white : "rgba(255,255,255,0.5)"} 
            />
            <Text style={[styles.headerTabText, activeTab === "produits" && styles.headerTabTextActive]}>
              Produits
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {activeTab === "realisations" ? (
          <FlatList
            data={MOCK_PUBLICATIONS}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PublicationThumbnail
                publication={item}
                onPress={() => setSelectedPublication(item)}
              />
            )}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={MOCK_PRODUCTS}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductThumbnail
                product={item}
                onPress={() => setSelectedProduct(item)}
              />
            )}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="bag-outline" size={64} color={theme.textMuted} />
                <Text style={styles.emptyTitle}>Aucun produit</Text>
                <Text style={styles.emptySubtitle}>
                  Ajoutez vos produits à vendre pour les proposer à vos clients
                </Text>
                <Pressable style={styles.emptyButton} onPress={() => setAddModalVisible(true)}>
                  <Ionicons name="add" size={20} color={theme.white} />
                  <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>

      {/* Modales */}
      <AddModal visible={addModalVisible} onClose={() => setAddModalVisible(false)} type={activeTab} />
      <PublicationDetailModal visible={!!selectedPublication} onClose={() => setSelectedPublication(null)} publication={selectedPublication} />
      <ProductDetailModal visible={!!selectedProduct} onClose={() => setSelectedProduct(null)} product={selectedProduct} />
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.black },

  // Header
  header: { backgroundColor: theme.black, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: theme.white },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },

  // Header Tabs
  headerTabs: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 4 },
  headerTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10 },
  headerTabActive: { backgroundColor: "rgba(255,255,255,0.15)" },
  headerTabText: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.5)" },
  headerTabTextActive: { color: theme.white },

  // Content
  content: { flex: 1, backgroundColor: theme.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  scrollView: { flex: 1 },
  gridContainer: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 120 },
  gridRow: { justifyContent: "space-between", marginBottom: 2 },

  // Thumbnail
  thumbnail: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 6, overflow: "hidden" },
  thumbnailImage: { width: "100%", height: "100%" },
  thumbnailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.15)", justifyContent: "flex-end", padding: 8 },
  thumbnailStats: { flexDirection: "row", alignItems: "center", gap: 4 },
  thumbnailStatText: { fontSize: 12, fontWeight: "600", color: theme.white },

  // Empty State
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: theme.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: theme.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  emptyButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.black, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
  emptyButtonText: { fontSize: 15, fontWeight: "600", color: theme.white },

  // Modal
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  dragIndicatorContainer: { alignItems: "center", paddingVertical: 12 },
  dragIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 },
  modalHeader: { paddingHorizontal: 20, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: theme.text },

  // Add Modal
  addModal: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.9 },
  addModalScroll: { paddingHorizontal: 20 },
  imagePicker: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 2, borderColor: theme.border, borderStyle: "dashed", paddingVertical: 40, alignItems: "center", marginBottom: 24 },
  imagePickerText: { fontSize: 16, fontWeight: "600", color: theme.text, marginTop: 12 },
  imagePickerSubtext: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: { backgroundColor: theme.card, borderRadius: 14, padding: 16, fontSize: 15, color: theme.text, marginBottom: 20 },
  textArea: { backgroundColor: theme.card, borderRadius: 14, padding: 16, fontSize: 15, color: theme.text, minHeight: 100, marginBottom: 24 },
  rowInputs: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tagChip: { backgroundColor: theme.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagChipActive: { backgroundColor: theme.accent },
  tagChipText: { fontSize: 14, fontWeight: "500", color: theme.textSecondary },
  tagChipTextActive: { color: theme.white },
  publishButton: { backgroundColor: theme.black, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 20 },
  publishButtonText: { fontSize: 16, fontWeight: "600", color: theme.white },

  // Detail Modal
  detailModal: { backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.9 },
  detailImage: { width: "100%", height: width, resizeMode: "cover" },
  detailStats: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  detailStatItem: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 20 },
  detailStatValue: { fontSize: 15, fontWeight: "600", color: theme.text },
  detailDate: { marginLeft: "auto", fontSize: 13, color: theme.textMuted },
  detailContent: { padding: 20 },
  detailDescription: { fontSize: 16, color: theme.text, lineHeight: 24, marginBottom: 14 },
  detailServiceTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.accentLight, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  detailServiceText: { fontSize: 13, fontWeight: "500", color: theme.accent },
  detailActions: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 20 },
  detailActionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.card, paddingVertical: 14, borderRadius: 14 },
  detailActionDelete: { backgroundColor: theme.errorLight },
  detailActionText: { fontSize: 15, fontWeight: "600", color: theme.text },

  // Product Thumbnail
  productOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end", padding: 8 },
  productPrice: { fontSize: 13, fontWeight: "bold", color: theme.white },

  // Product Detail
  productDetailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  productDetailName: { fontSize: 20, fontWeight: "bold", color: theme.text, flex: 1 },
  productDetailPrice: { fontSize: 22, fontWeight: "bold", color: theme.accent },
  productStockBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.successLight, alignSelf: "flex-start", marginLeft: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  productStockText: { fontSize: 13, fontWeight: "500", color: theme.success },
});