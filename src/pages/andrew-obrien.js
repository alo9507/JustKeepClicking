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

  const { author } = data.site.siteMetadata
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
          <h1 style={{ textAlign: "center", marginTop: "0px" }}>
            andrew o'brien
          </h1>
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
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <a
              href="https://github.com/alo9507"
              style={{
                textDecoration: "none",
              }}
            >
              <i
                class="fab fa-github fa-2x"
                style={{
                  color: "var(--textLink)",
                }}
              ></i>
            </a>
            <div>
              <a
                href="https://www.linkedin.com/in/andrew-o-brien-4ab468105/"
                style={{ textDecoration: "none" }}
              >
                <i
                  class="fab fa-linkedin-in fa-2x"
                  style={{
                    color: "var(--textLink)",
                  }}
                ></i>
              </a>
            </div>
          </div>
        </div>
        <p>
          I'm Andrew, a fullstack software engineer living in Detroit. I work
          for {` `}
          <a href="https://www.integral.io">Integral</a> with Ford Autonomous
          Vehicles LLC as an iOS Engineer on the Mobile Infrastructure Team.
        </p>
        {/* <p>
          I studied at Georgetown University, Class of 2018. Started in an
          International Business track then switched to major in Linguistics
          with a focus in Computational Linguistics and Mandarin.
        </p> */}
      </Layout>
    </>
  )
}

export default AboutMe
