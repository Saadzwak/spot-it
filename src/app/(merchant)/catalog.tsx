// ============================================================================
// Catalogue — liste des offres (toggle actif) + formulaire création/édition
// avec aperçu live de la carte d'offre. UI optimiste, best-effort en réel.
// Feature: tap offre → panneau détail produit (vue propriétaire).
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, categories as catTokens } from '@/design/tokens';
import { font } from '@/design/theme';
import {
  Card,
  SectionTitle,
  PrimaryButton,
  GhostButton,
  BrandAvatar,
  CatDot,
  Toggle,
  Icon,
} from '@/components';
import {
  OfferCardPreview,
  OFFER_TYPE_LABELS,
  SelectPill,
  type OfferDraft,
} from '@/merchant/components';
import {
  useMerchantOffers,
  saveOfferRemote,
  setOfferActiveRemote,
  deleteOfferRemote,
} from '@/merchant/useMerchantData';
import {
  CATEGORY_LABELS,
  PRICE_BAND_LABELS,
  offerPerformanceFor,
} from '@/merchant/mock';
import type { Offer, Category, PriceBand, OfferType } from '@/types/contracts';

const CATS: Category[]       = ['mode', 'tech', 'maison', 'beaute'];
const PRICE_BANDS: PriceBand[] = ['0-20', '20-50', '50-100', '100+'];
const OFFER_TYPES: OfferType[] = ['discount', 'gift', 'voucher', 'exclusive', 'bogo'];

const EMPTY_DRAFT: OfferDraft = {
  brand: '', title: '', category: 'mode', priceBand: '50-100',
  offerType: 'discount', sponsored: false, image: '',
};

function offerToDraft(o: Offer): OfferDraft {
  return {
    brand: o.brand, title: o.title, category: o.category, priceBand: o.priceBand,
    offerType: o.offerType, sponsored: o.sponsored, image: o.image ?? '',
  };
}

// ── Field label ───────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

// ── KPI Stat tile (used in detail panel) ─────────────────────────────────────
function StatTile({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Product Detail Panel ───────────────────────────────────────────────────────
function ProductDetailPanel({
  offer,
  isActive,
  onToggleActive,
  onEdit,
  onClose,
}: {
  offer: Offer;
  isActive: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onClose: () => void;
}): React.ReactElement {
  const perf = offerPerformanceFor(offer.id);
  const cat = catTokens[offer.category];
  const hasImage = Boolean(offer.image && offer.image.startsWith('http'));
  const grad: [string, string] = offer.grad
    ? [offer.grad[0], offer.grad[1]]
    : [cat.hue, cat.tint];

  const ctrPct = perf.ctr > 0 ? `${(perf.ctr * 100).toFixed(1)} %` : '—';

  return (
    <View>
      {/* Header */}
      <View style={styles.detailHead}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.backBtn} accessibilityLabel="Retour">
          <Icon name="chevronLeft" size={20} color={colors.ink2} />
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
        <Pressable onPress={onEdit} style={styles.editBtn} accessibilityLabel="Modifier l'offre">
          <Icon name="sliders" size={16} color={colors.accent} />
          <Text style={styles.editBtnLabel}>Modifier</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View style={styles.detailHero}>
        {hasImage ? (
          <Image source={{ uri: offer.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient
            colors={grad}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.detailHeroContent}>
          <Text style={[styles.detailBrand, { color: '#fff' }]} numberOfLines={1}>
            {offer.brand}
          </Text>
          <Text style={[styles.detailTitle, { color: hasImage ? '#fff' : (offer.ink ?? '#fff') }]} numberOfLines={2}>
            {offer.title}
          </Text>
        </View>
      </View>

      {/* Chips */}
      <View style={styles.detailChips}>
        <View style={[styles.chip, { backgroundColor: cat.tint }]}>
          <View style={[styles.chipDot, { backgroundColor: cat.hue }]} />
          <Text style={[styles.chipLabel, { color: cat.hue }]}>{CATEGORY_LABELS[offer.category]}</Text>
        </View>
        <View style={styles.chipMuted}>
          <Text style={styles.chipMutedLabel}>{OFFER_TYPE_LABELS[offer.offerType]}</Text>
        </View>
        <View style={styles.chipMuted}>
          <Text style={styles.chipMutedLabel}>{PRICE_BAND_LABELS[offer.priceBand]}</Text>
        </View>
      </View>

      {/* Description */}
      {offer.description ? (
        <Card style={styles.detailDescCard}>
          <Text style={styles.detailDescText}>{offer.description}</Text>
        </Card>
      ) : null}

      {/* Address */}
      {offer.address ? (
        <View style={styles.detailAddress}>
          <Icon name="pin" size={14} color={colors.ink3} />
          <Text style={styles.detailAddressText}>{offer.address}</Text>
        </View>
      ) : null}

      {/* Active toggle */}
      <Card style={styles.detailToggleCard}>
        <Toggle
          value={isActive}
          onValueChange={onToggleActive}
          label={isActive ? 'Offre active' : 'Offre en pause'}
          sublabel={isActive ? 'Visible dans le deck shopper' : 'Masquée du deck shopper'}
        />
      </Card>

      {/* Performance */}
      <SectionTitle style={styles.detailSectionTitle}>Performance de l'offre</SectionTitle>
      <View style={styles.statsGrid}>
        <StatTile label="Impressions" value={perf.impressions > 0 ? perf.impressions.toLocaleString('fr-FR') : '—'} />
        <StatTile label="Clics" value={perf.clicks > 0 ? perf.clicks.toLocaleString('fr-FR') : '—'} />
        <StatTile label="Visites" value={perf.visits > 0 ? perf.visits.toLocaleString('fr-FR') : '—'} />
        <StatTile label="Conversions" value={perf.conversions > 0 ? String(perf.conversions) : '—'} />
        <StatTile label="CTR" value={ctrPct} />
        <StatTile label="Accept. rate" value={perf.impressions > 0 && perf.clicks > 0
          ? `${Math.round((perf.conversions / perf.clicks) * 100)} %`
          : '—'} />
      </View>
    </View>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────
function OfferEditor({
  initial, editingId, wide, onCancel, onSave,
}: {
  initial: OfferDraft;
  editingId: string | null;
  wide: boolean;
  onCancel: () => void;
  onSave: (draft: OfferDraft) => void;
}): React.ReactElement {
  const [draft, setDraft] = useState<OfferDraft>(initial);
  const set = <K extends keyof OfferDraft>(k: K, v: OfferDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const canSave = draft.brand.trim().length > 0 && draft.title.trim().length > 0;

  const form = (
    <View style={styles.formCol}>
      <FieldLabel>Enseigne</FieldLabel>
      <TextInput
        value={draft.brand}
        onChangeText={(t) => set('brand', t)}
        placeholder="Ex. Sandro"
        placeholderTextColor={colors.ink3}
        style={styles.input}
      />

      <FieldLabel>Titre de l'offre</FieldLabel>
      <TextInput
        value={draft.title}
        onChangeText={(t) => set('title', t)}
        placeholder="Ex. -20% sur la nouvelle collection"
        placeholderTextColor={colors.ink3}
        style={styles.input}
        multiline
      />

      <FieldLabel>Catégorie</FieldLabel>
      <View style={styles.pillRow}>
        {CATS.map((c) => (
          <SelectPill key={c} label={CATEGORY_LABELS[c]} active={draft.category === c} onPress={() => set('category', c)} />
        ))}
      </View>

      <FieldLabel>Tranche de prix</FieldLabel>
      <View style={styles.pillRow}>
        {PRICE_BANDS.map((p) => (
          <SelectPill key={p} label={PRICE_BAND_LABELS[p]} active={draft.priceBand === p} onPress={() => set('priceBand', p)} />
        ))}
      </View>

      <FieldLabel>Type d'offre</FieldLabel>
      <View style={styles.pillRow}>
        {OFFER_TYPES.map((t) => (
          <SelectPill key={t} label={OFFER_TYPE_LABELS[t]} active={draft.offerType === t} onPress={() => set('offerType', t)} />
        ))}
      </View>

      <FieldLabel>Image (URL, optionnel)</FieldLabel>
      <TextInput
        value={draft.image}
        onChangeText={(t) => set('image', t)}
        placeholder="https://…"
        placeholderTextColor={colors.ink3}
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.toggleCard}>
        <Toggle
          value={draft.sponsored}
          onValueChange={(v) => set('sponsored', v)}
          label="Offre sponsorisée"
          sublabel="Mise en avant dans le deck shopper"
        />
      </View>
    </View>
  );

  const preview = (
    <View style={styles.previewCol}>
      <FieldLabel>Aperçu</FieldLabel>
      <OfferCardPreview draft={draft} />
    </View>
  );

  return (
    <View>
      <View style={styles.editorHead}>
        <Text style={styles.editorTitle}>{editingId ? "Modifier l’offre" : 'Nouvelle offre'}</Text>
      </View>

      <View style={[styles.editorBody, wide && styles.editorBodyWide]}>
        {form}
        {preview}
      </View>

      <View style={styles.editorActions}>
        <GhostButton label="Annuler" onPress={onCancel} />
        <View style={{ flex: 1 }} />
        <PrimaryButton
          label={editingId ? 'Enregistrer' : "Créer l'offre"}
          onPress={() => canSave && onSave(draft)}
          disabled={!canSave}
        />
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Catalog(): React.ReactElement {
  const { offers: fetched, loading } = useMerchantOffers();
  const { width } = useWindowDimensions();
  const centered: object = { width: '100%', maxWidth: 960, alignSelf: 'center' };
  const wide = Platform.OS === 'web' && width >= 760;

  const [offers, setOffers] = useState<Offer[]>(() => fetched);
  useEffect(() => { setOffers(fetched); }, [fetched]);

  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});
  const isActive = (id: string) => activeMap[id] ?? true;
  const toggleActive = (id: string) => {
    const next = !isActive(id);
    setActiveMap((prev) => ({ ...prev, [id]: next }));
    void setOfferActiveRemote(id, next);
  };

  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; draft: OfferDraft } | null>(null);
  const [detailOffer, setDetailOffer] = useState<Offer | null>(null);

  const duplicate = (offer: Offer) => {
    const id = `copy-${Date.now()}-${offer.id}`;
    const copy: Offer = { ...offer, id, title: `${offer.title} (copie)`, sponsored: false };
    setOffers((prev) => [copy, ...prev]);
    void saveOfferRemote(offerToDraft(copy));
  };

  const remove = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    setConfirmId(null);
    void deleteOfferRemote(id);
  };

  const handleSave = (draft: OfferDraft) => {
    if (editing?.id) {
      setOffers((prev) => prev.map((o) => (o.id === editing.id ? { ...o, ...draft } : o)));
      void saveOfferRemote(draft, editing.id);
    } else {
      const id = `new-${offers.length + 1}-${draft.brand.toLowerCase().replace(/\s+/g, '-')}`;
      const created: Offer = {
        id,
        brand: draft.brand,
        title: draft.title,
        category: draft.category,
        priceBand: draft.priceBand,
        offerType: draft.offerType,
        sponsored: draft.sponsored,
        image: draft.image || undefined,
        grad: ['#17130F', '#5C544C'],
        ink: '#FFFFFF',
        wordmark: { text: draft.brand },
      };
      setOffers((prev) => [created, ...prev]);
      void saveOfferRemote(draft);
    }
    setEditing(null);
  };

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? offers.filter((o) => o.brand.toLowerCase().includes(q) || o.title.toLowerCase().includes(q))
      : offers;
    const groups: Record<string, Offer[]> = {};
    for (const o of filtered) (groups[o.category] ??= []).push(o);
    return groups;
  }, [offers, query]);

  const hasResults = Object.keys(grouped).length > 0;

  // ── Éditeur plein écran ──
  if (editing) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, centered]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OfferEditor
          initial={editing.draft}
          editingId={editing.id}
          wide={wide}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── Panneau détail produit ──
  if (detailOffer) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, centered]}
        showsVerticalScrollIndicator={false}
      >
        <ProductDetailPanel
          offer={detailOffer}
          isActive={isActive(detailOffer.id)}
          onToggleActive={() => toggleActive(detailOffer.id)}
          onEdit={() => {
            const offer = detailOffer;
            setDetailOffer(null);
            setEditing({ id: offer.id, draft: offerToDraft(offer) });
          }}
          onClose={() => setDetailOffer(null)}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── Liste ──
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, centered]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headRow}>
        <Text style={styles.h1}>Mes offres</Text>
        <PrimaryButton
          label="Nouvelle offre"
          onPress={() => setEditing({ id: null, draft: { ...EMPTY_DRAFT } })}
        />
      </View>

      {/* Recherche */}
      {offers.length > 0 && (
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une offre…"
            placeholderTextColor={colors.ink3}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Effacer la recherche">
              <Icon name="x" size={16} color={colors.ink3} />
            </Pressable>
          )}
        </View>
      )}

      {loading && offers.length === 0 ? (
        <Text style={styles.loadingText}>Chargement…</Text>
      ) : offers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucune offre encore</Text>
          <Text style={styles.emptyText}>Créez votre première offre pour apparaître dans le deck shopper.</Text>
        </Card>
      ) : !hasResults ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptyText}>Aucune offre ne correspond à « {query} ».</Text>
        </Card>
      ) : (
        (Object.keys(grouped) as Category[]).map((cat) => (
          <View key={cat}>
            <View style={styles.catHeader}>
              <CatDot catId={cat} size={9} />
              <Text style={styles.catLabel}>{CATEGORY_LABELS[cat]}</Text>
            </View>
            <Card style={styles.groupCard}>
              {grouped[cat].map((offer, idx) => (
                <View key={offer.id} style={[styles.offerRow, idx > 0 && styles.rowBorder]}>
                  {/* Tap on brand info → detail view */}
                  <Pressable
                    style={styles.offerTap}
                    onPress={() => setDetailOffer(offer)}
                    accessibilityLabel={`Voir le détail de ${offer.brand}`}
                  >
                    <BrandAvatar offer={offer} size={42} />
                    <View style={styles.offerMeta}>
                      <Text style={styles.offerBrand} numberOfLines={1}>{offer.brand}</Text>
                      <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
                    </View>
                    <Icon name="chevronRight" size={14} color={colors.ink3} />
                  </Pressable>

                  {confirmId === offer.id ? (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmText}>Supprimer ?</Text>
                      <Pressable onPress={() => remove(offer.id)} hitSlop={6} style={styles.confirmYes}>
                        <Text style={styles.confirmYesText}>Oui</Text>
                      </Pressable>
                      <Pressable onPress={() => setConfirmId(null)} hitSlop={6} style={styles.confirmNo}>
                        <Text style={styles.confirmNoText}>Non</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.rowActions}>
                      <Pressable onPress={() => duplicate(offer)} hitSlop={6} style={styles.iconBtn} accessibilityLabel="Dupliquer l'offre">
                        <Icon name="cards" size={18} color={colors.ink3} />
                      </Pressable>
                      <Pressable onPress={() => setConfirmId(offer.id)} hitSlop={6} style={styles.iconBtn} accessibilityLabel="Supprimer l'offre">
                        <Icon name="x" size={18} color={colors.accent} />
                      </Pressable>
                      <Toggle value={isActive(offer.id)} onValueChange={() => toggleActive(offer.id)} />
                    </View>
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, paddingTop: 20 },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  h1: {
    fontFamily: font.displayBold,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: colors.ink,
  },
  loadingText: { fontFamily: font.body, color: colors.ink3 },
  // list
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  catLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  groupCard: { paddingVertical: 4 },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  offerTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  offerMeta: { flex: 1, gap: 2 },
  offerBrand: { fontFamily: font.bodySemiBold, fontSize: 14, fontWeight: '600', color: colors.ink },
  offerTitle: { fontFamily: font.body, fontSize: 12, color: colors.ink3, lineHeight: 16 },
  // search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  // row actions
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmText: { fontFamily: font.bodyMedium, fontSize: 13, color: colors.ink2 },
  confirmYes: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.accent },
  confirmYesText: { fontFamily: font.bodySemiBold, fontSize: 13, fontWeight: '600', color: colors.white },
  confirmNo: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.canvas },
  confirmNoText: { fontFamily: font.bodySemiBold, fontSize: 13, fontWeight: '600', color: colors.ink2 },
  // empty
  emptyCard: { padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontFamily: font.displaySemiBold, fontSize: 18, fontWeight: '600', color: colors.ink },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.ink3, textAlign: 'center', lineHeight: 20 },
  // editor
  editorHead: { marginBottom: 18 },
  editorTitle: {
    fontFamily: font.displayBold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.ink,
  },
  editorBody: { gap: 4 },
  editorBodyWide: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  formCol: { flex: 1.3, gap: 4 },
  previewCol: { flex: 1, gap: 4, minWidth: 260 },
  fieldLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
    ...shadows.sm,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...shadows.sm,
  },
  editorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 12,
  },
  // ── Detail panel ──
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLabel: {
    fontFamily: font.bodyMedium,
    fontSize: 14,
    color: colors.ink2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  editBtnLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  detailHero: {
    height: 220,
    borderRadius: radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  detailHeroContent: {
    padding: 20,
    gap: 6,
  },
  detailBrand: {
    fontFamily: font.displaySemiBold,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  detailTitle: {
    fontFamily: font.bodySemiBold,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  detailChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  chipDot: { width: 7, height: 7, borderRadius: 3.5 },
  chipLabel: { fontFamily: font.bodySemiBold, fontSize: 13, fontWeight: '600' },
  chipMuted: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  chipMutedLabel: { fontFamily: font.bodyMedium, fontSize: 13, color: colors.ink2 },
  detailDescCard: {
    padding: 16,
    marginBottom: 12,
  },
  detailDescText: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 22,
  },
  detailAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  detailAddressText: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink3,
    lineHeight: 18,
  },
  detailToggleCard: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  detailSectionTitle: { marginTop: 24, marginBottom: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 4,
    ...shadows.sm,
  },
  statValue: {
    fontFamily: font.displayBold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink3,
  },
});
