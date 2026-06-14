---
slug: unbalanced-bills
title: "Automatia Update: Unbalanced Skills"
authors: [gonzo]
tags: [automatia, gamedev]
---

Automatia now has several skills! Crafting, farming, mining, alchemy, fishing, cooking and magic, all with experience and levels. There's a developing economy hiding behind them too, but that part is still ongoing.

<!-- truncate -->

## Skills

There are now seven skills: crafting, farming, mining, alchemy, fishing, cooking and magic. I couldn't dream up any more generic skills, so those are the ones we're stuck with. Each one has its own experience, levels, and a tab in the UI to keep track of it all. The underlying system is the same for all of them, so adding a new skill later is fairly simple. However, a new skill also means deciding how it relates to the other skills, how it changes the economy and seeing if it's fun or not. It's also natural that some skills are more important than others, and that this may even change throughout the game. Either way, there's an XP bar, levelling sounds and an under-utilized toast for when you discover new things.

![alt text](<Screenshot from 2026-06-07 19-15-42.png>)

Creating row-based GUI widgets that list something with icons and text is fairly straight-forward now, so I've created the ones I could think of to support the skills system and NPCs. As a bonus, they are gamepad compatible because of their simplicity. Right now some skills are far more designed than others, while at the same time none of them are complete.

To debug all of this from the server side, I added a pile of debug commands so I can grant experience, set levels, and reset things without having to actually play the game.

![alt text](<Screenshot from 2026-06-06 09-00-16.png>)

## The economy (in theory)

Behind all of this is a wider, theoretical economy plan. Everything is still being worked out, but the systems underneath, experience, levels, goods, quality, are there to build on now. I also made a Python economy simulator where I'm trying to figure which day a speed-runner got rich on, and then I multiply that by some factor to get normal person. It's all just guesswork! ;)

I have a tendency to under-design and never write anything down, so if it's fun it got that way by random chance.

## Hands-free Mining

Mining is the skill I've worked on the most this time, and I tried various things until I gave up and made mining entirely through explosions.

![alt text](<Screenshot from 2026-06-07 20-29-27.png>)

So you mine with dynamite, thrown dynamite, blasting wands, and other things that go boom. It fits the chaotic zero-design feel of the game, and it means mining is a little bit of a skill in the platforming sense too, not just a number that goes up. You have to actually place or throw the thing, and then not be standing there when it goes off. And you can get stuck. You can't "mine" stone. It has to go boom now. But oh it's very satisfying. ;)

I made up some names for ores, making them fantasy ores, I guess:

![alt text](<Screenshot from 2026-06-07 20-29-10.png>)

But I was clever enough to key them on generic names so that I can rename in the future, with nothing changing underneath or data loss. Somehow I ended up with generic fantasy ore names instead generic real ore names. I am shaking my head as I write this.

## Farming

Crops take multiple days to grow. I'm using game time for this, so a crop planted on one day will be ready a few days later regardless of which world you wander off to in the meantime. When you harvest, you don't automatically get to replant, you need more seeds. So there's a little loop there: sell harvest and buy seeds to keep going.

![alt text](<Screenshot from 2026-06-07 20-22-16.png>)

Water improves crops. I haven't fully nailed down the exact numbers, but watered crops do better than dry ones. Nobody's selling any watering cans yet though. It'll come.

## Quality and stars

Harvested goods and artisanal goods now have a quality system, up to 5 stars. A higher-quality crop, or a better-brewed potion, or a nicer-cooked meal, is worth more and (eventually) does more. This is the thing that ties the skills back into the economy: leveling a skill should let you produce higher-quality goods, not just more of them.

![alt text](<Screenshot from 2026-06-07 20-23-45.png>)

Quality items are worth more when selling:

![alt text](<Screenshot from 2026-06-07 20-25-33.png>)

You can buy back things you sold for the same price:

![alt text](<Screenshot from 2026-06-07 20-27-01.png>)


## Fishing, cooking, alchemy and magic

The other skills are at various stages. Alchemy already had a head start from the [alchemy update](./better-living-through-alchemy), so potions and the brewing station tie straight into it. Cooking turns harvested goods into meals (and quality carries through). Fishing is exactly what it sounds like, and it's also the most promising skill. It's a bit like monster hunting because I can make truly hidden areas with rare loot. Magic ties into the wands and effects, but it's under-developed for now.

They all share the same experience and leveling backbone, so the work now is mostly content and economic/fun tuning rather than new systems. We'll see.

## Acquaintances, mailbox and requests

I added an **acquaintance tab** that keeps track of the NPCs you've actually met. The world has a few people in it now, and it's nice to keep track of who was who, so now the game remembers for you.

![alt text](<Screenshot from 2026-06-04 17-45-32.png>)

Alongside that there's a **mailbox** and a **request system**. NPCs can ask things of the player, fetch this, grow that, catch me a fish, and the request shows up in the mailbox. This is the first real hook between the NPCs (who all have their schedules and routines now) and the new skills, and it's where I think the economy plan will start to become something you can actually feel while playing.

![alt text](<Screenshot from 2026-06-06 09-00-31.png>)

And you can "meet" NPCs now, which adds them to the acquaintance tab:

![alt text](<Screenshot from 2026-06-07 20-24-32.png>)

## Storage space

Inventory space is limited at the start.

![alt text](<Screenshot from 2026-06-07 19-26-08.png>)

A variety of bags will introduce movement-related bonuses as well as storage space.

## Unstuck and home-going

In an attempt at redesigning death, I just made things like drowning, staying in the dark too long and being stuck in a wall eventually send you back home. I expect people will "abuse" that, so I just design around that: I also added a send me home button in the inventory. It's a 30 second wait.

## Villages

I've worked a little bit on villages, and I'm using collaboration-free ring-based voronoi diagrams. Which is to say, base the village around the center of the voronoi, so (unknown) cells don't have to collaborate to set limits like "only one town square". Now the town square is in the center.

![alt text](<Screenshot from 2026-06-07 14-50-59.png>)

## New NPCs

It makes a lot of sense to bring in new NPCs now with new skills, buying/selling screens. Here is Merrin the fishmonger:

![alt text](<Screenshot from 2026-06-07 20-17-54.png>)

He sells basic fishing things:

![alt text](<Screenshot from 2026-06-07 20-18-54.png>)

## Next steps

There's a lot of uncertainty in balancing a game. A lot of the groundwork is laid now, but it's still hard to manage multiple disciplines that has to work together to create a progression-based system that is not too easy, not too hard and fun to play.

Bye.

-gonzo
