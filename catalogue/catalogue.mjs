import {catalogue as researched} from './expanded.mjs'
import {reconcileFamilyPhoto} from './family-level-1.mjs'
import {reconcileTechniquePhoto} from './family-level-1-technique.mjs'
import {reconcileLevel2aPhoto} from './family-level-2a.mjs'
import {reconcileLevel2aTechniquePhoto} from './family-level-2a-technique.mjs'
import {reconcileLevel2bPhoto} from './family-level-2b.mjs'
import {reconcileLevel2bTechniquePhoto} from './family-level-2b-technique.mjs'
// Current family scope. Earlier research remains available for stable-ID archival.
export const removedBooks=researched.filter(b=>/^all-in-two-(3|4-5)-/.test(b.key))
const reconcilers={
 'all-in-two-1-lesson-theory-anglicised':reconcileFamilyPhoto,
 'all-in-two-1-technique-performance-anglicised':reconcileTechniquePhoto,
 'all-in-two-2a-lesson-theory-anglicised':reconcileLevel2aPhoto,
 'all-in-two-2a-technique-performance-anglicised':reconcileLevel2aTechniquePhoto,
 'all-in-two-2b-lesson-theory-anglicised':reconcileLevel2bPhoto,
 'all-in-two-2b-technique-performance-anglicised':reconcileLevel2bTechniquePhoto,
}
export const catalogue=researched.filter(b=>!removedBooks.includes(b)).map(b=>reconcilers[b.key]?reconcilers[b.key](b):b.key.startsWith('my-first')?b:{...b,catalogue_notes:b.catalogue_notes+' Awaiting family photos of the contents pages for reconciliation.'})
