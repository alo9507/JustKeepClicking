---
title: Domain Driven Authentication
date: "2020-01-17T22:12:03.284Z"
description: "Set your development team free with this flexible multi-provider authentication framework: EZClientAuth"
---

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth)

Authentication is hard. Authentication is less hard once it's reduced to its component parts.

This we call the <i>authentication domain</i>. A domain is fully described by two things: the domain's <i>components</i>, and the domain's <i>behaviors</i>.

There are many ways we could divide up the responsibilities of Authentication. What communicates with the auth server? Is that component also responsible for persisting the auth response locally? Possibilities (and confusions) abound.

Today, we'll lay the foundation for a fully-functional and flexible clientside authentication framework allowing your team to easily swap out authentication providers.

Here are the behaviors our framework will be capable of:

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

<blockquote>A typealias in Swift is literally an alias for an existing type.</blockquote>

Authentication is fertile ground for confusing errors. `AuthError` is a wrapper around the deeper errors thrown by the `RemoteAuthProvider` (e.g. network errors) and `AuthDataStore` (e.g. serialization errors) that will percolate these low-level errors in a developer-friendly manner.

For example,

<div class="impl">

```swift
AuthError.incorrectCredentials("
                    Provider: Firebase
                    HTTP ERROR: 401
                    Email: myEmail@g.com
                    Password: abc123!
                    ")
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

This begs a larger question that brings us to our third and final authentication domain behavior, i.e. synchronization: "When should I cache an AuthSession? And when should I remove an AuthSession from cache."

This is a larner issue requiring special attention, the challenge of synchronization.

<h3>The Challenge of Synchronizing Remote, Local, and Runtime Authentication State</h3>

Tell me if this has ever happened to you when adding authentication to an app:

You login, you kill the app, re-open, and it asks you to login again, even though your authentication token from your provider is still valid

This is a synchronization problem, and it often occurs because the seapration of responsibilities of the components in the authetnication implementation are unclear.

Even after you've fetched an AuthSession from remote and cached it locally, there's still a third step: passing around the correct and most recent `AuthSession` during the runtime of your application.

Observe that there are really three authentication states bouncing around any app:

- <b>Remote</b>: The most recent AuthSession returned from your remote auth provider
- <b>Local</b>: The AuthSession you you have in cache
- <b>Runtime:</b> The AuthSession being passed around as an object in the runtime of your app to make authenticated calls

EZClientAuth treats synchronization as a critical responsiblity in and of itself, therefore requiring a separate class.

This manager synchronizes the cached, remote, and runtime authentication state.

This manager responsible for synchronizing remote, cached, and runtime authentication state is called the `AuthManager`.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

I want a manager that synchronizes my AuthSession between the RemoteAuthProvider and the DataStore. This manager should also own the one and only AuthSession.

This manager will be the object the application actually interacts to query and mutate the authentication state.

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

An AuthManager has a `DataStore`, an `AuthSession`, and an `AuthProviderConfiguration`. We'll cover what the `AuthProviderConfiguration` is in a minute, but for now just think of it as a way for the consuming code to say "Hey AuthManager, use this implementation for RemoteAuthProvider", without the consuming code knowing how that implementation works.

<h4>Leveraging Null Checks to Direct Authentication Flow</h4>

If you're not familiar with guards, I suggest you give this espresso, [a concise explanation of guards](/what-is-a-guard), a quick read. If you are familiar with them, onwards!

Let's see how AuthManager facilitates signing in.

Step 1: Send Credentials to `RemoteAuthProvider` and receive an `AuthSession` if successful, and `AuthError` if unsuccesful.

<div class="impl">

```swift
// 1: Sign in with your remote
remoteAuthProvider.signIn(
    email: email, password:
    password, phoneNumber: phoneNumber) { [weak self] (authSession, error) in
    //2. Check for errors
    guard error == nil else {
        return completion(
            nil,
            .failedToSignInWithRemote("\(error!.localizedDescription)"))
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

Step 2: Attempt to cache the AuthSession returned, throw an `AuthError` if a caching error (e.g. seialization) occurs.

<div class="impl">

```swift
// 4. Cache the Auth Session
self?.dataStore.save(authSession: authSession, { (error) in

    // 5. Check for caching errors
    guard error == nil else {
        return completion(
            nil,
            .failedToPersistUserSessionData(error!.localizedDescription))
    }
})
```

</div>

Step 3: Set the `AuthManager`'s `AuthSession` equal to the return AuthSession so it can be used throughout the application

<div class="impl">

```swift
// 6. Set the AuthSession on the AuthManager
self!.authSession = authSession

// 7. Complete with the synchronized AuthSession
completion(authSession, nil)
```

</div>

<h3>Motivation for EZClientAuth</h3>

EZClientAuth was built as part of a mobility SDK. Being early in the prototyping process, the decision on an authentication provider was still in the works. We didn't want our application code to be written to any one provider since that would be messy to change. We wanted to do it in one line of code instead.

Because EZClientAuth was built as part of an SDK for integration across multiple apps, it was necessary as SDK developers to limit the surface area of the API as much as possible. This was achieved

`AuthProviderConfiguration`
</br>
A simple enum exposed to the client for choosing a `RemoteAuthProvider`
</br>

`Auth`
</br>
A struct that exposes the means of configuring and accessing a singleton AuthManager
</br>

Let's take a quick look at the `AuthProviderConfiguration`, then we'll complete EZClientAuth with the `Auth` manager mentioned above

<h2 style="text-decoration: underline;">AuthProviderConfiguration</h2>

`AuthProviderConfiguration` will be an enum with the actual `RemoteAuthProvider` implementation as a switch getter. We do this so that the framework, if installed as a Pod, doesn't need to expose the internals of its RemoteAuthProvider implementations. EZClientAuth was implemented as an importable module.

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

<h2 style="text-decoration: underline;">Auth</h2>

We could just allow the consuming code to create as many AuthManagers as they want, but this could quickly lead to misuse of the API.

I can think of few circumstances in which the consuming code would be benefit from multiple AuthManager's all with different states.

<blockquote>The tradeoff in SDK development is opinionated vs. flexible. Shoot for 80% approval.</blockquote>

AuthManager checks off all three of my usual criteria for justifying a singltone:

- The object is used in many parts of the application
- It's conceptually difficult to imagine a need for more than one of that object to exist simultaneously
- Changes to the object should be shared across across the application

AuthSession abides by all three, namely:
1: Any code that makes remote calls will likely need an authentication token in its header
2: There really aren't any (common?) use cases that would predicate multiple AuthSession floating around
3: If I refresh my AuthSession in one process, I want that new AuthSession to be propogated to everywhere else, god forbid a stale one is used.

If the above three criteria are not true, you may be better off just injecting through initializers or setters as need as needed and spare yourself the trouble of Singletons.

Singletons are notoriously untestable. We'll cover how to keep things testable in Part III. (Hint: It involves initializer injection of a MockAuthManager.)

The honor of the Singleton now upheld, lets create a construct, simply called `Auth`. `Auth` will be responsible for two things:

1. Owning the singleton AuthManager, and by extension the single true AuthSession
2. Providing an entry point for configuring which RemoteAuthProvider implementation the consuming code would like to use

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

In case you parsed over, here's the moneyshot of EZClientAuth one more time:

`manager.configure(for: authProvider)`

In our application we can simply configure our AuthManager with any authProvider we've written an implementation for, and rest assured that our remote, cached, and runtime AuthSession will all remain in sync.

SIDENOTE: To the keen eyed among you, this may look familair. It's is inspired by FirebaseAuth with Firebase.configure(). and Auth.auth() syntax.

<h3>Conclusion</h3>

That's it for today.

In follow up articles, we will:

Create a Firebase `RemoteAuthProvider`
Integrate EZClientAuth into a real application
Show how to maintian testable code with a MockAuthManager
