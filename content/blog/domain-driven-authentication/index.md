---
title: Domain Driven Authentication with EZClientAuth
date: "2020-02-06T22:12:03.284Z"
description: "Because clientside authentication shouldn't be difficult"
---

<small>Special Thanks: [Jacob Pricket](https://www.linkedin.com/in/jacob-prickett-19a771a0/), [Eugene Pavlov](https://www.linkedin.com/in/epavlov29/), [Shivum Bharill](https://www.linkedin.com/in/shivum-bharill/), [Waseem Hijazi](https://www.linkedin.com/in/waseemhijazi/), [Waleed Johnson](https://www.linkedin.com/in/waleed-johnson-07873b63/)</small>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth) : <i>A Multi-Provider Authentication Manager for iOS</i>

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

Today, we'll lay the foundation for EZClientAuth.

EZClientAuth is a clientside authentication manager that gives your app three new superpowers:

1. <b>Synchronization:</b> Synchronize authentication state between your remote auth provider, on-device cache, and the runtime of your app

2. <b>Flexibility</b>: Easily swap out auth providers in one line of code

3. <b>Testability</b>: Straightforward mocking of authentication state for unit testing

EZClientAuth gains this flexibility by adhering to the principles of Domain Driven Design (DDD) and Protocol Oriented Programming (POP). More on these codebase-saving paradigms later.

Today we'll be hacking with Swift. However, I promise that the domain driven core of EZClientAuth makes it conceptually portable to any langauge with interfaces (i.e. most).

Here's what EZClientAuth is capable of:

<h4>EZClientAuth Capabilities</h4>

- <b>Authentication CRUD Operations</b>: Sign-in, Sign-out, determining current authentication state
- <b>Peristing authentication state between application launches</b>
- <b>Synchronizing authentication state across the entire application</b>: Because no one wants a stale cache or a stale token attached to HTTP calls
- <b>Switch Auth Providers in One Line of Code</b>: Prevents vendor lock-in

We'll build out these behaviors using five primary building blocks:

<h4>EZClientAuth Components</h4>

`AuthSession`
</br>An object encapsulating authentication state, e.g. the authentication token

`RemoteAuthProvider`
</br>
Any remote service capable of creating, deleting and refreshing AuthSessions using some form of credential
</br>
<i class="example">Examples: Firebase, Keycloak, a Custom Auth Service</i>

`AuthDataStore`
</br>
An on-device cache for persisting an `AuthSession` between application launches
</br>
<i class="example">Examples: Browser local storage, Keychain on iOS</i>

`AuthManager`
</br>A manager responsible for orchestrating interactions between the `RemoteAuthProvider`, `AuthDataStore`, and the runtime of your application

`Auth`
</br>The consuming code's sole entrypoint to use EZClientAuth

<h4>Domain Driven Design</h4>

<blockquote>The goal of domain-driven design is to create better software by focusing on a model of the domain rather than the technology. - Eric Evans</blockquote>

Domain Driven Design (DDD) is a term coined by Eric Evans in his 2004 book [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG). DDD strips away the accidental complexities of implementations and provides a modelling framework for development teams to focus on the inherent complexities of their domain.

In Domain Driven Design, we name by <i>function</i>, not implementation. This means there is no "the". There is only "a". Our code calls "a RemoteAuthProvider", not "the FirebaseAuthProvider". Genericism endows your code with flexibility.

In Swift practice, DDD is realized through Protocol Oriented Programming (POP). We create a protocol (Swift's word for <i>interface</i>) that sits in front of some implementation. We then write all of our client code to only know about that intention-revealing interface, NEVER the implementation behind it.

In the case of authentication, our client calls a generic sign-in on an interface, not a sign-in defined directly on an implementation like Firebase.

Codebases built atop proper DDD patterns enjoy a number of benefits:

<b>Prevent vendor lock-in:</b> If you can easily change your implementations, then changing providers is less of a lift.

<b>Testability:</b> Because you've written to interfaces rather than implementations, you can always create mocks that implement that interface.

<b>Shared Domain-Driven Language:</b> DDD provides a common thread of shared vocabulary that ought to stem all the way from the codebase up into common parlance between engineers, PMs, and business.

Today, we'll focus on developing sign-in. Let’s get started by creating the nucleus of authentication: the `AuthSession`.

<hr/>

<h2 style="text-decoration: underline;">AuthSession</h2>

<i>I want some immutable object that encapsulates my entire authentication state.</i>

This object is called the `AuthSession`.

<div class="impl">

```swift
struct AuthSession: Codable {

    let token: String

    init(token: String) {
        self.token = token
    }
}
```

</div>

As you’re authentication needs grow more complex, you will want space to stretch your legs and add new properties, like a refresh token. The `AuthSession` class becomes what [Martin Fowler](https://martinfowler.com/) describes as <i>"a home that can attract useful behavior"</i>. A primitive String token would provide no room for future expansion.

Where does the `AuthSession` come from? It comes from the `RemoteAuthProvider`.

<hr/>

<h2 style="text-decoration: underline;">RemoteAuthProvider</h2>

<i>I want a service that takes credentials (e.g. email and password) and returns an `AuthSession` if they are valid, or a helpful error message if the credentials are invalid or some error occurs.</i>

This is the responsibility of the `RemoteAuthProvider`.

<div class="impl">

```swift
protocol RemoteAuthProvider {}
```

</div>

Notice that `RemoteAuthProvider` is a protocol, i.e. an interface. `RemoteAuthProvider` describes the the proeprties and method signatures that an object aspiring to be a `RemoteAuthProvider` must provide. It does not implement these methods itself.

For example, any `RemoteAuthProvider` must have a sign-in method accepting these parameters:

<div class="impl">

```swift
protocol RemoteAuthProvider {
    func signIn(email: String?,
                password: String?,
                _ completion: @escaping (AuthSession?, AuthError?) -> Void)
}
```

</div>

Let's have a closer look at this method signature, as it will appear as an idiom throughout EZClientAuth.

First off, all the parameters are [Optionals](https://learnappmaking.com/swift-optionals-how-to/). This means they're either the specified type, or nil.

<div class="impl">

```swift
// The '?' makes this an Optional parameter
// It's either a String or nil
email: String?
```

</div>

EZClientAuth is built with flexibility at its core, and that's why these parameters are optional. Business may want to use anything from biometric login to a phone number for authentication. EZClientAuth is unopinionated in the matter of credentials. More optional parameters can always be added if the use case arises.

Let's take a closer look at the final parameter: the completion closure.

<div class="impl">

```swift
_ completion: @escaping (AuthSession?, AuthError?) -> Void)
```

</div>

`_`: Swift let's developers choose whether or not they want to expose [named parameters](https://useyourloaf.com/blog/swift-named-parameters/) in their method signatures. The underscore `_` just means this is not a named parameter, so the consuming code need not include a parameter label.

`completion`: The name of the closure parameter used in this method body

`@escaping`: Ignoring this `@escaping` keyword is ay-okay. It is not important here.

`(AuthSession?, AuthError?) -> Void`: This is the completion closure (aka lambda or anonymous function) passed by the calling code. Our `RemoteAuthProvider` will call this completion callback once it has either authenticated successfully or encountered an error.

There are 2 scenarios for what is passed to the `(AuthSession?, AuthError?) -> Void` closure upon authentication compeletion:

<div class="example"><b>Scenario 1:</b> Authenticated successfully!</div>

`completion(authSession, nil)`</br>
We call the completion with the returned `AuthSession` and nil errors

<div class="example"><b>Scenario 2:</b> Authenticated failed!</div>

`completion(nil, AuthError.*the specific error*)`</br>
We call the completion with a nil `AuthSession` and the particular `AuthError` that occurred.</br>

If you're curious about what the `AuthError` is, you can check out [this article on responsible error handling](/wrap-your-errors-please).

Awesome! Let's persist the `AuthSession` between application launches using a generic `AuthDataStore`.

<h2 style="text-decoration: underline;">AuthDataStore</h2>

<i>I want an on-device storage to persist my `AuthSession` so that users do not have to re-authenticate between each app launch.</i>

This is the responsibility of our `AuthDataStore`.

<div class="impl">

```swift
public protocol AuthDataStore {}
```

</div>

The `AuthDataStore` is the <b><i>only</b></i> component in our authentication domain with the ability to save, read, and delete the `AuthSession` to or from the on-device storage.

`AuthDataStore` defines three CRUD methods to interact with the cache:

<div class="impl">

```swift
public protocol AuthDataStore {
    func readAuthSession(_ completion: @escaping (AuthSession?, AuthError?) -> Void)

    // save also overwrites, so it double duties as an update
    func save(
        authSession: AuthSession,
        _ completion: @escaping (AuthError?) -> Void)

    func delete(_ completion: @escaping (AuthError?) -> Void)
}
```

</div>

Once we get our `AuthSession` from `RemoteAuthProvider`, we can persist it locally by passing it to `AuthDataStore.save(_:_:)`.

If caching is successful, `AuthDataStore` completes with a `nil` error.

If a serialization error occurs, `AuthDataStore` completes with an `AuthError`.

Great! We can get an `AuthSession` by sending credentials to `RemoteAuthProvider.signIn(_:_:_:)` and perists the returned `AuthSession` by passing it to `AuthDataStore.save(_:_:)`.

How do we keep these two `AuthSession`s in sync? How will the client actually use this `AuthSession` at runtime to make authenticated calls to our backend?

<h3>Solving The Problem of Synchronizing Remote, Cached, and Runtime AuthSessions</h3>

Raise your hand if this has ever happened to you while implementing authentication in an app:

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

In its remote form, the AuthSession is stored in some serialized form a remote server.</br>
In its cached form, the AuthSession is serialized JSON.</br>
In its runtime form, the AuthSession is a Swift struct.

But as far as our domain is concerned, <b>these are identical `AuthSession`s!</b>

They are <i>domain-identical</i> but memory-distinct.

Your control over the synchonrized CRUD of these three `AuthSession`s will determine whether you succeed or fail in clientside authentication.

EZClientAuth uses unidirectional data flow to ensure synchronization of these three `AuthSession`s.

Unidirectional data flow for authentication means that authentication state MUST flow from the `RemoteAuthProvider` into the `AuthDataStore` and finally into the single `AuthSession` used by your application.

The class responsible for coordinating unidirectional authenticaion flow is called the `AuthManager`.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

<i>I want a manager that synchronizes the `AuthSession` between the `RemoteAuthProvider` and the `AuthDataStore`. This manager should also act as a custodian of the most recent `AuthSession`.</i>

This is the responsibility of the `AuthManager`

<div class="impl">

```swift
public protocol AuthManager {
    var authSession: AuthSession? { get }
    var authDataStore: AuthDataStore { get }

    // We'll explain what this is in just a second
    var authProviderConfiguration: AuthProviderConfiguration { get }
}
```

</div>

An `AuthManager` owns an `AuthDataStore`, an `AuthSession`, and an `AuthProviderConfiguration` (more on this configuration in a moment).

This protocol is public because it will serve as the consuming code's entry point for sign in.

Although we will only implement one `AuthManager`, we make it a protocol for a very important reason: in our application, we may want to replace this with a `MockAuthManager` for unit testing.

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

Let's perform a fully synchronized sign-in on the `AuthManager`.

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

You will receive an `AuthSession` if successful, or an `AuthError` if unsuccesful.

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

If you're not familiar with the concept of a <i>guard</i>, I suggest you give this article on [guards and null-safe langauges](/what-is-a-guard) a quick read and then come back. If you are familiar with guards, onwards!

If no errors is returned, `AuthManager` proceeds to Step 2.

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

If no errors are returned, then we know the `AuthSession` was cached successfully.

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
    email: email, password:
    password, phoneNumber: phoneNumber) { (authSession, error) in
    //2. Check for errors
    guard error == nil else {
        return completion(
            nil,
            .failedToSignInWithRemote(error!.localizedDescription))
    }

    //3. Check for auth session
    guard let authSession = authSession else {
        return completion(
            nil,
            failedToRetrieveAuthSession(
                "No AuthSession returned from RemoteAuthProvider.
                However, no errors were returned either."
                ))
    }

    // 4. Cache the AuthSession
    self.dataStore.save(authSession: authSession, { [weak self] (error) in

        // 5. Check for caching errors
        guard error == nil else {
            return completion(
                nil,
                .failedToPersistUserSessionData(error!.localizedDescription))
        }

        // 6. Set the AuthSession on the AuthManager
        self!.authSession = authSession

        // 7. Complete sign-in on the AuthManager by calling the
        // completion handler with the synchronized AuthSession
        completion(authSession, nil)
    })
```

</div>

We're ONE STEP away from securely integrating EZClientAuth into an application.

All that remains is a strategy for A) protecting the internals of EZClientAuth from being directly accessed by the client, and B) ensuring that only a single instance of `AuthManager` exists in the application.

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
    static public let manager: AuthManager = AuthManager()

    static public func configure(
        for authProviderConfiguration: AuthProviderConfiguration) {
        // 2 Hand off AuthProviderConfiguration to manager
        manager.configure(for: authProviderConfiguration)
    }

    // 3: Convenience getter for the authSession
    static public var session: AuthSession? {
        return manager.authSession
    }
}
```

</div>

We use the `EZAuth.configure(for authProviderConfiguration: AuthProviderConfiguration)` method to method-inject an `AuthProviderConfiguration`.

On the client, we can simply configure our `AuthManager` with any `AuthProviderConfiguration` that EZClientAuth provides an implementation for. The client can then rest assured that the remote, cached, and runtime `AuthSession` will all remain synchronized, thanks to the unidrectional control of the `AuthManager`.

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

Becuase we abstract away our auth provider implementation using the `RemoteAuthProvider` protocol, a single line is all we need to swap out auth providers.

If the day comes to switch to a new authentication provider, it ought to take hours or days rather than weeks to implement.

After calling `EZAuth.configure(_:)`, the client can simply call `EZAuth.manager.signIn(_:_:_:)` and reap the benefits of Remote, Cache and Runtime authentication synchronization.

<h2>Check out the Full EZClientAuth Implementation</h2>

Now that we've implemented sign-in together, the behaviors for sign-out and checking if the client is already authenticated should be a breeze. You can see the complete implementation of EZClientAuth in the [EZClientAuth example app](https://github.com/alo9507/EZClientAuth).

Thanks for reading! Please roast me in the comments!
