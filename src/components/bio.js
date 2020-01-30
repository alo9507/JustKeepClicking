/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"
import { Link } from "gatsby"
import { rhythm } from "../utils/typography"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/andrew_lg.jpg/" }) {
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
    <div
      style={{
        display: `flex`,
        marginBottom: rhythm(2.5),
      }}
    >
      <Image
        fixed={data.avatar.childImageSharp.fixed}
        alt={author}
        style={{
          marginRight: rhythm(1 / 2),
          marginBottom: 0,
          minWidth: 150,
          minHeight: 150,
          borderRadius: `100%`,
        }}
        imgStyle={{
          borderRadius: `50%`,
        }}
      />
      <div
        style={{
          display: `flex`,
          flexDirection: "column",
        }}
      >
        <p className="bio_description">
          dev thoughts of <br />{" "}
          <strong>
            <Link
              style={{
                boxShadow: `none`,
                textDecoration: `underline`,
              }}
              to={`/andrew-obrien`}
            >
              {author}
            </Link>
          </strong>
        </p>
        <strong>
          <Link
            style={{
              boxShadow: `none`,
              textDecoration: `underline`,
            }}
            to={`/resources`}
          >
            modern developer resources
          </Link>
        </strong>
      </div>
    </div>
  )
}

export default Bio
