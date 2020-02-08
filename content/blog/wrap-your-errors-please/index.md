---
title: Be Responsible. Wrap Your Errors.
date: "2020-01-29T22:12:03.284Z"
description: "A good error is like a flashing neon sign. Not a breadcrumb."
---

<blockquote>An error message ought to be more than just a breadcrumb. An error should be a massive, blinking neon sign informing the developer what went wrong and where to start bug hunting. As SDK developers, it's our responsibility wire that neon sign.</blockquote>

SDK developers control how deeper errors surface to the developer.

Irresponsible developers surface errors thrown by 3rd party sources generically and raw.

Responsible developers wrap them in helpful categories?

Let's wrap our errors to provide detailed error logging in Swift!

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

After inheriting, we can override `errorDescription`. Error description is a string representation of the error that occured.

<div class="impl">

```swift
public enum CustomError: Error {
    public var errorDescription: String?
}
```

</div>

A quality custom error is composed from 3 parts:

1. The verbiage of the raw error itself
2. An enum with a developer-friendly name for each kind of error
3. An error description composed of a) our own and b) the underlying error message

SDKs that only provide the raw error message itself miss out on a huge opportunity to enhance developer experience by leveraging a developer-friendly wrapper to house generic errors before percolating them up to the application.

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

`AuthError` becomes the logical home for all things that can go wrong during authentication.

`errorDescription` switches over the AuthError enum type to determine which helpful error message to return.

The `let error` we see in `.invalidCredentials(let error)` is an [associated value](https://docs.swift.org/swift-book/LanguageGuide/Enumerations.html). Associated values allow the SDK developer to determine the category of error and respond appropriately.

This could be used at the scene of the crime like so:

<div class="impl">

```swift
yourAuthenticationProvder.signIn { error in
    if error != nil {
        if error.isInvalidCredentialError {
            // we pre-cateogrize the error so the consuming code doesn't have to
            return AuthError.invalidCredentials(error)
        }
        ...
    }
}
```

</div>

We wrap the 3rd party error that we don't control into an error that we do control.

Cultivate developer empathy with custom errors! (Especially if I ever have to integrate your code!)
