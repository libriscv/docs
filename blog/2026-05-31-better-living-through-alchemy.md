---
slug: better-living-through-alchemy
title: "Automatia Update: Better Living Through Alchemy"
authors: [gonzo]
tags: [automatia, gamedev]
---

Player effects have arrived in Automatia! Buffs, potions, a new alchemy station, and many other things.

<!-- truncate -->

## Player effects

Players can now have effects applied to them: buffs, debuffs, permanent (equipment) and temporary (flasks). Effects can stack. The system is open-ended in the underlying architecture, but limited in current implementation. Only a few things can be buffed, for example.

![alt text](<Screenshot from 2026-05-30 15-35-39.png>)

This opens the door to a lot of things later, but for now I'm using it for the simple stuff: extra speed, jumping, falling slower. All the basic things, so I didn't have implement anything new to test.

## Potions

![alt text](<Screenshot from 2026-05-31 12-08-59.png>)

Potions are (currently) just data on top of the effect system, which let me spam potions:

![alt text](<Screenshot from 2026-05-31 20-26-16.png>)

I expect the list to grow. In order to debug it from the servers perspective, I had to keep F5'ing the dashboard to see my updated attributes, and then I eventually folded and added an effects sub-tab:

![alt text](<Screenshot from 2026-05-31 20-27-31.png>)

## The alchemy station

I made a basic alchemy station to brew things in. It ended up fairly OK, but I do feel that I'm a bit over "small machines". I might convert it to a bigger machine eventually. For now, it's very mobile.

![alt text](<Screenshot from 2026-05-31 15-32-38.png>)

The graphics are temporary, as always. I recorded a [test run here](https://youtu.be/I1E28HJIUrQ).

I also ended up migrating recipes in the engine out into JSON. They are now easily readable and editable for those who want to get spoiled. However, I will say that the recipes get shipped into the script and executed along with the "real" recipe API, so .. it's possible for me to implement hidden recipes that you won't be able to see without inspecting the ELF.


## Two horror bugs

I fixed two horrendous bugs that were (thankfully) rare, and also so old they are probably from back in 2015, probably. Both are on the client-side. It turns out that when you teleport I had forgotten to clear a flag that should have been cleared on work sectors. If a sector was being generated async, arrived after the teleport cleared the GENERATED bit on sectors but forgot to clear GENERATING, the sector would enter a stuck state where it was unable to build scheduled objects. If those objects were large (and they often are), a big area around the player would be unable to progress and stay empty. The second bug has to do with the GUI, and it was just a blindspot. I am using NanoVG to draw things and NanoGUI for GUI widgets, and it turns out that (and of course I knew this) NanoGUI also uses NanoVG internally to draw things. So, things like measuring text and other commands needed to generate measurements needed by item rendering (among others) was using the same NanoVG instance, and that was simply not going to work well. It would trample something and crash in FMOD to maximally irritate me.

## World tool

I also made a "world tool" Python script for maintenance of persisted worlds outside of the server. It can validate sectors and whole worlds, make precise edits and normalize hash tables.

I also made it accessible in a new **Maintenance** sub-tab in the Web UI. Note that maintenance of persisted files (obviously) requires an empty server.

![alt text](<Screenshot from 2026-05-31 20-30-18.png>)

You absolutely cannot access the Maintenance panel while people are on the server, or with loaded regions. It will predictably fail to exclusively lock the databases. Restart the server, close it, go to the panel and it will load.

## Weighted OIT for transparent blocks

![alt text](<Screenshot from 2026-05-31 20-10-28.png>)

This is transparent glass using order-independent transparency (OIT). Instead of sorting, each transparent fragment contributes a weighted color and the result is resolved in a single pass. Block entities can also use transparent glass:

![alt text](<Screenshot from 2026-05-31 20-10-58.png>)

It's now easy to make diamond-shaped color class, for example:

![alt text](<Screenshot from 2026-05-31 20-12-40.png>)

## NPC sequences & daily schedules

I've started experimenting with NPC sequences. Here is Beardy refilling the magic tank a bit every day for the paint machine:

![alt text](<Screenshot from 2026-05-31 20-17-20.png>)

Also, the magic fuel is now a rainbow plasma. Inside, Robin will replenish the stock of the store every working day.

## Train travel

Travelling with trains is seamless across worlds now. I am continuing work on another station. People I've shown the train travelling to seem really impressed.

There is still a lot of things to do with the trains, but for now they serve their purpose to allow players to go between two wildly different places on a schedule.

## A trend: World editing in-game

I've noticed a trend that I am making more and more blocks whose role is to maintain something for me in-game. The Pond block, NPC spawner and platform manager all let me program something that is painful to hand-write into JSON or script in C++. Instead I can fine-tune it in-game and the "admin" blocks are designed to hide (masquerade) themselves. I added an admin option to visualize admin blocks by strobing magenta:

The NPC spawner block in the picture above is managing 20+ hog NPCs:

![alt text](<Screenshot from 2026-05-31 20-35-27.png>)

And the pond block in the middle of the pond maintains its level:

![alt text](<Screenshot from 2026-05-31 20-36-28.png>)

While the other blinking block is keeping it froggy around there.

## Next steps

Next steps: More of everything, I guess. I've experimented with a real-time bounce pad (it bounces under you), and a big button that has to be landed heavily on to jump-start something. But, otherwise I am actually making more world content now, and I have started placing more secrets. The game is all about exploration, crafting and platforming.

Bye.

-gonzo
