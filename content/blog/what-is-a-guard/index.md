---
title: Guards and Nils, A Match Made in Heaven
date: "2020-01-17T22:12:03.284Z"
description: "Get your integrity checks out of the way so you can code confidently and prevent massive if-else indentations"
---

<h2>IN PROGRESS</h2>

What is a guard?

<blockquote>A guard is an if statement with one additional requirement: if the condition fails, then control-flow must end with a `return`</blockquote>

That's it. It's a way to check integrity preconditions without deeply nested if/else blocks leading to massive indentation.

Guards turn this:

<div class="impl">

```swift
if error == nil else{
    print("An error occured \(error)")
    return
} else {
    if object == nil {
    print("No object returned!")
    return
    } else {
        // perform on object
    }
}
```

</div>

into this:

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

// you brilliant code goes here
```

</div>

Isn't it just cleaner? No indentation, a land where sequence of code rather than nesting and indentation determines safety of the integrtiy precondition.

<h3>Why Guards Pair Well With Null-Safe Languages</h3>

Swift uses the question mark charcater `?` to indicate that an object is either the object, or nil. It is an <i>optional</i> type.

An Optional is just an enum with two types: `.some` and `.none`

Null-safe languages like Kotlin and Swift force you to answer the question <i>"What happens if this object is nil?"</i> at compile time, not runtime. So rather than receiving a surprising `undefined` or `NullPointerException` after building, or worse, in production, you receive compiler errors requesting that you as a developer consider the null case.

We'll use Swift's built-in `guard` statement to direct authentication flow around null-checks.

In other words, a guard statement allows you to check <i>integrity preconditions</i> before the objects under check are consumed later in your code. If the condition fails, you return from that method.

Here's an idiomatic null-checking flow that uses guards:

Because we return if the condition is false, all code appearing below a guard can safely execute knowing with certainty that the integrity precondition is true.

A major advantage of this is that we don't end up separating our else blocks in the case that there are several integrity checks that rely on each other.

Thank you Chris Lattner :-)
