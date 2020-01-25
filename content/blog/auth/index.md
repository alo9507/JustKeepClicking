---
title: Domain Driven Authentication
date: "2020-01-17T22:12:03.284Z"
description: "Set your development team free with this flexible multi-provider authentication framework: EZClientAuth"
---

<h2>IN PROGRESS</h2>

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth) : <i>A flawed but useful way to synchronize authentication state</i>

Authentication is hard. Authentication is less hard once it's reduced to its component parts.

This we call the <i>Authentication Domain</i>. A domain can be described by two things: the domain's <i>components</i>, and the domain's <i>behaviors</i>.

Today, we'll lay the foundation for a fully-functional and flexible clientside authentication framework allowing your team to easily swap out authentication providers. It achieves this by following the tenets of Domain Driven Design, namely, writing to interfaces, not implementations.

<h4>EZClientAuth Behaviors</h4>

- <b>Authentication CRUD Operations</b>: Sign-in, Sign-out, determining whether or not the client is already authenticated
- <b>Caching Authentication State</b>: Peristing the AuthSession between application launches
- <b>Synchronizing Auth State across the Entire App</b>: Because no one wants a stale cache or a stale token attached to http calls

We'll build out these behaviors using five primary building blocks:

<h4>EZClientAuth Components</h4>

`AuthSession`
</br>An object encapsulating authentication state, e.g. the authentication token

`RemoteAuthProvider`
</br>
A remote service capable of creating, deleting and refreshing AuthSessions using some form of credential
</br>
<i class="example">Examples: Firebase, AuthO, Keycloak</i>

`DataStore`
</br>
An on-device cache for persisting an AuthSession between application launches
</br>
<i class="example">Examples: Browser local storage, Keychain on iOS</i>

`AuthManager`
</br>The manager that kicks of remote authentication, caches the returned AuthSession, and stores a reference to the AuthSession for use during the application's runtime

`Auth`
</br>An abstraction that holds and exposes the ability to configure a singleton AuthManager in the actual application. This is the only construct that the application has to be aware of.

Today we'll only develop sign in. The GitHub repo includes the complete framework with both a Mock and a Firebase implementation.

We'll accomplish all this with a paradigm known as Domain Driven Development.

<h4>Domain Driven Development (DDD)</h4>

Coined by Eric Evans in his 1962 masterpiece [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG), DDD strips away the accidental complexities of implementations by focusing on the underlying similarities of a problem space.

The key fill in the blank of DDD: I want some X (component) that does Y (behavior). I don't care what the behind-the-curtain implementation is of X.

In practice, DDD is realized through interface driven development. We create an interface of X that has methods and properties that do Y, and then we write all of our application code to only know about X, NEVER the implementation behind X.

This approach to development gives us a number of benefits:

<b>Prevent vendor lock-in:</b> If you can easily change your implementation in one centralized place, you can jump ship on a lousy provider much more easily than if you'd spread direct calls to that implementation across your application.

In our case, this DDD approach endows EZClientAuth with the flexibility to plug in any `RemoteAuthProvider` implementation, be it Firebase or Keycloak etc., and any caching provider, be it Keychain or UserDefaults for iOS, with a single-line configuration change on the client.

<b>Testability:</b> Because you've written to interfaces, you can always create mocks that implement that interface. Do this for every interface, and you have yourself a ready-made local environment.

<b>Shared Domain Vocabulary:</b> DDD provides your team(s) with a shared language in the domain. This becomes difficult if you merely adopt the language of your implementation. Imagine an iOS team chatting or even cross-pairing with an Android team, all using the same explicitly-defined domain vocabulary.

DDD lets you maintain the blast-zone of rapidly changing business decisions to a nice directory titled “Implementations”. It encourages your application to talk to generic interfaces with nice laymen names like “AuthenticationManager”, rather than implementation-specific names like "FirebaseAuthenticator" or "KeycloakAuthenticationService".

<h4>Implementation: Swift</h4>
Today we'll be hacking in Swift, but I promise, even if you don't know Swift, this domain driven approach to authentication will port to any langauge that provides you with interfaces or protocols.

</br>
</br>

Much of what you'll see here was inspired by Ray Wenderlich's excellent resource, [Advanced iOS App Architecture](https://store.raywenderlich.com/products/advanced-ios-app-architecture)

Let’s get started by creating the nucleus of authentication: the `AuthSession`.

<hr/>

<h2 style="text-decoration: underline;">AuthSession</h2>

I want some object that encapsulates my entire authentication state.

This object is called `AuthSession`.

<div class="impl">

```swift
class AuthSession: Codable {

    let token: String

    init(token: String) {
        self.token = token
    }
}
```

</div>

Why not a simple string for the token? Why wrap the token in a class?

As you’re authentication needs grow more complex, you may want space to include new properties and helper methods to manage changing auth needs. The `AuthSession` class becomes the scaffold on which you build up your unique authentication needs.

There's an anti-pattern called [primtive obsession](https://martinfowler.com/articles/refactoring-adaptive-model.html#RemovePrimitiveObsession) that goes into more detail about the superiority of classes to strings for potentially complex or growing objects.

Where does this AuthSession come from? It comes from the `RemoteAuthProvider`.

<hr/>

<h2 style="text-decoration: underline;">RemoteAuthProvider</h2>

I want some service that takes <i>some</i> credentials (e.g. email and password) and returns an AuthSession if successful, or a helpful error message if unsuccessful.</span>

This is the responsibility of the `RemoteAuthProvider`.

<div class="impl">

```swift
protocol RemoteAuthProvider {}
```

</div>

Notice it is a <i>protocol</i> (Swift's version of what other languages call and <i>interface</i>), meaning that there are no implementations for these methods. It is only a contract that an object trying to be a `RemoteAuthProvider` must adhere to.

Any `RemoteAuthProvider` must have a sign-in method that looks exactly like this.

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

Notice that I said <i>some</i> credentials as the behavior of RemoteAuthProvider. That could be anything from an email and password to facial recognition to social media logins. That is why the parameters of sign-in are all Optionals.

Let's have a closer the last line, as it will appear as an idiom throughout EZClientAuth:

<div class="impl">

```swift
_ completion: @escaping AuthResponse)
```

</div>

The underscore \_ just means this is not a named parameter, so calling code need not include a parameter label. Our `RemoteAuthProvider` will communicate back to the calling code through callbacks, also known as <i>completion handlers</i>, hence the name `completion`.

Ignoring the `@escaping` keyword is ay-okay, it's not relevant to this. If you're learning Swift, it has to do with when the [closure](https://docs.swift.org/swift-book/LanguageGuide/Closures.html) is called.

When the `RemoteAuthProvider` is ready, it will call the completion handler closure passed to it with an `AuthResponse`.

Here's what an `AuthReponse` looks like:

<div class="impl">

```swift
typealias AuthResponse = (AuthSession?, AuthError?) -> Void
```

</div>

The `AuthResponse` is a tuple that packages up the `AuthSession` returned from `RemoteAuthProvider`, or any `AuthError`s if they occur.

There are 3 scenarios for the return from RemoteAuthProvider:
`AuthSession` is not `nil` --> User is authenticated. Here is the `AuthSession`.
`AuthError` is not `nil` --> Authentication with `RemoteAuthProvider` failed, therefore authentication status could not be determined and `AuthSession` is nil
`AuthSession` is nil. `AuthError` is `nil` --> User is not authenticated.

<blockquote>A typealias in Swift is literally an alias for an existing type.</blockquote>

Authentication is fertile ground for confusing errors. `AuthError` is a wrapper around the deeper errors thrown by the `RemoteAuthProvider` (e.g. network errors) and `AuthDataStore` (e.g. serialization errors) that will percolate these low-level errors in a developer-friendly manner.

For example,

<div class="impl">

```swift
AuthError.incorrectCredentials("
                    Credentials provided are not known:
                    [*implementation-specific error here*]")
```

</div>

is much more informative to developers than

<div class="impl">

```swift
Error.networkError("HTTP ERROR 401")
```

</div>

<blockquote>A good error should be more than just a breadcrumb: it should be a massive, blinking neon sign telling the developer where to go. As SDK developers, we create that sign.</blockquote>

So let's create an `AuthError` to act as our massive neon error sign. Let's start with one common error: `incorrectCredentials`.

<div class="impl">

```swift
public enum AuthError: Error, Equatable {
    case incorrectCredentials(_ error: String)

    public var errorDescription: String? {
        switch self {
        case .incorrectCredentials(let error):
            return "Credentials provided are not known: \(error)"
        }
    }
}
```

</div>

This custom error gives you as an app or SDK developer intimate control over how network and caching errors percolate up to the consuming application.

Now back to the `AuthResponse`.

The `AuthSession` and `AuthError` in the `AuthResponse` are both Optional because we don't know for sure that an `AuthSession` will be returned (what if connection fails?) and we don't know for sure that any `AuthError`s will be returned (what if we successfully get the `AuthSession` error-free?)

<blockquote>In Domain Driven Design, there is no "The". There is only "A/An". It's all about "A RemoteAuthProvider", never "The Firebase AuthProvider" Genericism endows your code with flexibility.</blockquote>

We have the components we need to receive a valid `AuthSession` from a `RemoteAuthProvider`.

Now let's persist that `AuthSession`, using an `AuthDataStore`.

<h2 style="text-decoration: underline;">AuthDataStore</h2>

I want some on-device cache to locally persist my AuthSession so that my users don’t have to sign-in between every launch.

This is our `AuthDataStore`. The `AuthDataStore` is the <b><i>only</b></i> component in our entire authentication domain that has the ability to save, read, and delete an `AuthSession`'s from on-device cache.

<div class="impl">

```swift
public protocol AuthDataStore {}
```

</div>

`AuthDataStore` implements three CRUD methods for interacting with the cache:

<div class="impl">

```swift
public protocol AuthDataStore {
    func readAuthSession(_ completion: @escaping AuthResponse)

    // save also overwrites, so it double duties as an update
    func save(
        authSession: AuthSession,
        _ completion: @escaping ErrorResponse)

    func delete(_ completion: @escaping ErrorResponse)
}
```

</div>

So once we get our AuthSession from `RemoteAuthProvider`, we can persist it locally with an `AuthDataStore` using the `save` method.

But how do we ensure that the cached `AuthSession` get stale or fall out of sync with the `RemoteAuthProvider`. Also, how do we propogate this AuthSession across the rest of our app to use it in our many network calls?

<h3>Solving The Problem of Synchronizing Remote, Local, and Runtime Authentication State</h3>

Tell me if this has ever happened to you while implementing authentication in an app:

You login. You kill the app. You open the app... and you have to login again.
You login. You attempt an authenticated network call. Unauthenticated error.

This error stems from failures to synchronize the `AuthSession` across the three areas in memory it exists:

- <b>Remote</b>: The most recent AuthSession returned from your remote auth provider
- <b>Local</b>: The AuthSession stored in cache
- <b>Runtime:</b> The AuthSession object passed in the runtime of your app for making authenticated calls

Errors of this sort are much more common if the seapration of responsibilities in your authentication implementation are unclear. That is why we have clearly separated remote authentication in the RemoteAuthProvider from caching behavior in the AuthDataStore.

This leaves us with the third AuthSession: The Runtime AuthSession.

This responsibility for synchronizing the cached, remote, and runtime authentication state is called the `AuthManager`.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

I want a manager that synchronizes the `AuthSession` between the `RemoteAuthProvider` and the `DataStore`. This manager should also have the most recent `AuthSession` as a property that also stays synchronized.

The `AuthManager` is the public object that our application will actually interact with to query and mutate the authentication state.

<div class="impl">

```swift
public protocol AuthManager {
    var authProviderConfiguration: AuthProviderConfiguration { get }
    var dataStore: AuthDataStore { get }

    var authSession: AuthSession? { get }

    func signIn(
        email: String?,
        password: String?,
        phoneNumber: String?,
        _ completion: @escaping AuthResponse
        )
}
```

</div>

An AuthManager owns a `RemoteAuthProvider`, a `DataStore`, and an `AuthSession`.

The three steps to signing in:

Step 1: Send credentials to `RemoteAuthProvider`

- Deal with any errors and return
- If an `AuthSession` is returned, then Step 2

  Step 2: Cache the AuthSession in the `DataStore`

- Deal with any errors and return
- If no errors occurred, then...

  Step 3: Set the AuthManager's AuthSession to the AuthSession returned by `RemoteAuthProvider`

Let's see Steps 1 to 3 in code, starting with the RemoteAuthProvider.

<h4>Leveraging Null Checks to Direct Authentication Flow</h4>

If you're not familiar with guards, I suggest you give this espresso, [a concise explanation of guards](/what-is-a-guard), a quick read. If you are familiar with them, onwards!

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
// 1. Cache the Auth Session
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
                However, no errors were returned either."
                ))
    }

        // 4. Cache the Auth Session
    self.dataStore.save(authSession: authSession, { (error) in

        // 5. Check for caching errors
        guard error == nil else {
            return completion(
                nil,
                .failedToPersistUserSessionData(
                    error!.localizedDescription
                    ))
        }

        // 6. Set the AuthSession on the AuthManager
        self!.authSession = authSession

        // 7. Complete sign-in on the AuthManager by calling the
        // completion handler with the synchronized AuthSession
        completion(authSession, nil)
    })
```

</div>

AuthManager is pretty central to our applicaiton as the class repsonsible for maintaining `AuthSession` synchronization. But who's managing the AuthManager? What if we create ten `AuthManager`s in an app? Since the AuthManager hold the AuthSession, don't we only want one of them during runtime?

This is where EZClientAuth gets...opinionated! _Dun-dun-dun!_

<h3>On the Impossible Task Creating Perfect SDKs</h3>

<blockquote>The more opinionated the SDK, the less work developers have to do within the SDK's use case, but the more work developers have to do to escape the SDKs opinions</blockquote>

EZClientAuth was built as part of a mobility SDK and intended for use across several product lines of mobile iOS applications. Being early in the prototyping process, the jury was still out on an approved authentication provider. We didn't want our application code to be written to any one provider since that would be messy to change. We wanted to do it in one line of code instead.

Some things my team faced while implementing EZClientAuth:

Should we perform caching for the client?
Should we keep a reference to the AuthSession for the user, or let them decide how to propogate it?
Should we keep a singleton AuthManager?

EZClientAuth is opinionated about the way it synchronizes the AuthSession. We see the benefits to the client (out of site out of mind). It's entirely unopinionated about what RemoteAuthProvider you implement (we can always add more weird optional paramaters to sign-in) and what dataStore you use

Because EZClientAuth was built as part of an SDK for integration across multiple apps, it was necessary as SDK developers to limit the surface area of the API as much as possible. This was achieved by hiding the implementations of the RemoteAuthProvider and the DataStore. We only expose the interface of the AuthManager, so the client can mock it.

We hide the `RemoteAuthProvider` implementations by using Swift enums. The

`AuthProviderConfiguration`
</br>
A simple enum exposed to the client for choosing a `RemoteAuthProvider`
</br>

<div class="impl">

```swift
public enum AuthProviderConfiguration {
    case firebase
    case mock(mockRemoteAuthProvider: RemoteAuthProvider)

    var remoteProvider: RemoteAuthProvider {
        switch self {
        case .firebase:
          return FirebaseRemoteAuthProvider()
        case .mock(let mockRemoteAuthProvider):
            return mockRemoteAuthProvider
        }
    }
}
```

</div>

The application just the enum. Then EZClientAuth switches on this enum to determine which private RemoteAuthProvider to use.

Let's take a quick look at the `AuthProviderConfiguration`, then we'll complete EZClientAuth with the `Auth` manager mentioned above

<h2 style="text-decoration: underline;">AuthProviderConfiguration</h2>

`AuthProviderConfiguration` will be an enum with the actual `RemoteAuthProvider` implementation as a switch getter. We do this so that the framework, if installed as a Pod, doesn't need to expose the internals of its RemoteAuthProvider implementations. EZClientAuth was implemented as an importable module.

<h2 style="text-decoration: underline;">Auth</h2>

A struct that exposes the means of configuring and accessing a singleton AuthManager

We could just allow the consuming code to create as many AuthManagers as they want, but this could quickly lead to misuse of the API.

I can think of few circumstances in which the consuming code would be benefit from multiple AuthManager's all with different states.

The `AuthManager` checks off all three of my usual criteria for justifying a singltone:

- The object is used in many parts of the application. Any code that makes remote calls will likely need an authentication token in its header
- It's conceptually difficult to imagine a need for more than one of that object to exist simultaneously. There really aren't any (common?) use cases that would necessitate multiple AuthSession floating around
- Changes to the object should be shared across across the application. If I refresh my AuthSession in one process, I want that new AuthSession to be propogated to everywhere else, god forbid a stale one is used.

If the above three criteria are not true, you may be better off just injecting through initializers, setters or methods as need as needed and spare yourself the trouble of Singletons.

NOTE: Singletons are notoriously untestable. We'll cover how to keep things testable in Part III. (Hint: You just add an instance property called authManager to your object, then add an authManager in that object's initializer that defauls to the singleton. Inject for tests, don't inject for production)

The occasional viability of the singleton design pattern now upheld, lets create our final abstraction, simply called `Auth`, that will confgirure and hold our one and only `AuthManager`, and therefore our one and only synchronized `AuthSession`.

Here's the [struct](https://docs.swift.org/swift-book/LanguageGuide/ClassesAndStructures.html) (for non-Swifters, thinking of this as a class is non-lossy for our purposes):

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
        // 2.5 Hand off AuthProviderChoice and datastore to the singleton manager
        manager.configure(
            for: authProvider,
            with: dataStore)
    }

    // 3: Convenience getter for the authSession
    static public var session: AuthSession? {
        return manager.authSession
    }
}
```

</div>

In case you parsed over, here's the moneyshot of EZClientAuth:

`manager.configure(for: authProvider)`

We use the `Auth.configure` method to <i>method-inject</i> the `RemoteAuthProvider` into our singleton `AuthManager`.

In our application we can simply configure our `AuthManager` with any authProvider we've written an implementation for, and rest assured that our remote, cached, and runtime AuthSession will all remain synchronized thanks to the controlled and tested code paths of the `AuthManager`.

SIDENOTE: To the keen eyed among you, this may look familair. It's is inspired by FirebaseAuth with Firebase.configure(). and Auth.auth() syntax.

When our application boots up, the only thing we have to do to start using EZClientAuth is this:

<div class="impl">

```swift
// Non-Swifters: This is the main entry point method called when booting an iOS app
func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions) {
    Auth.configure(.myRemoteAuthProviderChoice)
}
```

</div>

Thereafter, you can just call `Auth.manager.signIn(email: myEmail, password: myPassword)`, `Auth.manager.signOut()`, `Auth.manager.isAuthenticated()` and whatever else on your AuthManager and reap the benefits of Remote, Cache and Runtime synchronization, all with the certainty that a switch to a new authentication provider might take days rather than weeks to implement.

The implementations of `signOut` and `isAuthenticated` can be foudn in the [example app](https://github.com/alo9507/EZClientAuth). They follow the same pattern as `signIn`.
