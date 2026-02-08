// Max v8 JS
// Input: chord symbol string like "Cmaj", "D#m", "F#dim", "Bb7", "G"
// Output: rootName, pc(0-11), midi(C1..B1), fromC1(0..11)

inlets = 1;
outlets = 1;

const NOTE_TO_PC = {
  "C": 0,  "B#": 0,
  "C#": 1, "DB": 1,
  "D": 2,
  "D#": 3, "EB": 3,
  "E": 4,  "FB": 4,
  "F": 5,  "E#": 5,
  "F#": 6, "GB": 6,
  "G": 7,
  "G#": 8, "AB": 8,
  "A": 9,
  "A#": 10, "BB": 10,
  "B": 11, "CB": 11
};

const C1_MIDI = 24;

// Extracts tonic/root at start: letter A-G + optional # or b
function getRoot(sym) {
  if (typeof sym !== "string") return null;
  const s = sym.trim();
  const m = s.match(/^([A-Ga-g])([#b]?)/);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const acc = (m[2] || "").toUpperCase(); // make flats "b" into "B" key form
  return letter + acc; // e.g. "D#", "BB"
}

// Accept a chord symbol as a single atom or as a list that joins to a symbol
function anything() {
  // Max calls `anything` with messagename + args
  const a = arrayfromargs(messagename, arguments);
  const chordSymbol = a.join(" ");

  const root = getRoot(chordSymbol);
  if (!root) {
    outlet(0, "error", "bad_chord", chordSymbol);
    return;
  }

  const pc = NOTE_TO_PC[root];
  if (pc === undefined) {
    outlet(0, "error", "unknown_root", root);
    return;
  }

  const midi = C1_MIDI + pc;  // 24..35
  const fromC1 = pc;          // 0..11

  // choose your preferred output format:
  // outlet(0, midi);                         // just midi
  // outlet(0, fromC1);                       // just 0..11
  outlet(0, midi);             // root + both
}
