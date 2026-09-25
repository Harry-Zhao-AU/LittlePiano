# Catalogue coverage

9 books, 464 entries. My First A/B/C retain their complete page-indexed learning lists. All six Level 1, 2A and 2B books are reconciled against the family’s Progress Chart photos. All nine retained books now have chart-level coverage; edition and subsection limitations are documented below. Levels 3 and 4–5 are removed from the active catalogue.

| Book | Entries | Pages unknown | Status |
|---|---:|---:|---|
| My First Piano Adventure — Lesson Book A | 60 | 0 | verified_complete |
| My First Piano Adventure — Lesson Book B | 64 | 0 | verified_complete |
| My First Piano Adventure — Lesson Book C | 45 | 0 | verified_complete |
| Piano Adventures — Level 1 Lesson & Theory | 56 | 25 | verified_complete |
| Piano Adventures — Level 1 Technique & Performance | 49 | 12 | verified_complete |
| Piano Adventures — Level 2A Lesson & Theory | 58 | 27 | verified_complete |
| Piano Adventures — Level 2A Technique & Performance | 37 | 9 | verified_complete |
| Piano Adventures — Level 2B Lesson & Theory | 48 | 31 | verified_complete |
| Piano Adventures — Level 2B Technique & Performance | 47 | 14 | verified_complete |

## Verification scope

My First A/B/C include every page-indexed learning entry in the publisher’s two-page Progress Charts, in printed order. Writing Book cross-references, audio-only tracks without Lesson Book pages, certificates and reference-library pages are excluded. Technique games and exercises are included.

The six retained All-in-Two books are English Anglicised editions. Level 1 Lesson & Theory now has 56 learning entries reconciled against the family’s printed Progress Chart photo. Paired theory activities are retained as chart context, standalone theory rows are included, shared rows with two named pieces are split, and the certificate is excluded. Its cover/ISBN/printing still require confirmation. Level 1 Technique & Performance has 49 learning entries, including Technique Secrets and the Challenge Section, with combined named exercises split for individual assessment and the certificate excluded. Its own page column is used. Level 2A Lesson & Theory has 58 learning entries reconciled from its chart, including standalone theory, separate right/left-hand Old Man entries, the lead sheet, and Adventure Scale and Chord Warm-Ups. Page ranges are retained and the certificate excluded. Level 2A Technique & Performance has 37 entries representing every learning row in its chart, including five Technique Secrets, all four Explorer pieces and both starred scale-reference rows. Busy Places spans pages 6–7; its two known page-6 exercises are retained, but the chart does not name any further page-7 subsections. Completeness refers to chart coverage, not every subsection. Level 2B Lesson & Theory now has 48 chart entries. The audio-only Camptown Races Duet and Boom Boom! entries are removed; the printed chart instead includes I’ve Got Peace Like a River and Deep River. These are distinct pieces with new IDs, not renames. The seed removes the excluded entries only if they have no assessments; otherwise it stops and rolls back for review. Level 2B Technique & Performance now has 47 entries, including four Technique Secrets, three separate Classic Sonatina movements and both starred reference rows. The parent sonatina heading and certificate are not duplicated as assessments. All six family photos are reconciled; cover, ISBN and printing confirmation remain separate from chart completeness. Audio-index ordering remains provisional where printed pages are unknown. Publisher preview pages, warm-up references and Lesson correlation footers provide additional page evidence. The Level 2B Technique & Performance ISBN remains unconfirmed.

Sources are limited to Piano Adventures, including its official UK and Australian sites, plus the family’s photo of the printed publisher chart. The photo is identified by a stable URN in catalogue_sources; it is not a public URL and is not shipped with the app. Chart ranges are retained in the local review metadata; the SQL page_number remains null when an exact page cannot be established. No Hal Leonard or retailer lists are imported. No sheet music, recordings or artwork are shipped.

## Removed books

Level 3 and Level 4–5 Lesson & Theory and Technique & Performance are excluded from the active seed and review. On an existing database the seed marks these four books inactive, preserving any progress references. Earlier research remains in source files for stable-ID reconciliation. No remote changes are made by generating the seed.

## Review and repeat

[Every current title, page and source](REVIEW.md). Run `npm.cmd run seed:generate`, `node scripts/catalogue-report.mjs`, and `node scripts/research-audit.mjs`. Review generated SQL before applying. Existing song IDs are retained, and reseeding does not delete progress.

Read-only browser research: `node scripts/research-browser.mjs <publisher-URL> ...`. Screenshots remain in the OS temporary directory `piano-contents-research`; metadata receipts are recorded in research-audit.json.
