---
title: EZClientAuth Part II - Synchronization
date: "2020-02-06T21:12:03.284Z"
tags: ["software"]
description: "Synchronize authentication state across your app"
---

<i>This is Part II of the three part EZClientAuth series:</i></br>
<i>[EZClientAuth Part I - Core](/domain-driven-authentication)</i></br>
<i>[EZClientAuth Part II - Synchronization](/domain-driven-authentication-synchronization)</i></br>
<i>[EZClientAuth Part III - Integration](/domain-driven-auth-integration)</i></br>

<h3>Solving The Problem of Synchronizing Remote, Cached, and Runtime AuthSessions</h3>

Raise your hand if this has ever happened to you while implementing authentication on a client:

<i>You login
</br>You kill the app
</br>You re-open the app
</br>You're still presented with login page</i>

or

<i>You login
</br>You attempt an authenticated network call
</br>You still receive a 401-Unauthorized network error</i>

This class of error stems from failure to synchronize the AuthSession across the 3 areas of memory where `AuthSession` lives:

- <b>1. Remote</b>: The most recent `AuthSession` returned from your remote auth provider
- <b>2. Cached</b>: The `AuthSession` stored in cache
- <b>3. Runtime</b>: The `AuthSession` object used in your application's runtime to make authenticated calls

<b>In its remote form</b>, the AuthSession is stored in some serialized form on a remote server.</br>
<b>In its cached form</b>, the AuthSession is serialized JSON.</br>
<b>In its runtime form</b>, the AuthSession is a Swift struct.

But as far as our domain is concerned, <b>these are identical `AuthSession`s!</b>

They are <i>domain-identical</i> but memory-distinct.

Your control over the synchronized CRUD of these three `AuthSession`s will determine whether you succeed or fail in clientside authentication.

EZClientAuth uses unidirectional data flow to ensure synchronization of these three `AuthSession`s.

Unidirectional data flow for authentication means that authentication state MUST flow from the `RemoteAuthProvider` into the `AuthDataStore` and finally into the single `AuthSession` used by your application.

The class responsible for coordinating unidirectional authentication flow is called the `AuthManager`.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

<i>I want a manager that synchronizes the `AuthSession` between the `RemoteAuthProvider` and the `AuthDataStore`. This manager should also act as a custodian of the most recent `AuthSession`.</i>

This is the responsibility of the `AuthManager`:

<div class="impl">

```swift
public protocol AuthManager {
    var authSession: AuthSession? { get }
    var authDataStore: AuthDataStore { get }

    // We'll explain what this is in just a second 😉
    var authProviderConfiguration: AuthProviderConfiguration { get }
}
```

</div>

An `AuthManager` has an `AuthSession`, an `AuthDataStore`, and an `AuthProviderConfiguration` (more on this in a moment).

Although we will only implement one `AuthManager`, we make it a protocol for a very important reason: in our application, we may want to replace this with a `MockAuthManager` for unit testing and manipulating authentication state.

Here's what our `AuthManager` implementation looks like. Let's call it `EZAuthManager`:

<div class="impl">

```swift
public class EZAuthManager: AuthManager {
    public var authSession: AuthSession? { get }
    private var authDataStore: AuthDataStore { get }

    // We'll explain what this is in just a second
    private var authProviderConfiguration: AuthProviderConfiguration { get }
    private var remoteAuthProvider: RemoteAuthProvider = {
        return authProviderConfiguration.remoteAuthProvider
    }
}
```

</div>

There's one thing here we haven't seen yet: `AuthProviderConfiguration`. Let's justify its existence as a simple enum that greatly reduces the API surface area that EZClientAuth exposes to the client.

<h2 style="text-decoration: underline;">AuthProviderConfiguration</h2>

<i>I want some simple enum that allows me to hide the remote auth provider implementation from the client</i>

Why abstract away the `RemoteAuthProvider` from the client? A major goal of the EZClientAuth framework is to genericize the specific authentication provider behind a shared interface of common authentication methods.

With this as the goal, it makes little sense to expose the `RemoteAuthProvider` to the client.

So we make `AuthProviderConfiguration` public instead:

<div class="impl">

```swift
public enum AuthProviderConfiguration {
    // Your remote auth provider options
    case firebase
    case keycloak

    // Implementations you've written for remote auth providers
    var remoteAuthProvider: RemoteAuthProvider {
        switch self {
        case .firebase:
          return FirebaseRemoteAuthProvider()
        case .keycloak:
          return KeycloakRemoteAuthProvider()
        }
    }
}
```

</div>

The `AuthProviderConfiguration` is an enum exposed to the client for choosing a `RemoteAuthProvider` implementation.

The `case` is switched over in the `remoteAuthProvider` computed property to determine which `RemoteAuthProvider` implementation to return to the `AuthManager`.

This private `remoteAuthProvider` property on `EZAuthManger`:

<div class="impl">

```swift
var authProviderConfiguration: AuthProviderConfiguration { get }
private var remoteAuthProvider: RemoteAuthProvider = {
    return authProviderChoice.remoteAuthProvider
}
```

</div>

is just a convenience getter for the `remoteAuthProvider` stored as an associated value on the chosen `AuthProviderConfiguration` enum.

Congrats on making it this far! It's finally time to sign in!

<h3>AuthManager Sign In Flow</h3>

Let's perform a fully synchronized sign-in on the `AuthManager` in 3 steps.

Here's the sign-in method signature:

<div class="impl">

```swift
public protocol AuthManager {
    func signIn(
        email: String?,
        password: String?,
        _ completion: @escaping (AuthSession?, AuthError?) -> Void
        )
}
```

</div>

It takes the same arguments as `RemoteAuthProvider.signIn(_:_:_:)`. That's because Step 1 to sign in is passing these credentials to a `RemoteAuthProvider`'s sign-in method, like so:

<h4>Step 1: Call RemoteAuthProvider.signIn with the provided credentials.</h4>

You will receive an `AuthSession` if successful, or an `AuthError` if unsuccessful.

<div class="impl">

```swift
// 1: Sign in with your remote
remoteAuthProvider.signIn(
    email: email,
    password: password
    ) { (authSession, error) in
    //2. Check for errors
    guard error == nil else {
        return completion(
            nil,
            .failedToSignInWithRemote(
                "\(error!.localizedDescription)"))
    }

    //3. Check for auth session
    guard let authSession = authSession else {
        return completion(
            nil,
            failedToRetrieveAuthSession(
                "No AuthSession, but also no errors?"))
    }
```

</div>

If you're not familiar with the concept of a <i>guard</i>, I suggest you give this article on [guards and null-safe languages](/what-is-a-guard) a quick read and then come back. If you are familiar with guards, onwards!

If remote sign-in completes error-free, `AuthManager` proceeds to Step 2.

<h4>Step 2: cache the AuthSession </h4>

Attempt to cache the AuthSession returned from `RemoteAuthProvider` into the `AuthDataStore`.

<div class="impl">

```swift
// 1. Cache the AuthSession
self.dataStore.save(authSession: authSession, { (error) in

    // 2. Check for caching errors
    guard error == nil else {
        return completion(
            nil,
            .failedToPersistUserSessionData(
                error!.localizedDescription
                ))
    }
})
```

</div>

If save completes error-free, then we know the `AuthSession` was cached successfully. `AuthManager` moves on to Step 3.

<h4>Step 3: Set or update the AuthSession stored on the AuthManager</h4>

Set the `AuthSession` stored on the `AuthManager` to the `AuthSession` returned from the `RemoteAuthProvider`.

<div class="impl">

```swift
// Set the AuthSession on the AuthManager
self!.authSession = authSession
```

</div>

Then complete!

<div class="impl">

```swift
// Complete sign-in on the AuthManager by calling
// the completion handler with the freshly synchronized AuthSession
completion(authSession, nil)
```

</div>

That's it for synchronizing sign-in! All together now:

<div class="impl">

```swift
// 1: Sign in with your remote
remoteAuthProvider.signIn(
    email: email,
    password: password,
    phoneNumber: phoneNumber) { [weak self] (authSession, error) in

    //2. Check for errors
    guard error == nil else {
        return completion(
            nil,
            AuthError.failedToSignInWithRemote(
                "Email: \(email ?? 'no email'),
                Password: \(password ?? 'no password')
                \(error!.localizedDescription)"))
    }

    //3. Check for AuthSession
    guard let authSession = authSession else {
        return completion(
            nil,
            AuthError
            .failedToRetrieveAuthSession("No AuthSession, but also no errors?"))
    }

    // 4. Cache the AuthSession
    self?.authDataStore.save(authSession: authSession, { (error) in

        // 5. Check for caching errors
        guard error == nil else {
            return completion(nil,
            AuthError.failedToPersistAuthSessionData(error!.localizedDescription))
        }

        // 6. Set the AuthSession on the AuthManager
        self!.authSession = authSession

        // 7. Complete sign-in on the AuthManager by calling the
        // completion handler with the synchronized AuthSession
        completion(authSession, nil)
    })
}
```

</div>

We're ONE STEP away from securely integrating EZClientAuth into an application.

All that remains is a strategy for:

A) protecting the internals of EZClientAuth from being directly accessed by the client

and

B) ensuring that only a single instance of `AuthManager` exists in the application.

That's the topic of the final step - [EZClientAuth Part III - Integration](/domain-driven-auth-integration).
