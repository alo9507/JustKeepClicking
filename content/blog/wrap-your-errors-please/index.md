---
title: Be Responsible. Wrap Your Errors.
date: "2020-01-29T22:12:03.284Z"
description: "A good error is a flashing neon sign. Not a breadcrumb."
---

<blockquote>An error message should be more than just a breadcrumb. An error should be a massive, blinking neon sign informing the developer what went wrong and where to start bug hunting. As SDK developers, it's our responsibility wire that neon sign.</blockquote>

Let's imagine we're implementing a clientside authentication library as part of an SDK. Authentication is fertile ground for confusing errors.

Complicated as the domain might be, SDK developers control how those errors are surfaced. Do they surface them genericall, or with helpful categories and instructions on where to start searching for bugs?

Let's get ahead of our errors with detailed error logging in Swift.

What would you rather see in your debug console:

<div class="impl">

```bash
networkError("401")
```

</div>

or

<div class="impl">

```bash
AuthError.invalidCredentials:
"The email: example@g.com and password: examplePassword
did not match any accounts on Firebase"
```

</div>

All you need to do to create custom errors in Swift is create an enum that inherits from the native Swift `Error`.

<div class="impl">

```swift
public enum CustomError: Error {}
```

</div>

After inheriting, we can override `errorDescription`.

<div class="impl">

```swift
public enum CustomError: Error {
    public var errorDescription: String?
}
```

</div>

We compose a quality custom error from 3 parts:

1. The error itself
2. An enum of error sub-categories
3. A tailored error description for each category

SDKs that only provide the error itself miss out on a huge opportunity to enhance developer experience by leveraging a developer-friendly wrapper to house generic errors before percolating them up to the application.

<h3>Example: AuthError</h3>

I like to create a custom error type for each behavior of my applications.

Let's create one for authentication.

Let's start with one common error: `invalidCredentials`:

<div class="impl">

```swift
public enum AuthError: Error, Equatable {
    // A case in Swift is an option for an enum
    case invalidCredentials(_ error: String)

    // AuthError can switch on itself and return a String that we define
    public var errorDescription: String? {
        switch self {
        // This case has an associated type of error
        case .invalidCredentials(let error):
            return "Credentials provided are not known: \(error)"
        }
    }
}
```

</div>

`AuthError` becomes the logical home for all things that can go wrong during authentication. The `errorDescription` is a computed property that returns a String we define.

The `error` we see in `.invalidCredentials(let error)` is an [associated value](https://docs.swift.org/swift-book/LanguageGuide/Enumerations.html). It lets us pass the deeper and probably less comprehensible error that was thrown and wrap it up with the helpful name `invalidCredentials` and an `errorDescription` that we as SDK developers control before exposing it to the client in console.

Cultivate developer empathy with custom errors!
