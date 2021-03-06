import React from "react";
import Layout from "../components/layout";
import { useStaticQuery, graphql } from "gatsby";
import Image from "gatsby-image";
import { rhythm } from "../utils/typography";

const AboutMe = () => {
  const data = useStaticQuery(graphql`
    query AboutMeQuery {
      avatar: file(absolutePath: { regex: "/coffee_crop.png/" }) {
        childImageSharp {
          fixed(width: 250, height: 250) {
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
  `);

  const { author } = data.site.siteMetadata;
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
              minWidth: 250,
              minHeight: 250,
            }}
            imgStyle={
              {
                // borderRadius: `50%`,
              }
            }
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
                className="fab fa-github fa-2x"
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
                  className="fab fa-linkedin-in fa-2x"
                  style={{
                    color: "var(--textLink)",
                  }}
                ></i>
              </a>
            </div>
          </div>
        </div>
        <p>
          Welcome! I'm Andrew, a fullstack software engineer living in Boston.
          </p>
        <p>
          I work for Wolfram Research on Wolfram | Alpha.
          </p>
        <p>
          Previously I worked for {` `}
          <a href="https://www.integral.io">Integral</a> in Detroit with Ford Autonomous
          Vehicles LLC as a Mobile (iOS) Engineer on the Mobile Infrastructure
          Team and with Ford Motor Company on the Dynamic Routing team. Other software dev related escapades include participating in <a href="https://community.wolfram.com/groups/-/m/t/2029824">Wolfram Summer School 2020</a> and writing for this blog.
        </p>
        <h2>PM -> Software Engineer</h2>
        <p>
          I began my journey into software as a Product Manager, but quickly
          realized that I wanted to build rather than manage products. Tutorial
          by tutorial and book by book, I transitioned from acting as a business
          liason to tech, to acting as a tech liason to business.
        </p>
        <h2>If We Want it We Build It</h2>
        <p>
          For the first year or so I lived by the modus operandi of {" "}
          <b>
            <i>"If I want it, I build it."</i>
          </b>{" "}
        </p>
        <p>
          Curious how GraphQL compares to REST? Build an API with both and see
          for yourself. Can React Native supplant native development? Build with
          both and form your own opinion.
        </p>
        <p>
          This approach worked great!...but it came with major shortcomings: it
          doesn't scale, and it gets lonely quick.
        </p>
        <p>
          Adjusting the motto slightly I now prefer {" "}
          <b>
            <i>"If we want it, we build it."</i>
          </b>
        </p>
        <p>
          Sounds motivational-postery, but I mean it. I spend most of my time experimenting with different techniques for
          growing codebases into something people look forward to collaborating
          on, and how pair programming and test-driven development cooperate to
          do the same.
        </p>
        <p>
          From this I've developed several tenets of my core software belief system.
          <br />
          <br />
          <ul>
            <li>
              <b>A)</b> Developer experience WILL manifest in user experience
            </li>
            <li>
              <b>B)</b> Developer experience is a product of codebase
              architecture, developer-to-manager and developer-to-developer
              interaction, and freedom to choose the right tools
            </li>
            <li>
              <b>C)</b> Without the presence of a shared, domain-driven langauge
              uniting both codebase and business, most meetings are just people
              talking past each other
            </li>
          </ul>
        </p>
        <h2>justkeepclicking.io</h2>
        <p>
          <b>justkeepclicking.io</b> is where I learn in public and broadcast
          development techniques I see working for my teams to the wider
          community.
        </p>
        <p>It's like open source learning.</p>
      </Layout>
    </>
  );
};

export default AboutMe;
