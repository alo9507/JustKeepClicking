import React from "react"
import Layout from "../components/layout"
import Image from "gatsby-image"
import { rhythm } from "../utils/typography"

const Resources = () => {
  return (
    <Layout location={"/about-me"} title={"just keep clicking"}>
      <h1
        style={{ textAlign: "center", marginTop: "0px", marginBottom: "0px" }}
      >
        The Modern Dev
      </h1>
      <p style={{ textAlign: "center", marginTop: "0px", fontSize: "18px" }}>
        categorized best ofs
      </p>
      <h2>Canon</h2>
      <p>
        <a href="https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215/ref=sr_1_2?crid=15BD78KQGY5UE&keywords=domain+driven+design&qid=1580360758&sprefix=domain+driven+design%2Caps%2C140&sr=8-2">
          Domain Driven Design
        </a>
        <p>
          The one book you need to establish a shared domain langauge in
          meetings and in the code for your engineers executives, product
          managers, designers, architects
        </p>
      </p>
      <p>
        <a href="https://www.amazon.com/Mythical-Man-Month-Software-Engineering-Anniversary/dp/0201835959/ref=sr_1_1?crid=3HT0ZEZ6B53EI&keywords=the+mythical+man+month&qid=1580359031&sprefix=the+mythical+man%2Caps%2C140&sr=8-1">
          The Mythical Man Month
        </a>
        <p>Time to Release != # of Developers / Size of Project</p>
      </p>
      <p>
        <a href="https://www.amazon.com/Cathedral-Bazaar-Musings-Accidental-Revolutionary/dp/0596001088/ref=sr_1_1?crid=NDMVJQ6VR94C&keywords=cathedral+and+the+bazaar&qid=1580359078&sprefix=cathedral+and+the+ba%2Caps%2C142&sr=8-1">
          The Cathedral & the Bazaar: Musings on Linux and Open Source by an
          Accidental Revolutionary
        </a>
      </p>
      <p>
        <a href="https://www.amazon.com/Psychology-Computer-Programming-Silver-Anniversary/dp/0932633420/ref=sr_1_1?crid=2J9MP77Q99HJ2&keywords=the+psychology+of+computer+programming&qid=1580359145&sprefix=the+psychology+of+computer+%2Caps%2C189&sr=8-1">
          The Psychology of Computer Programming
        </a>
      </p>
      <p>
        <a href="https://www.amazon.com/Linux-Unix-Philosophy-Mike-Gancarz/dp/1555582737/ref=sr_1_1?crid=RVWTHUB5QYXD&keywords=linux+and+the+unix+philosophy&qid=1580359232&sprefix=linux+and+the+unix%2Caps%2C139&sr=8-1">
          Linux and the Unix Philosophy
        </a>
      </p>
      <p>
        <a href="https://www.amazon.com/Extreme-Programming-Explained-Embrace-Change/dp/0321278658/ref=sr_1_1?crid=1HWHSZW921SLV&keywords=extreme+programming+explained+2nd+edition&qid=1580360625&sprefix=extreme+programming+expl%2Caps%2C154&sr=8-1">
          Extreme Programming Explained
        </a>
        <p>
          On the Origins of Agile (Fun Fact: It was born in Detroit at Chrysler)
        </p>
      </p>
      <p>
        <a href="https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530/ref=sr_1_2?crid=3QBIVHQT1SUD2&keywords=test+driven+development+by+example&qid=1580360679&sprefix=test+driven+devel%2Caps%2C168&sr=8-2">
          Test Driven Development By Example
        </a>
      </p>
      <h2>Learn iOS</h2>
      <p>
        <a href="https://www.udemy.com/course/ios-13-app-development-bootcamp/">
          iOS 13 and Swift 5 - The Complete iOS App Development Bootcamp
        </a>
      </p>
      <p>
        <a href="https://www.pluralsight.com/courses/ios-11-fundamentals">
          Simon Alardice's iOS 11 Fundamentals
        </a>
      </p>

      <a href="https://store.raywenderlich.com/products/advanced-ios-app-architecture">
        Advanced iOS App Architecture
      </a>
      <p>
        A career-changingly good read on{" "}
        <a href="https://developer.apple.com/videos/play/wwdc2015/408/">
          Protocol Oriented Programming
        </a>{" "}
        and more with Swift. Explains how to scale your iOS codebase from
        example MVC app and into full-featured MVVM app
      </p>

      <p>
        <a href="https://github.com/raywenderlich/swift-algorithm-club">
          Swift Algorithm Club
        </a>
      </p>

      <p>
        <a href="https://www.raywenderlich.com/762435-swift-interview-questions-and-answers">
          Beginner, Intermediate and Advanced Swift Interview Questions and
          Answers
        </a>
      </p>

      <h2>Learn JAMStack</h2>
      <a href="https://www.youtube.com/channel/UC8bRyfU7ycLXnEBfvdorpUg/videos">
        JAMStack_conf 2019
      </a>
      <a href="https://github.com/gaearon/overreacted.io">
        Dan Abramov's Blog Repo
      </a>
      <a href="https://www.staticgen.com/">Static Site Generator Explorer</a>
      <a href="https://headlesscms.org/">Headless CMS Explorer</a>
      <a href="https://bejamas.io/blog/jamstack-seo-guide/">JAMStack + SEO</a>
      <a href="https://twitter.com/kylemathews?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor">
        Kyle Matthews' (Gatsby BDFL) Twitter
      </a>

      <h2>Learn React</h2>
      <a href="https://www.udemy.com/course/react-redux/">
        Stephen Grider's Udemy Course
      </a>
      <p>
        Stephen Grider's Excellent Udemy Course. No rush... Udemy is
        oxymoronically always having a "flash" sale
      </p>
      <h2>Learn GraphQL</h2>
      <a href="https://graphql.dev/news/2019/10/31/linux-foundation-training-announces-a-free-online-course-exploring-graphql-a-query-language-for-apis/">
        Linux Foundation GraphQL Course
      </a>
      <p>
        The Linux Foundation houses the GraphQL Foundation. They have kindly
        created this awesome course to get you started.
      </p>
      <h2>(Deeply) Learn Deep Learning</h2>
      <a href="https://www.fast.ai/">fast.ai</a>
      <p>
        Jeremy Howard is a democratizer of AI, a refreshingly practical
        programmer, and one of the best instructors I've ever had.
      </p>
      <a href="https://www.youtube.com/user/lexfridman">
        The Lex Friedman Podcast
      </a>
      <br />
      <br />
    </Layout>
  )
}

export default Resources
