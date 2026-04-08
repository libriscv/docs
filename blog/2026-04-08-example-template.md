---
slug: automatia-5
title: "Automatia: Update 5"
authors: [gonzo]
tags: [automatia]
draft: false
---

It’s been over 2 months since the last update, and I’ve completely forgotten what I wrote about last time. Apparently it was block entities. Since adding block entities I’ve implemented 3 new blocks that don’t emit a block mesh but instead manage an entity that renders a custom animation. I’ve added a service counter bell, a shopkeeper bell (hanging over doors) and a barbershop pole. You can ring the bells manually by right-clicking, and dialogues can triggers bells too, making them very versatile. It’s starting to feel like I’m making a real game and not just a ton of loosely connected game mechanics.

Which leads us to dialogues, I guess.

## Dialogues

Early prototype of buying from the shop

<iframe width="100%" style={{"aspect-ratio": "16 / 9"}} src="https://www.youtube.com/embed/9--ife2HcqY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

I’ve implemented support for Drafft 2, a game organizing tool, by implementing a converter in Python. The converter produces various loadable data for my game engine. For example, Drafft 2 supports complex dialogue chains that you create by connecting together visual nodes in Drafft 2. I also added support for some inline hints that produce features specific to my game engine in the text, such as `[a:talking]` will make an NPC appear like he’s talking. Or `{event:std,stdRingCounterBell}` will call that function during the dialogue, which then can RPC to the server to do something specific like ringing a counter bell, which can be seen and heard by all nearby players.
Press enter or click to view image in full size
A dialogue chain that shows what happens if you keep ringing the bell too much

Beardy will pick up the bell and hold it in his hand for a day. 😆

```cpp
PUBLIC void
beardyTiredOfTheRinging(Entity ent, std::vector<std::string>& args)
{
 ent.EndDialogue();

 Game::server_rpc(
 [] (Player) {
   auto& beardy = NPCs::Get("beardy");
   beardy.npc.setHeldItemByName(Item(Block("counter_bell")));

   counterBellWalker.remove();
   counterBellRemoved = true;

   Game::call_next_day(8, 0, [] (double) {
     auto& beardy = NPCs::Get("beardy");
     beardy.npc.setHeldItemByName(Item());
     counterBellWalker.set(Block("counter_bell"));
     counterBellRemoved = false;
   });
 });
}
```

C++ running in a tiny sandbox trivializes game scripting.

## GameTime

I have to write about GameTime, sadly. I originally designed time to tick differently depending on which world you were on, however, I realized that doing that meant that things will eventually behave in a way that surprises everyone (me included). If you imagine a world that has very slow time, and then whether or not that worlds time is frozen when nobody is on it or not (it doesn’t matter), at some point during gameplay you’ll reach year 2 in some world, you’ll go back to this world and it’s still year 1. I don’t like that.

So, I’ve started migrating towards a shared time across all worlds, which marches relentlessly forward at the same speed everywhere. I already have a lore reason in my head, which I will forget in a few days. But then I’ll re-remember it at some point later, and probably add some story behind it.

![alt text](<Screenshot from 2026-04-07 20-59-42.png>)
NPC routines give people a schedule. Beardy doesn’t work on Saturdays.

The reason that finally made me make the jump to shared time is that I want to have NPCs that travel between worlds. NPCs have routines that allow me to calculate precisely where they are at any time, so if you restart the server, everyone will be in the right place. This is largely incompatible with having different time on each place. At least if finishing a solo game in human time is the goal.

## Cutscenes

Yep. I added support for cutscenes out of nowhere. I decided that I wanted to have a very limited form of cutscene in the game where it’s basically just showcasing a place, the first time you go somewhere. Some games have a lot of cutscenes involving NPCs and storyline, but that’s not my cup of tea. I think the types of cutscenes you’d see in something like SM64 is what I’m going for, with a title on the screen introducing the place.

A basic cutscene I made for the farmers shop.

<iframe width="100%" style={{"aspect-ratio": "16 / 9"}} src="https://www.youtube.com/embed/iFCiP9WxF48" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Public builds

There are now public builds of the game at my [automatia-releases repository](https://github.com/fwsGonzo/automatia-releases). If you intend to play it, make sure that you don’t build in any of the “permanent” story worlds: limbo and farms (for now). I’ve recently started packaging those worlds and distributing them, so they will be replaced on each update as I am actively making changes.

Thanks for reading!
