inlets = 2
outlets = 1

const MAJOR_INTERVAL = 4
const MINOR_INTERVAL = 3
const FIFTH_INTERVAL = 7
const TRIAD_NOTES_COUNT = 3

let currentTransform = transformP
let currentLabel = 'P'

const transforms = [transformP, transformL, transformR]

const labels = ['P', 'L', 'R']

function transform(index) {
   if (!(index in transforms))
      throw new Error(
         `the argument from transform less than ${transforms.length}, found '${index}'`,
      )

   currentTransform = transforms[index]
   currentLabel = labels[index]

}

function triad(...args) {
   const result = currentTransform(args)
   outlet(0, result)
}

function transformP(chord) {
   validChordOrThrow(chord)

   const isMajor = isMajorByRoot(chord)
   const [r, t, f] = getRootThirdFifth(chord, isMajor)

   const newPitchClasses = isMajor ? [r, mod12(t - 1), f] : [r, mod12(t + 1), f]
   return voiceChord(newPitchClasses, chord)
}

// L: Major->minor: root -1; Minor->major: fifth +1
function transformL(chord) {
   validChordOrThrow(chord)

   const isMajor = isMajorByRoot(chord)
   const [r, t, f] = getRootThirdFifth(chord, isMajor)

   const newPitchClasses = isMajor ? [mod12(r - 1), t, f] : [r, t, mod12(f + 1)]
   return voiceChord(newPitchClasses, chord)
}

// R: Major->minor: fifth +2; Minor->major: root -2
function transformR(chord) {
   validChordOrThrow(chord)

   const isMajor = isMajorByRoot(chord)
   const [r, t, f] = getRootThirdFifth(chord, isMajor)

   const newPitchClasses = isMajor ? [r, t, mod12(f + 2)] : [mod12(r - 2), t, f]
   return voiceChord(newPitchClasses, chord)
}
// helpers
function mod12(x) {
   return ((x % 12) + 12) % 12
}

function isMajorByRoot(chord) {
   const root = getChordRoot(chord)
   const pcs = chord.map(mod12)
   // Check if there's a major third (4 semitones) above the root
   return pcs.some((pc) => mod12(pc - root) === MAJOR_INTERVAL)
}

function getRootThirdFifth(chord, isMajor) {
   const root = getChordRoot(chord)

   const thirdInterval = isMajor ? MAJOR_INTERVAL : MINOR_INTERVAL
   const third = mod12(root + thirdInterval)
   const fifth = mod12(root + FIFTH_INTERVAL)

   return [root, third, fifth]
}

function getChordRoot(chord) {
   const pcs = chord.map(mod12)
   // Try each note as potential root
   //
   for (let i = 0; i < TRIAD_NOTES_COUNT; i++) {
      const pitch = pcs[i]
      const othersPitches = pcs.filter((_, j) => j !== i)

      // Check if this forms a major or minor triad
      const intervals = othersPitches
         .map((n) => mod12(n - pitch))
         .sort((a, b) => a - b)

      if (isMajorOrMinorInterval(intervals)) return pitch
   }

   throw new Error(`Not a valid triad: ${chord}`)
}

function isMajorOrMinorInterval(intervals) {
   if (!Array.isArray(intervals))
      throw new Error(`intervals must be an array, found: '${typeof intervals}'`)

   if (intervals.length != 2) return false

   return (
      (intervals[0] === MINOR_INTERVAL && intervals[1] === FIFTH_INTERVAL) || // minor
      (intervals[0] === MAJOR_INTERVAL && intervals[1] === FIFTH_INTERVAL)
   ) // major
}


function voiceChord(pitchClasses, referenceChord) {
  const [root, third, fifth] = pitchClasses;
  const refOctave = Math.floor(referenceChord[0] / 12) * 12;
  const octaveOffsets = [-12, 0, 12];
  
  const voicings = [];
  
  // For each note, generate all octave variants
  const rootOctaves = octaveOffsets.map(o => refOctave + o + root);
  const thirdOctaves = octaveOffsets.map(o => refOctave + o + third);
  const fifthOctaves = octaveOffsets.map(o => refOctave + o + fifth);
  
  // Try all combinations of octave placements
  for (const r of rootOctaves) {
    for (const t of thirdOctaves) {
      for (const f of fifthOctaves) {
        const v = [r, t, f].sort((a, b) => a - b);
        
        // Valid if no duplicates and within 1.5 octaves
        if (v[0] !== v[1] && v[1] !== v[2] && v[2] - v[0] <= 18) {
          voicings.push(v);
        }
      }
    }
  }
  
  // Find voicing with minimum movement
  return voicings.reduce((best, v) => {
    const dist = totalDistance(v, referenceChord);
    const bestDist = totalDistance(best, referenceChord);
    return dist < bestDist ? v : best;
  });
}

function totalDistance(voicing, reference) {
  return voicing.reduce((sum, note, i) => sum + Math.abs(note - reference[i]), 0);
}

function validChordOrThrow(chord) {
   if (Array.isArray(chord) == false)
      throw `Chord must be an array but found: '${typeof chord}'`

   if (chord.length != 3)
      throw `Only triads supported but found:  '${chord.length}' notes.`
}