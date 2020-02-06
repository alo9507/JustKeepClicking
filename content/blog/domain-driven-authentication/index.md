---
title: Domain Driven Authentication with EZClientAuth
date: "2020-01-29T22:12:03.284Z"
description: "Because authentication doesn't have to be difficult"
---

<small>Special Thanks: [Jacob Pricket](https://www.linkedin.com/in/jacob-prickett-19a771a0/), [Eugene Pavlov](https://www.linkedin.com/in/epavlov29/), [Shivum Bharill](https://www.linkedin.com/in/shivum-bharill/), [Waseem Hijazi](https://www.linkedin.com/in/waseemhijazi/), [Waleed Johnson](https://www.linkedin.com/in/waleed-johnson-07873b63/)</small>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth) : <i>A Multi-Provider Authentication Manager for iOS</i>

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

Today, we'll lay the foundation for EZClientAuth.

EZClientAuth is a clientside authentication framework that gives your app three new superpowers:

1. <b>Synchronization:</b> Synchronize authentication state between your remote auth provider, on-device cache, and the runtime of your app

2. <b>Flexibility</b>: Switch out auth providers with almost no code changes in your application code

3. <b>Testability</b>: Straightforward mocking of authentication state for unit testing

EZClientAuth gains this flexibility by adhering to the principles of Domain Driven Design (DDD) and Protocol Oriented Programming (POP). More on these codebase-saving paradigms later.

Today we'll be hacking with Swift. However, I promise that the domain driven core of EZClientAuth makes it conceptually portable to any langauge with interfaces (i.e. most).

Note: This article assumes basic knowledge of interfaces, closures and null-checking. No problem if you're unfamiliar! Additional resources will be provided inline with their usage here.

Here's what EZClientAuth is capable of:

<h4>EZClientAuth Capabilities</h4>

- <b>Authentication CRUD Operations</b>: Sign-in, Sign-out, determining whether or not the client is already authenticated or if a sign in is needed
- <b>Caching Authentication State</b>: Peristing the authentication state between application launches
- <b>Synchronizing Auth State across the Entire App</b>: Because no one wants a stale cache or a stale token attached to HTTP calls
- <b>Switch Auth Providers in One Line of Code</b>: Prevents vendor lock-in

We'll build out these behaviors using five primary building blocks:

<h4>EZClientAuth Components</h4>

`AuthSession`
</br>An object encapsulating authentication state, e.g. the authentication token

`RemoteAuthProvider`
</br>
Any remote service capable of creating, deleting and refreshing AuthSessions using some form of credential
</br>
<i class="example">Examples: Firebase, AuthO, Keycloak</i>

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

<blockquote>In Domain Driven Design, there is no "the". There is only "a". It's all about "a RemoteAuthProvider", never "the Firebase AuthProvider". Genericism endows your code with flexibility.</blockquote>

Domain Driven Design (DDD) is a term coined by Eric Evans in his 2004 book [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG). DDD strips away the accidental complexities of implementations and provides a framework for development teams to focus on the inherent complexities of their domain.

In Swift practice, DDD is realized through Protocol Oriented Programming (POP). We create a protocol (Swift's word for <i>interface</i>) that sits in front of some implementation. We then write all of our application code to only know about the interface, NEVER the implementation.

In the case of authentication, our app calls a generic sign-in on an interface, not a sign-in defined directly on an implementation like Firebase.

Codebases built atop proper DDD patterns enjoy a number of benefits:

<b>Prevent vendor lock-in:</b> If you can easily change your implementations, then changing providers is less of a lift.

<b>Testability:</b> Because you've written to interfaces rather than implementations, you can always create mocks that implement that interface.

<b>Shared Domain-Driven Language:</b> DDD provides a common thread of shared vocabulary that ought to stem all the way from the codebase up into common parlance between engineers, PMs, and business.

Today, we'll focus on developing sign-in. Let’s get started by creating the nucleus of authentication: the `AuthSession`.

<hr/>

<h2 style="text-decoration: underline;">AuthSession</h2>

I want some immutable object that encapsulates my entire authentication state.

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

As you’re authentication needs grow more complex, you will want space to stretch your legs and add new properties, like a refresh token. The `AuthSession` class becomes what [Martin Fowler](https://martinfowler.com/) calls <i>"a home that can attract useful behavior"</i>

Where does the `AuthSession` come from? It comes from the `RemoteAuthProvider`.

<hr/>

<h2 style="text-decoration: underline;">RemoteAuthProvider</h2>

I want a service that takes credentials (e.g. email and password) and returns an `AuthSession` if they are valid, or a helpful error message if they are invalid or some error occurs.</span>

This is the responsibility of the `RemoteAuthProvider`.

<div class="impl">

```swift
protocol RemoteAuthProvider {}
```

</div>

Notice that `RemoteAuthProvider` is a <i>protocol</i> (Swift's version of what other languages call an <i>interface</i>). This doesn't contain implementations for these methods. It contains the the proeprties and method signatures that an object aspiring to be a `RemoteAuthProvider` must provide.

Any `RemoteAuthProvider` must have a sign-in method with these parameters:

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

`completion`: Our `RemoteAuthProvider` will call this completion callback once it has either authenticated successfully or encountered an error.

`@escaping`: Ignoring this `@escaping` keyword is ay-okay. It is not important here. If you're learning Swift and are curious, it has to do with when the closure is called.

`(AuthSession?, AuthError?) -> Void`: This is a completion closure passed by the calling code.

There are 2 scenarios for what is passed to the `(AuthSession?, AuthError?) -> Void` closure upon authentication compeletion:

<b>Scenario 1:</b> Authenticated successfully!</br>
`completion(authSession, nil)`

<b>Scenario 2:</b> Authenticated failed!</br>
`completion(nil, AuthError.*the specific error*)`

If you're curious about what the `AuthError` is, you can check out [this article](/wrap-your-errors-please) on responsible error handling. If not, just assume it's some error. That's fine.

Awesome! Let's persist the `AuthSession` between application launches using a generic `AuthDataStore`.

<h2 style="text-decoration: underline;">AuthDataStore</h2>

I want an on-device storage to persist my `AuthSession` so that users do not have to reauthenticate between each app launch.

This is the responsibility of our `AuthDataStore`.

<div class="impl">

```swift
public protocol AuthDataStore {}
```

</div>

The `AuthDataStore` is the <b><i>only</b></i> component in our authentication domain with the ability to save, read, and delete an `AuthSession`'s to or from the on-device storage.

`AuthDataStore` defines three CRUD methods:

<div class="impl">

```swift
public protocol DataStore {
    func readAuthSession(_ completion: @escaping (AuthSession?, AuthError?) -> Void)

    // save also overwrites, so it double duties as an update
    func save(
        authSession: AuthSession,
        _ completion: @escaping (AuthError?) -> Void)

    func delete(_ completion: @escaping (AuthError?) -> Void)
}
```

</div>

Once we get our `AuthSession` from `RemoteAuthProvider`, we can persist it locally by passing it the to the `AuthDataStore`'s `save` method.

If caching is successful, `AuthDataStore` completes with a `nil` error. If a serialization error occurs, `AuthDataStore` completes with an `AuthError`.

Great! We can get an `AuthSession` by sending credentials to `RemoteAuthProvider.signIn` and perists the returned `AuthSession` by calling `DataStore.save`.

How do we keep these two `AuthSession`s in sync? How will our application actually use this `AuthSession` to make authenticated calls to our backend?

<h3>Solving The Problem of Synchronizing Remote, Cached, and Runtime AuthSessions</h3>

Raise your hand if this has ever happened to you while implementing authentication in an app:

<i>You login
</br>You kill the app
</br>You re-open the app.
</br>You're still presented with login page</i>

or

<i>You login.
</br>You attempt an authenticated network call
</br>You still receive a 401-Unauthorized network error</i>

This class of error stems from failure to synchronize the AuthSession across the 3 primary areas of memory:

- <b>1. Remote</b>: The most recent `AuthSession` returned from your remote auth provider
- <b>2. Cached</b>: The `AuthSession` stored in cache
- <b>3. Runtime</b>: The `AuthSession` object used in your actual application's runtime to make authenticated calls

Your control over the communication of these three pieces of memory determines whether you succeed or fail in clientside authentication.

EZClientAuth uses unidirectional data flow to ensure synchronization of these three `AuthSession`s.

Unidirectional data flow for authentication means that authentication state MUST flow from the `RemoteAuthProvider` into the `AuthDataStore` and finally into a single `AuthSession` used by your application.

The class responsible for coordinating unidirectional authenticaion flow is called the `AuthManager`.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

I want a manager that synchronizes the `AuthSession` between the `RemoteAuthProvider` and the `AuthDataStore`. This manager should also act as a custodian of the most recent `AuthSession`.

This is the responsibility of the `AuthManager`

<div class="impl">

```swift
public protocol AuthManager {
    var authSession: AuthSession? { get }
    var dataStore: DataStore { get }

    // We'll explain what this is in just a second
    var authProviderConfiguration: AuthProviderConfiguration { get }
}
```

</div>

An `AuthManager` owns an `AuthDataStore`, an `AuthSession`, and an `AuthProviderConfiguration`.

This protocol is public because it will serve as the consuming code's entry point for sign in.

Althought we will only implement one `AuthManager`, we make it a protocol for a very important reason: in our application, we may want to replace this with a `MockAuthManager` for unit testing.

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

There's one thing here we haven't seen yet: `AuthProviderConfiguration`. Let's justify its existence as a means of greatly reducing the API surface area that EZClientAuth exposes to the client.

<h2 style="text-decoration: underline;">AuthProviderConfiguration</h2>

An `AuthProviderConfiguration` is an enum exposed to the consuming code for choosing a `RemoteAuthProvider` implementation.

<div class="impl">

```swift
public enum AuthProviderConfiguration {
    // Your remote auth provider options
    case firebase
    case auth0

    // Implementations you've written for remote auth providers
    var remoteAuthProvider: RemoteAuthProvider {
        switch self {
        case .firebase:
          return FirebaseRemoteAuthProvider()
        case .auth0:
          return Auth0RemoteAuthProvider()
        }
    }
}
```

</div>

The `case` is switched over in the `remoteAuthProvider` computed property to determine which `RemoteAuthProvider` implementation to return to the `AuthManager`, just like what we do in [`AuthError`](/wrap-your-errors-please) to return the appropriate error string.

Why abstract away the `RemoteAuthProvider` from the client? A major goal of the EZClientAuth framework is to genericize the specific authentication provider behind a shared interface of common authentication methods. With this as the goal, it made little sense to expose the `RemoteAuthProvider` to the client. So we make `AuthProviderConfiguration` public instead.

So this private `remoteAuthProvider` property on `EZAuthManger`:

<div class="impl">

```swift
var authProviderConfiguration: AuthProviderConfiguration { get }
private var remoteAuthProvider: RemoteAuthProvider = {
    return authProviderChoice.remoteAuthProvider
}
```

</div>

is just a convenience getter for the `remoteAuthProvider` stored as an associated value on the `AuthProviderConfiguration` enum.

Congrats on making it this far! It's time to sign in!

<h3>AuthManager Sign In Flow</h3>

Let's perform a fully synchronized sign-in on the `AuthManager`:

Here's the sign-in method signature:

<div class="impl">

```swift
public protocol AuthManager {
    func signIn(
        email: String?,
        password: String?,
        _ completion: @escaping AuthResponse
        )
}
```

</div>

It takes the same arguments as `RemoteAuthProvider.signIn(_:_:_:)`. That's because Step 1 for the sign-in implementation is passing the credentials to a `RemoteAuthProvider`'s sign-in method, like so:

<h4>Step 1: Call `RemoteAuthProvider.signIn` with the provided credentials.</h4>

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
                "\(error!.localizedDescription)"
                ))
    }

    //3. Check for auth session
    guard let authSession = authSession else {
        return completion(
            nil,
            failedToRetrieveAuthSession(
                "No AuthSession. No errors."))
    }
```

</div>

NOTE: If you're not familiar with the concept of a <i>guard</i>, I suggest you read this 3 minute article on [the advantages of guards over if/else statements](https://medium.com/better-programming/why-you-need-to-stop-using-else-statements-5b1fd09dea9e) then come back. If you are familiar with guards, onwards!

If no errors is returned, `AuthManager` proceeds to Step 2.

<h4>Step 2: cache the AuthSession </h4>

Attempt to cache the AuthSession returned from `RemoteAuthProvider` into the `AuthDataStore`. Throw an `AuthError` if a caching error (e.g. seialization) occurs.

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

There's no object returned here. If there no errors are returned, then we know the `AuthSession` was cached successfully.

<h4>Step 3: Set the AuthSession stored on the AuthManager</h4>

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
// the completion handler with the synchronized AuthSession
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

<blockquote>The more opinionated the SDK, the less work developers have to do within the SDK's use case, but the more work developers have to do to escape the SDKs opinions</blockquote>

An SDK ought to be simple enough that common operations are easy, yet customizable enough that complicated things are also easy.

We do not want multiple `AuthManager`s created. This would ruin our synchronization efforts.

The `AuthManager` checks off all three of my usual criteria for justifying a singleton. It is:

- Used in many parts of the application

- Difficult to imagine a use case requiring more than one

- Should propogate any mutations to its state across the entire application immediately

We need one more building block to configure and hold reference to the `AuthManager` singleton: a struct simply named `Auth`.

<h2 style="text-decoration: underline;">Auth</h2>

`Auth` is a struct (basically an immutable and uninheritable class) that exposes a static `configure` method for configuring the static singleton `AuthManager` with a particular `AuthProviderConfiguration`.

<div class="impl">

```swift
public struct Auth {
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

We use the `Auth.configure` method to <i>method-inject</i> an `AuthProviderConfiguration`, and therefore a `RemoteAuthProvider`, into the singleton `AuthManager` held on `Auth`.

In the consuming code, we can simply configure our `AuthManager` with any `RemoteAuthProvider` we've written an implementation for, and rest assured that our remote, cached, and runtime `AuthSession` will all remain synchronized, thanks to the unidrectional control of the `AuthManager`.

On application start, we can simply call `Auth.configure` with our chosen `AuthProviderConfiguration` and that will suffice to begin using EZClientAuth.

This is the boot method for iOS applications:

<div class="impl">

```swift
func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions) {

    Auth.configure(.firebase) // or Keycloak, OAuth, etc.
}
```

</div>

This is the moneyshot of EZClientAuth:

<div class="impl">

```swift
    Auth.configure(.firebase)
    // OR!
    Auth.configure(.keycloak)
    // OR!
    Auth.configure(.auth0)
    // etc...
```

</div>

Becuase we abstract away our auth provider implementation using the `RemoteAuthProvider` protocol, in a single line we can change auth providers to anything remote provider we've written an implementation for:

Thereafter, you can just call `Auth.manager.signIn` and reap the benefits of Remote, Cache and Runtime synchronization.

If the day comes to switch to a new authentication provider, it ought to take hours or days rather than weeks to implement.

Now that we've implemented sign-in together, the behaviors for sign-out and checking if the client is already authenticated is a breeze. You can see the complete implementation of EZClientAuth in the [EZClientAuth example app](https://github.com/alo9507/EZClientAuth).

Thanks for reading! Please roast me in the comments!
