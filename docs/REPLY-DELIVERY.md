# Reply delivery — 0.13.0

Authored forest and harbor flights keep three numbered parcel tags visible at the desk. Tags change from awaiting acceptance to awaiting reply, returned, and entered in the ledger. The same number appears on the outgoing seal and returned envelope. Returned envelopes show the actual recipient portrait, the original sender, and the parcel name. Only the current letter is initially open, and opening another closes the previous letter without changing the active clock question. Each receipt step opens its corresponding letter before recording arrival time. Successful recording shows the original sender acknowledging the reply. The saved journal also shows both correspondents and the parcel.

Uses existing character portraits and parchment UI. No additional generated art is necessary for identity matching. Motion respects reduced-motion preferences. Original clock difficulty and save data remain intact.

Validation includes all authored portrait identities, one-at-a-time envelope controls, correct letter selection on every receipt, ledger status, responsive layouts, full chapter replay, saves, audio and offline checks.
