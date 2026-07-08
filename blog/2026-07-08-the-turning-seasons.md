---
slug: the-turning-seasons
title: "Automatia Update: The Turning of Seasons"
authors: [gonzo]
tags: [automatia, gamedev]
---

We now have initial support for seasons. The farms world will have the four staple seasons, which drastically changes the look of the world on each season change. There's also new animal NPCs, a forest rabbit, a Dog companion, and some graphics work: cascaded shadow maps and god-rays.

<!-- truncate -->

## Seasons

The farms world will have the four staple seasons, which drastically changes the look of the world on each season change. Other worlds will have their own seasons too, most likely two half-year seasons (in order to not drown in work).

$image$

The way seasons are implemented is actually quite fascinating. The server repopulates the entire instance, which was made possible due to the big change last blogpost: instancing. Instancing makes it possible for me to design the main look of the world safely in template/master worlds, and then repopulate it deterministically using a per-season algorithm. For example, autumn will have mushrooms, winter turns ponds into ice.

$image$

I was thinking about spreading the gameplay out over many worlds, because that gave the game the absolute most unique experience, however, it takes a while to visit each place and it can quickly lose its lustre. Most likely the right choice is to keep most things close, and some rare things out there with longer production times and thus less need to visit often (and possibly no rotting/wilting mechanics).

## Overgrowth

As part of seasons, there is now a regular growth happening around the players area and neighboring exploration areas, which if left alone can run amok. Some gardening needed!

Currently, it is very primitive:

1. Spring clears, starts with small grass
2. Spring and summer grows grass
3. Autumn grows mushrooms, fallen logs
4. Winter clears everything, but I will add some winter berries

So there is a cycle to it. It's very cool to watch how spring starts barren and over time it's fully overgrown.

It's also clear that the player will need tools to clear the growth and not just with their bare hands.

## The Dog companion

Last big change is the new Dog companion NPC that everyone starts with, in the farms world. The NPC is a work-in-progress, but is very much adding to the game.

$image$

## New animals

I also added new animal NPCs that will be the foundation for more farming activities: Bees/apiaries, goats, chickens (and some work on making hogs produce manure for fertilizer). It's all experimentation work that can change quickly.

$image$

There's also a new forest rabbit that runs away fast, in the farms world.

$image$

Finally, I reworked birds to be themed, like magpie is black with yellow beak.

## Graphics

Graphics-wise, the shadow maps are now cascaded and there's god-rays (crepuscular) now.

$image$

Bye.

-gonzo
