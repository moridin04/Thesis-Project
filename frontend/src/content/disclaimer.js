/*
 * Copy and version stamp for the public disclaimer dialog.
 * DisclaimerGate shows this text before the public pages.
 * disclaimerAck.js stores DISCLAIMER_VERSION with the acknowledgement.
 */
// Stored with each ack. Change this string when the disclaimer text changes.
export const DISCLAIMER_VERSION = '2026-10-05-1'

// One sentence shared with the public CSV and HTML export disclaimer.
export const DISCLAIMER_CORE =
  'For information purposes only. Not a warning system. Priority classes are relative tertiles across Manila barangays, not official flood warnings.'

export const DISCLAIMER_TITLE = 'Important Notice'

export const DISCLAIMER_LEAD = 'AGOS is a flood-risk prioritization tool for Manila barangays.'

// Paragraphs inside the dialog, under the lead sentence.
export const DISCLAIMER_BODY = [
  'For information purposes only. Not a warning system.',
  'Priority classes (High, Medium, Low) are relative tertiles across Manila barangays. They are not official flood warnings or forecasts.',
  'AGOS was developed as a thesis project. Results come from a model and may contain errors.',
  'For evacuation, warnings and emergency decisions, follow official advisories from national and local disaster authorities and your barangay or city DRRM office.',
]

export const DISCLAIMER_CHECKBOX_LABEL = 'I have read and agree to these terms'

export const DISCLAIMER_BUTTON_LABEL = 'I understand'

export const DISCLAIMER_CLOSE_LABEL = 'Close'
