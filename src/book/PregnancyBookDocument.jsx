/* ═══════════════════════════════════════════════════════════════
   PregnancyBookDocument — prints the full pregnancy book

   Trim: 6" × 9" hardcover
   Bleed: 0.125" (but page size is set to trim; bleed added via bleedBox)
   Interior margins: 0.75" top/bottom, 0.75" inside, 0.5" outside
   Paper: cream (via background color on cover, white interior otherwise)

   Uses @react-pdf/renderer — pure React components → print-ready PDF.
═══════════════════════════════════════════════════════════════ */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Using PDF's built-in Times-Roman family — always available, no network fetch.
// Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic are PDF standard fonts.
const SERIF_FONT = 'Times-Roman';

// ── Palette (print-friendly, CMYK-safe values) ──
const C = {
  cream:      '#FAF6EE',
  ink:        '#2C1F18',
  mutedInk:   '#5C4A40',
  rose:       '#C28598',
  roseLight:  '#E5C6CD',
  gold:       '#B89456',
  sage:       '#8A9F82',
  divider:    '#D4C5B5',
};

// ── Shared styles ──
const s = StyleSheet.create({
  /* Pages */
  page: {
    backgroundColor: C.cream,
    paddingTop:    54,   // 0.75in
    paddingBottom: 54,
    paddingLeft:   54,
    paddingRight:  36,   // outer edge slightly less for book feel
    fontFamily: SERIF_FONT,
    color: C.ink,
    fontSize: 11,
    lineHeight: 1.6,
  },
  pageRight: { paddingLeft: 36, paddingRight: 54 },

  /* Cover */
  coverPage: {
    backgroundColor: C.cream,
    padding: 0,
    fontFamily: SERIF_FONT,
    color: C.ink,
  },
  coverInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: C.cream,
    borderWidth: 8,
    borderColor: C.roseLight,
    borderStyle: 'solid',
    margin: 36,
  },
  coverLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: C.rose,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 34,
    fontWeight: 700,
    textAlign: 'center',
    color: C.ink,
    lineHeight: 1.2,
    marginBottom: 16,
  },
  coverSub: {
    fontSize: 14,
    fontStyle: 'italic',
    color: C.mutedInk,
    textAlign: 'center',
    marginBottom: 40,
  },
  coverOrnament: {
    width: 60, height: 1, backgroundColor: C.rose, marginVertical: 20,
  },
  coverAuthor: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.mutedInk,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  coverDate: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    fontSize: 9,
    letterSpacing: 3,
    color: C.mutedInk,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  /* Centered full-page content */
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },

  /* Title page */
  titleMain: { fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 10, textAlign: 'center', lineHeight: 1.2 },
  titleSub:  { fontSize: 14, fontStyle: 'italic', color: C.mutedInk, textAlign: 'center', marginBottom: 30 },
  titleMeta: { fontSize: 10, letterSpacing: 2, color: C.mutedInk, textAlign: 'center', textTransform: 'uppercase' },

  /* Section header (for week cards, etc.) */
  sectionLabel: {
    fontSize: 8, letterSpacing: 3, color: C.rose,
    textTransform: 'uppercase', marginBottom: 8,
  },
  sectionH1: { fontSize: 24, fontWeight: 700, color: C.ink, marginBottom: 14, lineHeight: 1.2 },
  divider:   { width: 40, height: 1, backgroundColor: C.divider, marginVertical: 16 },

  /* Week spread */
  weekNumber: { fontSize: 9, letterSpacing: 4, color: C.rose, textTransform: 'uppercase', marginBottom: 6 },
  weekTitle:  { fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 14, lineHeight: 1.2 },
  weekBody:   { fontSize: 11, color: C.ink, lineHeight: 1.75, marginBottom: 12 },
  weekLabel:  { fontSize: 8, letterSpacing: 2, color: C.mutedInk, textTransform: 'uppercase', marginBottom: 4, marginTop: 10 },
  scriptureBox: {
    backgroundColor: '#F4EADF',
    borderRadius: 6,
    padding: 16,
    marginTop: 14, marginBottom: 14,
  },
  scriptureText: { fontSize: 11, fontStyle: 'italic', color: C.ink, textAlign: 'center', lineHeight: 1.6, marginBottom: 6 },
  scriptureRef:  { fontSize: 8, letterSpacing: 2, color: C.rose, textAlign: 'center', textTransform: 'uppercase' },

  /* Letter */
  letterDate: { fontSize: 9, letterSpacing: 2, color: C.rose, textTransform: 'uppercase', marginBottom: 6 },
  letterGreeting: { fontSize: 16, fontStyle: 'italic', color: C.mutedInk, marginBottom: 14 },
  letterBody: { fontSize: 11.5, color: C.ink, lineHeight: 1.85, marginBottom: 14 },
  letterSignOff: { fontSize: 11, fontStyle: 'italic', color: C.mutedInk, marginTop: 10 },

  /* Memento item */
  mementoBox: {
    paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: C.divider, borderStyle: 'solid',
  },
  mementoHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  mementoLabel: { fontSize: 12, fontWeight: 600, color: C.ink, flex: 1 },
  mementoDate: { fontSize: 9, color: C.mutedInk, letterSpacing: 1 },
  mementoNote: { fontSize: 10, fontStyle: 'italic', color: C.mutedInk, lineHeight: 1.6 },

  /* Footer on body pages */
  footer: {
    position: 'absolute', bottom: 24, left: 54, right: 54,
    fontSize: 8, color: C.mutedInk, letterSpacing: 2,
    textTransform: 'uppercase', textAlign: 'center',
  },
  pageNum: {
    position: 'absolute', bottom: 24, right: 36,
    fontSize: 9, color: C.mutedInk,
  },
});

// ── Helpers ──
function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function formatDueDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch { return iso; }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN DOCUMENT
// ═══════════════════════════════════════════════════════════════
// Pass: { pregnancy, motherName, weeksData, dedication }
export default function PregnancyBookDocument({ pregnancy, motherName, weeksData, dedication }) {
  const babyName = (pregnancy.babyNickname && pregnancy.babyNickname.trim()) || 'Little One';
  const dueDate = pregnancy.dueDate;
  const faithMode = pregnancy.faithMode || 'christian';

  // Decide which weeks to include — only those with content OR all up to current week
  const weeksWithContent = new Set();
  (pregnancy.letters || []).forEach(l => weeksWithContent.add(l.week));
  const maxWeek = Math.max(
    ...Array.from(weeksWithContent),
    pregnancy.letters?.length ? 0 : 10, // ensure at least 10 weeks shown
  );

  const lettersByWeek = {};
  (pregnancy.letters || []).forEach(l => {
    const wk = l.week || 1;
    if (!lettersByWeek[wk]) lettersByWeek[wk] = [];
    lettersByWeek[wk].push(l);
  });

  const savedMementos = Object.entries(pregnancy.milestones || {})
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Document
      title={`The Story of ${babyName}`}
      author={motherName || 'Mama'}
      subject="A Pregnancy Keepsake"
      creator="Inner Room Journal"
      producer="Inner Room Journal"
    >
      <CoverPage babyName={babyName} motherName={motherName} dueDate={dueDate} />
      <TitlePage babyName={babyName} motherName={motherName} dueDate={dueDate} />
      <DedicationPage babyName={babyName} dedication={dedication} />
      <OpeningLetterPage babyName={babyName} motherName={motherName} />
      <TOCPage hasLetters={(pregnancy.letters || []).length > 0} hasMementos={savedMementos.length > 0} weeksCount={weeksData.length} />

      {/* Week spreads */}
      {weeksData.map(wd => (
        <WeekSpread
          key={wd.week}
          weekData={wd}
          letters={lettersByWeek[wd.week] || []}
          faithMode={faithMode}
          babyName={babyName}
        />
      ))}

      {/* All letters collection */}
      {(pregnancy.letters || []).length > 0 && (
        <>
          <SectionDividerPage title="Letters to You" subtitle={`Every word mama wrote to ${babyName}`} />
          {(pregnancy.letters || []).slice().reverse().map(letter => (
            <LetterPage key={letter.id} letter={letter} babyName={babyName} motherName={motherName} />
          ))}
        </>
      )}

      {/* Mementos */}
      {savedMementos.length > 0 && (
        <>
          <SectionDividerPage title="Mementos" subtitle="The small, sacred days" />
          <MementosPage mementos={savedMementos} />
        </>
      )}

      <ClosingPage babyName={babyName} motherName={motherName} />
    </Document>
  );
}

// ═══════════════════════════════════════════════════════════════
//  INDIVIDUAL PAGE COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CoverPage({ babyName, motherName, dueDate }) {
  return (
    <Page size={[432, 648]} style={s.coverPage}>
      <View style={s.coverInner}>
        <Text style={s.coverLabel}>A Keepsake Book</Text>
        <View style={s.coverOrnament} />
        <Text style={s.coverTitle}>The Story{'\n'}of {babyName}</Text>
        <Text style={s.coverSub}>Before we ever met</Text>
        <View style={s.coverOrnament} />
        {motherName && <Text style={s.coverAuthor}>by {motherName}</Text>}
      </View>
      {dueDate && <Text style={s.coverDate}>{formatDueDate(dueDate)}</Text>}
    </Page>
  );
}

function TitlePage({ babyName, motherName, dueDate }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <View style={s.centered}>
        <Text style={s.titleMain}>The Story of {babyName}</Text>
        <Text style={s.titleSub}>A Pregnancy Keepsake</Text>
        <View style={{ width: 50, height: 0.5, backgroundColor: C.divider, marginVertical: 20 }} />
        {motherName && <Text style={s.titleMeta}>Written by {motherName}</Text>}
        {dueDate && <Text style={{ ...s.titleMeta, marginTop: 10 }}>{formatDueDate(dueDate)}</Text>}
      </View>
    </Page>
  );
}

function DedicationPage({ babyName, dedication }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <View style={s.centered}>
        <Text style={{ fontSize: 10, letterSpacing: 3, color: C.rose, textTransform: 'uppercase', marginBottom: 30 }}>
          Dedication
        </Text>
        <Text style={{ fontSize: 16, fontStyle: 'italic', color: C.ink, lineHeight: 1.7, textAlign: 'center', paddingHorizontal: 30 }}>
          {dedication || `For you, ${babyName}.\nBefore we ever met, you were already loved.`}
        </Text>
      </View>
    </Page>
  );
}

function OpeningLetterPage({ babyName, motherName }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <Text style={s.sectionLabel}>A note from this book</Text>
      <View style={s.divider} />
      <Text style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.9, marginTop: 6 }}>
        Dear {babyName},{'\n\n'}
        Your mama wrote this for you.{'\n\n'}
        Before she ever held you, before you had a name she could say out loud,
        she was already making a home for you. Every letter in this book, every
        small moment she remembered — she wrote these down because she did not
        want to forget a single thing about the season of becoming your mother.{'\n\n'}
        One day, when you are old enough to read, she will give you this book.
        And you will know: you were wanted. You were waited for. You were loved
        before you arrived.{'\n\n'}
        <Text style={{ fontStyle: 'italic', color: C.mutedInk }}>
          With love,{'\n'}
          The book she kept for you
        </Text>
      </Text>
    </Page>
  );
}

function TOCPage({ hasLetters, hasMementos, weeksCount }) {
  const items = [
    { label: 'Week by Week', page: 7 },
    ...(hasLetters ? [{ label: 'Letters to You', page: 7 + weeksCount * 2 + 1 }] : []),
    ...(hasMementos ? [{ label: 'Mementos', page: 0 }] : []),
    { label: 'Closing', page: 0 },
  ];
  return (
    <Page size={[432, 648]} style={s.page}>
      <Text style={s.sectionLabel}>Contents</Text>
      <View style={s.divider} />
      <View style={{ marginTop: 20 }}>
        {items.map((it, i) => (
          <View key={i} style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.divider, borderStyle: 'solid' }}>
            <Text style={{ flex: 1, fontSize: 12, color: C.ink }}>{it.label}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}

function WeekSpread({ weekData, letters, faithMode, babyName }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <Text style={s.weekNumber}>Week {weekData.week}</Text>
      <Text style={s.weekTitle}>{weekData.title}</Text>
      <View style={s.divider} />

      <Text style={s.weekLabel}>Their Week</Text>
      <Text style={s.weekBody}>{weekData.baby}</Text>

      <Text style={s.weekLabel}>Your Week</Text>
      <Text style={s.weekBody}>{weekData.body}</Text>

      {faithMode === 'christian' && weekData.scripture && (
        <View style={s.scriptureBox}>
          <Text style={s.scriptureText}>&ldquo;{weekData.scripture.text}&rdquo;</Text>
          <Text style={s.scriptureRef}>— {weekData.scripture.ref}</Text>
        </View>
      )}
      {faithMode !== 'christian' && weekData.poem && (
        <View style={s.scriptureBox}>
          <Text style={s.scriptureText}>{weekData.poem}</Text>
        </View>
      )}

      {letters.length > 0 && (
        <>
          <Text style={{ ...s.weekLabel, marginTop: 20 }}>Your Letters This Week</Text>
          {letters.map(letter => (
            <View key={letter.id} wrap={false} style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: C.divider, borderStyle: 'solid' }}>
              <Text style={s.letterDate}>{formatDate(letter.date)}</Text>
              <Text style={{ fontSize: 11, color: C.ink, lineHeight: 1.85, fontStyle: 'italic' }}>
                {letter.text}
              </Text>
            </View>
          ))}
        </>
      )}

      <Text style={s.pageNum} render={({ pageNumber }) => pageNumber} />
    </Page>
  );
}

function SectionDividerPage({ title, subtitle }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <View style={s.centered}>
        <View style={{ width: 80, height: 0.5, backgroundColor: C.rose, marginBottom: 30 }} />
        <Text style={{ fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 12, textAlign: 'center' }}>{title}</Text>
        <Text style={{ fontSize: 13, fontStyle: 'italic', color: C.mutedInk, textAlign: 'center' }}>{subtitle}</Text>
        <View style={{ width: 80, height: 0.5, backgroundColor: C.rose, marginTop: 30 }} />
      </View>
    </Page>
  );
}

function LetterPage({ letter, babyName, motherName }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <Text style={s.letterDate}>{formatDate(letter.date)}{letter.week ? ` · Week ${letter.week}` : ''}</Text>
      <View style={{ ...s.divider, backgroundColor: C.rose }} />
      <Text style={s.letterGreeting}>Dear {babyName},</Text>
      <Text style={s.letterBody}>{letter.text}</Text>
      {motherName && <Text style={s.letterSignOff}>— {motherName}</Text>}
      <Text style={s.pageNum} render={({ pageNumber }) => pageNumber} />
    </Page>
  );
}

function MementosPage({ mementos }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <Text style={s.sectionLabel}>Mementos</Text>
      <View style={s.divider} />
      {mementos.map(m => (
        <View key={m.id} style={s.mementoBox} wrap={false}>
          <View style={s.mementoHead}>
            <Text style={s.mementoLabel}>{mementoLabel(m.id)}</Text>
            <Text style={s.mementoDate}>{formatDate(m.date)}</Text>
          </View>
          {m.reflection && <Text style={s.mementoNote}>{m.reflection}</Text>}
        </View>
      ))}
      <Text style={s.pageNum} render={({ pageNumber }) => pageNumber} />
    </Page>
  );
}

function ClosingPage({ babyName, motherName }) {
  return (
    <Page size={[432, 648]} style={s.page}>
      <View style={s.centered}>
        <Text style={{ fontSize: 10, letterSpacing: 3, color: C.rose, textTransform: 'uppercase', marginBottom: 30 }}>
          The End of the Beginning
        </Text>
        <Text style={{ fontSize: 15, fontStyle: 'italic', color: C.ink, lineHeight: 1.8, textAlign: 'center', paddingHorizontal: 30 }}>
          This was the story{'\n'}
          of how we got to you.
        </Text>
        <View style={{ width: 60, height: 0.5, backgroundColor: C.rose, marginVertical: 30 }} />
        <Text style={{ fontSize: 11, color: C.mutedInk, textAlign: 'center' }}>
          {motherName ? `Written by ${motherName}` : 'Written by your mama'}
        </Text>
        <Text style={{ fontSize: 10, color: C.mutedInk, textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>
          in the Inner Room Journal
        </Text>
      </View>
    </Page>
  );
}

// Look up a memento label from its id
function mementoLabel(id) {
  const labels = {
    'first-test':       'First Positive Test',
    'first-heartbeat':  'First Heartbeat Heard',
    'first-ultrasound': 'First Ultrasound',
    'told-family':      'Told the Family',
    'first-flutter':    'First Flutter Felt',
    'gender-revealed':  'Learned Who They Are',
    'anatomy-scan':     'Anatomy Scan',
    'chose-name':       'Chose a Name',
    'baby-shower':      'Baby Shower',
    'nursery-ready':    'Nursery Ready',
    'bag-packed':       'Hospital Bag Packed',
    'labor-begins':     'Labor Began',
    'baby-born':        'They Were Born',
  };
  return labels[id] || id;
}
