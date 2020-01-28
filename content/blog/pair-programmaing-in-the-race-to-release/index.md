---
title: Pair Programming in the The Race to Release | Part 1
date: "2020-01-13T22:12:03.284Z"
description: "What part of the software development equation does pairing improve?"
---

<blockquote>Enterprise asks of pair programming culture: why would I pay two developers to do the job of one?</blockquote>

This legitimate concern with pairing stems from the following notion about the nature of software release time:

<img src="./StartingEquation.svg" alt="equation_1" class="equation">

Where number of developers is taken to mean <i>independently operating</i> developers. If this were all there is to determing <b>Time-to-Release (TTR)</b>, then coalescing the efforts of two developers onto a single task should effectively <i>double</i> the time it takes to complete a project.

But this is not what we see in practice. This two-part series attempts to formulate a more full-fledged TTR equation in Part I, then show how pairing effects TTR in Part II.

Frederick Brooks says it well in the classic software engineering anthology, [The Mythical Man-Month](https://www.amazon.com/Mythical-Man-Month-Software-Engineering-Anniversary/dp/0201835959/ref=sr_1_1?crid=3O2L8PDSPQDPI&keywords=the+mythical+man+month&qid=1580174025&sprefix=the+mythical+man+m%2Caps%2C140&sr=8-1):

<blockquote>...our estimating techniques fallaciously confuse effort with progress, hiding the assumption that [people] and months are interchangable</blockquote>

Our TTR equation will operate under a <i>ceteris paribus</i> assumption, i.e. all other factors outside of software engineers, their skill and their interactions with each other being held equal.

This is intended as a framework for capacity planning nad explicitly stating the variables. Without a culture of self and peer assessment, and an awareness of known unknowns, it's not useful.

<h2>Codebase Divided by Humans</h2>

Before we get started adding complexities to the TTR equation, let's first observe the fact that one level of abstraction higher than the equation above, we arrive at:

<img src="./CodeOverHuman.svg" alt="technical_ability" class="equation">

The more complex the codebase factor, the higher the TTR.

The more maximized the human factor, the lower the TTR.

With this in mind, let's go through those codebase and human factors one by one.

<h2>Technical Ability of Programmers</h2>

Not all programmers are of equal technical skill. Software development is nothing more than hundreds of small decisions every day. Experienced devs make better decisions quicker.

Thus:

<img src="./TechnicalAbility.svg" alt="technical_ability" class="equation">

The greater the technical ability, the fewer developers <i><b>n</b></i> necessary to achieve the same TTR.

The mythical 10x engineer fits in here as a major factor, with a massive skill weighting.

<h2>Code Reuse</h2>

Good devs code well, but great devs know how to lift, adapt and integrate existing code into a new feature.

Reusable code can be integrated from one of two places:

- <b>1st Party</b>: This is code that is either already in the codebase solving a similar but not identical problem, or some other part of your organization
  </br>
  <i class="example">Examples: Reusable UI Components, services</i>

- <b>3rd Party</b>: SaaS and open-source packages

The decision to build from scratch versus integrating reusable code should be made in light of the estimated <i>net value of reusable code</i>:

Net Value of Reusable Code = Custom Build Effort - Integration Effort

There are other things to consider with 3rd Party code, like the risk of adding a dependency to the project and the loss of cuztomizability if you adopt 3rd party code.


If it takes more time and energy to integrate existing code than it would be to build from scratch, the net value becomes negative and lengthens TTR rather than shortening it.

Thus:

<img src="./CodeReuse.svg" alt="technical_ability" class="equation">

<h2>Codebase Size Divided By Codebase Quality</h2>

<blockquote>Proper architecture allows codebases to grow in size without increasing in complexity.</blockquote>

As the codebase grows in size, the possibility for regressions caused by new features grows.

This is why greenfield projects often enjoy very high velocity early on: there are fewer constraints on each user story.

Though it's certainly a factor in TTR, Codebase Size cannot be considered as a TTR factor in isolation. What if the codebase were 1 million lines, but thanks to proper modularization, the feature could effectively ignore all but a single integration point in that codebase? The correlation between codebase size and TTR is meaningless separate from Codebase Quality.

The greater the quality of a codebase, the less effect codebase size should have on time-to-release.

"Codebase quality" is intentionally general, including everything from properly deployed architectural patterns and naming consistency, to performance and documentation.

Good architecture and documentations allow codebases to grow in size without increasing in complexity. New features fit snugly into existing paradigms rather than being solved in an ad hoc “take it as it comes” manner that leads to gross interdependencies and spaghetti code.

We reflect this by dividing codebase size by codebase quality, since quality offsets the negative effects of size.

<img src="./CodebaseQuality.svg" alt="technical_ability" class="equation">

Even in a monorepo as massive as Google's, codebase size may not effect TTR if the quality is such that the place to add new modules is obvious and not interdependent.

<h2>Codebase Familiarity</h2>

Codebase familiarity, or source code awareness, here encapsulates:

- <b>Tribal knowledge</b>: “I remember what we named that method - let me just search for it”
- <b>Architectural knowledge</b>: “How should I implement this new screen with navigation and networking. I should use the precedent set by the Coordinator pattern and Repository pattern.”

Codebase familiarity is the ability to reach for precedent in existing code rather than solving the problem for the first time. Familiarity enables much faster code discoverability.

Codebase familiarity lets you solve problems once and use that answer everywhere.

Even a great developer in uncharted territory may perform slower than a less skilled dev familiar with the ley of this land, however idiosyncratic it may be.

In my mind "code discoverability" has to do with general code hygiene: are variable names sufficiently descriptive? Is the codebase searchable and documented well? "Code familiarity" on the other hand resides in the mind and memory of the developer.

I think familiarity isn't quite as valuable as technical skill, so we add it rather than multiply it by the individual developer.

<img src="./CodebaseFamiliarity.svg" alt="technical_ability" class="equation">

<h2>Upskilling Opportunities during Project</h2>

<blockquote>You are not the same developer towards the end of a project as you were at the beginning. Programmer skill is dynamic across time. Programmer skill makes step-wise leaps when a new concept is realized, then levels off asymptotically as the new lesson settles in. The amount of growth is proportional to the quantity and diversity of upskilling opportunitites presented to developers during a project.</blockquote>

Let's unpack that statement, in particular why I think improvement is both logarithmic and step-wise.

Why do I say tehcnical skill improves logarithmically? Because revelations level-off to new plateaus. An initial boost levels off to a new norm.

Why step-wise? Becuase revelations by definition only come once in a while, and they take time to sink in. An "aha!" moment paired with practice is what lifts a developer to the next level.

So we should multiply the skill weighting of an individual programmer by upskilling opportunitities in order to reflect this reality of change in skill over the lifetime of a feature or project.

<i>Upskilling time</i> is a rough estimate of how deep into the projet a developer is and how many upskilling opportunitites have been presented to the developer along the way.

It’s the job of a good team leader, particularly a technical one, to figure out what plateaus people are in, what revelations are needed to break out of those plateaus, and how to deliver them. This greatly effects TTR.

Upskilling opportunities is where the 10x Engineer’s cool cousin, the Team Multiplier Engineer, acts as a major scaling factor. Some devs just teach really well. They care that others know what they know. They multiply the lesser abilities of other devs on the team with their positivity, kindness, and knack for succinct and comprehensible explanations of complex subject.

Let's add Upskilling during Project to our Skill Weighting to reflect the increase in skill the most programmers undergo on a well managed project.

<img src="./UpskillingOpportunity.svg" alt="technical_ability" class="equation">

<h2>A Tentative Time to Release Equation</h2>

Endlessly debatable, but here’s what I take to be a more realistic equation for determing time to release a new feature:

<img src="./FinalEquation.svg" alt="final_equation" class="equation">

A powerful symmetry emerges. The top half of the equation is all technical factors. The bottom half of the equation is all human factors.

The lead Software Engineer is responsible for minimizing the top half of this equation, i.e. the codebase half. They can do this by increasing code quality, properly determining when to employ reusable code.

Both the Product Manager and the lead Software Engineer together are responsible for maximizing the bottom half of this equation, i.e. the human half. They can do this by facilitating knowledge shares on the project and proper;y onboarding new hires.

Ideally, a partnership exists between the PM and Lead Software Engineer to jointly minimize TTR by singling out and increasing/decreasing the factors we outlined above.

<h2>Time for Part II</h2>

Let's now return to the original question:

<blockquote><b>QUESTION</b>: How does pair programming effect time to release?</blockquote>

I attempt an answer to this question in Part II: [How Pair Programming Effects TTR](/pair-programming-answer/)
