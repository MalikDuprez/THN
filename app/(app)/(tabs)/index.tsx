// app/(app)/(tabs)/index.tsx
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InspirationCard, InspirationModal, CoiffeurCard } from "@shared";
import SuccessModal from "@components/shared/SuccessModal";
import { useScrollContext } from "./_layout";
import { COIFFEURS, FILTERS, SEARCH_FILTERS, INSPIRATIONS } from "@constants/mockData";
import { ROUTES } from "@/constants/routes";
import { getInspirations, Inspiration } from "@api/inspirations";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ✅ FIX MASONRY (béton)
const FEED_PADDING = 16;
const COLUMN_GAP = 8;
const COLUMN_WIDTH = (SCREEN_WIDTH - FEED_PADDING * 2 - COLUMN_GAP) / 2;

const { height } = Dimensions.get("window");

// ============================================
// THEME - Style Premium (Header noir)
// ============================================
const theme = {
  black: "#000000",
  white: "#FFFFFF",
  card: "#F8FAFC",
  text: "#000000",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
};

// Adapter les données Supabase au format des composants
const adaptInspiration = (item: Inspiration, index: number) => {
  const heights = [200, 240, 280, 220, 260];
  return {
    id: item.id,
    title: item.title,
    image: item.image_url,
    category: item.category || "Autre",
    duration: item.duration_estimate || "N/A",
    price: item.price_estimate || 0,
    height: heights[index % heights.length],
  };
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setIsScrolling } = useScrollContext();

  const [activeTab, setActiveTab] = useState<string>("inspiration");

  const [inspirationsDB, setInspirationsDB] = useState<Inspiration[]>([]);
  const [loadingDB, setLoadingDB] = useState(true);

  // Charger les inspirations depuis Supabase
  useEffect(() => {
    async function loadInspirations() {
      setLoadingDB(true);
      const data = await getInspirations();
      console.log("📊 Inspirations from DB:", data.length);
      setInspirationsDB(data);
      setLoadingDB(false);
    }
    loadInspirations();
  }, []);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSearchFilters, setActiveSearchFilters] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");

  const [selectedInspiration, setSelectedInspiration] = useState<typeof INSPIRATIONS[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successData, setSuccessData] = useState<{
    title: string;
    subtitle: string;
    recapImage?: string;
    recapTitle?: string;
    recapSubtitle?: string;
    recapItems?: { icon: string; text: string }[];
    priceLabel?: string;
    priceValue?: string;
    buttonText?: string;
  }>({ title: "", subtitle: "" });

  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const isGoingDown = currentY > lastScrollY.current;
    const isGoingUp = currentY < lastScrollY.current;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    if (isGoingDown && currentY > 30) {
      setIsScrolling(true);
    } else if (isGoingUp) {
      setIsScrolling(false);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);

    lastScrollY.current = currentY;
  };

  const handleInspirationPress = (item: any) => {
    setSelectedInspiration(item);
    setModalVisible(true);
  };

  const handleBook = () => {
    setModalVisible(false);
    if (selectedInspiration) {
      router.push(ROUTES.SHARED.INSPIRATION(selectedInspiration.id));
    }
  };

  const toggleFilter = (filter: string) => {
    if (activeTab === "inspiration") {
      if (filter === "Tout") {
        setActiveFilters([]);
      } else {
        setActiveFilters((prev) =>
          prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
        );
      }
    } else {
      if (filter === "À proximité") {
        setActiveSearchFilters([]);
      } else {
        setActiveSearchFilters((prev) =>
          prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
        );
      }
    }
  };

  const filteredInspirations = useMemo(() => {
    let data = inspirationsDB;

    if (activeFilters.length > 0) {
      data = inspirationsDB.filter((item) =>
        activeFilters.some(
          (filter) => (item.category ?? "").toLowerCase() === filter.toLowerCase()
        )
      );
    }

    // Adapter au format attendu par les composants (avec index pour la hauteur)
    return data.map((item, index) => adaptInspiration(item, index));
  }, [activeFilters, inspirationsDB]);

  const leftColumn = filteredInspirations.filter((_, index) => index % 2 === 0);
  const rightColumn = filteredInspirations.filter((_, index) => index % 2 === 1);

  const filteredCoiffeurs = useMemo(() => {
    let results = COIFFEURS;
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.salon.toLowerCase().includes(searchLower) ||
          c.specialty.toLowerCase().includes(searchLower)
      );
    }
    return results;
  }, [search]);

  const currentFilters = activeTab === "inspiration" ? FILTERS : SEARCH_FILTERS;

  const filteredFiltersInModal = currentFilters.filter((filter) =>
    filter.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const hasActiveFilters =
    activeTab === "inspiration" ? activeFilters.length > 0 : activeSearchFilters.length > 0;

  return (
    <View style={styles.container}>
      {/* HEADER NOIR */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {/* Titre */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Découvrir</Text>
          <Pressable
            style={styles.notificationButton}
            onPress={() => router.push(ROUTES.SHARED.NOTIFICATIONS)}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.white} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.headerTabs}>
          <Pressable
            onPress={() => setActiveTab("inspiration")}
            style={[styles.headerTab, activeTab === "inspiration" && styles.headerTabActive]}
          >
            <Ionicons
              name={activeTab === "inspiration" ? "sparkles" : "sparkles-outline"}
              size={18}
              color={activeTab === "inspiration" ? theme.white : "rgba(255,255,255,0.5)"}
            />
            <Text
              style={[styles.headerTabText, activeTab === "inspiration" && styles.headerTabTextActive]}
            >
              Inspiration
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("recherche")}
            style={[
              styles.headerTab,
              styles.headerTabLarge,
              activeTab === "recherche" && styles.headerTabActive,
            ]}
          >
            <Ionicons
              name={activeTab === "recherche" ? "location" : "location-outline"}
              size={18}
              color={activeTab === "recherche" ? theme.white : "rgba(255,255,255,0.5)"}
            />
            <Text
              style={[styles.headerTabText, activeTab === "recherche" && styles.headerTabTextActive]}
              numberOfLines={1}
            >
              Coiffeurs à proximité
            </Text>
          </Pressable>

          {/* Bouton Filtre */}
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          >
            <Ionicons name="options-outline" size={20} color={theme.white} />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {activeTab === "inspiration" ? activeFilters.length : activeSearchFilters.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* CONTENU BLANC ARRONDI */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* TAB INSPIRATION */}
          {activeTab === "inspiration" && (
            <>
              {activeFilters.length > 0 && (
                <View style={styles.filtersActive}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filtersRow}>
                      {activeFilters.map((filter) => (
                        <View key={filter} style={styles.filterChip}>
                          <Text style={styles.filterChipText}>{filter}</Text>
                          <Pressable onPress={() => toggleFilter(filter)}>
                            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                          </Pressable>
                        </View>
                      ))}
                      <Pressable onPress={() => setActiveFilters([])}>
                        <Text style={styles.clearFilters}>Tout effacer</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                  <Text style={styles.resultsCount}>
                    {filteredInspirations.length} résultat{filteredInspirations.length > 1 ? "s" : ""}
                  </Text>
                </View>
              )}

              <View style={styles.feed}>
                {filteredInspirations.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="images-outline" size={48} color={theme.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>Aucune inspiration</Text>
                    <Text style={styles.emptySubtitle}>Essayez de modifier vos filtres</Text>
                  </View>
                ) : (
                  // ✅ MASONRY FIX (50/50 béton)
                  <View style={{ flexDirection: "row", paddingHorizontal: FEED_PADDING }}>
                    <View style={{ width: COLUMN_WIDTH, marginRight: COLUMN_GAP / 2 }}>
                      {leftColumn.map((item) => (
                        <InspirationCard
                          key={item.id}
                          item={item}
                          onPress={() => handleInspirationPress(item)}
                        />
                      ))}
                    </View>

                    <View style={{ width: COLUMN_WIDTH, marginLeft: COLUMN_GAP / 2, marginTop: 24 }}>
                      {rightColumn.map((item) => (
                        <InspirationCard
                          key={item.id}
                          item={item}
                          onPress={() => handleInspirationPress(item)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* TAB COIFFEURS */}
          {activeTab === "recherche" && (
            <>
              <View style={styles.searchContainer}>
                <View style={styles.searchInput}>
                  <Ionicons name="search" size={18} color={theme.textMuted} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Rechercher salon, coiffeur, ville..."
                    placeholderTextColor={theme.textMuted}
                    style={styles.searchTextInput}
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch("")}>
                      <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>

              {activeSearchFilters.length > 0 && (
                <View style={styles.filtersActive}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filtersRow}>
                      {activeSearchFilters.map((filter) => (
                        <View key={filter} style={styles.filterChip}>
                          <Text style={styles.filterChipText}>{filter}</Text>
                          <Pressable onPress={() => toggleFilter(filter)}>
                            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                          </Pressable>
                        </View>
                      ))}
                      <Pressable onPress={() => setActiveSearchFilters([])}>
                        <Text style={styles.clearFilters}>Tout effacer</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={styles.coiffeursList}>
                {filteredCoiffeurs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="search-outline" size={48} color={theme.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>Aucun coiffeur trouvé</Text>
                    <Text style={styles.emptySubtitle}>Essayez une autre recherche</Text>
                  </View>
                ) : (
                  <>
                    {filteredCoiffeurs.map((item) => (
                      <CoiffeurCard
                        key={item.id}
                        item={item}
                        onPress={() => router.push(ROUTES.SHARED.COIFFEUR(item.id))}
                      />
                    ))}
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* MODAL FILTRES */}
      <Modal visible={filterModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setFilterModalVisible(false);
              setFilterSearch("");
            }}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filtrer par catégorie</Text>
                  {hasActiveFilters && (
                    <Text style={styles.modalSubtitle}>
                      {activeTab === "inspiration" ? activeFilters.length : activeSearchFilters.length}{" "}
                      sélectionné(s)
                    </Text>
                  )}
                </View>

                <View style={styles.modalSearchInput}>
                  <Ionicons name="search" size={18} color={theme.textMuted} />
                  <TextInput
                    value={filterSearch}
                    onChangeText={setFilterSearch}
                    placeholder="Rechercher un filtre..."
                    placeholderTextColor={theme.textMuted}
                    style={styles.modalSearchTextInput}
                  />
                  {filterSearch.length > 0 && (
                    <Pressable onPress={() => setFilterSearch("")}>
                      <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                    </Pressable>
                  )}
                </View>

                <ScrollView style={styles.modalFiltersScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalFiltersGrid}>
                    {filteredFiltersInModal.map((filter) => {
                      const isSelected =
                        activeTab === "inspiration"
                          ? activeFilters.includes(filter)
                          : activeSearchFilters.includes(filter);
                      const isDefault = filter === "Tout" || filter === "À proximité";

                      return (
                        <Pressable
                          key={filter}
                          onPress={() => toggleFilter(filter)}
                          style={[styles.modalFilterItem, isSelected && styles.modalFilterItemSelected]}
                        >
                          {!isDefault && (
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                              {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                          )}
                          <Text style={[styles.modalFilterText, isSelected && styles.modalFilterTextSelected]}>
                            {filter}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      if (activeTab === "inspiration") setActiveFilters([]);
                      else setActiveSearchFilters([]);
                    }}
                    style={styles.modalResetButton}
                  >
                    <Text style={styles.modalResetText}>Réinitialiser</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setFilterModalVisible(false);
                      setFilterSearch("");
                    }}
                    style={styles.modalApplyButton}
                  >
                    <Text style={styles.modalApplyText}>Appliquer</Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ height: 34 }} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL INSPIRATION */}
      <InspirationModal
        visible={modalVisible}
        item={selectedInspiration}
        onClose={() => setModalVisible(false)}
        onBook={handleBook}
        onSuccess={(data) => {
          setModalVisible(false);
          setSelectedInspiration(null);
          setSuccessData(data);
          setSuccessModalVisible(true);
        }}
      />

      {/* SUCCESS MODAL */}
      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title={successData.title}
        subtitle={successData.subtitle}
        recapImage={successData.recapImage}
        recapTitle={successData.recapTitle}
        recapSubtitle={successData.recapSubtitle}
        recapItems={successData.recapItems}
        priceLabel={successData.priceLabel}
        priceValue={successData.priceValue}
        buttonText={successData.buttonText}
      />
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

  // Header noir
  header: {
    backgroundColor: theme.black,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Header Tabs
  headerTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  headerTabLarge: {
    flex: 1,
  },
  headerTabActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  headerTabTextActive: {
    color: theme.white,
    fontWeight: "600",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.white,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: theme.black,
    fontSize: 9,
    fontWeight: "bold",
  },

  // Content blanc arrondi
  content: {
    flex: 1,
    backgroundColor: theme.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollView: {
    flex: 1,
  },

  // Filtres actifs
  filtersActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 10,
    gap: 6,
  },
  filterChipText: {
    color: theme.text,
    fontSize: 13,
  },
  clearFilters: {
    color: theme.textMuted,
    fontSize: 12,
    paddingHorizontal: 8,
  },
  resultsCount: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 6,
  },

  // Feed Masonry
  feed: {
    // ✅ on enlève le padding ici (car on le met dans la vue masonry)
    // paddingHorizontal: 12,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  searchTextInput: {
    flex: 1,
    color: theme.text,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
  },

  // Coiffeurs list
  coiffeursList: {
    paddingHorizontal: 16,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  modalBody: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "600",
  },
  modalSubtitle: {
    color: theme.textMuted,
    fontSize: 13,
  },
  modalSearchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  modalSearchTextInput: {
    flex: 1,
    color: theme.text,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
  },
  modalFiltersScroll: {
    maxHeight: 280,
  },
  modalFiltersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalFilterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.card,
    gap: 8,
  },
  modalFilterItemSelected: {
    backgroundColor: theme.black,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: theme.black,
    borderColor: theme.black,
  },
  modalFilterText: {
    fontSize: 14,
    color: theme.text,
  },
  modalFilterTextSelected: {
    color: theme.white,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalResetButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 12,
  },
  modalResetText: {
    color: theme.textSecondary,
    fontWeight: "500",
    fontSize: 14,
  },
  modalApplyButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: theme.black,
  },
  modalApplyText: {
    color: theme.white,
    fontWeight: "600",
    fontSize: 14,
  },
});
