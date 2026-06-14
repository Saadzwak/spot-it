// ============================================================================
// Catalogue — liste des offres (toggle actif) + formulaire création/édition
// avec aperçu live de la carte d'offre. UI optimiste, best-effort en réel.
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
import { colors, radius, shadows } from '@/design/tokens';
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
import { CATEGORY_LABELS, PRICE_BAND_LABELS } from '@/merchant/mock';
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

      <FieldLabel>Titre de l’offre</FieldLabel>
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

      <FieldLabel>Type d’offre</FieldLabel>
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
        <Text style={styles.editorTitle}>{editingId ? 'Modifier l’offre' : 'Nouvelle offre'}</Text>
      </View>

      <View style={[styles.editorBody, wide && styles.editorBodyWide]}>
        {form}
        {preview}
      </View>

      <View style={styles.editorActions}>
        <GhostButton label="Annuler" onPress={onCancel} />
        <View style={{ flex: 1 }} />
        <PrimaryButton
          label={editingId ? 'Enregistrer' : 'Créer l’offre'}
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
  const maxWidth = Math.min(width, 960);
  const centered: object = { width: '100%', maxWidth: 960, alignSelf: 'center' };
  const wide = Platform.OS === 'web' && width >= 760;

  // Liste locale (optimiste) initialisée depuis le fetch.
  const [offers, setOffers] = useState<Offer[]>([]);
  useEffect(() => { setOffers(fetched); }, [fetched]);

  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});
  const isActive = (id: string) => activeMap[id] ?? true;
  const toggleActive = (id: string) => {
    const next = !isActive(id);
    setActiveMap((prev) => ({ ...prev, [id]: next })); // optimiste
    void setOfferActiveRemote(id, next);
  };

  // Recherche + confirmation de suppression
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Éditeur
  const [editing, setEditing] = useState<{ id: string | null; draft: OfferDraft } | null>(null);

  const duplicate = (offer: Offer) => {
    const id = `copy-${Date.now()}-${offer.id}`;
    const copy: Offer = { ...offer, id, title: `${offer.title} (copie)`, sponsored: false };
    setOffers((prev) => [copy, ...prev]);
    void saveOfferRemote(offerToDraft(copy));
  };

  const remove = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id)); // optimiste
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
                  <Pressable
                    style={styles.offerTap}
                    onPress={() => setEditing({ id: offer.id, draft: offerToDraft(offer) })}
                  >
                    <BrandAvatar offer={offer} size={42} />
                    <View style={styles.offerMeta}>
                      <Text style={styles.offerBrand} numberOfLines={1}>{offer.brand}</Text>
                      <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
                    </View>
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
                      <Pressable onPress={() => duplicate(offer)} hitSlop={6} style={styles.iconBtn} accessibilityLabel="Dupliquer l’offre">
                        <Icon name="cards" size={18} color={colors.ink3} />
                      </Pressable>
                      <Pressable onPress={() => setConfirmId(offer.id)} hitSlop={6} style={styles.iconBtn} accessibilityLabel="Supprimer l’offre">
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
});
