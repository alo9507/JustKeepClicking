import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm, scale } from "../utils/typography"
import Helmet from "react-helmet"

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    const { tags } = post.frontmatter.tags

    return (
      <>
        <Helmet>
          <script defer>
            {`
              /**
               *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
               *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables*/
              /*
              var disqus_config = function () {
              this.page.url = "https://www.justkeepclicking.io/auth/";  // Replace PAGE_URL with your page's canonical URL variable
              this.page.identifier = "auth"; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
              };
              */
              (function() { // DON'T EDIT BELOW THIS LINE
              var d = document, s = d.createElement('script');
              s.src = 'https://justkeepclicking-io.disqus.com/embed.js';
              s.setAttribute('data-timestamp', +new Date());
              (d.head || d.body).appendChild(s);
              })();
          `}
          </script>
          <noscript>
            {`
            Please enable JavaScript to view the{" "}
            <a href="https://disqus.com/?ref_noscript">
              comments powered by Disqus.
            </a>
            `}
          </noscript>
        </Helmet>
        <Layout location={this.props.location} title={siteTitle}>
          <SEO
            title={post.frontmatter.title}
            description={post.frontmatter.description || post.excerpt}
          />
          <article>
            <header>
              <h1
                className="article_title"
                style={{
                  marginTop: rhythm(1),
                  marginBottom: 0,
                }}
              >
                {post.frontmatter.title}
              </h1>
              <p
                className="article_date"
                style={{
                  ...scale(-1 / 5),
                  display: `block`,
                  marginBottom: rhythm(1),
                }}
              >
                {post.frontmatter.date}
              </p>
              {tags.map(tag => {
                return <h2>{tag}</h2>
              })}
            </header>
            <section
              className="artcile_body"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
            <hr
              className="bottom_hr"
              style={{
                marginBottom: rhythm(1),
              }}
            />
            <footer>
              <Bio />
            </footer>
            <div id="disqus_thread"></div>
          </article>

          <nav>
            <ul
              className="prev_next_link"
              style={{
                display: `flex`,
                flexWrap: `wrap`,
                justifyContent: `space-between`,
                listStyle: `none`,
                padding: 0,
              }}
            >
              <li>
                {previous && (
                  <Link
                    className="prev_link"
                    to={previous.fields.slug}
                    rel="prev"
                  >
                    ← {previous.frontmatter.title}
                  </Link>
                )}
              </li>
              <li>
                {next && (
                  <Link className="next_link" to={next.fields.slug} rel="next">
                    {next.frontmatter.title} →
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </Layout>
      </>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
        tags
      }
    }
  }
`
