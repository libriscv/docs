---
slug: rivers-and-ruins
title: "Automatia Update: Rivers and Ruins"
authors: [gonzo]
tags: [automatia, gamedev]
---

This week I've mostly been experimenting with mining. I implemented void nights, a new rare night that turns darkness into a space-like void and will consume unprepared explorers. I also implemented a lost-and-found feature, which helps prevent some permanent item loss, allowing me to finally experiment with various types of "death".

<!-- truncate -->

## Restoration

The biggest new system this week is **restoration**. The story worlds can now contain things like buildings that need renovation, or places that are blocking the player from passing (like a rubble). You can now comission a carpenter to solve this. The architectural decisions underpinning this feature ended up being fairly complex, because story worlds are hand-made and can't be regenerated in case something happens. I needed a foolproof way of going back and forth between two states (before/after) that also supports complex multi-blocks. And the final piece was re-routing an NPC temporarily to do something that was outside his/her regular schedule, which is now all in place.

![alt text](<Screenshot from 2026-06-13 20-41-19.png>)

The feature is tickless as usual, so a restoration job can be scheduled and progress correctly whether or not you're standing there watching it. There's also a new GUI widget for comissioning carpenter renovation projects.

![alt text](<Screenshot from 2026-06-13 20-46-36.png>)

To go with all of this, there's a new NPC: **Tobias the carpenter**. He has no place to sleep yet.

![alt text](<Screenshot from 2026-06-14 07-22-53.png>)

## Waterfalls and rivers

I made an attempt at adding controlled flowing water that actually looks and sounds like it. There's a new waterfall admin block. It doesn't look great yet but the foundation is there. I'll probably show it off next blog post.

There's also a new **river block**:

![alt text](<Screenshot from 2026-06-14 08-09-49.png>)

The river block is the easiest to use, but it can be hard to find a setting that looks good, and it has some really rough edges still. At least the frogs like it.

## Lamps

I needed an indoor lamp and thought it would be a 1-hour job. The thing that takes forever with complex models is taste. It needs to look decently like a lamp. I decided to split into two pieces so I could have a wooden base:

![alt text](<Screenshot from 2026-06-14 13-45-25.png>)

I might make more tweaks later, but I think it's at least ready for use now:

![alt text](<Screenshot from 2026-06-14 13-45-01.png>)

## Void nights

Void nights is now a **first-class feature**. The midnight hours can now turn into something darker and stranger, with extra polish, and more to come.

![alt text](<Screenshot from 2026-06-08 22-48-03.png>)

It's probably best to stay home during those nights. Unless...?

## Explosives, continued

There's a new **meteor wand**, initial **depth/bunker charges**, sticky dynamite, and new explosion sounds. I widened the blast death radius for players, because apparently I didn't die enough.

![alt text](<Screenshot from 2026-06-14 07-48-12.png>)

The explosives also use a new **programmable point light** system, so blasts and blasting wands actually light up the world dynamically. Also with a broader auxlight Magix FX pass for light effects.

## Rope ladders

Mining kind of got annoying when you can't hand-mine tunnels to get out properly. I decided to try something different and I made a rope ladder. Quite frankly it turned out awesome. Almost too good, so I had to balance it hard.

![alt text](<Screenshot from 2026-06-14 07-52-08.png>)

The way it works is that you can use it to descend down, by extending it from the top (adding more ladder pieces), and then take down the whole thing from below. There's also a higher tier version that rolls itself out.

I also made a basic tier **headlamp**, which turns on and off automatically depending on how dark it is. It has a switch sound, and a charging bar. It charges in sunlight.

![alt text](<Screenshot from 2026-06-10 08-53-58.png>)

Overall, mining now has early-game equipment. However, it requires buying equipment and dynamite to get started. Since the player has limited inventory space at the start one neat thing about the headlamp is that it uses the head slot.

## Mailbox and letters

The mailbox grew read/write tabs for offline mail, a mail icon, gamepad support, and scheduled letters that arrive over time. NPC requests now carry an objective and self-heal if an introduction gets lost.

![alt text](<Screenshot from 2026-06-10 08-56-05.png>)

There's also an unread mail icon now, which doesn't require you to read anything. Opening and closing the mailbox is enough. And yes, no red dots. F that shit.

## Economy and patronage

I overhauled the economy a bit and added a **patronage/standing tab**. Things like the train line now have patronage, farm shops contribute to standings, and seller inventories got tuned. This is the same economy plan from last time slowly getting hooks into more of the game.

![alt text](<Screenshot from 2026-06-14 07-58-14.png>)

## Farming

Crops now visibly have weeds, and I added regrowth and weed-reduction bonuses that can come from potions. The _watering can_ model got nicer too.

## Movement and QoL

A lot of people are going to like this one. I added a bunch of jumping and landing effects, quality-of-life tweaks to how both feel, and a bunch of new features like climbing, double-jumping and others. Climbing allows you to recover from missing a jump, and also allows you to scale 2 blocks. Double-jump is exactly like it says, and combined with climbing actually allows scaling 3 blocks up.

More to come, as anything related to _equipment_ is work-in-progress. It's very clear to me that pickaxe mining trivialized certain things, and that untrivializing it was the right move. The movement aids that players get through progression feels extra great.

## Fixed but not in the release

I recently revamped terrain interpolation (as in fixed it). It used to be a sigmoid solution because I didn't understand how to calculate proper distance from center, but I actually had an LLM walk me through it. I wasn't too far off, actually. That took care of some interpolation issues in some circumstances, but also made borders "less wild", if that makes sense.

I also revamped the winter world, making ice translucent and some proper icecaps. Hence the above: I needed the terrain selection to be a proper voronoi so it was more predictable.

## Next steps

The next steps are already laid out. I am working on swimming and climate effects, so that I can make water, winter and desert story worlds. I already made an ocean world that will be a story world. Nothing but the open sea. Almost.

Bye.

-gonzo
