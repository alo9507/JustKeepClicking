---
title: Guards and Nils, A Match Made in Heaven
date: "2019-12-17T22:12:03.284Z"
description: "Get your integrity checks out of the way so you can code confidently and prevent massive if-else indentations"
---

<h2>IN PROGRESS</h2>

What is a guard?

<blockquote>A guard is like an if statement with one additional requirement: if the condition fails, then control-flow must end with a `return`</blockquote>

That's it. It's a way to easily check an arbitrary number of integrity preconditions without using deeply nested if/else blocks that lead to ugly indentation.

Guards turn labyrinthine, 2-dimensional and heavily-indented code:

<div class="impl">

```swift
if error == nil else{
    return
} else {
    if object == nil {
        return
    } else {
        if object.id == "" {
            return
        } else {
            print("OBJECT ID IS: \(object.id)")
        }
    }
}
```

</div>

into concise, 1-dimensional and sequential code:

<div class="impl">

```swift
guard error == nil else {
    return
}

// ERROR-FREE ZONE!

guard object != nil else {
    return
}

// OBJECT EXISTS ZONE!

guard object.id != "" else {
    return
}

// you brilliant code goes here
```

</div>

Isn't it just cleaner? No indentation, a land where sequence of code rather than nesting and indentation determines safety of the integrtiy precondition.

Furthermore, the else block isn't pushed ever further from it's corresponding if block.

Swift comes with prebuilt and compile-time checked guard clauses, but guard clauses can still be implicitly implemented in non-nullsafe languages like JavaScript.

<h3>Why Guards Pair Well With Null-Safe Languages</h3>

Null-safe languages like Swift and Kotlin force you to answer the question <i>"What happens if this object is nil?"</i> at compile time, rather than runtime. So rather than receiving a surprising `undefined` or `NullPointerException` after building, or worse, in production, you receive compiler errors requesting that you as a developer consider the null case.

Swift uses the question mark charcater `?` to indicate that an object is either the object, or nil. It is an <i>optional</i> type.

An Optional is just an enum with two types: `.some` and `.none`. If it is `.some`, then the enum has an associated which is the object itself.

<blockquote>Guarding on nulls early in control flow frees you from wondering if an object is present.</blockquote>

Because we return if the condition is false, all code appearing below a guard can safely execute knowing with certainty that the integrity precondition is true and that the object will not be nil.

Thank you [Chris Lattner](http://nondot.org/~sabre/) and anyone who's ever worked on one of the almost 100,000 (Jan 2020) commits to [Swift](https://github.com/apple/swift) :-)
