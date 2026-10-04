// Shared warning that in-sample predictions are not a fair test.
// Staff barangay list and barangay detail both print this note.
// The wording lives here so those two pages stay in agreement.

// Shown next to the model class on staff barangay pages.
export const IN_SAMPLE_NOTE =
  'Model-predicted class. The model was trained on these same 897 barangays, so this is not independent validation. Use the held-out results on the Model results page for performance.'
