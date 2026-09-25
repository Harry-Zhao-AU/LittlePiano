# Catalogue coverage

Verified on **2026-09-24**. Eight books, 91 trackable entries. All are **partial**, not complete transcriptions. No demo songs are in the seed.

| Level | Book type | Edition / language | Imported | What remains |
|---|---|---|---:|---|
| Primer | Lesson | US 2nd / English | 49 | Reconcile the teaching guide against a full contents list; 48 page numbers unavailable in the guide index; introductory exercises not imported |
| Primer | Performance | US 2nd / English | 6 | All other songs and full contents reconciliation |
| Level 1 | Lesson | US 2nd / English | 6 | All other songs and full contents reconciliation |
| Level 1 | Performance | US 2nd / English | 6 | All other songs and full contents reconciliation |
| Level 2A | Lesson | US 2nd / English | 6 | All other songs and full contents reconciliation |
| Level 2A | Performance | US 2nd / English | 6 | All other songs, ISBN, full contents reconciliation |
| Level 2B | Lesson | US 2nd / English | 6 | All other songs and full contents reconciliation |
| Level 2B | Performance | US 2nd / English | 6 | All other songs, ISBN, full contents reconciliation |

The machine-readable record is [catalogue.mjs](catalogue.mjs). Every imported song has a source URL and verification date in the generated `catalogue_sources` rows. `sort_order` follows teaching-guide order for Primer Lesson and ascending verified first-page number for the exam selections. The UI identifies partial lists and calculates progress only for imported entries. Unknown page numbers stay null.

## Sources and decisions

- [Faber Primer teaching guide contents](https://primerguide.pianoadventures.com/) supplies the broader Primer Lesson sequence. Its index mixes teaching topics and pieces; we have deliberately kept the book partial pending a complete piece/exercise audit. [Into the Cave](https://primerguide.pianoadventures.com/units/into-the-cave/) explicitly identifies Lesson page 12.
- [Faber exam repertoire, July 2024](https://exams.pianoadventures.com/wp-content/uploads/2024/07/Piano-Adventures-Exams-Repertoire-List-Primer-to-2B.pdf) supplies selected pieces and page numbers for the other seven books. “Complete repertoire” in that document means the exam repertoire, not every book’s contents. US book codes match the product listings. English is identified from the English-language teaching resources and titles; UK All-in-Two books are separate editions and are not represented.
- Edition/ISBN verification uses the official Faber product pages linked in `catalogue.mjs`; Level 2A Performance uses the [official distributor listing](https://www.halleonard.com/product/420176/level-2a-performance-book-2nd-edition).
- [Hal Leonard Primer Lesson listing](https://www.halleonard.com/product/420168/primer-level-lesson-book-2nd-edition) and [Level 1 Lesson listing](https://www.halleonard.com/product/420171/level-1-lesson-book-2nd-edition) have alphabetical lists with title differences from the newer teaching/exam resources. These are not book order. The seed does not merge incompatible title variants or infer missing pages from them.
- Faber’s Primer product and legacy catalogue pages disagree on total page count (64 / 72). Total page count is not stored. Exact print revisions within “2nd Edition” remain unresolved; match the contents to your copy before using a title/page reference.

## Not covered

Levels 3A, 3B, 4, 5; Theory; Technique & Artistry; Sightreading; Gold Star; Christmas; Popular Repertoire; My First; Accelerated; Adult; UK All-in-Two editions; translations and earlier editions. These need separate book-by-book verification, not inferred contents.

To expand coverage, add source-confirmed entries with **new stable keys** (never renumber existing `entry-*` keys), update sort orders, record source/date, regenerate SQL and review the diff. A `verified_complete` designation requires reconciling all trackable pieces against a full contents/teaching index of the exact edition, documenting exclusions and checking order. None currently meets that bar. Reseeding does not delete entries or private progress.
