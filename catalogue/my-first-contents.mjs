// Transcribed from the publisher's product-gallery Progress Charts (pages 2–3),
// visually checked with Playwright screenshots on 2026-09-25.
// Include all page-indexed learning entries, including technique and theory activities.
// Exclude certificates, reference libraries, Writing Book cross-references and
// audio-only lines without a printed Lesson Book page (A: This Old Man, Rockin' on C and F).
const charts = {
 a: [
  '4:Friends at the Piano|5:Roll Call|6:The “I’m Great” Pose|8:Sounds on the Piano|10:Will You Play?|12:Stone on the Mountain|14:The Name Game|15:Tiger, Tiger|16:Left Hand and Right Hand|17:Cookie Dough|18:Dallas Dips L.H. Donuts|19:Dallas Dips R.H. Donuts|20:Twinkle, Twinkle Little Star|22:Black-Key Groups|23:Monster Bus Driver|24:Wrist, Forearm, Fingertips|25:Mitsy’s Cat Back|26:L.H. Rainbows|27:R.H. Rainbows|28:Kangaroo Show|29:Katie Scores!|30:Tigers at My Door|32:Wendy the Whale|34:Magic Tree House',
  '36:Quarter Note = 1 Beat|37:Dancing Feet|38:Cuckoo Clock|40:Dinosaur Music Night|42:Paw Prints|43:Wabbit the Rabbit|44:Little Lost Kitty|46:Half Note = 2 Beats|47:Band Practice!|48:Monsieur Mouse|50:Raccoon’s Lullaby|52:Bass Clef|53:Treble Clef|54:Mary’s Rockin’ Pets|56:Whole Note = 4 Beats|57:Train Rhythms|58:Old Pig-Donald|60:Shepherd, Count Your Sheep|62:The Music Alphabet|63:Cookie’s Journey Up the Mountain|64:Jungle Wedding|66:Riding the Escalator|68:Sneak-y Thumb|69:Birthday Train|70:Wish I Were a Fish|72:Oh! I Love Snack Time|74:If You’re Happy|76:My L.H. C Scale|77:My R.H. C Scale|78:The Measure|79:Katie’s Dog Tucker|80:Bed on a Boat|82:Eensie Weensie Spider|84:Graduation Party|86:The Grand Staff|87:Grand Staff Games'
 ],
 b: [
  '4:Friends at the Piano|6:Parade of Friends|8:Posture Power|9:Making Glasses|10:Giddy-up, Pony!|12:Silent Melody|12:Ode to Joy|14:The Grand Staff|15:Music Alphabet on the Grand Staff|16:The King’s Cat|17:The Queen’s Cat|18:Tub Time!|20:Gliding Goldfish|22:Pumpkin Party|24:Patterns by Memory|24:Mozart’s Musical Patterns|26:Ride the “A” Train|27:Tooth Fairy|28:Tucker’s Secret Life|30:A-B Bop!|32:Russian Folk Dance|34:f and p Fingers|34:Sounds of Beethoven|36:Time Signature|37:____ the Time Keeper|38:Gallop, Pony|40:King of the Land|42:Tambourine Party|44:Finger Trick 1|45:Finger Trick 2|46:Ice Cream Dog|47:Knock! Knock!|48:Hush, Little Baby|50:Wolfgang’s Theme|51:Ludwig’s Theme|52:3-Speed Fingers|52:On My Two-Wheeler',
  '54:Airplane Pilot|55:Tap, Be Nimble|56:Picnic with Friends|58:Knocking Game|58:Beethoven’s Door|60:Pilot, Land Your Plane|61:Scotland Bells|62:I Would Like to Go to Mars|64:Silent L.H. Jump|64:Construction Zone — Steam Shovel (for L.H.)|65:Silent R.H. Jump|65:Construction Zone — The Crane (for R.H.)|66:Pearl in the C|67:Octave Blues|68:This Is My C Scale|70:Pet Dragon|72:Thumb Whispers|72:Hide-and-Seek|74:Hot Chocolate, Whipped-Cream Day|76:Alouette|78:Alley Cat Choir|80:Write, Beethoven|81:Rock It and Roll It|82:Star Crossing Over|82:Twinkle, Twinkle Little Star|84:Twinkle, Twinkle Little Star — Variation 1|85:Twinkle, Twinkle Little Star — Variation 2'
 ],
 c: [
  '4:Time for a Rhyme!|6:Friends at the Piano|8:Con Brio|10:Hungarian Dance|12:Rising Sun|14:C Scale Flags|16:Treble Clef Mouse|17:E-G-B’s Morning Warm-ups|18:Mouse House|18:Cat Game|19:Mouse Game|20:Dinner with Wolfgang|22:Baby Owl|24:R.H. Thumb Taps|24:Skip with My R.H. Friends|25:Skip with My L.H. Friends|26:Cinderella’s Waltz|28:Ludwig’s Accents|30:Leap for the Piñata|32:Marching Feet|32:Marching Band Show',
  '34:Treasure Chest|36:Birthday Cake for Me|38:Swan Lake|40:Color Your Music|40:Dolphin Dreams|42:Allegro Skips|43:Mozart’s Pets|44:Go Tell Aunt Rhodie Theme and Variation|46:Night of Stars|48:Falling Elephant|49:Surprise Symphony Theme|50:Bass Clef Chant|52:Detective ____ at the Piano|54:Mouse in the Clock|56:Bedtime Boogie Woogie|58:You Can Clap for Me|60:Waltzing Hands|60:Tchaikovsky’s Waltz|62:Mama’s Bakin’ Apple Pie|64:Wild, Windy Day|66:Fingertaps|66:All the Raindrops|67:The G 5-Finger Scale|68:Let’s Go Play!'
 ]
}
export const myFirstContents = Object.fromEntries(Object.entries(charts).map(([letter,pages])=>{
 const sku={a:'FF1619',b:'FF1621',c:'FF1623'}[letter]
 return [letter,pages.flatMap((text,index)=>text.split('|').map(entry=>{
  const [page,title]=entry.split(':')
  return {title,page_number:Number(page),source_url:`https://pianoadventures.com/wp-content/uploads/sites/13/product_images/${sku}_${index+2}.jpg`}
 }))]
}))
