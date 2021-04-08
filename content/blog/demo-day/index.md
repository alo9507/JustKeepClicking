---
title: Prepping for Demo(lition) Day
date: "2021-04-08T22:12:03.284Z"
tags: ["devops", "ci/cd", "on-prem", "12 factor"]
description: "Building antifragile products through controlled avalanches"
---

## rm -rf / for Dummies

So the other day I nuked a test server. Jumped right into the test namespace and confidently ran `kubectl delete all --all`  (the `rm -rf /` of the Kubernetes world). "I'm on localhost!" I figured, until I saw unfamiliar containers terminating at lightning speed down my terminal.

No problem! I'm no pilgrim. My full stack is written up in Kubernetes YAMLs, under version control, and ready to respawn from the ashes. I'll quickly re-apply them all, check my Slack for angry DMs, and be back up and running before anyone even notices.

Apply them I did. And it worked! Sort of...

The containerized workloads were back up and running, but the test site was still inaccessible in the browser.

That's because the Ingress Controller (an NGINX reverse proxy that routes external traffic into a Kubernetes cluster) had been installed using a separate package manager called Helm, and therefore was not under our version control.

In correcting my mistake, we uncovered many bugs hiding under rocks that hadn't been turned in ages: some images running in these containers weren't hosted any more, some were unused, and others weren't under version control. It was a successful failure. A few hours later, that test server was armed against future fools like myself <i>because</i> it had been broken.

<blockquote>Antifragile: A category of things that not only gain from chaos, but need it to survive and flourish.</blockquote>

Good codebases are antifragile. Unlike physical objects which lose strength from frequent breakage and repair, codebases <i>gain</i> strength with each breakage and repair.

So treat your codebase like a pack animal rather than a cherished pet. In fact, it doesn't even matter if you do or don't. Your engineers' mistakes will. And your users will be even more merciless.

Most of us know this intuitively, so why don't we hack ourselves more often?

## Pressing All the Big Red Buttons

When I join a new team, I often ask myself: "What would happen if I deleted this? How would we recover?"

Netflix's <a href="https://netflix.github.io/chaosmonkey/" target="_blank">Chaos Monkey</a> is oft mentioned as a forcing factor to scare teams into building resiliently. The service "...randomly terminates instances in production to ensure that engineers implement their services to be resilient to instance failures." 

Instance failures happen and should of course be coded against, but they're only one sliver of the intentional chaos needed to make your organization truly antifragile in the face of doomsday scenarios - especially if you're on prem.

The pendulum of cloud-to-on-prem swings both at a macro level across the industry, with a recent study showing that <a href="https://www.businesswire.com/news/home/20191113005113/en/Hybrid-Cloud-Future-Bright-As-73-of-Enterprises-Moving-Apps-Back-on-Prem" target="_blank">73% of enterprises have moved workloads onto, and then off of cloud environments</a>, and at the micro level, with organizations hopping from cloud to on prem at the rate of whichever one caused the greatest headache in recent collective memory.

So if you're on the on prem end of the pendulum swing, consider your internal tooling as a target for creative destruction:
- Code Repositories
- Package Repositories
- Image Registries
- CI/CD Pipelines
- Clusters
- Wikis

What if any of these were to crash? How much downtime would your team experience before spinning them back up?

The only way to truly know is through unforgiving experimentation rather than optimistic speculation. You must undergo the harsh realities of simulated or real destruction.

## Demo (lition) Day

Demo (nstration) days are fun. Demo (lition) days are not...unless you've prepared for them.

What would a demolition day look like for your team?

Here are some points of failure that could be targeted:

- <b>Code Repositories:</b> What if someone ran `git checkout master && rm -rf ./ && git add . && git commit --amend --no-edit && git push -f --no-verify`. How would you recover from a Git catastrophe like this? Where are your backups?
- <b>Package Repositories/Image Registries:</b> This exists at two levels: the packages/images living within the repository, and the repository itself. What happens if you delete either? How would you rebuild images, or redeploy your full repository?
- <b>CI/CD Pipelines:</b> What happens if your Jenkins/TravisCI/CircleCI goes down? If you lost all of their configuration? Could you restore it?
- <b>Distributed Workloads:</b> Are you resilient to network failures and instance failures?
- <b>Self-hosted Tooling:</b> What would happen if someone ran `k delete all --all` in a tooling namespace. How quickly would your team be able to bring the full stack back up?
- <b>Cluster Data</b> If someone were to delete the state of your Kubernetes cluster, what would you do?
- <b>VPN:</b> How would a VPN outage affect your organization?

The benefits derived from answering these questions go well beyond disaster recovery.

1. <b>12 Factor</b> - The same processes which make both static code and running applications recoverable, and the disciplined CI/CD practices needed to achieve this, are only possible if your builds and releases are <i>fully</i> repeatable - thus covering a couple factors of a good ole' <a href="https://12factor.net/" target="_blank">12 factor app</a>.
2. <b>Take Backups, Grant Privileges</b> - Granting too many permissions to inexperienced developers is one of the leading causes of data breaches and security vulnerabilities. Yet, having to consult a separate infrastructure team with God-level permissions to deploy certain resources is a major bottleneck on development. These separations rightfully exist in order to keep the keys to the kingdom in the hands of experts. 

Luckily, the greater your team's ability to recover from disaster, the greater trust you can place in more junior developers to experiment, move fast and break things.

Trust me - it doesn't take to many Git apocalypses and application shutdowns before developer's learn their lesson and tread more carefully. Shielding them from making these didactic mistakes is a disservice to your team's development.
3. <b>Separation of Teams</b> - It's harder to recover from all of the above when the boundaries between teams is unclear and smeared across your larger organization. Multi-tenancy is great for cost savings, but there are hidden operational costs to sharing resources. 

These costs manifest in greater complexity in access control strategies, inability to answer the questions "Who owns this? Can I delete it?", and greater chances of stepping on toes. These blurred lines will become obvious once the proverbial shit hits the proverbial fan, and only then can you adapt your infrastructure with full understanding of who lives where.

## Controlling the Avalanche

I could imagine three levels of hardcore-ness in a Demo(lition) Day. They ought to happen in this order, building from least potential for harm to greatest:

<b>Simulated Demo Day:</b> Asking your team what would happen if any of the outages listed in the prior section were to happen.

<b>Piecemeal Demo Day:</b> Actually execute ONE of these destruction events once a month.

<b>Hardcore Demo Day:</b> Designating a day on which ALL of these actions will actually be executed, either in sequence or at once.

Out of the ashes of this exercise will emerge your recovery protocols: Who contacts who, who has access to what, where is everything living, and how will you get back up and running despite your best efforts at self-sabotage.