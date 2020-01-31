---
title: Open Source PR Number One
date: "2020-01-13T22:12:03.284Z"
description: " "
---

I've never made an open source contribution. After reading Eric Raymond's [The Cathedral and the Bazaar](https://www.amazon.com/Cathedral-Bazaar-Musings-Accidental-Revolutionary/dp/0596001088/ref=sr_1_1?crid=NDMVJQ6VR94C&keywords=cathedral+and+the+bazaar&qid=1580359078&sprefix=cathedral+and+the+ba%2Caps%2C142&sr=8-1), I felt the time had come to break the seal and see where it might lead.

Here's how I started, the absolute simplest way possible.

<h2>First Timers Only</h2>

[First Timers Only](https://www.firsttimersonly.com/)

After a simple Google of "easy open source contributions", I found the site above which led me to a good sequence of other first time OSS contribution sites.

<h2>First Contributions</h2>

Github: [First Contributions](https://github.com/firstcontributions/first-contributions)

This repo is as easy as it gets to try a risk-free, judgement-free first open source commit.

Your task: add yourself to the CONTRIBUTORS.md.

Since you dont have write-access to this repository, you'll learn how the Open Source contribution flow:

Fork -> Clone -> Modify -> PR your forked branch to base repository master

differs from full write-access contribution flow you're may be familiar with from work:

Branch -> Modify -> PR into master

Forking rather than branching also keeps the base repository from becoming to cluttered with experimental branches.

Good lesson. But I wanted to make a slightly larger contribution, something that would require actually pulling down and running a JavaScript or iOS project.

<h2>Up For Grabs</h2>

[Up For Grabs](https://up-for-grabs.net/)

I found this site called Up For Grabs. They curate OSS projects that tag issues as `Great First Timer` if they're low-hanging fruit.

I filtered by `javascript` and `swift` and randomly clicked on a few projects. I checked out their open issues.

Some projects had contributin guidelines with lengthy descriptions of standards upheld in the codebase.

I found [open-wc](https://github.com/open-wc/open-wc/labels/help%20wanted)

They were missing an `await` in an async test `README.md`.

I forked, added the `await` keyword in the docs, and PR'd my branch.

My tests passsed CircleCI. Nice.

A bot commented on my PR with a red ❌ prompting me to sign the Contributor License Agreement before my contribution could be accepted.

The link brought me to a webpage called [CLA Assistant](https://cla-assistant.io/) where I could sign in with my GitHub to sign the CLA. Easy enough.

I signed and it rerouted me to the project. Now I saw the message:

`All committers have signed the CLA.`

Great. I still had one more PR blocker.

Turns out my commit message of "added missing await to testing README.md" did not abide by the projects guidelines.

Something called [commitlint](https://github.com/conventional-changelog/commitlint) found 2 issues with my commit message:

`You may need to change the commit messages to comply with the repository contributing guidelines.`

I didn't know what those standards were and couldn't find them immediately, so I just looked at other commits and saw that documentation related issues were prefixed with `docs:`. That was probably it.

So I on my local I ran `git commit --amend`, modified my previous commit message to be prefixed with `docs:`, then I `git push -f`'d up to my remote branch.

This time I passed commitlint. The final check now was a code review by a maintainer.

Nice! Waiting time.

<h2>Lessons Learned</h2>

I can't truly call myself an open source contributor yet, but the seal has been broken.

- Forking prevents clutter and allows maximum access to auxiliary repos without adding contributors to main repo
- OSS requires stricter commit message standards, or standards for online communication in general
- Contributor License Agreements are often necessary before contributing
- I realized that it's not great to have auto-formatting on when you're working on OSS. If there's no common IDE config files, your apt to be making PRs that look WAY bigger than they really are thanks to formatting changes.

I didn't realize how often in the office I rely on proximity to facilitate communication. That's an impossibility in OSS and a lot of their strict standards could serve office environments well.

I think it would be cool to give several hours each month to your team to heavily encourage your developers to search for an open source project to contribute to. ANY Open Source project.

Don't wait to contribute to OSS. The medium is the message. The content is secondary to cracking the seal on giving back to an ecosystem and social economy that has given the world so much.
