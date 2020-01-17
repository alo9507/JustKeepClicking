---
title: Domain Driven Authentication
date: "2020-01-13T22:12:03.284Z"
description: "Set your development team free with this reusable multi-provider authentication framework: EZClientAuth"
---

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

An Authentication framework that grows with your project.

Authentication is hard. Authentication is less hard when you reduced to its component parts. This we call its domain.

A domain keeps you abstracted just far enough from your auth implementation to think clearly, yet close enough to save it from becoming the most seductive carrot in programming - a useless abstraction.

There are three components to client-side authentication:

- AuthSession: An object encapsulating authentication state, i.e. the authentication token.

- RemoteAuthProvider: A remote service capable of creating, removing and updating AuthSessions using some kind of credential.
  Examples: Firebase, Auth0, Keycloak

- DataStore: An on-device cache for persisting your AuthSession between application launches
  Example: browser local storage, Keychain or FileSystem on iOS

Using only the above 3 constructs, we will build an Authentication domain capable of

Features:

- Basic Auth CRUD: sign-in, sign-out, checking if the client is already authenticated
- Persisted login between application launches
- Ability to change authentication provider in a single line of code

- Even if you don't know Swift, I promise this framework will conceptually wherever a client has to prove its identity.

<h4>Constraints + Requirements</h4>

1. Expose the minimum amount of surface area necessary for the application to fulfill its authentication tasks
2. Be fully testable/mockable
3. Allow for arbitrary remote authentication providers (e.g. Auth0, Firebase, Keycloak)
4. Allow for arbitrary client-side caches

<h4>Approach</h4>
Domain/Interface Driven Development: No mention of implementations

<h3>The Golden Rule of DDD</h3>

<i>Start with what we want (coding by wishful thinking), then work backwards to the abstractions which succinctly deliver that behavior.</i>

The key statement in DDD:

I want \_**\_ that does \_\_** so that **\_**.
I want some X that does Y. My app Z doesn’t care what X is.

If you can fill in the blanks above for your domain, and create an interface to accomplish those tasks, you can reap the beneifts of DDD, which include

<h4>Benefits of DDD</h4>

1. Prevent vendor lock-in: Interface Driven Design reduces switching costs by reducing a) the lines of code you need to change in a refactor, and b) encapsulating those lines of code to a smaller area, in our case one file per auth provider

2. Fine-grained error handling: When you’re domain has been reduced,

3. Straightforward testing

Let’s get started with the nucleus of authentication: the auth session.

<h2>AuthSession</h2>

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

<h2>RemoteAuthProvider</h2>

<h4>The Ask</h4>
I want <span style="text-decoration: underline; font-weight: 900">something that takes an email and password and returns an AuthSession if successful, or a helpful error message if unsuccessful.</span>

<h4>The Interface</h4>

<div class="impl">

```swift
protocol RemoteAuthProvider {}
```

</div>

I want something I give an email and password, or a phone number and password, that return me an AuthSession or helpful error message if it fails.

Let's add signIn to the protocol

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

The `email`, `phoneNumber` and `password` are all Optionals to allow for maximum flexibility in implementing new `RemoteAuthProvider`s.

<h4>Auth Response</h4>

<div class="impl">

```swift
typealias AuthResponse = (AuthSession?, AuthError?) -> Void
```

</div>

<i>From the Swift docs</i>

<blockquote>A typealias in Swift is literally an alias for an existing type.</blockquote>

This typealias bundles the existing types `AuthSession` and `AuthError`, which we'll see in a minute.

<h4>The Null Safe Tango</h4>

The `?` makes the return `Optional`.

Is error nil?

- Yes. Continue execution.
- No. Throw and AuthError with that error

Is there an AuthSesion?

- Yes. Continue execution.
- No.

<div class="impl">

```swift
guard error == nil else {
    // account for the error then return
}

guard object != nil else {
    // account for the fact that you object is nil then return
}

// safely code knowing that ZERO errors occurred and your return object is not nil :-)
```

</div>

<h4>Comprehensive Error Handling</h4>

I want <span style="text-decoration: underline; font-weight: 900">something that let's me control how errors are presented to the consuming code.</span>

Let's create an enum, `AuthError`, to house all the possible errors we may encounted in Auth workflows, along with helpful error messages.

Included here are just a few.

<div class="impl">

```swift
public enum PUBAuthError: Error, Equatable {
    case failedToPersistUserSessionData(_ error: String)
    case failedToSignInWithRemote(_ error: String)
    case wrongEmail(_ error: String)
    case wrongPassword(_ error: String)

    public var errorDescription: String? {
        switch self {
        case .failedToReadLocalAuthSession(let error):
            return "Failed to read locally persisted : \(error)"
        }
        case .failedToSignInWithRemote(let error):
            return "Failed to sign in with remote auth provider: \(error)"
    }
}
```

</div>

This custom error gives you as an app or SDK developer intimate control over how network and caching errors percolate up to the consuming application.

Code that aspires to be a RemoteAuthProvider implements this interface. Our application code never knows about them.

<h2>DataStore</h2>

I want (underline this) some place to locally persist my auth session so that (underline this) my users don’t have to log in between each launch.

I want helpful error messages when serialization fails

<div class="impl">

```swift
public protocol PUBAuthDataStore {
    func readAuthSession(_ completion: @escaping PUBAuthResponse)
    func save(authSession: PUBAuthSession, _ completion: @escaping PUBErrorResponse)
    func delete(_ completion: @escaping PUBErrorResponse)
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

<h2>AuthManager</h2>

I want a manager that synchronizes my AuthSession between the RemoteAuthProvider and the DataStore AND houses the one and only AuthSession as a property so that I never have a stale AuthSession in cache or in my application's runtime.

An AuthManager has a RemoteAuthProvider, a DataStore, and an AuthSession.

<div class="impl">

```swift
public protocol PUBAuthManager {
    var authProvider: PUBAuthProvider? { get }
    var dataStore: PUBAuthDataStore { get }
    var authSession: PUBAuthSession? { get }

    func signIn(email: String?, password: String?, phoneNumber: String?, _ completion: @escaping PUBAuthResponse)
}
```

</div>

Let's see how AuthManager facilitates signing in.

signIn: Sign in with RemoteAuthProvider in exchange for an AuthSession. If successful, it should persist the AuthSession to the DataStore then assign itself that AuthSession.

<div class="impl">

```swift
    func signIn(email: String? = nil, password: String? = nil, phoneNumber: String? = nil, _ completion: @escaping PUBAuthResponse) {
        // 1
        remoteAuthProvider.signIn(email: email, password: password, phoneNumber: phoneNumber) { [weak self] (authSession, error) in
            guard error == nil else {
                // 2
                return completion(nil, PUBAuthError.failedToSignInWithRemote("email: \(email), password: \(password) \(error!.localizedDescription)"))
            }

            // 3
            guard let authSession = authSession else {
                // 3
                return completion(nil, PUBAuthError.failedToRetrieveAuthSession("No AuthSession, but also no errors?"))
            }

            // 4
            self?.dataStore.save(authSession: authSession, { (error) in
                guard error == nil else {
                    // 5
                    return completion(nil, PUBAuthError.failedToPersistUserSessionData(error!.localizedDescription))
                }
                // 6
                self!.authSession = authSession
                // 7
                completion(authSession, nil)
            })
        }
    }
```

</div>

Let's break that down:
1: Send our sign-in credentials to our RemoteAuthProvider in exchange for our (AuthSession?, Error?) tuple
(Red for error)
2: If there are errors, complete with the helpful PUBAuthError.failedToSignInWithRemote so the consuming code knows exactly what part of the authentication process failed
3: Ensure the authSession is not nil
3.5: If there somehow is no errors but also no errors, complete with the helpful PUBAuthError.failedToRetrieveAuthSession so the consuming code knows exactly what part of the authentication process failed
4: Attempt to persist the AuthSession returned from our RemoteAuthProvider to our DataStore
5: Ensure there are not errors
6: Save that AuthSession onto our AuthManager
7: Complete with out AuthSession and no errors

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

We will hide our AuthManager behind an enum, and expose only the PUBAuthManager interface.

<h2>Auth</h2>

Keeping these

Top 3 Reasons for Using a Singleton:

- The object is used in many parts of the application
- It's conceptually difficult to imagine a need for more than one of that object to exist simultaneously
- Changes to the object should be reflected instantly across the application

AuthSession abides by all three, namely:
1: Any code that makes remote calls will likely need an authentication token in its header
2: There really aren't any (common?) use cases that would predicate multiple AuthSession floating around
3: If I refresh my AuthSession in one process, I want that new AuthSession to be propogated to everywhere else, god forbid a stale one is used.

If the above three criteria are not true, you may be better off just injecting through initializers or setters as need as needed and spare yourself the trouble of Singletons.
(e.g. testing, which we'll cover in Part III).

The honor of the Singleton now upheld, lets create a singleton AuthManager to house our one and only AuthSession.

<div class="impl">

```swift
public struct PUBAuth {
    // 1: Singleton AuthManager for sign-in, sign-out, etc.
    static public let manager: PUBAuthManager = AuthManager()

    // 2: Convenience getter for the authSession
    static public var session: PUBAuthSession? {
        return manager.authSession
    }

    // 3: Sole exposed method for configuring AuthManager with the application-provided choice of RemoteAuthProvider and optional DataStore
    static public func configure(for authProvider: PUBAuthProvider, with dataStore: PUBAuthDataStore? = nil) {
        manager.configure(for: authProvider, with: dataStore)
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

- Mocking PUBAuthManager in the app itself so you can unit test your application
  Easily make a MockAuthManager in your app.
  Make MockAuthManager succeed when you want to test happy paths.
  Make MockAuthManager fail when you want to test error handling.

iOS Swift 5 Full Implementation
Here’s an implementation repo along with a sample app. It’s modularized, so you can import it as a module to your projects, and write your own implementations.

I use Keychain as my default data store because it’s encrypted, unlike UserDefaults (never store authentication credentials in UserDefaults) or FileSystem.
