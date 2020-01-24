---
title: "Bitmasks for Field State"
date: "2020-01-12T22:12:03.284Z"
description: "Use Bitmasks for Rendering Form Fields"
---

<h2>IN PROGRESS</h2>

The Goal: Create an exhaustive form field renderer in ~50 lines of code to keep the touched, focused, set and valid appearance of our forms in sync with their state.

The Tool: Bitmasks

Let's go.

- What's a Bitmask?

If you can represent state as a series of yes-no questions, you can bitmask it into a single decimal number.

Let these examples illustratate this fact:

yes-no-yes-no ====> 1010 ====> The decimal of 10
no-yes-yes-no ====> 0110 ====> The decimal of 6
yes-no-no-no ====> 1000 ====> The decimal of 8

Bitmasks are well-employed in use cases raning from Role Based Access Control (RBAC) (think isAdmin-isClient-isFreelancer).

Bitmasks rock. So how do they help us with tracking field state?

- Bitmasking Field State

A Field will render as a function of four states:
Touched
Focused
Set
Valid

valid-set-focused-touched ====> 1000 ====> The decimal of 8

This means 24 (4 factorial) possible states. Daunting, however, several field state bitmasks are conceptually (though not mathematically) impossible: e.g., a focused field is by definition also touched, so a bitmask in which both those values are one should not be allowed. After subtracting the impossible states, we reach our magic number of field states we have to code for:

12

Our Mission: Encapsulate The 12 possible field state in a bitmask, then switch on the corresponding decimal in your UI code to define appearances for each state.

Our 2 central objects:
InteractionState
FieldState

The InteractionState is where we compose our exhaustively-descriptive bitmask value by taking the _union of all current state_ (touch, focused, set, valid) of the field, each piece of state represented by a position in a binary number whose length is equal to the number of different states you have.

Bitmask = Union of all current state

<div class="impl">

```swift
struct InteractionState: OptionSet {
    let rawValue: Int

      // VALID STATES
//    (touched: false, focused: false, set: false, valid: true): 8
//    (touched: true, focused: true, set: false, valid: true): 11
//    (touched: true, focused: false, set: true, valid: true): 13
//    (touched: true, focused: true, set: true, valid: true): 15

      // INVALID STATES
//    (touched: true, focused: true, set: true, valid: false): 7
//    (touched: true, focused: false, set: true, valid: false): 5

    static let touched = InteractionState(rawValue: 1 << 0) // adds 1 to the InteractionState
    static let focused = InteractionState(rawValue: 1 << 1) // adds 2 to the InteractionState
    static let set = InteractionState(rawValue: 1 << 2) // adds 4 to the InteractionState
    static let valid = InteractionState(rawValue: 1 << 3) // adds 8 to the InteractionState
}
```

</div>

<div class="impl">

```swift
class FieldState {
    static let fresh: FieldState = FieldState(touched: false, focused: false, set: false, valid: true)

    var touched: Bool
    var focused: Bool
    var set: Bool
    var valid: Bool

    init(touched: Bool, focused: Bool, set: Bool, valid: Bool) {
        self.touched = touched
        self.focused = focused
        self.set = set
        self.valid = valid
    }

    var interactionState: Int {
        var state: InteractionState = []
        if touched { state = state.union(.touched) }
        if focused { state = state.union(.focused) }
        if set { state = state.union(.set) }
        if valid { state = state.union(.valid) }

        return state.rawValue
    }
}
```

</div>

- Using FieldState in the Wild

Let's use FieldState on a UITextField.

Our designer wants to account for all 8 possible scenarios for the best UX:

untouched + valid (valid can also simply mean nothing wrong yet)

touched + valid (maybe we don't want to sketch out users who clicked in a box by making it red until they've typed)
touched + set + invalid
touched + invalid (if they submit without filling it out)

touched + set + valid (green for good)
touched + set + invalid (red for bad)

touched + focused + valid (green for good but also strong border)
touched + focused + invalid (red for bad but also strong border)

We add a property called currentState to textField (because mere `state` causes name collisions with much of iOS's UIKit)

What's reposnsible for updating field state to reflect interactions?

What know's when a field is interacted with, and should determine field validity? The Form. The form drives state changes on our field.

Then, we indulge my hipstery need to recreate React in everything I touch with a render function on our TextField. Until SwiftUI comes out, iOS sadly relies on an imperative UI paradigm, and property changes on a property don’t trigger property observers on that class.

This re-renders our component with our new state.

This is a personal call, but I feel like a bitmask of interaction state is, after more frequent use, as intelligible as an enum with a case for touchedFocusedSetInvalid. Over time, the tribal knowledge builds and you can see the colors in the numbers.

And when you're forms work like works of computational art, you're users say aloud in unison "My word, I sure love these reactive forms, I should spend my whole day on this site."

The end.

Why it Scales:
Designer-developer workflow
Covers both validity and interaction (touched/filled/focused) state in one framework. These two independent though interrelated states are often treated separately, causing confusing and highly visible bugs like a form field having a valid border color (focused) but invalid background color (invalid).

Applies to all different kinds of form fields. I use this for my TextFields, DatePickers, everything.

Is not conceptually tied to one development ecosystem. iOS doesn’t even have automatic re-renders on state changes. React-lovers turned iOS native devs wait with bated breath for SwiftUI(link) stability.
