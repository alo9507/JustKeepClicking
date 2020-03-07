import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges

    return (
      <>
        <Layout location={this.props.location} title={siteTitle}>
          <SEO title="just keep clicking" />
          <Bio />
          {posts.map(({ node }) => {
            const title = node.frontmatter.title || node.fields.slug
            return (
              <article key={node.fields.slug}>
                <header>
                  <h3
                    style={{
                      marginBottom: rhythm(1 / 4),
                    }}
                  >
                    <Link
                      className="article_link"
                      style={{
                        boxShadow: `none`,
                      }}
                      to={node.fields.slug}
                    >
                      {title}
                    </Link>
                  </h3>
                  <ul
                    style={{
                      marginBottom: "0px",
                      marginLeft: "0px",
                      fontSize: "14px",
                    }}
                  >
                    {node.frontmatter.tags.map(tag => {
                      return (
                        <li
                          style={{
                            display: "inline",
                            marginRight: "20px",
                          }}
                        >
                          <Link
                            style={{ boxShadow: "none" }}
                            to={`/tags/${tag}`}
                          >
                            {`#${tag}`}
                            {` `}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  <small className="frontpage_date">
                    {node.frontmatter.date} • {node.fields.readingTime.text}
                  </small>
                </header>
                <section className="article_description">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: node.frontmatter.description || node.excerpt,
                    }}
                  />
                </section>
              </article>
            )
          })}
        </Layout>
      </>
    )
  }
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
            readingTime {
              text
            }
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
            tags
          }
        }
      }
    }
  }
`
