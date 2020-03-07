---
title: EZClientAuth Part III - Integration
date: "2020-02-06T20:12:03.284Z"
tags: ["software", "ddd", "swift", "authentication"]
description: "How to integrate EZClientAuth into your apps for simple sign-in"
---

<i>This is Part III of the three part EZClientAuth series:</i></br>
<i>[EZClientAuth Part I - Core](/domain-driven-authentication)</i></br>
<i>[EZClientAuth Part II - Synchronization](/domain-driven-authentication-synchronization)</i></br>
<i>[EZClientAuth Part III - Integration](/domain-driven-auth-integration)</i></br>

<h3>Managing a Singleton AuthManager</h3>

<blockquote>The more opinionated the SDK, the less work developers have to do within the SDK's use case, but the more work developers have to do to escape the SDKs opinions.</blockquote>

An SDK ought to be simple enough that common operations are easy, yet customizable enough that complicated things are also easy.

EZClientAuth is opinionated in the way it synchronizes the `AuthSession`.

We do not want multiple `AuthManager`s instantiated. This would ruin our synchronization efforts.

The `AuthManager` checks off all four of my usual criteria for justifying a singleton. It is:

- Used in many parts of the application

- Addresses a cross-cutting concern

- Difficult to imagine a use case requiring more than one

- Should propogate any mutations to its state across the entire application immediately

We need one more building block to configure and hold reference to the `AuthManager` singleton: a struct simply named `EZAuth`.

This is the only part of our authentication domain the client needs to enjoy EZClientAuth's benefits.

<h2 style="text-decoration: underline;">EZAuth</h2>

`EZAuth` is a struct (basically an immutable and uninheritable class) that exposes a static `configure` method for configuring the static singleton `AuthManager` with a particular `AuthProviderConfiguration`.

<div class="impl">

```swift
public struct EZAuth {
    // 1: A singleton AuthManager instance
    static public let manager: AuthManager = EZAuthManager()

    static public func configure(
        for authProvider: AuthProviderConfiguration) {
        // 2 Hand off AuthProviderConfiguration to AuthManager
        manager.configure(for: authProvider)
    }

    // 3: Convenience getter for the single AuthSession
    static public var session: AuthSession? {
        return manager.authSession
    }
}
```

</div>

We use the `EZAuth.configure(for authProvider: AuthProviderConfiguration)` method to method-inject an `AuthProviderConfiguration` into the `EZAuthManager` singleton.

On the client, we can simply configure our `AuthManager` with any `AuthProviderConfiguration` that EZClientAuth provides an implementation for. The client can then rest assured that the remote, cached, and runtime `AuthSession` will all remain synchronized, thanks to the unidirectional control of `EZAuthManager`.

On application start, we can simply call `EZAuth.configure` with our chosen `AuthProviderConfiguration` and that will suffice to begin using EZClientAuth.

This is the boot method for iOS applications:

<div class="impl">

```swift
func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions) {

    EZAuth.configure(.firebase) // or Keycloak, OAuth, etc.
}
```

</div>

This is the moneyshot of EZClientAuth:

<div class="impl">

```swift
    EZAuth.configure(.firebase)
    // OR!
    EZAuth.configure(.keycloak)
    // OR!
    EZAuth.configure(.myCustomAuthService)
    // etc...
```

</div>

Because we abstract away our auth provider implementation using the `RemoteAuthProvider` protocol, a single line is all we need to swap out auth providers.

If the day comes to switch to a new authentication provider, it ought to take hours or days rather than weeks to implement.

After calling `EZAuth.configure(_:)`, the client can simply call `EZAuth.manager.signIn(_:_:_:)` and reap the benefits of Remote, Cache and Runtime authentication synchronization.

<h2>Check out the Full EZClientAuth Implementation</h2>

Now that we've implemented `signIn` together, the behaviors for `signOut`, `signUp`, and `isAuthenticated` should be a breeze. You can see the complete implementation of EZClientAuth as well as pointers for testing in the [EZClientAuth example app](https://github.com/alo9507/EZClientAuth).

Clone it, run it, write a `RemoteAuthProvider` implementation for your use case, and start authenticating without worrying about synchronization.

Thanks for reading! Please roast me in the comments!
