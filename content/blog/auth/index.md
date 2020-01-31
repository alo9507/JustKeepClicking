---
title: Domain Driven Authentication with EZClientAuth
date: "2020-01-29T22:12:03.284Z"
description: "Set your development team free with this flexible multi-provider authentication framework: EZClientAuth"
---

<h2>IN PROGRESS</h2>

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth) : <i>A Multi-Provider Authentication Manager for iOS</i>

Today, we'll lay the foundation for EZClientAuth.

EZClientAuth is a clientside authentication framework that gives your app three new superpowers:

- A) Synchronize authentication state between your remote auth provider, on-device cache, and the runtime of your app

- B) Switch out auth providers with almost no code changes in your application code

- C) Straightforward mocking of authentication state for testing your application

EZClientAuth gains this flexibility by adhering to the principles of Domain Driven Design (DDD) and Protocol Oriented Programming (POP).

Here's what EZClientAuth is capable of:

<h4>EZClientAuth Capabilities</h4>

- <b>Authentication CRUD Operations</b>: Sign-in, Sign-out, determining whether or not the client is already authenticated or if a sign in is needed
- <b>Caching Authentication State</b>: Peristing the AuthSession between application launches
- <b>Synchronizing Auth State across the Entire App</b>: Because no one wants a stale cache or a stale token attached to HTTP calls
- <b>Single Line Changes for Changing Between Auth Providers</b>: This helps prevent vendor-lock

We'll build out these behaviors using five primary building blocks:

<h4>EZClientAuth Components</h4>

`AuthSession`
</br>An object encapsulating authentication state, e.g. the authentication token

`RemoteAuthProvider`
</br>
Any remote service capable of creating, deleting and refreshing AuthSessions using some form of credential
</br>
<i class="example">Examples: Firebase, AuthO, Keycloak</i>

`DataStore`
</br>
An on-device cache for persisting an AuthSession between application launches
</br>
<i class="example">Examples: Browser local storage, Keychain on iOS</i>

`AuthManager`
</br>A manager responsible for orchestrating interactions between the `RemoteAuthProvider`, `DataStore`, and the runtime of your application

`Auth`
</br>The single entrypoint into the EZClientAuth framework. It's responsible for configuring the `AuthManager` with a particular `RemoteAuthProvider`, and holding a singleton `AuthManager`.

EZClientAuth was built as part of an SDK intended for use across multiple product lines of iOS applications.

The business jury was still undecided on which authentication provider we would ultimately use. So the engineering team needed to build authentication with flexibility at its core.

Today, we'll focus on developing sign-in.

<h4>Domain Driven Design (DDD)</h4>

<blockquote>In Domain Driven Design, there is no "the". There is only "a". It's all about "a RemoteAuthProvider", never "the Firebase AuthProvider". Genericism endows your code with flexibility.</blockquote>

Domain Driven Design (DDD) is a term coined by Eric Evans in his 2004 book [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG). DDD strips away the accidental complexities of implementations and provides a framework for development teams to focus on the inherent complexities of their domain.

In Swift practice, DDD is realized through Protocol Oriented Programming (POP). We create an interface of X that has methods and properties that do Y, and then we write all of our application code to only know about X, NEVER the implementation behind X.

Codebases built atop proper DDD patterns enjoy a number of benefits:

<b>Prevent vendor lock-in:</b> If you can easily change your implementation in one centralized place, you can jump ship on a lousy provider much more easily than if you'd spread direct calls to that lousy implementation across your application.

In our case, this DDD approach endows EZClientAuth with the flexibility to plug in any `RemoteAuthProvider` implementation, be it Firebase or Keycloak etc., and any caching provider, be it Keychain or UserDefaults for iOS, with a single-line configuration change on the client.

<b>Testability:</b> Because you've written to interfaces rather than implementations, you can always create mocks that implement that interface.

<b>Shared Domain-based Language:</b> DDD provides your team(s) with a shared language in your domain. The PM, engineers, and architects all adopt the names provided in our interfaces.

<h4>Implementation: Swift</h4>

Today we'll be hacking in Swift, but I promise, even if you don't know Swift, this domain driven approach to authentication will port to any langauge that provides you with interfaces or protocols.

Much of what you'll see here was inspired by Ray Wenderlich's excellent resource, [Advanced iOS App Architecture](https://store.raywenderlich.com/products/advanced-ios-app-architecture)

Let’s get started by creating the nucleus of authentication: the `AuthSession`.

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

Why don't we just use a simple string for the token?

Because classes are flexible and strongly-typed, while primitives are not.

As you’re authentication needs grow more complex, you may want space to stretch your legs, adding new properties like refresh tokens. The `AuthSession` class becomes the scaffold on which you will build up your unique authentication needs.

Programmer legend [Martin Fowler](https://martinfowler.com/) singles out overuse of primitives as an anti-pattern, called [primtive obsession](https://martinfowler.com/articles/refactoring-adaptive-model.html#RemovePrimitiveObsession). He believes classes can provide <i>"a home that can attract useful behavior"</i>. This `AuthSession` will become a magnet for new authentication attributes.

Where does this AuthSession come from? It comes from the `RemoteAuthProvider`.

<hr/>

<h2 style="text-decoration: underline;">RemoteAuthProvider</h2>

I want a service that takes credentials (e.g. email and password) and returns an `AuthSession` if they are valid, or a helpful error message if they are invalid or some error occurs.</span>

This is the responsibility of the `RemoteAuthProvider`.

<div class="impl">

```swift
protocol RemoteAuthProvider {}
```

</div>

Notice that `RemoteAuthProvider` is a <i>protocol</i> (Swift's version of what other languages call an <i>interface</i>). This means that there are no implementations for these methods. It is only a contract that an object trying to be a `RemoteAuthProvider` must adhere to.

Any `RemoteAuthProvider` must have a sign-in method with these parameters:

<div class="impl">

```swift
protocol RemoteAuthProvider {
    func signIn(email: String?,
                password: String?,
                phoneNumber: String?,
                _ completion: @escaping AuthResponse)
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

EZClientAuth is built with flexibility at its core, and that's why these parameters are optional. A client may want to use anything biometric login to a phone number to authenticate. EZClientAuth itself is unopinionated in this matter. The specified `RemoteAuthProvider` will handle it's particular credentials.

Let's take a closer look at the final parameter: the completion handler, closure, or callback (whichever term you prefer):

<div class="impl">

```swift
_ completion: @escaping AuthResponse)
```

</div>

`_`: Swift let's developers choose whether or not they want to expose [named parameters](https://useyourloaf.com/blog/swift-named-parameters/) in their method signatures. The underscore `_` just means this is not a named parameter, so the consuming code need not include a parameter label.

`completion`: Our `RemoteAuthProvider` will call this completion callback once it's either authenticated successfully or encountered an error.

`@escaping`: Ignoring the `@escaping` keyword is ay-okay, it's not important here. If you're learning Swift and are curious, it has to do with when the [closure](https://docs.swift.org/swift-book/LanguageGuide/Closures.html) is called.

`AuthResponse`: When the `RemoteAuthProvider` has completed its operations either successfully or with an error, it will call the completion handler closure passed to it with an `AuthResponse` object. The `AuthResponse` is simply a tuple that packages up the `AuthSession` returned from `RemoteAuthProvider`, or any `AuthError`s if they occur.

Here's what an `AuthReponse` looks like:

<div class="impl">

```swift
typealias AuthResponse = (AuthSession?, AuthError?) -> Void
```

</div>

A [typealias](https://www.avanderlee.com/swift/typealias-usage-swift/) in Swift is just an alias for an existing type, in this case a void lambda that takes an `AuthSession` (which we've seen) and `AuthError` (which well see soon) as parameters.

Both the `AuthSession` and the `AuthError` are optional since we don't know if authentication will succeed.

There are 2 scenarios for the return from `RemoteAuthProvider.signIn()`:

Scenario 1: `AuthSession` is non-nil:
User is authenticated. Here is the `AuthSession`.

Scenario 2: `AuthError` is non-nil:
Authentication with `RemoteAuthProvider` failed, therefore authentication status could not be determined and `AuthSession` is nil

Let's take a closer look at `AuthError`.

<h3>Be Responsible. Wrap Your Errors.</h3>

<blockquote>An error message should be more than just a breadcrumb. An error should be a massive, blinking neon sign informing the developer what went wrong and where to start bug hunting. As SDK developers, it's our responsibility wire that neon sign.</blockquote>

Authentication is fertile ground for confusing errors. Let's get ahead of that with detailed error logging.

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
"The email: example@g.com and password: abc123!
did not match any accounts on Firebase"
```

</div>

`AuthError` gives us a developer-friendly wrapper to house generic networking and caching errors before percolating them up to the application.

We intercept these deeper errors, categorize them, and then deliver a highly localized error rather than a general obfuscated error message.

Let's start with one common error: `invalidCredentials`.

<div class="impl">

```swift
public enum AuthError: Error, Equatable {
    case invalidCredentials(_ error: String)

    public var errorDescription: String? {
        switch self {
        case .invalidCredentials(let error):
            return "Credentials provided are not known: \(error)"
        }
    }
}
```

</div>

`AuthError` is an enum of EVERYTHING that can go wrong during authentication. The associated value is a developer-controlled message followed by the wrapped error.

Awesome! Let's persist the `AuthSession` between application launches using a generic `DataStore`.

<h2 style="text-decoration: underline;">DataStore</h2>

I want an on-device storage to persist my `AuthSession` so that users don’t have to reauthenticate between each app launch.

This is the responsibility of our `DataStore`.

<div class="impl">

```swift
public protocol DataStore {}
```

</div>

The `DataStore` is the <b><i>only</b></i> component in our entire authentication domain with the ability to save, read, and delete an `AuthSession`'s to or from the on-device storage.

`DataStore` defines three CRUD methods:

<div class="impl">

```swift
public protocol DataStore {
    func readAuthSession(_ completion: @escaping AuthResponse)

    // save also overwrites, so it double duties as an update
    func save(
        authSession: AuthSession,
        _ completion: @escaping ErrorResponse)

    func delete(_ completion: @escaping ErrorResponse)
}
```

</div>

Once we get our AuthSession from `RemoteAuthProvider`, we can persist it locally by passing it the to the `DataStore`'s `save` method.

If caching is successful, `DataStore` completes with a `nil` error. If a serialization error occurs, `DataStore` completes with an `ErrorResponse`.

Great! We can get an `AuthSession` by sending credentials to `RemoteAuthProvider.signIn` and perists the returned `AuthSession` by calling `DataStore.save`.

How do we keep these two `AuthSession`s in sync? How will our application actually use this `AuthSession` to make authenticated calls to our backend?

<h3>Solving The Problem of Synchronizing Remote, Cached, and Runtime Authentication State</h3>

Raise your hand if this has ever happened to you while implementing authentication in an app:

<i>You login. You kill the app. You re-open the app. You're presented with login page!</i>

or

<i>You login. You attempt an authenticated network call, yet still receive a 401-Unauthorized network error.</i>

This class of error often stems from failures to synchronize authentication state across the three zones in which authentication state resigns:

- <b>1. Remote</b>: The most recent `AuthSession` returned from your remote auth provider
- <b>2. Cached</b>: The `AuthSession` stored in cache
- <b>3. Runtime</b>: The `AuthSession` object passed into your actual application's runtime to make authenticated calls

EZClientAuth uses unidirectional data flow to ensure synchronization of these three `AuthSession`s.

Unidirectional data flow for authentication means that authentication state MUST flow from the `RemoteAuthProvider` into the `DataStore` and finally into a single `AuthSession` used by our application.

The class responsible for coordinating unidirectional authenticaion flow is called the `AuthManager`.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

I want a manager that synchronizes the `AuthSession` between the `RemoteAuthProvider` and the `DataStore`. This manager should also act as a custodian of the most recent `AuthSession`.

This is the responsibility of the `AuthManager`

<div class="impl">

```swift
public protocol AuthManager {
    var authSession: AuthSession? { get }
    var dataStore: DataStore { get }

    var authProviderConfiguration: AuthProviderConfiguration { get }
    private var remoteAuthProvider: RemoteAuthProvider = {
        return authProviderChoice.remoteAuthProvider
    }
}
```

</div>

The `AuthManager` protocol is public unlike the previous protocols because this will be the consuming code's point of access to sign in.

An AuthManager owns a `DataStore`, an `AuthSession`, and an `AuthProviderConfiguration`.

<h2 style="text-decoration: underline;">AuthProviderConfiguration</h2>

An `AuthProviderConfiguration` is an enum exposed to the consuming code for choosing a `RemoteAuthProvider` implementation.

<div class="impl">

```swift
public enum AuthProviderConfiguration {
    case firebase
    case auth0

    var remoteAuthProvider: RemoteAuthProvider {
        switch self {
        case .firebase:
          return FirebaseRemoteAuthProvider() // Firebase implementation of RemoteAuthProvider
        case .auth0:
          return Auth0RemoteAuthProvider() // Auth0 implementation of RemoteAuthProvider
        }
    }
}
```

</div>

The `case` is switched over in the `remoteAuthProvider` computed property to determine which `RemoteAuthProvider` implementation to return to the `AuthManager`.

A major goal of the EZClientAuth framework was to abstract away the specific authentication provider behind a shared interface of common authentication methods. With this as the goal, it made little sense to expose the `RemoteAuthProvider` to the client. So we make `AuthProviderConfiguration` public instead.

On the `AuthManger` we saw these properties:

<div class="impl">

```swift
var authProviderConfiguration: AuthProviderConfiguration { get }
private var remoteAuthProvider: RemoteAuthProvider = {
    return authProviderChoice.remoteAuthProvider
}
```

</div>

We now know that this is basically a getter for the `RemoteAuthProvider` implementation we chose using the `AuthProviderConfiguration` enum.

You made it this far! It's time to sign in!

<h3>AuthManager Sign In Flow</h3>

Let's perform a fully synchronized sign in on the `AuthManager`:

<div class="impl">

```swift
public protocol AuthManager {
    func signIn(
        email: String?,
        password: String?,
        phoneNumber: String?,
        _ completion: @escaping AuthResponse
        )
}
```

</div>

Let's investigate how `AuthManager`'s sign in implementation leverages an uber-useful built-in Swift language feature to maintain synchronization: the guard.

<h3>Leveraging Null Checks to Direct Authentication Flow</h3>

If you're not familiar with the concept of a <i>guard</i>, I suggest you read this 3 minute article on [the advantages of guards over if/else statements](https://medium.com/better-programming/why-you-need-to-stop-using-else-statements-5b1fd09dea9e) then come back. If you are familiar with guards, onwards!

Sign in is a 3 step process.

<h4>Step 1:</h4>

Call `RemoteAuthProvider.signIn` with the provided credentials. You will receive an `AuthSession` if successful, or an `AuthError` if unsuccesful.

<div class="impl">

```swift
// 1: Sign in with your remote
remoteAuthProvider.signIn(
    email: email,
    password: password,
    phoneNumber: phoneNumber) { (authSession, error) in
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

<h4>Step 2:</h4>

Attempt to cache the AuthSession returned from `RemoteAuthProvider` in the `DataStore`. Throw an `AuthError` if a caching error (e.g. seialization) occurs.

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

There's nothing returned here, so if there are no errors we know the `AuthSession` was cached successfully.

<h4>Step 3:</h4>

Set the `AuthSession` stored on the `AuthManager` to the `AuthSession` returned from the `RemoteAuthProvider`. Then complete!

<div class="impl">

```swift
// 1. Set the AuthSession on the AuthManager
self!.authSession = authSession

// 2. Complete sign-in on the AuthManager by calling the completion handler with the synchronized AuthSession
completion(authSession, nil)
```

</div>

That's it for a synchronized sign-in! All together now:

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

Congratulations on getting this far! We're one step away from integrating this into an application.

<h3>Protecting the AuthManager</h3>

<blockquote>The more opinionated the SDK, the less work developers have to do within the SDK's use case, but the more work developers have to do to escape the SDKs opinions</blockquote>

We do not want multiple `AuthManager`s created. This would ruin our synchronization efforts.

The `AuthManager` checks off all three of my usual criteria for justifying a singleton. It is:

- Used in many parts of the application

- Conceptually difficult to imagine a need for more than one

- Should propogate any mutations to itself across the application immediately

We need one more building block to manage the `AuthManager` singleton: simply named `Auth`.

<h2 style="text-decoration: underline;">Auth</h2>

`Auth` is a struct (basically an immutable and uninheritable class) that exposes a `configure` method for configuring the `AuthManager` with an `AuthProviderConfiguration`.

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

In the consuming code we can simply configure our `AuthManager` with any `RemoteAuthProvider` we've written an implementation for, and rest assured that our remote, cached, and runtime `AuthSession` will all remain synchronized, thanks to the unidrectional control of the `AuthManager`.

On application boot, we can simply call `Auth.configure` with our chosen `AuthProviderConfiguration` and that will suffice to begin using EZClientAuth.

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

This is the moneyshot of EZClientAuth.

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

Becuase we abstract away our auth provider implementation using the `RemoteAuthProvider` protocol, in a single line we can change auth providers to anything provider written an implementation for:

Thereafter, you can just call `Auth.manager.signIn` reap the benefits of Remote, Cache and Runtime synchronization.

If the day comes to switch to a new authentication provider, it ought to take take days rather than weeks to implement.

Now that we've implemented sign-in together, sign-out and isAuthenticated will be a breeze. You can see the complete implementations in the [example app](https://github.com/alo9507/EZClientAuth).

Thanks for reading! Please roast me in the comments!
