import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Linking,
  FlatList,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useRouter } from "expo-router";
import axios from "axios";
import { Ionicons, FontAwesome, FontAwesome5, MaterialIcons } from "@expo/vector-icons";

// ─── ENV ────────────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Activity {
  time: string;
  task: string;
}

interface Itinerary {
  day_no: number;
  title: string;
  activities?: Activity[];
}

interface Destination {
  _id: string;
  name: string;
  image?: string;
  description?: string;
}

interface RoomType {
  finalPrice?: number;
}

interface Hotel {
  _id: string;
  name: string;
  city?: string;
  rating?: number;
  images?: string[];
  roomTypes?: RoomType[];
}

interface Faq {
  question: string;
  answer: string;
}

interface TravellerTip {
  title: string;
  description: string;
}

interface Package {
  _id: string;
  title: string;
  location?: string;
  no_of_days?: number;
  price?: number;
  categories?: string[];
  gallery?: string[];
  itineraries?: Itinerary[];
  destinations?: Destination[];
  included_hotels?: Hotel[];
  transport?: string[];
  faqs?: Faq[];
  traveller_tips?: TravellerTip[];
}

interface UserId {
  firstName?: string;
  lastName?: string;
  image?: string;
}

interface Review {
  rating: number;
  comment: string;
  createdAt?: string;
  userId?: UserId;
}

// ─── NAV TYPES ──────────────────────────────────────────────────────────────
type RootStackParamList = {
  PackageOverview: { id: string };
  Destination: { id: string };
  HotelDetails: { id: string };
  Booking: { packageId: string };
};

type PackageOverviewRouteProp = RouteProp<RootStackParamList, "PackageOverview">;

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const NAV_TABS = [
  "Travel Itinerary",
  "Destinations",
  "Hotels",
  "Transport",
  "Gallery",
  "FAQs & Tips",
  "Reviews",
] as const;

type NavTab = (typeof NAV_TABS)[number];

// ─── COLORS ─────────────────────────────────────────────────────────────────
const C = {
  navy: "#0b223a",
  amber: "#f3c26b",
  amberLight: "#f0dfc0",
  amberBorder: "#e8d5b7",
  amberDark: "#c87941",
  brownDark: "#7a4e1e",
  cream: "#fdf8f2",
  bg: "#f4f7fc",
  white: "#ffffff",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
};

// ─── LOGGING STUB (replace with your actual implementation) ─────────────────
async function logView(id: string, duration: number): Promise<void> {
  // TODO: replace with real call, e.g. await axios.post(`${BACKEND_URL}/interactions/view`, { id, duration });
  console.log("logView", id, duration);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const PackageOverviewPage: React.FC = () => {
  const route = useRoute<PackageOverviewRouteProp>();
  const router = useRouter();
  const { id } = route.params;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NavTab>("Travel Itinerary");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const arrivalTime = useRef<number>(Date.now());
  const scrollRef = useRef<ScrollView>(null);

  // ── Section refs for scroll-to ─────────────────────────────────────────
  const sectionOffsets = useRef<Partial<Record<NavTab, number>>>({});

  // ── View tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const duration = Math.round((Date.now() - arrivalTime.current) / 1000);
      logView(id, duration);
    };
  }, [id]);

  // ── Fetch package ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const cleanId = id.includes(":") ? id.split(":")[1] : id;
        const response = await axios.get(`${BACKEND_URL}/packages/get/${cleanId}`);
        if (response.data?.success) {
          setPkg(response.data.data as Package);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPackage();
  }, [id]);

  // ── Fetch reviews ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const cleanId = id.includes(":") ? id.split(":")[1] : id;
        const response = await axios.get(`${BACKEND_URL}/reviews/package/${cleanId}`);
        if (response.data?.success) {
          setReviews(response.data.data ?? []);
        }
      } catch (error) {
        console.error("Reviews fetch error:", error);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  const scrollToSection = (section: NavTab) => {
    setActiveSection(section);
    const offset = sectionOffsets.current[section];
    if (offset !== undefined) {
      scrollRef.current?.scrollTo({ y: offset, animated: true });
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────
  const galleryImages = pkg?.gallery ?? [];
  const visibleGallery = showAllGallery ? galleryImages : galleryImages.slice(0, 3);

  const avgRating =
    reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  // ── Loading / not found ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.amberDark} />
        <Text style={styles.loadingText}>PREPARING YOUR JOURNEY</Text>
      </View>
    );
  }

  if (!pkg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>Package not found!</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── STICKY NAV TABS ── */}
      <View style={styles.stickyNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navTabsContent}>
          {NAV_TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => scrollToSection(tab)} style={styles.navTabBtn}>
              <Text style={[styles.navTabText, activeSection === tab && styles.navTabTextActive]}>
                {tab}
              </Text>
              {activeSection === tab && <View style={styles.navTabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── 1. HERO ── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: pkg.gallery?.[0] ?? "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={C.navy} />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            {/* Categories */}
            <View style={styles.categoryRow}>
              {pkg.categories?.map((cat, i) => (
                <View key={i} style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{cat.toUpperCase()}</Text>
                </View>
              ))}
            </View>
            {/* Title */}
            <Text style={styles.heroTitle}>{pkg.title}</Text>
            {/* Location */}
            <View style={styles.heroMeta}>
              <FontAwesome name="map-marker" size={14} color={C.amber} />
              <Text style={styles.heroMetaText}>{pkg.location}</Text>
            </View>
            {/* Badges row */}
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <FontAwesome name="calendar" size={14} color={C.amber} />
                <Text style={styles.heroBadgeText}>{pkg.no_of_days} Days</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeCurrency}>LKR</Text>
                <Text style={styles.heroBadgeText}>{pkg.price?.toLocaleString()}</Text>
              </View>
              {avgRating && (
                <View style={styles.heroBadge}>
                  <FontAwesome name="star" size={14} color={C.amber} />
                  <Text style={styles.heroBadgeText}>
                    {avgRating}{" "}
                    <Text style={styles.heroBadgeSub}>({reviews.length})</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── MAIN CONTENT ── */}
        <View style={styles.content}>

          {/* ── CUSTOMIZE BANNER ── */}
          <View style={styles.customizeBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customizeTitle}>Customize your tour package</Text>
              <Text style={styles.customizeSubtitle}>Extend nights, change hotels, add activities</Text>
            </View>
            <TouchableOpacity style={styles.customizeBtn}>
              <Text style={styles.customizeBtnText}>Customize</Text>
            </TouchableOpacity>
          </View>

          {/* ── TRAVEL ITINERARY ── */}
          <View
            onLayout={(e) => { sectionOffsets.current["Travel Itinerary"] = e.nativeEvent.layout.y; }}
            style={styles.section}
          >
            <SectionTitle title="Travel Itinerary" />
            {pkg.itineraries?.map((itin, idx) => (
              <ItineraryCard key={idx} itin={itin} />
            ))}
            {/* Map link */}
            <TouchableOpacity
              style={styles.mapLink}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(pkg.location ?? "Sri Lanka")}`)}
            >
              <FontAwesome name="map-marker" size={16} color={C.amberDark} />
              <Text style={styles.mapLinkText}>View on Google Maps</Text>
              <Ionicons name="open-outline" size={14} color={C.amberDark} />
            </TouchableOpacity>
          </View>

          {/* ── DESTINATIONS ── */}
          {(pkg.destinations?.length ?? 0) > 0 && (
            <View
              onLayout={(e) => { sectionOffsets.current["Destinations"] = e.nativeEvent.layout.y; }}
              style={styles.section}
            >
              <SectionTitle title="Destinations" />
              {pkg.destinations!.map((dest, idx) => (
                <DestinationCard
                  key={idx}
                  dest={dest}
                  onView={() => router.push({ pathname: "/destinationOverview", params: { id: dest._id } })}
                />
              ))}
            </View>
          )}

          {/* ── HOTELS ── */}
          {(pkg.included_hotels?.length ?? 0) > 0 && (
            <View
              onLayout={(e) => { sectionOffsets.current["Hotels"] = e.nativeEvent.layout.y; }}
              style={styles.section}
            >
              <SectionTitle title="Included Hotels" />
              {pkg.included_hotels!.map((hotel, idx) => (
                <HotelCard
                  key={idx}
                  hotel={hotel}
                  onView={() => router.push({ pathname: "/hotelOverview", params: { id: hotel._id } })}
                />
              ))}
            </View>
          )}

          {/* ── TRANSPORT ── */}
          {(pkg.transport?.length ?? 0) > 0 && (
            <View
              onLayout={(e) => { sectionOffsets.current["Transport"] = e.nativeEvent.layout.y; }}
              style={styles.section}
            >
              <SectionTitle title="Transport" />
              <View style={styles.transportGrid}>
                {pkg.transport!.map((t, idx) => (
                  <TransportCard key={idx} label={t} />
                ))}
              </View>
            </View>
          )}

          {/* ── GALLERY ── */}
          {galleryImages.length > 0 && (
            <View
              onLayout={(e) => { sectionOffsets.current["Gallery"] = e.nativeEvent.layout.y; }}
              style={styles.section}
            >
              <SectionTitle title="Gallery" />
              <View style={styles.galleryGrid}>
                {visibleGallery.map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </View>
              {!showAllGallery && galleryImages.length > 3 && (
                <TouchableOpacity onPress={() => setShowAllGallery(true)} style={styles.viewMoreBtn}>
                  <Text style={styles.viewMoreText}>View more →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── FAQs & TIPS ── */}
          <View
            onLayout={(e) => { sectionOffsets.current["FAQs & Tips"] = e.nativeEvent.layout.y; }}
            style={styles.section}
          >
            {(pkg.faqs?.length ?? 0) > 0 && (
              <>
                <SectionTitle title="Frequently Asked Questions" />
                {pkg.faqs!.map((faq, idx) => (
                  <FaqItem
                    key={idx}
                    faq={faq}
                    isOpen={openFaq === idx}
                    onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
                  />
                ))}
              </>
            )}
            {(pkg.traveller_tips?.length ?? 0) > 0 && (
              <View style={{ marginTop: 24 }}>
                <SectionTitle title="Traveller Tips" />
                {pkg.traveller_tips!.map((tip, idx) => (
                  <TipCard key={idx} tip={tip} />
                ))}
              </View>
            )}
          </View>

          {/* ── REVIEWS ── */}
          <View
            onLayout={(e) => { sectionOffsets.current["Reviews"] = e.nativeEvent.layout.y; }}
            style={styles.section}
          >
            <SectionTitle title="Reviews" />
            {reviewsLoading ? (
              <ActivityIndicator color={C.amber} />
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <FontAwesome name="star" size={36} color={C.amberBorder} />
                <Text style={styles.emptyReviewsText}>No reviews yet for this package.</Text>
              </View>
            ) : (
              <>
                {/* Summary */}
                <View style={styles.reviewSummary}>
                  <Text style={styles.avgRating}>{avgRating}</Text>
                  <StarRow rating={parseFloat(avgRating!)} size={22} />
                  <Text style={styles.reviewCount}>
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </Text>
                  {ratingCounts.map(({ star, count }) => (
                    <View key={star} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarStar}>{star}</Text>
                      <FontAwesome name="star" size={10} color={C.amber} />
                      <View style={styles.ratingBarTrack}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            { width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" as any },
                          ]}
                        />
                      </View>
                      <Text style={styles.ratingBarCount}>{count}</Text>
                    </View>
                  ))}
                </View>

                {/* Review cards */}
                {reviews.map((review, idx) => (
                  <ReviewCard key={idx} review={review} />
                ))}
              </>
            )}
          </View>

        </View>

        {/* ── FOOTER / BOOK CTA ── */}
        <View style={styles.footer}>
          <View style={styles.footerMeta}>
            {pkg.location && (
              <View style={styles.footerMetaItem}>
                <FontAwesome name="map-marker" size={14} color={C.amber} />
                <Text style={styles.footerMetaText}>{pkg.location}</Text>
              </View>
            )}
            <View style={styles.footerMetaItem}>
              <FontAwesome name="calendar" size={14} color={C.amber} />
              <Text style={styles.footerMetaText}>{pkg.no_of_days} Days</Text>
            </View>
            <View style={styles.footerMetaItem}>
              <FontAwesome name="hashtag" size={12} color={C.amber} />
              <Text style={styles.footerMetaText}>LuxuryTravelSL</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() =>
              router.push({
                pathname: "/bookingpage",
                params: { packageId: pkg._id },
              })
            }
          >
            <FontAwesome name="calendar-check-o" size={18} color={C.navy} />
            <Text style={styles.bookBtnText}>BOOK NOW</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── SectionTitle ─────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

// ── StarRow ───────────────────────────────────────────────────────────────
const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <FontAwesome
        key={s}
        name="star"
        size={size}
        color={s <= Math.round(rating) ? C.amber : C.slate200}
      />
    ))}
  </View>
);

// ── ReviewCard ────────────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const userName =
    review.userId
      ? `${review.userId.firstName ?? ""} ${review.userId.lastName ?? ""}`.trim() || "Traveller"
      : "Traveller";

  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const imageUri =
    review.userId?.image
      ? review.userId.image.includes("googleusercontent") || review.userId.image.startsWith("http")
        ? review.userId.image
        : `${BACKEND_URL}/${review.userId.image}`
      : null;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          <View style={styles.avatarCircle}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-circle" size={28} color={C.amberDark} />
            )}
          </View>
          <View>
            <Text style={styles.reviewUserName}>{userName}</Text>
            {date ? <Text style={styles.reviewDate}>{date}</Text> : null}
          </View>
        </View>
        <StarRow rating={review.rating} />
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );
};

// ── ItineraryCard ─────────────────────────────────────────────────────────
const ItineraryCard: React.FC<{ itin: Itinerary }> = ({ itin }) => (
  <View style={styles.itineraryCard}>
    <View style={styles.itineraryHeader}>
      <View style={styles.dayBadge}>
        <Text style={styles.dayBadgeText}>Day {String(itin.day_no).padStart(2, "0")}</Text>
      </View>
      <Text style={styles.itineraryTitle}>{itin.title}</Text>
    </View>
    {itin.activities?.map((act, idx) => (
      <View
        key={idx}
        style={[
          styles.activityRow,
          idx < (itin.activities!.length - 1) && styles.activityRowBorder,
        ]}
      >
        <Text style={styles.activityTime}>{act.time}</Text>
        <Text style={styles.activityTask}>{act.task}</Text>
      </View>
    ))}
  </View>
);

// ── DestinationCard ───────────────────────────────────────────────────────
const DestinationCard: React.FC<{ dest: Destination; onView: () => void }> = ({ dest, onView }) => (
  <View style={styles.card}>
    <Image
      source={{ uri: dest.image ?? "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" }}
      style={styles.cardImage}
      resizeMode="cover"
    />
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle}>{dest.name}</Text>
      {dest.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>{dest.description}</Text>
      )}
      <TouchableOpacity style={styles.viewBtn} onPress={onView}>
        <Text style={styles.viewBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── HotelCard ─────────────────────────────────────────────────────────────
const HotelCard: React.FC<{ hotel: Hotel; onView: () => void }> = ({ hotel, onView }) => (
  <View style={styles.card}>
    <View>
      <Image
        source={{ uri: hotel.images?.[0] ?? "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb" }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {hotel.rating && (
        <View style={styles.hotelRatingBadge}>
          <FontAwesome name="star" size={10} color={C.brownDark} />
          <Text style={styles.hotelRatingText}>{hotel.rating}</Text>
        </View>
      )}
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle}>{hotel.name}</Text>
      {hotel.city && (
        <View style={styles.hotelCityBadge}>
          <Ionicons name="location-sharp" size={10} color={C.brownDark} />
          <Text style={styles.hotelCityText}>{hotel.city}</Text>
        </View>
      )}
      <View style={styles.hotelFooter}>
        <Text style={styles.hotelPrice}>
          from LKR {hotel.roomTypes?.[0]?.finalPrice?.toLocaleString() ?? "—"}
        </Text>
        <TouchableOpacity style={styles.viewBtn} onPress={onView}>
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ── TransportCard ─────────────────────────────────────────────────────────
const TRANSPORT_ICON_MAP: Record<string, React.ReactNode> = {
  train: <FontAwesome5 name="train" size={24} color={C.slate700} />,
  bus: <FontAwesome5 name="bus" size={24} color={C.slate700} />,
  car: <FontAwesome5 name="car" size={24} color={C.slate700} />,
  vehicle: <FontAwesome5 name="car" size={24} color={C.slate700} />,
  tuk: <FontAwesome5 name="bus" size={24} color={C.slate700} />,
};

const TransportCard: React.FC<{ label: string }> = ({ label }) => {
  const iconKey = Object.keys(TRANSPORT_ICON_MAP).find((k) => label.toLowerCase().includes(k));
  const icon = iconKey ? TRANSPORT_ICON_MAP[iconKey] : <FontAwesome5 name="bus" size={24} color={C.slate700} />;
  return (
    <View style={styles.transportCard}>
      {icon}
      <Text style={styles.transportLabel}>{label}</Text>
    </View>
  );
};

// ── FaqItem ───────────────────────────────────────────────────────────────
const FaqItem: React.FC<{ faq: Faq; isOpen: boolean; onToggle: () => void }> = ({
  faq,
  isOpen,
  onToggle,
}) => (
  <View style={styles.faqCard}>
    <TouchableOpacity style={styles.faqHeader} onPress={onToggle}>
      <Text style={styles.faqQuestion}>{faq.question}</Text>
      <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={C.slate400} />
    </TouchableOpacity>
    {isOpen && (
      <View style={styles.faqBody}>
        <Text style={styles.faqAnswer}>{faq.answer}</Text>
      </View>
    )}
  </View>
);

// ── TipCard ───────────────────────────────────────────────────────────────
const TipCard: React.FC<{ tip: TravellerTip }> = ({ tip }) => (
  <View style={styles.tipCard}>
    <Text style={styles.tipTitle}>{tip.title}</Text>
    <Text style={styles.tipDescription}>{tip.description}</Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  loadingText: { marginTop: 12, color: C.amberDark, fontWeight: "900", letterSpacing: 3, fontSize: 10, textTransform: "uppercase" },
  notFoundText: { color: C.slate500, fontWeight: "700" },
  scrollView: { flex: 1 },

  // ── Sticky Nav ─────────────────────────────────────────────────────────
  stickyNav: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.slate50,
    zIndex: 20,
  },
  navTabsContent: { paddingHorizontal: 16, paddingVertical: 4 },
  navTabBtn: { paddingHorizontal: 12, paddingVertical: 12, alignItems: "center" },
  navTabText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5, color: C.slate400 },
  navTabTextActive: { color: C.navy },
  navTabUnderline: { position: "absolute", bottom: 0, left: 12, right: 12, height: 2, backgroundColor: C.navy, borderRadius: 1 },

  // ── Hero ───────────────────────────────────────────────────────────────
  hero: { height: 340, width: "100%", justifyContent: "flex-end" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(11,34,58,0.55)" },
  backBtn: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    padding: 10,
  },
  heroContent: { padding: 20, gap: 8 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  categoryBadge: {
    backgroundColor: "rgba(243,194,107,0.2)",
    borderWidth: 1,
    borderColor: "rgba(243,194,107,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  categoryText: { color: C.amber, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  heroTitle: { color: C.white, fontSize: 28, fontWeight: "900", lineHeight: 32 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroMetaText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "300" },
  heroBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  heroBadgeCurrency: { color: C.amber, fontSize: 12, fontWeight: "900" },
  heroBadgeText: { color: C.white, fontSize: 13, fontWeight: "700" },
  heroBadgeSub: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "400" },

  // ── Content ────────────────────────────────────────────────────────────
  content: { padding: 16, gap: 8 },

  // ── Customize Banner ───────────────────────────────────────────────────
  customizeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#d4a96a",
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
  },
  customizeTitle: { fontSize: 16, fontWeight: "900", color: C.slate900 },
  customizeSubtitle: { fontSize: 12, color: C.slate500, fontWeight: "600", marginTop: 2 },
  customizeBtn: {
    backgroundColor: C.slate900,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    flexShrink: 0,
  },
  customizeBtnText: { color: C.white, fontWeight: "900", fontSize: 12 },

  // ── Section ────────────────────────────────────────────────────────────
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: C.slate800, marginBottom: 16 },

  // ── Map Link ──────────────────────────────────────────────────────────
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.amberBorder,
    backgroundColor: C.cream,
  },
  mapLinkText: { flex: 1, color: C.amberDark, fontWeight: "700", fontSize: 13 },

  // ── Cards (Destination / Hotel shared) ────────────────────────────────
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.amberBorder,
    backgroundColor: C.white,
    marginBottom: 14,
  },
  cardImage: { width: "100%", height: 180 },
  cardBody: { padding: 14 },
  cardTitle: { fontWeight: "900", color: C.slate900, fontSize: 15, marginBottom: 4 },
  cardDescription: { color: C.slate500, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  viewBtn: {
    alignSelf: "flex-start",
    backgroundColor: C.slate900,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  viewBtnText: { color: C.white, fontWeight: "900", fontSize: 11 },

  // ── Hotel specific ─────────────────────────────────────────────────────
  hotelRatingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: C.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hotelRatingText: { color: C.brownDark, fontSize: 11, fontWeight: "900" },
  hotelCityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginBottom: 10,
    marginTop: 4,
  },
  hotelCityText: { color: C.brownDark, fontSize: 10, fontWeight: "900" },
  hotelFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hotelPrice: { fontWeight: "900", color: C.slate900, fontSize: 13 },

  // ── Transport ─────────────────────────────────────────────────────────
  transportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  transportCard: {
    borderWidth: 2,
    borderColor: C.amberBorder,
    borderRadius: 20,
    padding: 16,
    backgroundColor: C.white,
    gap: 10,
    flex: 1,
    minWidth: "45%",
  },
  transportLabel: { fontWeight: "900", color: C.slate900, fontSize: 14 },

  // ── Gallery ───────────────────────────────────────────────────────────
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  galleryImage: {
    width: (SCREEN_WIDTH - 56) / 3,
    height: 110,
    borderRadius: 16,
  },
  viewMoreBtn: { alignSelf: "flex-start", marginTop: 10 },
  viewMoreText: { fontWeight: "900", color: C.slate900, fontSize: 16 },

  // ── FAQ ───────────────────────────────────────────────────────────────
  faqCard: {
    borderWidth: 2,
    borderColor: C.amberBorder,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: C.white,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestion: { flex: 1, fontWeight: "900", color: C.slate900, fontSize: 13, marginRight: 8 },
  faqBody: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: "#f0e4cc" },
  faqAnswer: { color: C.slate500, fontSize: 13, lineHeight: 20, paddingTop: 12 },

  // ── Tip ───────────────────────────────────────────────────────────────
  tipCard: {
    borderWidth: 2,
    borderColor: C.amberBorder,
    borderRadius: 16,
    padding: 16,
    backgroundColor: C.white,
    marginBottom: 10,
  },
  tipTitle: { fontWeight: "900", color: C.slate900, fontSize: 13, marginBottom: 4 },
  tipDescription: { color: C.slate500, fontSize: 12, lineHeight: 18 },

  // ── Reviews ───────────────────────────────────────────────────────────
  emptyReviews: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: C.cream,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: C.amberBorder,
  },
  emptyReviewsText: { color: C.slate400, fontSize: 13, fontWeight: "700", marginTop: 10 },
  reviewSummary: {
    backgroundColor: C.cream,
    borderWidth: 2,
    borderColor: C.amberBorder,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  avgRating: { fontSize: 52, fontWeight: "900", color: C.slate900 },
  reviewCount: { color: C.slate400, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  ratingBarRow: { flexDirection: "row", alignItems: "center", gap: 6, width: "100%" },
  ratingBarStar: { fontSize: 11, fontWeight: "900", color: C.slate500, width: 12, textAlign: "right" },
  ratingBarTrack: { flex: 1, height: 6, backgroundColor: C.amberBorder, borderRadius: 100, overflow: "hidden" },
  ratingBarFill: { height: 6, backgroundColor: C.amber, borderRadius: 100 },
  ratingBarCount: { fontSize: 11, color: C.slate400, fontWeight: "700", width: 14, textAlign: "center" },

  reviewCard: {
    borderWidth: 2,
    borderColor: C.amberBorder,
    borderRadius: 20,
    padding: 16,
    backgroundColor: C.white,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  reviewUser: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.amberLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  reviewUserName: { fontWeight: "900", color: C.slate900, fontSize: 13 },
  reviewDate: { color: C.slate400, fontSize: 10, fontWeight: "500" },
  reviewComment: { color: C.slate600, fontSize: 13, lineHeight: 20 },

  // ── Itinerary ─────────────────────────────────────────────────────────
  itineraryCard: {
    borderWidth: 2,
    borderColor: C.amberBorder,
    borderRadius: 20,
    padding: 16,
    backgroundColor: C.white,
    marginBottom: 12,
  },
  itineraryHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  dayBadge: {
    backgroundColor: C.amberLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  dayBadgeText: { color: C.brownDark, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  itineraryTitle: { fontWeight: "900", color: C.slate800, fontSize: 14, flex: 1 },
  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingBottom: 10, marginBottom: 10 },
  activityRowBorder: { borderBottomWidth: 1, borderBottomColor: C.slate100, borderStyle: "dashed" },
  activityTime: { color: C.slate400, fontWeight: "900", fontSize: 11, minWidth: 44, paddingTop: 1 },
  activityTask: { color: C.slate700, fontSize: 13, flex: 1, lineHeight: 18 },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: C.navy,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  footerMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footerMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerMetaText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 13 },
  bookBtn: {
    backgroundColor: C.amber,
    paddingVertical: 18,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bookBtnText: { color: C.navy, fontWeight: "900", fontSize: 18, letterSpacing: 1 },
});

export default PackageOverviewPage;