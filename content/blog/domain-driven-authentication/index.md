---
title: Domain Driven Authentication with EZClientAuth
date: "2020-01-29T22:12:03.284Z"
description: "Because authentication doesn't have to be difficult"
---

<small>Contributors: [Jacob Pricket](https://www.linkedin.com/in/jacob-prickett-19a771a0/), [Shivum Bharill](https://www.linkedin.com/in/shivum-bharill/), [Waleed Johnson](https://www.linkedin.com/in/waleed-johnson-07873b63/), [Waseem Hijazi](https://www.linkedin.com/in/waseemhijazi/), [Eugene Pavlov](https://www.linkedin.com/in/epavlov29/)</small>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth) : <i>A Multi-Provider Authentication Manager for iOS</i>

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

Today, we'll lay the foundation for EZClientAuth.

EZClientAuth is a clientside authentication framework that gives your app three new superpowers:

1. <b>Synchronization:</b> Synchronize authentication state between your remote auth provider, on-device cache, and the runtime of your app

2. <b>Flexibility</b>: Switch out auth providers with almost no code changes in your application code

3. <b>Testability</b>: Straightforward mocking of authentication state for testing your application

EZClientAuth gains this flexibility by adhering to the principles of Domain Driven Design (DDD) and Protocol Oriented Programming (POP). More on this later.

The audience of this article is any developer who needs to login, logout, and check for authentication state on a client for an arbitrary backend authentication provider, be it Firebase or Auth0 etc. That's it.

Of all things an application does, authentication is one of the main hard things to get right early in a project.

Today we'll be hacking with Swift, but I promise EZClientAuth's domain driven approach to authentication will conceptually port to any langauge that provides developers with an interface construct (that means you TypeScript for React or Kotlin/Java for Android).

Here's what EZClientAuth is capable of:

<h4>EZClientAuth Capabilities</h4>

- <b>Authentication CRUD Operations</b>: Sign-in, Sign-out, determining whether or not the client is already authenticated or if a sign in is needed
- <b>Caching Authentication State</b>: Peristing the AuthSession between application launches
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
An on-device cache for persisting an AuthSession between application launches
</br>
<i class="example">Examples: Browser local storage, Keychain on iOS</i>

`AuthManager`
</br>A manager responsible for orchestrating interactions between the `RemoteAuthProvider`, `DataStore`, and the runtime of your application

`Auth`
</br>The single entrypoint into the EZClientAuth framework. It's responsible for configuring the `AuthManager` with a particular `RemoteAuthProvider`, and holding a singleton `AuthManager`.

EZClientAuth was built as part of an SDK intended for use across multiple product lines of iOS applications.

The business jury was still undecided on which authentication provider we would ultimately use. So the engineering team needed to build authentication with flexibility at its core.

<h4>Domain Driven Design</h4>

<blockquote>In Domain Driven Design, there is no "the". There is only "a". It's all about "a RemoteAuthProvider", never "the Firebase AuthProvider". Genericism endows your code with flexibility.</blockquote>

Domain Driven Design (DDD) is a term coined by Eric Evans in his 2004 book [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG). DDD strips away the accidental complexities of implementations and provides a framework for development teams to focus on the inherent complexities of their domain.

In Swift practice, DDD is realized through Protocol Oriented Programming (POP). We create a protocol (Swift's word for <i>interface</i>) that sits in front of some implementation. We then write all of our application code to only know about the interface, NEVER the implementation.

In the case of authentication, our app calls a generic sign-in on an interface, not a sign-in defined directly on an implementation like Firebase.

Codebases built atop proper DDD patterns enjoy a number of benefits:

<b>Prevent vendor lock-in:</b> If you can easily change your implementation in one centralized place, you can jump ship on a lousy provider much more easily than if you'd spread direct calls to that lousy implementation across your application.

In our case, this DDD approach endows EZClientAuth with the flexibility to plug in any `RemoteAuthProvider` implementation, be it Firebase or Keycloak etc., and any caching provider, be it Keychain or UserDefaults for iOS, with a single-line configuration change on the client.

<b>Testability:</b> Because you've written to interfaces rather than implementations, you can always create mocks that implement that interface.

<b>Shared Domain-Driven Language:</b> DDD provides your team(s) with a shared language in your domain. The PM, engineers, and architects all adopt the names provided in our interfaces. A shared vocabulary is crucial to the success of any project. People can be agreeing with each other without realizing it simply because their terms are different.

With DDD, there is no ambiguity in terminology between the technical and non-technical departments, no deficient workplace [pidgin](https://en.wikipedia.org/wiki/Pidgin) needed.

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

EZClientAuth is built with flexibility at its core, and that's why these parameters are optional. A client may want to use anything biometric login to a phone number to authenticate. EZClientAuth itself is unopinionated in this matter. The specified `RemoteAuthProvider` will handle it's particular credentials and the developer can always add more parameters, like `phoneNumber` when the usecase comes along.

Let's take a closer look at the final parameter: the completion handler, closure, or callback (whichever term you prefer):

<div class="impl">

```swift
_ completion: @escaping (AuthSession?, AuthError?) -> Void)
```

</div>

`_`: Swift let's developers choose whether or not they want to expose [named parameters](https://useyourloaf.com/blog/swift-named-parameters/) in their method signatures. The underscore `_` just means this is not a named parameter, so the consuming code need not include a parameter label.

`completion`: Our `RemoteAuthProvider` will call this completion callback once it's either authenticated successfully or encountered an error.

`@escaping`: Ignoring the `@escaping` keyword is ay-okay, it's not important here. If you're learning Swift and are curious, it has to do with when the [closure](https://docs.swift.org/swift-book/LanguageGuide/Closures.html) is called.

`(AuthSession?, AuthError?) -> Void`: This is a completion closure passed by the calling code. When the `RemoteAuthProvider` has completed its operations either successfully or with an error, it will call the completion handler closure passed to it with an `AuthSession` or nil, or an `AuthError` or nil.

Both the `AuthSession` and the `AuthError` are optional since we don't know if authentication will succeed or fail.

There are 2 scenarios for the return from `RemoteAuthProvider.signIn()`:

Scenario 1: `AuthSession` is non-nil:
User is authenticated. Here is the `AuthSession`.

Scenario 2: `AuthError` is non-nil:
Authentication with `RemoteAuthProvider` failed, therefore authentication status could not be determined and `AuthSession` is nil

If you're curious about what the `AuthError` is, you can check out this article on responsible SDK development. If not, just assume it's some error. That's fine.

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
    func readAuthSession(_ completion: @escaping (AuthSession?, AuthError?) -> Void)

    // save also overwrites, so it double duties as an update
    func save(
        authSession: AuthSession,
        _ completion: @escaping (AuthError?) -> Void)

    func delete(_ completion: @escaping (AuthError?) -> Void)
}
```

</div>

Once we get our AuthSession from `RemoteAuthProvider`, we can persist it locally by passing it the to the `DataStore`'s `save` method.

If caching is successful, `DataStore` completes with a `nil` error. If a serialization error occurs, `DataStore` completes with an `AuthError`.

Great! We can get an `AuthSession` by sending credentials to `RemoteAuthProvider.signIn` and perists the returned `AuthSession` by calling `DataStore.save`.

How do we keep these two `AuthSession`s in sync? How will our application actually use this `AuthSession` to make authenticated calls to our backend?

<h3>Solving The Problem of Synchronizing Remote, Cached, and Runtime Authentication State</h3>

Raise your hand if this has ever happened to you while implementing authentication in an app:

<i>You login. You kill the app. You re-open the app. You're presented with login page!</i>

or

<i>You login. You attempt an authenticated network call, yet still receive a 401-Unauthorized network error.</i>

At any one time, authentication state exists in 3 separate parts of memory:

- <b>1. Remote</b>: The most recent `AuthSession` returned from your remote auth provider
- <b>2. Cached</b>: The `AuthSession` stored in cache
- <b>3. Runtime</b>: The `AuthSession` object passed into your actual application's runtime to make authenticated calls

Your control over the communication of these three pieces of memory determines whether you succeed or fail in clientside authentication.

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

    // We'll explain what this is in just a second
    var authProviderConfiguration: AuthProviderConfiguration { get }
}
```

</div>

The `AuthManager` protocol is public unlike the previous protocols because this will be the consuming code's point of access to sign in.

We will only implement one `AuthManager`, yet we make it a protocol for a very important reason: in our application, we may want to replace this with a `MockAuthManager` for unit testing.

An AuthManager owns a `DataStore`, an `AuthSession`, and an `AuthProviderConfiguration`.

<div class="impl">

```swift
public class EZAuthManager: AuthManager {
    var authSession: AuthSession? { get }
    var dataStore: DataStore { get }

    // We'll explain what this is in just a second
    var authProviderConfiguration: AuthProviderConfiguration { get }
    public var remoteAuthProvider: RemoteAuthProvider = {
        return authProviderChoice.remoteAuthProvider
    }
}
```

</div>

There's one thing here we haven't seen yet: `AuthProviderConfiguration`. Let's justify its existence by talking about access controls.

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

The `case` is switched over in the `remoteAuthProvider` computed property to determine which `RemoteAuthProvider` implementation to return to the `AuthManager`, just like what we do in `AuthError` to return the appropriate error string.

Why abstract away the `RemoteAuthProvider` from the client? A major goal of the EZClientAuth framework was to abstract away the specific authentication provider behind a shared interface of common authentication methods. With this as the goal, it made little sense to expose the `RemoteAuthProvider` to the client. So we make `AuthProviderConfiguration` public instead.

On the `EZAuthManger` we saw these properties:

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

An SDK ought to be simple enough that common operations are easy, yet customizable enough that complicated things are also easy.

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
