/* ═══════════════════════════════════════════════════════════════
   PregnancyCoverDocument — wrap-around hardcover for Lulu

   Layout (single page, landscape wrap):
     ┌──────────┬───┬──────────┐
     │   back   │sp │  front   │
     │          │   │          │
     └──────────┴───┴──────────┘

   Dimensions for 6" × 9" hardcover:
     - Page width:   back(6") + spine + front(6") + wrap(0.625" each side) = 13.25" + spine
     - Page height:  9" + wrap(0.625" top + bottom) = 10.25"
     - Bleed:        0.125" included in the wrap allowance
     - Spine width:  depends on page count; Lulu's formula for hardcover cream:
                     spine = (pages × 0.0025") rounded
                     e.g. 150pg → 0.375"

   All measurements in PDF points (1" = 72pt).
═══════════════════════════════════════════════════════════════ */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const SERIF_FONT = 'Times-Roman';

// Print-safe palette (matches interior)
const C = {
  cream:     '#FAF6EE',
  ink:       '#2C1F18',
  mutedInk:  '#5C4A40',
  rose:      '#C28598',
  roseLight: '#E5C6CD',
};

// ── Spine calculation ──
// Lulu hardcover cream paper: spine width in inches ≈ pageCount × 0.0025"
// Plus fixed allowance for the hardcover boards (~0.25")
// This is a safe default; production flow should query Lulu's cover calculator API
// for the exact spine width for the SKU. See api/lulu/cover-dimensions for future.
export function computeCoverDims(pageCount, { trimWidth = 6, trimHeight = 9, wrap = 0.625 } = {}) {
  const spineInches = Math.max(0.15, (pageCount * 0.0025) + 0.25);
  const totalWidthInches  = (trimWidth * 2) + spineInches + (wrap * 2);
  const totalHeightInches = trimHeight + (wrap * 2);
  return {
    spineInches,
    totalWidthInches,
    totalHeightInches,
    // in points (72 per inch)
    spine:  spineInches  * 72,
    width:  totalWidthInches  * 72,
    height: totalHeightInches * 72,
    wrap:   wrap * 72,
    trim:   { w: trimWidth * 72, h: trimHeight * 72 },
  };
}

export default function PregnancyCoverDocument({ pregnancy, motherName, pageCount }) {
  const babyName = (pregnancy.babyNickname && pregnancy.babyNickname.trim()) || 'Little One';
  const dueDate = pregnancy.dueDate;

  const dims = computeCoverDims(pageCount);

  const s = StyleSheet.create({
    page: {
      backgroundColor: C.cream,
      fontFamily: SERIF_FONT,
      color: C.ink,
      padding: 0,
    },
    // Wrap = full page. Inside it we place 3 columns: back, spine, front.
    wrapRow: {
      flexDirection: 'row',
      width: dims.width,
      height: dims.height,
    },
    // Each panel accounts for wrap on its outer edge.
    back: {
      width: dims.trim.w + dims.wrap,
      height: dims.height,
      paddingTop:    dims.wrap + 36,
      paddingBottom: dims.wrap + 36,
      paddingLeft:   dims.wrap + 36,
      paddingRight:  18,
      justifyContent: 'flex-start',
    },
    spine: {
      width: dims.spine,
      height: dims.height,
      backgroundColor: C.roseLight,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: dims.wrap + 20,
      paddingBottom: dims.wrap + 20,
    },
    front: {
      width: dims.trim.w + dims.wrap,
      height: dims.height,
      paddingTop:    dims.wrap + 36,
      paddingBottom: dims.wrap + 36,
      paddingLeft:   18,
      paddingRight:  dims.wrap + 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Front decorative border (inside the wrap area)
    frontInner: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: C.roseLight,
      borderStyle: 'solid',
      padding: 40,
    },
    coverLabel: {
      fontSize: 9,
      letterSpacing: 3,
      color: C.rose,
      textTransform: 'uppercase',
      marginBottom: 18,
    },
    coverTitle: {
      fontSize: 32,
      fontWeight: 700,
      textAlign: 'center',
      color: C.ink,
      lineHeight: 1.2,
      marginBottom: 14,
    },
    coverSub: {
      fontSize: 13,
      fontStyle: 'italic',
      color: C.mutedInk,
      textAlign: 'center',
      marginBottom: 32,
    },
    coverOrnament: {
      width: 50, height: 1, backgroundColor: C.rose,
      marginVertical: 16,
    },
    coverAuthor: {
      fontSize: 10,
      letterSpacing: 2,
      color: C.mutedInk,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    coverDate: {
      fontSize: 9,
      letterSpacing: 3,
      color: C.mutedInk,
      textAlign: 'center',
      textTransform: 'uppercase',
      marginTop: 20,
    },
    // Spine typography (rotated sideways for reading top-to-bottom)
    spineText: {
      fontSize: 11,
      color: C.ink,
      fontWeight: 700,
      transform: 'rotate(-90deg)',
      // The rotated text needs room; alignItems:center on spine helps
    },
    // Back cover content
    backBlurb: {
      fontSize: 11,
      color: C.ink,
      fontStyle: 'italic',
      lineHeight: 1.7,
      textAlign: 'center',
      marginTop: dims.height * 0.3,
    },
    backCredit: {
      position: 'absolute',
      bottom: dims.wrap + 30,
      left: dims.wrap + 30,
      right: 30,
      fontSize: 8,
      letterSpacing: 2,
      color: C.mutedInk,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
  });

  return (
    <Document
      title={`The Story of ${babyName} — Cover`}
      author={motherName || 'Mama'}
    >
      <Page size={[dims.width, dims.height]} style={s.page}>
        <View style={s.wrapRow}>

          {/* ── BACK COVER ── */}
          <View style={s.back}>
            <Text style={s.backBlurb}>
              "Before you knew,{'\n'}
              you were already becoming."
            </Text>
            <Text style={s.backCredit}>
              Inner Room Journal{dueDate ? ` · ${new Date(dueDate).getFullYear()}` : ''}
            </Text>
          </View>

          {/* ── SPINE ── */}
          <View style={s.spine}>
            {dims.spineInches >= 0.25 && (
              <Text style={s.spineText}>
                The Story of {babyName}
              </Text>
            )}
          </View>

          {/* ── FRONT COVER ── */}
          <View style={s.front}>
            <View style={s.frontInner}>
              <Text style={s.coverLabel}>A Keepsake Book</Text>
              <View style={s.coverOrnament} />
              <Text style={s.coverTitle}>The Story{'\n'}of {babyName}</Text>
              <Text style={s.coverSub}>Before we ever met</Text>
              <View style={s.coverOrnament} />
              {motherName && <Text style={s.coverAuthor}>by {motherName}</Text>}
              {dueDate && (
                <Text style={s.coverDate}>
                  {new Date(dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
              )}
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}
