---
title: Be Responsible. Wrap Your Errors.
date: "2020-01-29T22:12:03.284Z"
description: "A good error is a flashing neon sign. Not a breadcrumb."
---

<h3>Be Responsible. Wrap Your Errors.</h3>

<blockquote>An error message should be more than just a breadcrumb. An error should be a massive, blinking neon sign informing the developer what went wrong and where to start bug hunting. As SDK developers, it's our responsibility wire that neon sign.</blockquote>

Let's imagine we're implementing a clientside authentication library as part of an SDK. Authentication is fertile ground for confusing errors, so let's get ahead of that with detailed error logging.

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

`AuthError` gives us a developer-friendly wrapper to house generic networking and caching errors before percolating them up to the application.

We intercept these deeper errors, categorize them, and then deliver a highly localized error rather than a general, obfuscated error message.

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

`AuthError` is an enum of EVERYTHING that can go wrong during authentication. The `errorDescription` is a computed property that returns a String we define. The `error` we see in `.invalidCredentials(let error)` is an [associated value](https://docs.swift.org/swift-book/LanguageGuide/Enumerations.html). It lets us pass the deeper and probably less comprehensible error that was thrown and wrap it up with the helpful name `invalidCredentials` and an `errorDescription` that we as SDK developers control before exposing it to the client in console.
