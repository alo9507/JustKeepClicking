---
title: Domain Driven Authentication with EZClientAuth
date: "2020-01-17T22:12:03.284Z"
description: "Set your development team free with this flexible multi-provider authentication framework: EZClientAuth"
---

<h2>IN PROGRESS</h2>

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth) : <i>A Multi-Provider Authentication Manager for iOS</i>

Today, we'll lay the foundation for EZClientAuth, a clientside authentication framework allowing your team to reliably synchronize authentication state between remote, cache and runtime, as well as easily swap out authentication providers. EZClientAuth gains this flexibility by adhering to the principles of Domain Driven Design (DDD) and Protocol Oriented Programming (POP).

Long story short, we will write our consuming code to and authentication interfaces (aka protocols in Swift), not implementations.

Here's what our framework will be capable of:

<h4>EZClientAuth Capabilities</h4>

- <b>Authentication CRUD Operations</b>: Sign-in, Sign-out, determining whether or not the client is already authenticated or if a sign in is needed
- <b>Caching Authentication State</b>: Peristing the AuthSession between application launches
- <b>Synchronizing Auth State across the Entire App</b>: Because no one wants a stale cache or a stale token attached to HTTP calls
- <b>Single Line Changes for Changing Between Auth Providers</b>: This helps prevent vendor-lock and increase modularity

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
</br>A manager responsible for orchestrating sign in, sign out etc. Faciliattes the unidirectional transfer of the AuthSession from the RemoteAuthProvider into the DataStore, and finally how that AuthSession is exposed for the consuming code to use it.

`Auth`
</br>The single entrypoint into the EZClientAuth framework. It's responsible for configuring the AuthManager with a developer-specified RemoteAuthProvider, and holding a singleton AuthManager.

EZClientAuth was built as part of a mobility SDK and intended for use across several product lines of mobile iOS applications. The jury was still out on which authentication provider would be used. We didn't want our application code to be written to any one provider since that would lead to vendor lock-in with larger switching costs. We wanted to do it in one line of code instead.

Today we'll only develop sign-in. The GitHub repo includes the complete framework with both a MockAuthManager and a Firebase implementation.

<h4>Domain Driven Development (DDD)</h4>

<blockquote>In Domain Driven Design, there is no "The". There is only "A/An". It's all about "A RemoteAuthProvider", never "The Firebase AuthProvider". Genericism endows your code with flexibility.</blockquote>

Domain Driven Design is a term coined by Eric Evans in his 2004 book [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG). DDD strips away the accidental complexities of implementations and provides a framework for development teams to focus on the inherent complexities of their domain.

A tool I use to help realize DDD style design in my architecture is this fill-in-the-blank of this sentence:

<blockquote>I want some X (component) that does Y (behavior). I don't care what the behind-the-curtain implementation is of X, and the consuming code should care either.</blockquote>

In Swift practice, DDD is realized through Protocol Oriented Programming. We create an interface of X that has methods and properties that do Y, and then we write all of our application code to only know about X, NEVER the implementation behind X.

This approach to development gives us a number of benefits:

<b>Looser coupling between consuming code and dependencies:</b>If the application doesn't call any methods on the implementation, it can be changed.

<b>Prevent vendor lock-in:</b> If you can easily change your implementation in one centralized place, you can jump ship on a lousy provider much more easily than if you'd spread direct calls to that implementation across your application.

In our case, this DDD approach endows EZClientAuth with the flexibility to plug in any `RemoteAuthProvider` implementation, be it Firebase or Keycloak etc., and any caching provider, be it Keychain or UserDefaults for iOS, with a single-line configuration change on the client.

<b>Testability:</b> Because you've written to interfaces, you can always create mocks that implement that interface. Do this for every interface, and you have yourself a ready-made local environment.

<b>Shared Domain Vocabulary:</b> DDD provides your team(s) with a shared language in the domain. This becomes difficult if you merely adopt the language of your implementation. In the mobile world, DDD/POP eases communication between iOS and Android teama because they are all using the same explicitly-defined domain vocabulary.

As you'll see, DDD lets you maintain the blast-zone of rapidly changing business decisions to a nice directory titled “Implementations”. It encourages your application to talk to generic interfaces with nice layman names like “AuthenticationManager”, rather than implementation-specific names like "FirebaseAuthenticator" or "KeycloakAuthenticationService".

<h4>Implementation: Swift</h4>

Today we'll be hacking in Swift, but I promise, even if you don't know Swift, this domain driven approach to authentication will port to any langauge that provides you with interfaces or protocols.

Much of what you'll see here was inspired by Ray Wenderlich's excellent resource, [Advanced iOS App Architecture](https://store.raywenderlich.com/products/advanced-ios-app-architecture)

Let’s get started by creating the nucleus of authentication: the `AuthSession`.

<hr/>

<h2 style="text-decoration: underline;">AuthSession</h2>

I want some immutable object that encapsulates my entire authentication state.

This object is called `AuthSession`.

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

As you’re authentication needs grow more complex, you may want space to stretch your legs, including new properties like refresh tokens. The `AuthSession` class becomes the scaffold on which you build up your unique authentication needs.

[Martin Fowler](https://martinfowler.com/) singles out overuse of primitives as an anti-pattern, called [primtive obsession](https://martinfowler.com/articles/refactoring-adaptive-model.html#RemovePrimitiveObsession). He believes classes can provide <i>"a home that can attract useful behavior"</i>. This AuthSession will become a magnet for new authentication attributes.

Where does this AuthSession come from? It comes from the `RemoteAuthProvider`.

<hr/>

<h2 style="text-decoration: underline;">RemoteAuthProvider</h2>

I want a service that takes credentials (e.g. email and password) and returns an AuthSession if they are valid, or a helpful error message if they are invalid or some error occurs.</span>

This is the responsibility of the `RemoteAuthProvider`.

<div class="impl">

```swift
protocol RemoteAuthProvider {}
```

</div>

Notice `RemoteAuthProvider` is just a <i>protocol</i> (Swift's version of what other languages call and <i>interface</i>), not a class. This means that there are no implementations for these methods. It is only a contract that an object trying to be a `RemoteAuthProvider` must adhere to.

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

First off, all the parameters are [Optionals](https://learnappmaking.com/swift-optionals-how-to/).

<div class="impl">

```swift
// The '?' makes this an Optional parameter
// It's either a String or nil
email: String?
```

</div>

EZClientAuth is built with flexibility at its core. These fields are optional because a client may want to use biometric, email/password won't be needed. The RemoteAuthProvider implementation can error check for it's own particular credential is present. The framework itself is unopinionated.

This does break one of the SOLID principles: the [interface segregation principle](https://stackify.com/interface-segregation-principle/). Thought not exactly an interface, this does mean that in some implementations, there will be unused email/password credentials where thy're not needed. Given authentication as a domain has some coherence at its extremities (i.e. takes in some credentials, spits out some token), this is a conscious tradeoff we're willing to make to gain flexibility in implementation.

Let's take a closer look at the completion handler, closure, or callback (whichever term you prefer) parameter:

<div class="impl">

```swift
_ completion: @escaping AuthResponse)
```

</div>

`_`: Swift let's developers choose whether or not they want to expose [named parameters](https://useyourloaf.com/blog/swift-named-parameters/) in their method signatures. The underscore `_` just means this is not a named parameter, so the consuming code need not include a parameter label.

`completion`: Our `RemoteAuthProvider` will communicate back to the calling code through callbacks, also known as <i>completion handlers</i>, hence the name `completion`.

`@escaping`: Ignoring the `@escaping` keyword is ay-okay, it's not important here. If you're learning Swift and are curious, it has to do with when the [closure](https://docs.swift.org/swift-book/LanguageGuide/Closures.html) is called.

`AuthResponse`: When the `RemoteAuthProvider` has completed its operations, it will call the completion handler closure passed to it with an `AuthResponse` objec, whether it succeeded or not. The `AuthResponse` is simply a tuple that packages up the `AuthSession` returned from `RemoteAuthProvider`, or any `AuthError`s if they occur, and calls the completion handler with the tuple.

Here's what an `AuthReponse` looks like:

<div class="impl">

```swift
typealias AuthResponse = (AuthSession?, AuthError?) -> Void
```

</div>

A [typealias](https://www.avanderlee.com/swift/typealias-usage-swift/) in Swift is just an alias for an existing type. In this case, the existing types are `AuthSession` (which we've seen) and `AuthError` (which well see soon)

Both the `AuthSession` and the `AuthError` are optionals. We don't know if an error will occur, and if one does occur, we sure won't be getting an `AuthSession` back

There are 2 scenarios for the return from `RemoteAuthProvider.signIn()`:

Scenario 1: `AuthSession` is non-nil:
User is authenticated. Here is the `AuthSession`.

Scenario 2: `AuthError` is non-nil:
Scenario 1: Authentication with `RemoteAuthProvider` failed, therefore authentication status could not be determined and `AuthSession` is nil

The unused combination (i.e. both `AuthSession` and `AuthError` are nil) should never happen. If authentication fails for any reason, only an `AuthError` should be provided to the closure. This requirement isn't enforced, but may be soon.

Let's take a closer look at `AuthError` before moving on to caching the `AuthSession` we receive from sign-in.

<h3>Be Responsible. Wrap Your Errors.</h3>

<blockquote>A good error should be more than just a breadcrumb: it should be a massive, blinking neon sign telling the developer what went wrong and where to start bug hunting. As SDK developers, it's our responsibility create that sign.</blockquote>

Authentication is fertile ground for confusing errors. `AuthError` is a wrapper around the deeper errors thrown by the `RemoteAuthProvider` (e.g. network errors) and `DataStore` (e.g. serialization errors) that will percolate these low-level errors up to the consuming code in a developer-friendly wrapper.

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
did not match any accounts on RemoteAuthProvider"
```

</div>

So let's create a custom `AuthError` that where we as SDK developers control the verbiage. Let's start with a common error: `invalidCredentials`.

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

This custom error gives you as an SDK developer intimate control over how network and caching errors percolate up to the consuming application. We intercept these deeper network and caching errors, categorize them, and then deliver a helpful rather than obfuscated message.

We now have the components we need to receive a valid `AuthSession` from a `RemoteAuthProvider`. It's now time to persist the `AuthSession` between app launches using a generic `DataStore`.

<h2 style="text-decoration: underline;">DataStore</h2>

I want an on-device local storage to locally persist my `AuthSession` so that users don’t have to reauthenticate after every app relaunch.

This is the sole responsibility of our `DataStore`.

<div class="impl">

```swift
public protocol AuthDataStore {}
```

</div>

The `DataStore` is the <b><i>only</b></i> component in our entire authentication domain with the ability to save, read, and delete an `AuthSession`'s to or from the on-device cache.

`DataStore` implements three CRUD methods for interacting with local storage:

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

It's common for caching operations to throw either an error or just nil. It should never mutate the object passed in, it should just serialize it. Hence there's no reason to pass the saved object into the closure. Just an error if one occurs, or nil.

Awesome! We can get and `AuthSession` by sending credentials to `RemoteAuthProvider.signIn` and perists the returned `AuthSession` by calling `DataStore.save`.

<h3>Solving The Problem of Synchronizing Remote, Cached, and Runtime Authentication State</h3>

Raise your hand if this has ever happened to you while implementing authentication in an app:

<i>You login. You kill the app. You re-open the app. You're presented with login page!</i>

or

<i>You login. You attempt an authenticated network call, yet still receive a 401-Unauthorized network error.</i>

This class of error often stems from failures to synchronize authentication state across the three zones in which authentication state resigns:

- <b>1. Remote</b>: The most recent `AuthSession` returned from your remote auth provider
- <b>2. Local</b>: The `AuthSession` stored in cache
- <b>3. Runtime</b>: The `AuthSession` object used to add tokens to header in the runtime of your app for making authenticated calls

How do we ensure that the cached AuthSession never grows stale, i.e. fall out of sync with the RemoteAuthProvider? Furthermore, how do we propogate this AuthSession across the rest of our app to use it in the headers of our many network calls?

The answer to these two questions is the same:

<blockquote>Unidirectional data flow for authentication means that authentication state MUST flow from the `RemoteAuthProvider` into the `DataStore` and finally into a single `AuthSession`.</blockquote>

The class responsible for coordinating this unidirectional authenticaion flow and for holding the latest `AuthSession` is called the `AuthManager`.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

I want a manager that synchronizes the `AuthSession` between the `RemoteAuthProvider` and the `DataStore`. This manager should also hold the most recent `AuthSession` as a property.

<div class="impl">

```swift
public protocol AuthManager {
    var authProviderConfiguration: AuthProviderConfiguration { get }
    private var remoteAuthProvider: RemoteAuthProvider = {
        return authProviderChoice.remoteAuthProvider
    }

    var dataStore: AuthDataStore { get }
    var authSession: AuthSession? { get }
}
```

</div>

The `AuthManager` protocol is public unlike the previous protocols because this will be the consuming code's point of access to sign in, sign out, and checking if the client is authenticated.

An AuthManager owns a `DataStore`, an `AuthSession`, and an `AuthProviderConfiguration`.

Let's briefly cover why we use `AuthProviderConfiguration` enum rather than a direct implementation of `RemoteAuthProvider`, and then we'll get to business implementing sign in on the `AuthManager`.

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

The `case` is switched on in the `remoteAuthProvider` getter to determine which `RemoteAuthProvider` implementation to return.

A major goal of the EZClientAuth framework was to abstract away the specific authentication provider behind a shared interface of common authentication methods. With this as the goal, it made no sense to make the `RemoteAuthProvider` implementation used behind the scenes public. So we make `AuthProviderConfiguration` public instead

So on the `AuthManger` we saw, this line:

<div class="impl">

```swift
var authProviderConfiguration: AuthProviderConfiguration { get }
private var remoteAuthProvider: RemoteAuthProvider = {
    return authProviderChoice.remoteAuthProvider
}
```

</div>

Returns the `RemoteAuthProvider` associated with out enum value, effectively keeping the implementation hidden.

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

Let's see how the sign in leverages an uber-useful built-in Swift language feature to maintain sync: the [guard](/what-is-a-guard).

<h4>Leveraging Null Checks to Direct Authentication Flow</h4>

If you're not familiar with the concept of a guard, I suggest you give this espresso article, [a concise explanation of guards](/what-is-a-guard), a quick read. If you are familiar with them, onwards!

Step 1: Call sign-in with credentials on `RemoteAuthProvider` and receive an `AuthSession` if successful, and `AuthError` if unsuccesful.

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
            .failedToSignInWithRemote(
                "\(error!.localizedDescription)"
                ))
    }

    //3. Check for auth session
    guard let authSession = authSession else {
        return completion(
            nil,
            failedToRetrieveAuthSession(
                "No AuthSession returned from RemoteAuthProvider.
                However, no errors were returned either."))
    }
```

</div>

Step 2: Attempt to cache the AuthSession returned from `RemoteAuthProvider` in the `DataStore`. Throw an `AuthError` if a caching error (e.g. seialization) occurs.

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

There's nothing returned here, so if there are no errors we take that to mean it cached successfully.

Step 3: Set the `AuthManager`'s `AuthSession` to the `AuthSession` returned from the RemoteAuthProvider.

<div class="impl">

```swift
// 1. Set the AuthSession on the AuthManager
self!.authSession = authSession

// 2. Complete sign-in on the AuthManager by calling the completion handler with the synchronized AuthSession
completion(authSession, nil)
```

</div>

That's it for sign-in. All together now:

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

Congratulations on getting this far! We're one step away from

Now that we can sign-in, let's move onto the final step: ensuring only ONE `AuthManager` can be instantiated at a time.

<h3>The Only Thing the Client Needs: Auth</h3>

<blockquote>The more opinionated the SDK, the less work developers have to do within the SDK's use case, but the more work developers have to do to escape the SDKs opinions</blockquote>

We do not want multiple `AuthManager`s created. This would ruin our synchronization efforts.

The `AuthManager` checks off all three of my usual criteria for justifying a singltone:

- The object is used in many parts of the application. Any code that makes remote calls will likely need an authentication token in its header
- It's conceptually difficult to imagine a need for more than one of that object to exist simultaneously. There really aren't any (common?) use cases that would necessitate multiple AuthSession floating around
- Changes to the object should be shared across across the application. If I refresh my AuthSession in one process, I want that new AuthSession to be propogated to everywhere else, god forbid a stale one is used.

NOTE: Singletons are notoriously untestable. We'll cover how to keep things testable in the Part III: Integrating and Testing with EZClientAuth. (Hint: You just add an instance property called authManager to your object, then add an authManager in that object's initializer that defauls to the singleton. Inject for tests, don't inject for production)

A reasonable argument for occasional usage of the dreaded singleton now made, lets create our final abstraction, simply called `Auth`, that will confgirure and hold our one and only `AuthManager`, and therefore our one and only synchronized `AuthSession`.

<h2 style="text-decoration: underline;">Auth</h2>

`Auth` is a struct (like an immutable, uninheritable class) that lets the client configure the `AuthManager` with just an `AuthProviderConfiguration` enum we saw above. `Auth` also holds a singleton `AuthManager` for use by the client.

<div class="impl">

```swift
public struct Auth {
    // 1: Singleton AuthManager for sign-in, sign-out, etc.
    static public let manager: AuthManager = AuthManager()

    // 2: Sole exposed method for configuring AuthManager with the consuming codes choice
    // of RemoteAuthProvider implementation and optional DataStore override
    static public func configure(
        for authProviderConfiguration: AuthProviderConfiguration,
        with dataStore: AuthDataStore? = nil) {
        // 2.5 Hand off AuthProviderConfiguration and datastore to the singleton manager
        manager.configure(
            for: authProviderConfiguration,
            with: dataStore)
    }

    // 3: Convenience getter for the authSession
    static public var session: AuthSession? {
        return manager.authSession
    }
}
```

</div>

Don't be deceived by the number of lines of code, `Auth` does very little.

We use the `Auth.configure` method to <i>method-inject</i> the `RemoteAuthProvider` into our singleton `AuthManager` held on `Auth`. Remember the `RemoteAuthProvider` implementation is held as an associated value of the `AuthProviderConfiguration` enum.

In the consuming code we can simply configure our `AuthManager` with any `RemoteAuthProvider` we've written an implementation for, and rest assured that our remote, cached, and runtime `AuthSession` will all remain synchronized, thanks to the unidrectional control of the `AuthManager`.

<blockquote>SIDENOTE: To the keen eyed among you, this may look familair. It's is inspired by FirebaseAuth's simple Firebase.configure() syntax.</blockquote>

When our application first boots, we can simply call `Auth.configure` with our chosen `RemoteAuthProvider` and that suffices to begin using EZClientAuth.

This is the boot method for iOS applications:

<div class="impl">

```swift
// Non-Swifters: This is the main entry point method called when booting an iOS app
func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions) {

    Auth.configure(.firebase) // or Keycloak, OAuth, etc.

}
```

</div>

Thereafter, you can just call `Auth.manager.signIn(email: myEmail, password: myPassword)`, `Auth.manager.signOut()`, `Auth.manager.isAuthenticated()` and whatever else on your AuthManager and reap the benefits of Remote, Cache and Runtime synchronization, all with the certainty that a switch to a new authentication provider might take days rather than weeks to implement with limited application-side changes.

Now that we've implemented sign-in together, sign-out and isAuthenticated will be a breeze. You can see the complete implementations in the [example app](https://github.com/alo9507/EZClientAuth).

Thanks for reading! Please roast me in the comments below!
