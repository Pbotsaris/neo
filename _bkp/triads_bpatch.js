// Input: list of MIDI notes (ints). Output: "root quality pcs [..] [inversion]" or "unknown".
inlets = 1
outlets = 1

// pitch class -> preferred name (sharps)
var PC_TO_NAME = [
   'C',
   'C#',
   'D',
   'D#',
   'E',
   'F',
   'F#',
   'G',
   'G#',
   'A',
   'A#',
   'B',
]

// interval patterns (from root) => quality
var PATTERNS = {
   '4,7': 'maj',
   '3,7': 'm',
   '3,6': 'dim',
   '4,8': 'aug',
   '5,7': 'sus4',
}

function list(...args) {
   const midi = 
      args
      .map((x) => parseInt(x, 10))
      .filter((x) => isFinite(x))

   if (midi.length != 3) throw new Error('Expected exactly 3 MIDI notes as input')

   const pcsAll = midi.map((n) => ((n % 12) + 12) % 12)

   // unique pitch classes (sorted)
   var pcs = uniqueSorted(pcsAll)

   if (pcs.length < 3)  throw new Error('Expected 3 unique pitch classes from input MIDI notes')
   
   // If more than 3 unique pcs, try every 3-pc combination and pick first match

   var match = null

   if (pcs.length === 3) {
      match = matchTriad(pcs, midi)
   } else {
      var combos = combinationsOf3(pcs)
      for (var i = 0; i < combos.length; i++) {
         match = matchTriad(combos[i], midi)
         if (match) break
      }
   }

   if (!match) return outlet(0, 'unknown')

   // Output a useful message
   // e.g. "C maj pcs 0 4 7 inversion root"
   outlet(
      0,
      `${match.rootName}${match.quality}`,
      match.inversion,
   )
}

function matchTriad(pcs, midiAll) {
   for (var i = 0; i < 3; i++) {
      const note = pcs[i]
      const intervals = []

      for (var j = 0; j < 3; j++) {
         if (j === i) continue
         intervals.push(mod12(pcs[j] - note))
      }

      intervals.sort((a, b)=> a - b)

      const key = intervals[0] + ',' + intervals[1]
      const quality = PATTERNS[key]

      if (!quality) continue

      // inversion: need the lowest MIDI note and its chord tone relative to root
      // Find actual lowest MIDI among notes that are part of this triad’s pcs
      var lowestMidi = null
      var lowestPc = null
      for (var k = 0; k < midiAll.length; k++) {
         const pc = mod12(midiAll[k])

         if (pcs.indexOf(pc) === -1) continue

         if (lowestMidi === null || midiAll[k] < lowestMidi) {
            lowestMidi = midiAll[k]
            lowestPc = pc
         }
      }

      let inv = 'unknown'

      if (lowestPc !== null) {
         let rel = mod12(lowestPc - note)

         if (rel === 0) inv = 'root'
         else if (rel === intervals[0]) inv = 'first'
         else if (rel === intervals[1]) inv = 'second'
      }

      return {
         rootPc: note,
         rootName: PC_TO_NAME[note],
         quality: quality,
         pcs: pcs.slice().sort((a, b) =>  a - b),
         inversion: inv,
      }
   }

   return null
}

function mod12(x) {
   return ((x % 12) + 12) % 12
}

function uniqueSorted(arr) {
   var seen = {}
   var out = []
   for (var i = 0; i < arr.length; i++) {
      var v = arr[i]
      if (!seen[v]) {
         seen[v] = true
         out.push(v)
      }
   }
   out.sort(function(a, b) {
      return a - b
   })
   return out
}

function combinationsOf3(arr) {
   var res = []
   for (var i = 0; i < arr.length - 2; i++) {
      for (var j = i + 1; j < arr.length - 1; j++) {
         for (var k = j + 1; k < arr.length; k++) {
            res.push([arr[i], arr[j], arr[k]])
         }
      }
   }
   return res
}
