import React from "react"
import Layout from "../components/layout"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"
import { rhythm } from "../utils/typography"

const AboutMe = () => {
  const data = useStaticQuery(graphql`
    query AboutMeQuery {
      avatar: file(absolutePath: { regex: "/coffee.jpg/" }) {
        childImageSharp {
          fixed(width: 150, height: 150) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author
          social {
            twitter
          }
        }
      }
    }
  `)

  const { author, social } = data.site.siteMetadata
  return (
    <>
      <Layout location={"/about-me"} title={"just keep clicking"}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <h1 style={{ textAlign: "center" }}>andrew o'brien</h1>
          <Image
            fixed={data.avatar.childImageSharp.fixed}
            alt={author}
            style={{
              marginRight: rhythm(1 / 2),
              marginBottom: 0,
              minWidth: 200,
              minHeight: 200,
              borderRadius: `100%`,
            }}
            imgStyle={{
              borderRadius: `50%`,
            }}
          />
        </div>
        <p>
          Passionate about pair programming, test-driven development, and mobile
          development.
        </p>
        <p>
          I studied at Georgetown University, Class of 2018. Started in an
          International Business track then switched to major in Linguistics
          with a focus in Computational Linguistics and Mandarin.
        </p>
        <a href="https://github.com/alo9507">GitHub</a>
        <br />
        <a href="https://www.linkedin.com/in/andrew-o-brien-4ab468105/">
          Linked In
        </a>
      </Layout>
    </>
  )
}

export default AboutMe
