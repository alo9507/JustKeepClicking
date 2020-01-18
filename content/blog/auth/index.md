---
title: Domain Driven Authentication
date: "2020-01-17T22:12:03.284Z"
description: "Set your development team free with this flexible multi-provider authentication framework: EZClientAuth"
---

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

GitHub: [EZClientAuth](https://github.com/alo9507/EZClientAuth)

Authentication is hard. Authentication is less hard once it's reduced to its component parts.

This we call the authentication domain.

We will build EZClientAuth from 3 components of this authentication domain:

`AuthSession`
</br>An object encapsulating authentication state, e.g. the authentication token.

`RemoteAuthProvider`
</br>
A remote service capable of creating, deleting and refreshing AuthSessions using some form of credential.
</br>
<i class="example">Examples: Firebase, AuthO, Keycloak</i>

`DataStore`
</br>
An on-device cache for persisting your AuthSession between application launches
</br>
<i class="example">Examples: Browser local storage, Keychain on iOS</i>

<h4>What It Can Do</h4>

- <b>Basic Auth CRUD</b>: sign-in, sign-out, checking if the client is already authenticated
- <b>Caching</b>: Peristing the AuthSession between application launches
- <b>Multiple Auth Providers</b>: Ability to change authentication provider in a single line of code
- <b>Multiple Caching Providers</b>: Ability to change what cache is used with a single line of code.

<h4>Domain Driven Development (DDD)</h4>

Coined by Eric Evans in his 1962 masterpiece [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG), DDD strips away the accidental complexities of implementations by focusing on the underlying domain across all implementations.

<h3>The Golden Rule of DDD</h3>

<i>Start with what we want (coding by wishful thinking), then work backwards to the abstractions which succinctly deliver that behavior.</i>

The key statement in DDD:

I want \_**\_ that does \_\_** so that **\_**.
I want some X that does Y. My app Z doesn’t care what X is.

If you can fill in the blanks above for your domain, and create an interface to accomplish those tasks, you can reap the beneifts of DDD, which include

<h4>Benefits of DDD</h4>

- <b>Prevent vendor lock-in</b>: Interface Driven Design reduces switching costs by reducing a) the lines of code you need to change in a refactor, and b) encapsulating those lines of code to a smaller area, in our case one file per auth provider

- <b>Fine-grained error handling</b>: When you’re domain has been reduced to its flows, you can hook into the error paths with custom errors across implementations.

- <b>Straightforward testing</b>: Because DDD is realized through interfaces, you can always create a mock that adheres to that interface for testing.

![technical_skill](swiftlogo.jpeg)

<h4>Implementation: Swift</h4>
Even if you don't know Swift, I promise this framework will port conceptually wherever a client has to prove its identity.

Let’s get started with the nucleus of authentication: the auth session.

<hr/>

<h2 style="text-decoration: underline;">AuthSession</h2>

I want <span style="text-decoration: underline; font-weight: 900">something that encapsulates my auth state</span>.

<div class="impl">

```swift
public class AuthSession: Codable {

    public let token: String

    public init(token: String) {
        self.token = token
    }
}
```

</div>

Why not a simple String? As you’re authentication needs grow more complex, you may want more properties and helper methods to manage it.
Where does this AuthSession come from?

<hr/>

<h2 style="text-decoration: underline;">RemoteAuthProvider</h2>

I want <span style="text-decoration: underline; font-weight: 900">something that takes an email and password and returns an AuthSession if successful, or a helpful error message if unsuccessful.</span>

<h4>The Interface</h4>

<div class="impl">

```swift
protocol RemoteAuthProvider {}
```

</div>

I want something I give an email and password, or a phone number and password, that return me an AuthSession or helpful error message if it fails. So let's add signIn to the protocol.

Our `RemoteAuthProvider` will communicate back to the calling code through callbacks, also known as <i>completion handlers</i>.

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

The `AuthResponse` is a tuple that fulfills the requirement that the `RemoteAuthProvider` return either an `AuthSession` or an `AuthError`

The `email`, `phoneNumber` and `password` are all Optionals to allow for maximum flexibility in implementing new `RemoteAuthProvider`s that may take different credentials, e.g. social media logins.

<h4>Auth Response</h4>

<div class="impl">

```swift
typealias AuthResponse = (AuthSession?, AuthError?) -> Void
```

</div>

<i>From the Swift docs</i>

<blockquote>A typealias in Swift is literally an alias for an existing type.</blockquote>

This typealias bundles the existing types `AuthSession` and `AuthError`, which we'll see in a minute.

Swift is a null safe language. It uses the question mark charcater `?` to indicate that this object is either the object, or nil. It is an <i>optional</i> type.

Null checking is central to the EZClientAuth framework, so let's explore this before continuing development.

<h4>Leveraging Null Checks to Direct Authentication Flow</h4>

Null-safe languages like Kotlin and Swift force you to answer the question <i>"What happens if this object is nil?"</i> at compile time, not runtime. So rather than receiving a surprising `undefined` or `NullPointerException` after building, or worse, in production, you receive compiler errors requesting that you as a developer consider the null case.

We'll use Swift's built-in null-checking features, the `guard` statement and `if let` blocks to guide the flow of authentication around the many errors that may occur.

An idiomatic null-checking flow:

<div class="impl">

```swift
guard error == nil else {
    // Complete with the error
    completion(nil, error)
    return
}
// ERROR-FREE ZONE HEREAFTER!

guard object != nil else {
    // Account for the fact that you object is nil
    completion(nil, "The Object is nil!")
    return
}

// Complete with your object and no errors
completion(object, nil)

// Safely code seure in the fact that ZERO errors occurred
// and your Object is not nil :-)
```

</div>

A `guard` checks the condition it precedes, and if it is false, the control flow is forced to return in the else block, ensuring that after the guard, that condition is guaranteed true.

<h4>Comprehensive Error Handling</h4>

<blockquote>As SDK developers, we are responsible for improving the lives of developers. Helpful error handling is central in achieving this goal.</blockquote>

Authentication is fertile ground for confusing errors. Let's create a wrapper around the deeper errors thrown by the `RemoteAuthProvider` (e.g. network errors) that will percolate these low-level errors in a developer-friendly manner.

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
AuthError.networkError("HTTP ERROR 401")
```

</div>

Let's create an enum, `AuthError`, to house all the possible errors we may encounted in Auth workflows, along with helpful error messages.

There are dozens that the EZClientAuth implements. Let's just start with `incorrectCredentials`.

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

Code that aspires to be a RemoteAuthProvider implements this interface. Our application code never knows about them.

<h2 style="text-decoration: underline;">DataStore</h2>

I want (underline this) some place to locally persist my auth session so that (underline this) my users don’t have to log in between each launch.

I want helpful error messages when serialization fails

<div class="impl">

```swift
public protocol AuthDataStore {
    func readAuthSession(_ completion: @escaping AuthResponse)

    func save(
        authSession: AuthSession,
        _ completion: @escaping ErrorResponse)

    func delete(_ completion: @escaping ErrorResponse)
}
```

</div>

At any one time, you really have 3 versions of AuthSession.

- The AuthSession in your DataStore
- The AuthSession on remote
- The AuthSession in your runtime

In order to maintian synchronization between these three, we must make it programatically impossible to:
a) Sign-in without overwriting the persisted AuthSession and the runtime AuthSession
b) Sign-out without clearing the persisted AuthSession and setting the runtime AuthSession to nil

Herein lies another responsibility belonging to neither the RemoteAuthProvider or the DataStore: synchronization.

We will create our core class to do this: the AuthManager.

<hr/>

<h2 style="text-decoration: underline;">AuthManager</h2>

<h4>The Behavior</h4>
I want a manager that synchronizes my AuthSession between the RemoteAuthProvider and the DataStore AND houses the one and only AuthSession as a property. This prevents a stale AuthSession in cache or in my application's runtime.

<h4>The Interface</h4>

<div class="impl">

```swift
public protocol AuthManager {
    var remoteAuthProvider: RemoteAuthProvider { get }
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

An AuthManager has a RemoteAuthProvider, a DataStore, and an AuthSession.

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

Let's break that down:

- Step 1: Send our sign-in credentials to our RemoteAuthProvider in exchange for our (AuthSession?, Error?) tuple
  (Red for error)
- Step 2: If there are errors, complete with the helpful AuthError.failedToSignInWithRemote so the consuming code knows exactly what part of the authentication process failed
- Step 3: Ensure the authSession is not nil
- Step 3.5: If there somehow is no errors but also no errors, complete with the helpful AuthError.failedToRetrieveAuthSession so the consuming code knows exactly what part of the authentication process failed
- Step 4: Attempt to persist the AuthSession returned from our RemoteAuthProvider to our DataStore
- Step 5: Ensure there are not errors
- Step 6: Save that AuthSession onto our AuthManager
- Step 7: Complete with out AuthSession and no errors

Using Nulls to Guide your Auth Workflow:
1: Do something with remote
1.5 Make sure errors are null

2: Do something with data store
2.5 Make sure errors are null

3: Complete with the AuthSession

Rinse and repeat

Synchronization is a matter of enumerating your states and ensuring all roads lead to synchronization.

AuthSession Synchronization:
1: No AuthSession should be persisted if errors are thrown by RemoteAuthProvider
2: Sign-in should immediately perist AuthSession once it's received from RemoteAuthProvider
3: Sign-out should immediately remove AuthSession once we sign-out from RemoteAuthProvider

<h2 style="text-decoration: underline;">Auth</h2>

We could just allow the consuming code to create as many AuthManagers as they want, but this would .

<blockquote>The tradeoff in SDK development is opinionated vs. flexible. Shoot for 80% approval.</blockquote>

I can think of few circumstances in which the consuming code would be benefit from multiple AuthManager's all with different states.

AuthManager checks off all three of my usualy criteria for making a singltone:

- The object is used in many parts of the application
- It's conceptually difficult to imagine a need for more than one of that object to exist simultaneously
- Changes to the object should be shared across across the application

AuthSession abides by all three, namely:
1: Any code that makes remote calls will likely need an authentication token in its header
2: There really aren't any (common?) use cases that would predicate multiple AuthSession floating around
3: If I refresh my AuthSession in one process, I want that new AuthSession to be propogated to everywhere else, god forbid a stale one is used.

If the above three criteria are not true, you may be better off just injecting through initializers or setters as need as needed and spare yourself the trouble of Singletons.
(e.g. testing, which we'll cover in Part III).

The honor of the Singleton now upheld, lets create a construct, simply called Auth, that will be the consuming code's entry point to a singleton AuthManager, owner of the one and only AuthSession.

<div class="impl">

```swift
public struct Auth {
    // 1: Singleton AuthManager for sign-in, sign-out, etc.
    static public let manager: AuthManager = AuthManager()

    // 2: Convenience getter for the authSession
    static public var session: AuthSession? {
        return manager.authSession
    }

    // 3: Sole exposed method for configuring AuthManager with the application-provided choice of RemoteAuthProvider and optional DataStore
    static public func configure(
        for authProvider: AuthProvider,
        with dataStore: AuthDataStore? = nil) {
        // 3.5 Hand off AuthProviderChoice and datastore to the singleton manager
        manager.configure(
            for: authProvider,
            with: dataStore)
    }
}
```

</div>

In case it was parsed over, here's the MONEYSHOT one more time:

// link in nav to MONEYSHOTs dropdown menu
// nav has CONTEXT MONEYSHOT
// AuthSession RemoteAuthProvider DataStore AuthManager Auth
`manager.configure(for: authProvider, with: dataStore)`

We can configure our AuthManager with any authProvider and any dataStore and rest assured that our cached AuthSession, runtime AuthSession, and remote AuthSession all remain in sync.

SIDENOTE: To the keen eyed among you, this may look familair. It's is inspired by FirebaseAuth with Firebase.configure(). and Auth.auth() syntax.

That's it. The implementation of signOut, isAuthenticated, and any other authentication behaviors follow naturally from this.

SignOut

signOut: Sign out from RemoteAuthProvider. If successful, it should clear the AuthSession from the DataStore.

isAuthenticated
isAuthenticated should first check the local DataStore for an AuthSession. Finding one, it should check if it’s expired with RemoteAuthProvider. If valid, you are authenticated. If either of these two steps fails or returns nil, user is not authenticated.

(2 GIFs of conditional flows based on auth state)
(Unauthenticated, Authenticated)

The list goes on: account recovery and password resets, tokenRefreshes. These are concepts that scale, whatever you need can be added to the AuthSession and AuthManager.

Useful for startups. You don’t want to be on Firebase forever.

The moral of DDD:
Maintain the blast-zone of rapidly changing business decisions to folders titled “Implementation.” Let your app talk to files in directories titled things like “AuthenticationManager” and “RemoteAuthProvider” and you’re auth provider switching costs go from weeks to days.

Testing:
2 places:

- Testing the AuthManager itself
  Make a MockAuthManager that implements the AuthManager protocol. Give it a MockDataStore that implements the DataStore interface. Give the MockAuthManager a MockRemoteAuthProvider that implements the RemoteAuthProvider interface.

- Mocking AuthManager in the app itself so you can unit test your application
  Easily make a MockAuthManager in your app.
  Make MockAuthManager succeed when you want to test happy paths.
  Make MockAuthManager fail when you want to test error handling.

iOS Swift 5 Full Implementation
Here’s an implementation repo along with a sample app. It’s modularized, so you can import it as a module to your projects, and write your own implementations.

I use Keychain as my default data store because it’s encrypted, unlike UserDefaults (never store authentication credentials in UserDefaults) or FileSystem.
