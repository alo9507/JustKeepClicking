import React from "react"
import Layout from "../components/layout"

class AboutMe extends React.Component {
  render() {
    return (
      <>
        <Layout location={this.props.location} title={"just keep clicking"}>
          <h1>Me</h1>
        </Layout>
      </>
    )
  }
}

export default AboutMe
