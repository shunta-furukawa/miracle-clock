# Arrival ledger — 0.15.0

Returned letters no longer present three time answers. Luca reads the arrival
stamp and transcribes it using blank brass number wheels, then files the letter.
The recipient, parcel tags, original gemstone clock and reactions are retained.

- Hour-window stages enter hours only; exact-hour stages prefill zero minutes.
- Minute stages prefill the hour. Half/quarter/five/one-minute steps follow the chapter.
- Morning/afternoon stages require the period as well as hours and minutes.
- Greenhouse stages record elapsed minutes from the dotted reference to arrival;
  the range includes zero through 180 minutes, with five-minute increments.
- Every field starts blank, submitting incomplete entries is blocked, and wheel
  ranges never depend on the correct answer. Fields wrap in either direction.
- A wrong entry stays editable. Toto offers a reading cue beside the clock, without
  disabling a choice or opening an incorrect-answer modal. Existing scoring applies.
- All 108 arrival targets and off-by-one-wheel errors are unit tested; browser
  campaign tests fill records through wheel buttons and verify saved letters.

## 0.16.0 — direct reel interaction

Replace plus/minus buttons with three visible rows of a brass reel. Dragging
moves the digits with the pointer; release snaps to a row with bounded flick
momentum. Adjacent digits can be tapped, and Up/Down keys operate the focused
spinbutton. Hours, minutes and period are independent. Fields still start blank.
Pointer cancellation settles without momentum; reduced motion skips settling
animations. No asynchronous changes can submit or alter a later question.
Browser coverage includes a reel drag, keyboard reversal, all 108 records via
adjacent-digit taps, responsive bounds, and period/elapsed-time screenshots.
