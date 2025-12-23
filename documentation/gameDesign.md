-Effects: These directly affect battlers, such as changing hp, applying states, changing level / xp / parameters, etc. 
'learnAction' - Teaches an action to a creature. 
'learnPassive' - Teaches a passive to a creature. 
'elementAdd' - Adds a new element to the battler.
'elementChange' - Changes all elements of this battler to the target element. If the battler has no elements, it should now have one.
Effects should be flexible. I should be able to cover novel effects without hardcoding them.


-Traits: These modify or change characteristics of battlers, or/and trigger Effects. They are properties of Equipment, Passives and States. 
Some examples:
'hit_bonus' - for adding flat bonus to hit chance (default 0 means 100% chance. 0.1 would mean 110%).
'evade_chance' - for calculating the chance of evading enemy physical attacks. default is 0.
'crit_bonus_percent' - for calculating the chance of inflicting a critical hit. Default is 0.05 (5%).
'xp_bonus_percent' - increases XP gain.
'element_change' - Changes the battler's elemental affinity.
'PARAM_PLUS' - Additive bonus to parameters (e.g. +10 ATK).
'PARAM_RATE' - Multiplicative bonus to parameters (e.g. x1.2 DEF).
'trigger: effect' - Traits can execute Effects on certain triggers, such as restoring HP when winning a battle (`onBattleEnd`) or healing per turn (`onTurnStart`).


Both Effects and Traits also must generate description strings. These are going to be attached to an object's description. For example, a "Mythril Sword"'s "Description" field might just say "A sword made from legendary ore.", but, dynamically, "Increases ATK by 5." will be appended to its description.

TRAIT OBJECTS:
all trait objects have:
'condition' - a condition for which this object's traits are inherited.

1.Passives: Trait Objects that are innate or learned by creatures.

2.Equipment: Trait Objects that are equipped to creatures.
'price' - how much currency is required to purchase this equipment at a shop.

3.States: Trait Objects that are temporarily applied to creatures.
States expire. The architecture for handling state expiry allows for turn-based or event-based removal.

4.Battlers: The battle units. They're both allies and enemies. They inherit traits from Passives, Equipment, States and the PC.
They have the following core parameters:
-'mhp' - Max HP.
-'mmp' - Max MP.
-'atk' - Attack Power (Physical).
-'def' - Defense (Physical).
-'mat' - Magic Attack.
-'mdf' - Magic Defense.
-'agi' - Agility (affects Turn Order).
-'luk' - Luck (affects State rates etc).
And derived properties:
-'level' - Current level.
-'exp' - Current experience.
-'ele' - Array of elements (from innate species data + traits).

EFFECT OBJECTS:
1.Actions: Apply Effects to targets. They can be:
1.a.Skills: Used by creatures.
1.b.Items: Used by the PC (Inventory).

They have the following properties:
-'ele' - actions often have an element.
-'stat' - Defines the offensive stat used ('atk' or 'mat').

-Summoner:
The Player Character. 
'mmp / mp' - for exploration mechanics and spellcasting. 
Performing actions (such as moving) in the dungeon drains their MP. When it hits 0, the creatures get progressively weaker.
