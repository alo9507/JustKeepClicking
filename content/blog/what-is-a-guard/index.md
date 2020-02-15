---
title: Guards and Nils, A Match Made in Heaven
date: "2019-12-17T22:12:03.284Z"
description: "Guarding against the unreadable if/else pyramid"
---

What is a guard?

<blockquote>A guard is like an if statement with one additional requirement: if the condition fails, then you must return.</blockquote>

That's it. It's a way to easily check an arbitrary number of integrity preconditions without using deeply nested if/else blocks that lead to ugly indentation.

Guards turn labyrinthine, 2-dimensional and heavily-indented code:

<div class="impl">

```swift
if error != nil {
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

print("OBJECT ID IS: \(object.id)")
```

</div>

Isn't it just cleaner? No indentation. A magical land where the linear sequence of code rather than nesting communicates the validity of integrtiy preconditions.

<h3>Why Guards Pair Well With Null-Safe Languages</h3>

Null-safe languages like Swift and Kotlin force you to answer the question <i>"What happens if this object is nil?"</i> at compiletime, rather than runtime.

So instead of receiving a surprising `undefined` or `NullPointerException` at runtime, or worse, in production, you receive compiler errors requesting that you as a responsible developer consider the null case.

Swift uses the question mark charcater `?` to indicate that an object is either the object, or nil. We call this an <i>Optional</i> type.

Here's an Optional string:

<div class="impl">

```swift
// optionalString is either a String or nil
var optionalString: String?
```

</div>

The `?` indicates that `optionalString` is either a `String` or `nil`.

Under the hood, an Optional is just an enum with two types: `.some(Wrapped)` and `.none`. If it is `.some`, then the enum has an associated value `Wrapped` which is the object itself. Here it is in just four lines of code:

<div class="impl">

```swift
public enum Optional<Wrapped>: ExpressibleByNilLiteral {
    case none
    case some(Wrapped)
}
```

</div>

Swift provides a number of ways to [unwrap](https://www.hackingwithswift.com/sixty/10/2/unwrapping-optionals) Optionals. My favorite is called <i>optional binding</i>:

<div class="impl">

```swift
guard let person = optionalPerson else {
    return print("Person is nil! Must return!")
}
print(person.name)
```

</div>

Optional binding elegantly combines three operations:

- 1. Initializes a new variable called `person`
- 2. Assigns the value of `optionalPerson` to `person`
- 3. Forces a return if the `optionalPerson` is `nil`

Because we are <i>compiletime required</i> to return if the assignment of `optionalPerson` to the new variable `person` is nil, all code appearing below a guard can safely execute knowing that `person` will not be nil.

All that without a single if/else indentation!

Thank you [Chris Lattner](http://nondot.org/~sabre/) and anyone who's ever worked on one of the almost 100,000 (Jan 2020) commits to [Swift](https://github.com/apple/swift) :-)
