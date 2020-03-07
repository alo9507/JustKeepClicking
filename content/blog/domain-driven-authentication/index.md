---
title: EZClientAuth Part I - Core
date: "2020-02-06T22:12:03.284Z"
tags: ["software", "ddd", "swift", "authentication"]
description: "Domain Driven Authentication for clientside bliss"
---

<small>Special Thanks: [Jacob Pricket](https://www.linkedin.com/in/jacob-prickett-19a771a0/), [Eugene Pavlov](https://www.linkedin.com/in/epavlov29/), [Shivum Bharill](https://www.linkedin.com/in/shivum-bharill/), [Waseem Hijazi](https://www.linkedin.com/in/waseemhijazi/), [Waleed Johnson](https://www.linkedin.com/in/waleed-johnson-07873b63/)</small>

<blockquote>"All models are flawed. Some are useful." George E.P. Box</blockquote>

Today, we'll lay the foundation of [EZClientAuth](https://github.com/alo9507/EZClientAuth)<i>: A simple, provider-agnostic and domain driven approach to clientside authentication</i>.

EZClientAuth gives your app three new superpowers:

1. <b>Synchronization:</b> Synchronize authentication state between your remote auth provider, on-device cache, and the runtime of your app

2. <b>Flexibility</b>: Easily swap out auth providers in one line of code

3. <b>Testability</b>: Straightforward mocking of authentication state for unit testing

EZClientAuth gains this flexibility by adhering to the principles of Domain Driven Design (DDD) and Protocol Oriented Programming (POP). More on these codebase-saving paradigms later.

Today we'll be hacking with Swift. However, I promise that the domain driven core of EZClientAuth makes it conceptually portable to any language with interfaces (i.e. most).

Here's what EZClientAuth is capable of:

<h4>EZClientAuth Capabilities</h4>

- <b>Authentication CRUD Operations</b>: Sign-in, Sign-out, Sign-up, determining current authentication state
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

`EZAuth`
</br>The client's sole entrypoint to EZClientAuth

<h4>Domain Driven Design</h4>

<blockquote>The goal of domain-driven design is to create better software by focusing on a model of the domain rather than the technology. - Eric Evans</blockquote>

Domain Driven Design (DDD) is a term coined by Eric Evans in his 2004 book [Domain Driven Design: Tackling Complexity at the Heart of Software Development](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software-ebook/dp/B00794TAUG).

DDD strips away the accidental complexities of implementations and provides a modelling framework for development teams to focus on the inherent complexities of their domain without getting bogged down in technical detail.

DDD encourages developers to name by <i>function</i>, not implementation. This means there is no "the". There is only "a". The client calls "a RemoteAuthProvider", not "the FirebaseAuthProvider".

Here are some side-by-sides of Non-DDD names and their DDD equivalents:

<b>Non-DDD</b>: ❌ FirebaseAuthProvider</br><b>DDD</b>: ✅ RemoteAuthProvider

<b>Non-DDD</b>: ❌ KeychainDataStore</br><b>DDD</b>: ✅ AuthDataStore

<b>Non-DDD</b>: ❌ MongoDBClient</br><b>DDD</b>: ✅ UserRepository

Genericism endows your code with flexibility.

In Swift practice, DDD is manifested through Protocol Oriented Programming (POP).

The Three Steps of POP:

1. Create an intention-revealing protocol with generic, high level method names (e.g. `signIn`, `createUser`, etc.)
2. Create implementations that adopt the protocol
3. Write your code to the generic protocol methods, NEVER directly to the implementation.

Codebases built atop proper DDD patterns enjoy a number of benefits:

<b>Prevent vendor lock-in:</b> If you can easily change your implementations, then changing providers is less of a lift.

<b>Testability:</b> Because you've written to interfaces rather than implementations, you can always create mocks that implement that interface.

<b>Shared Domain-Driven Language:</b> Teams that adhere to DDD develop a shared domain vocabulary that spans technicals chasms starting in the codebase and extending all the way up into business meetings.

Today, we'll focus on developing a domain-driven sign-in process. Let’s get started by creating the nucleus of authentication: the `AuthSession`.

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

As your authentication needs grow more complex, you will want space to stretch your legs and add new properties, like a refresh token. The `AuthSession` class becomes what [Martin Fowler](https://martinfowler.com/) describes as <i>"a home that can attract useful behavior"</i>. A primitive String token would provide no room for future expansion.

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

Notice that `RemoteAuthProvider` is a protocol, i.e. an interface. `RemoteAuthProvider` describes the the properties and method signatures that an object aspiring to be a `RemoteAuthProvider` must provide. It does not implement these methods itself.

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

There are 2 scenarios for what is passed to the `(AuthSession?, AuthError?) -> Void` closure upon authentication completion:

<div class="example"><b>Scenario 1:</b> Authentication succeeded!</div>

`completion(authSession, nil)`</br>
We call the completion with the returned `AuthSession` and nil errors

<div class="example"><b>Scenario 2:</b> Authentication failed!</div>

`completion(nil, AuthError.*the specific error*)`</br>
We call the completion with a nil `AuthSession` and the particular `AuthError` that occurred.</br>

If you're curious about the details of the custom `AuthError`, you can check out [this article on responsible error handling](/wrap-your-errors-please).

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

Great! We can get an `AuthSession` by sending credentials to `RemoteAuthProvider.signIn(_:_:_:)` and persists the returned `AuthSession` by passing it to `AuthDataStore.save(_:_:)`.

How do we keep these two `AuthSession`s in sync? How will the client actually use this `AuthSession` at runtime to make authenticated calls to our backend?

Keep going to learn how to achieve simple synchronization in [EZClientAuth Part II - Synchronization](/domain-driven-authentication-synchronization).
