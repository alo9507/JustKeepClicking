import React from "react"
import Layout from "../components/layout"
import Image from "gatsby-image"
import { rhythm } from "../utils/typography"

const Resources = () => {
  return (
    <Layout location={"/about-me"} title={"just keep clicking"}>
      <h1 style={{ textAlign: "center", marginTop: "0px" }}>Dev Resources</h1>

      <h2>Learn React</h2>
      <a href="https://www.udemy.com/course/react-redux/">
        Stephen Grider's Udemy Course
      </a>
      <p>
        Stephen Grider's Excellent Udemy Course. No rush... Udemy is
        oxymoronically always having a "flash" sale)
      </p>

      <h2>Learn GraphQL</h2>
      <a href="https://graphql.dev/news/2019/10/31/linux-foundation-training-announces-a-free-online-course-exploring-graphql-a-query-language-for-apis/">
        Linux Foundation GraphQL Course
      </a>
      <p>
        The Linux Foundation houses the GraphQL Foundation and have kindly
        created this awesome course to get you started
      </p>
      <br />
      <br />
      <br />
    </Layout>
  )
}

export default Resources
