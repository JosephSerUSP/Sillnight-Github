# The Hollow Descent: An Architectural Walkthrough

> *A commentary on the "Ideal Campaign" for the Project Engine.*
> *Voice: Lead Designer / First-Time Player Hybrid.*

---

## 0. Introduction: The Weight of the Soul

The *Project Engine* is not built for high-octane action. It is built for *dread*.

In designing this ideal campaign, "The Hollow Descent," we lean heavily into the engine's core constraint: **The Summoner's MP is not just mana; it is Oxygen.** Every step costs MP. Every spell costs MP. Time is not measured in seconds, but in the slow, suffocating tick of that resource counter.

This walkthrough outlines a 5-hour structured campaign that utilizes the procedural dungeon generation while enforcing a strict narrative backbone. We assume the existence of a "Hub" (The Sanctuary) and a "Creature Inheritance" system (Soul Stitching), features that push the engine from a prototype to a full cohesive experience.

### The Core Loop
1.  **Prepare:** Recruit entities in the Sanctuary.
2.  **Descend:** Dive into the procedural abyss.
3.  **Suffocate:** Reach the limit of your MP/Oxygen.
4.  **Return:** Flee back to the surface with resources to upgrade the Sanctuary.
5.  **Repeat:** Go deeper.

---

## I. The Sanctuary (Floor 0)

The game begins not in a dungeon, but in a white, sterile room. **The Sanctuary**.
It acts as our Hub.

**Visuals:** A static 3D view of a ruined hospital ward, overgrown with white lilies.
**Mechanics:**
*   **The Vending Machine:** The shop. Buy Potions (Healing) and Ethers (MP Restoration).
*   **The Operating Table:** The "Soul Stitching" station (Creature Inheritance).
*   **The Gate:** The entrance to the dungeon.

> *Commentary: The decision to make the Hub a static, safe place contrasts sharply with the claustrophobia of the dungeon. It gives the player a false sense of security. I spent my first 10 minutes here just reading the cryptic logs on the terminal. The narrative hook is simple: You are incomplete. The parts of your soul are down there. Go get them.*

---

## II. Zone 1: The Tiled Hallways (Floors 1-3)

**Aesthetic:** Infinite, flickering bathroom tiles. The hum of fluorescent lights. The smell of bleach and ozone.

### Floor 1: The Lesson of Silence
The first floor is deceptively quiet. I started with the **Summoner** and a single **Pixie** (Standard recruit).
The fog of war here is thick. The "Reveal Radius" is small.
The first enemy I encountered was a **Skeleton**.

> *Gameplay Moment:* I instinctively tried to spam `Ray` with my Pixie. It dealt decent damage, but it cost 0 MP (Pixies use stamina/free acts). However, I then tried to use the Summoner's `Heal` spell when the Skeleton crit me.
>
> **MISTAKE.**
>
> Using that spell drained 15 MP.
> 15 MP is equivalent to walking 15 tiles.
> I realized immediately: **Magic is expensive.** I finished the fight with half health rather than wasting "movement currency" on healing.

### Floor 2: The Greed of the Goblin
On Floor 2, I found a Recruit Beacon. A **Goblin**.
Cost: 150 Gold. I had 200.
I bought him.
The Goblin is a physical attacker, but his AI has the `selfish` temperament.

*   **Battle 3:** vs. Two **Pixies**.
*   My Goblin had low health.
*   Instead of attacking the enemy to finish the fight, the Goblin used `Guard` to protect *himself*.
*   The Pixies pelted my Summoner.

> *Commentary: This is where the personality system shines. The Goblin isn't just a stats stick; he's an asshole. I found myself actually shouting at the screen. "Just hit him!" But he wouldn't. This friction makes the eventual "Soul Stitching" (where I can strip his stats and discard his personality) so much more satisfying.*

### The Gatekeeper: The Waiter (Floor 3 Boss)
The exit to Zone 2 is blocked by a fixed encounter: **The Waiter**.
A tall, tuxedoed undead.
He resists physical damage (Undead trait).
My Goblin was useless here.
I had to rely on my Pixie's `Wind` magic (which hits `MDF`).
But the Waiter has a nasty skill: `Serve Drink`. It heals *him*.
The fight became a DPS race. I burned 50 MP boosting my Pixie's output.
We won, but I was at 10 MP.

**The Forced Retreat:**
I couldn't go to Floor 4. 10 MP isn't enough to find the stairs.
I had to use the **Recall Item** (dropped by the Waiter).
Back to the Sanctuary.

---

## III. The First Return: Soul Stitching

Back at the Hub, the game opens up.
I have loot. I have XP.
And I have a useless, leveled-up Goblin.

**New Feature: Soul Stitching (Creature Inheritance)**
The "Operating Table" allows me to sacrifice a creature to transfer *one* passive trait or skill to another.
I sacrificed the Goblin.
I gave his `High Vitality` (Passive) to my Pixie.
Now, my Pixie is a tanky healer.
I also used my gold to buy a **Skeleton** (Undead/Free temperament).

> *Commentary: This mechanic is the hook. I stopped seeing creatures as friends and started seeing them as resources. "That Golem has a great Defense stat... I wonder what happens if I stitch it onto a Glass Cannon?" It fits the "Mad Scientist/Doctor" vibe perfectly.*

---

## IV. Zone 2: The Flooded Archives (Floors 4-7)

**Aesthetic:** Rusted metal catwalks over black water. The sound of dripping is constant.
**New Threat:** Environment Hazards.

### The Silence of the Damp
The game introduces a new status effect here: **Damp**.
It prevents the use of "Vocal" skills.
My Summoner's Spells are vocal.
My Pixie's magic is vocal.

> *Gameplay Moment:* I entered a room with two **Golems**. High Defense. Physical attacks bounced off (1 damage). Usually, I'd cast `Thunder`.
> But I was Damp.
> I sat there for 3 turns, guarding, waiting for the status to wear off, while the Golems pummeled my Skeleton.
> This forced me to open the Item Menu. I had 3 **Fire Bombs** (items). Items don't require speech.
> I threw them.
> It felt desperate. It felt right.

### The Recruit: Inori
On Floor 6, I found **Inori**.
Description: *"Their prayers are muddled by the thick latex covering every inch of their body."*
Inori is a powerhouse Healer/Holy attacker.
But there's a catch: The latex suit means Inori is *always* considered "Silenced" for standard speech skills, relying instead on unique "Prayer" actions that cost HP instead of MP.
This synergy (HP spending) worked perfectly with my tanky Skeleton.

### The Boss: The Lich (Floor 7)
The Lich is a DPS check. He summons **Skeleton** minions every 3 turns.
If you don't kill the minions, they explode.
My Inori used `Divine Bolt` (Holy).
It was effective (Weakness: Holy).
But the Lich cast `Deep Freeze`, slowing my party.
I barely scraped by.
I didn't have enough MP to return to the surface. I was stranded.

---

## V. Zone 3: The Neon Void (Floors 8-12)

**Aesthetic:** The rust falls away. We are in a void now, populated by floating neon signs and Japanese advertisements.
**Theme:** Artificial Life.

### The Mid-Dive Respite: The Campfire (Floor 8)
Design wise, 12 floors is too long for one MP bar.
Floor 8 introduces the **Safe Room**.
It's a small pocket dimension with a campfire.
**Function:**
1.  **Cook:** Convert monster parts (Loot) into Food (MP Restoration).
2.  **Rest:** Restore HP (but not MP).
3.  **Chat:** Unique dialogue scenes with recruits.

> *Commentary: This is where the narrative shines. I sat by the fire with Inori and the Skeleton. Inori spoke about the pain of the suit. The Skeleton just rattled. It gave texture to these assets. It made me care about them before I inevitably sent them to their deaths.*

### The Enemy: No. 7
Zone 3 is brutal.
**No. 7** is an enemy unit. Fast. High Crit.
He used `Wind Blades`. Two hits.
My Pixie (with the inherited Health) died in one turn.
**Permadeath?** No, but "Downed" units reduce the Summoner's Max MP until revived at the Hub.
The pressure mounted. I had to finish this zone with just the Summoner and Inori.

### The Puzzle: The Mirror Room
Floor 11 wasn't a combat floor.
It was a puzzle.
Large mirrors reflected the party.
To proceed, I had to "unequip" my party members in a specific order to match the reflection.
It was a nice pacer-breaker, reminding me that this is a surreal dream, not just a combat simulator.

---

## VI. Zone 4: The Frozen Cocytus (Floors 13-17)

**Aesthetic:** The neon freezes over. A digital wasteland of ice and static.
**Theme:** Stasis.

### The Difficulty Spike: Shiva
The enemies here are elemental powerhouses. **Shiva** (Ice) and **Ifrit** (Fire).
I had to re-spec my team.
I returned to the Hub (Recall) and used Soul Stitching to give my **Inori** the `Fire Resist` trait from a captured Ifrit.
Without this, Inori would get one-shot by `Hellfire`.

> *Commentary: This back-and-forth loop is the core gameplay. You hit a wall -> You Retreat -> You Adapt -> You Return. It's not about grinding levels; it's about grinding solutions.*

### The Narrative Twist
On Floor 15, I found a recording of the Summoner's voice.
It wasn't a log. It was a *conversation*.
The Summoner was talking to the monsters.
*"You are not real,"* the voice said. *"You are just symptoms."*
The realization hits: The dungeon is the Summoner's body. The monsters are the disease (or the cure?).
We are not fighting to escape. We are fighting to *wake up*.

---

## VII. The Finale: The Dream's End (Floors 18-20)

**Aesthetic:** A perfect replica of the Sanctuary, but twisted.
**Boss:** The Slumber.

### The Architect
The final boss is **The Slumber**.
Description: *"Though its appearance is that of a mere baby, this being has lived for many a lifetime."*
It doesn't attack directly.
It summons *clones* of your current party.
I had to fight my own build.
My tanky Skeleton. My healer Inori.
Every strength I built was turned against me.

> *Commentary: The ultimate test of mastery is defeating your own creation. I had to exploit the weaknesses I knew my team had. "I know Inori is weak to Dark damage because I never patched that hole." I switched my Summoner to Dark Magic and nuked my own healer.*

### The Ending
When The Slumber falls, the Summoner wakes up.
**Ending A (Standard):** Waking up in a hospital bed. Alone. The world is grey. The magic is gone.
**Ending B (True - If you recruited all "Human" types):** Waking up surrounded by the "real" versions of the recruits (doctors, nurses, patients). The dungeon was a coma dream.
**Ending C (The Abyss - If you never returned to the Hub):** The Summoner accepts the dream. They become the new Lord of the Dungeon.

---

## VIII. Conclusion: The Engine's Potential

"The Hollow Descent" demonstrates that the *Project Engine* is capable of deep, emotional storytelling through mechanics. By treating MP as Oxygen and Creatures as disposable parts of the self, we create a roguelike that feels personal.

The architecture supports this:
*   **Procedural Generation** creates the "unstable dream" logic.
*   **The Inheritance System** gives weight to every recruitment.
*   **The Hub Loop** provides the pacing necessary for a 5-hour experience.

It is a masterful, haunting experience.
