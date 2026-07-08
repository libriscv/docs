---
slug: the-turning-seasons
title: "Automatia Update: Autumn-atia"
authors: [gonzo]
tags: [automatia, gamedev]
---

We now have initial support for seasons. The farms world will have the four staple seasons, which drastically changes the look of the world on each season change. There's also new animal NPCs, a forest rabbit, a Dog companion, and some graphics work: cascaded shadow maps and god-rays.

<!-- truncate -->

## Seasons

The farms world will have the four staple seasons, which drastically changes the look of the world on each season change. Other worlds will have their own seasons too, most likely two half-year seasons (in order to not drown in work).

![alt text](image-33.png)

The way seasons are implemented is actually quite fascinating. The server repopulates the entire instance, which was made possible due to the big change last blogpost: instancing. Instancing makes it possible for me to design the main look of the world safely in template/master worlds, and then repopulate it deterministically using a per-season algorithm. For example, autumn will have mushrooms, winter turns ponds into ice.

![alt text](<Screenshot from 2026-07-08 15-15-40.png>)

I was thinking about spreading the gameplay out over many worlds, because that gave the game the absolute most unique experience, however, it takes a while to visit each place and it can quickly lose its lustre. Most likely the right choice is to keep most things close, and some rare things out there with longer production times and thus less need to visit often (and possibly no rotting/wilting mechanics).

What about sector hashes and churn? Turns out most inhabitable sectors had some churn already, and the hash percentage is *completely unchanged*. My worries were dead wrong. I expected some increased percentage, eg. 60-80% would have to be sent on login, however the latest browser build says 40% of sectors around the player were received at load time. This is also after the change in the next section. Sometimes you just have to try things.

## Overgrowth

As part of seasons, there is now a regular growth happening around the players area and neighboring exploration areas, which if left alone can run amok. Some gardening needed!

Currently, it is very primitive:

1. Spring clears, starts with small grass
2. Spring and summer grows grass
3. Autumn grows mushrooms, fallen logs
4. Winter clears everything, but I will add some winter berries

![alt text](image-31.png)

So there is a cycle to it. It's very cool to watch how spring starts barren and over time it's fully overgrown.

![alt text](image-32.png)

It's also clear that the player will need tools to clear the growth and not just with their bare hands.

## New harvesting skill

There is a new skill now in the skills tab: Harvesting. It's mostly there to let the player know that harvesting certain things is useful, and that the drops are useful now or later. Harvesting will tie into other skills later on. Most of the growth from the daily overgrowth mechanic are harvestable.

## A hundred things

The change to accomodate seasons (which was always the plan), has caused an avalanche of adjustments in every sub-system, system and widget and everything else that I forgot. Even the farms shop needs to adjust because as I was playing, I realized that I had no idea what I was buying anymore. Are any of the crops I'm looking at in-season right now? The answer is to just make the farms shop change the stock when the season has changed. That way, all the content in the shop is relevant that specific day. It's still a gamble to buy things just before a season changes.

## The Dog companion

Last big change is the new Dog companion NPC that everyone starts with, in the farms world. The NPC is a work-in-progress, but is very much adding to the game.

![alt text](image-34.png)

## New animals

I also added new animal NPCs that will be the foundation for more farming activities: Bees/apiaries, goats, chickens (and some work on making hogs produce manure for fertilizer). It's all experimentation work that can change quickly.

![alt text](image-36.png)

![alt text](image-35.png)

There's also a new forest rabbit that runs away fast, in the farms world. It's kind of elusive so I couldn't find it for screenshotting.

Finally, I reworked birds to be themed, like magpie is black with yellow beak.

## Graphics

Graphics-wise, the shadow maps are now cascaded and there's god-rays (crepuscular) now.

![alt text](<Screenshot from 2026-07-07 11-12-50.png>)

Bye.

-gonzo
