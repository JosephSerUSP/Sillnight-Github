export const Campaign = {
    levels: [
        { floor: 1, introEvent: 'intro_01', zone: 'ruins' },
        { floor: 3, introEvent: 'boss_warn_01', outroEvent: 'boss_defeat_01', fixed: true, zone: 'ruins' },
        { floor: 4, introEvent: 'enter_zone_02', zone: 'crystals' },
        { floor: 6, introEvent: 'boss_warn_02', fixed: true, zone: 'crystals' },
        { floor: 7, introEvent: 'enter_zone_03', zone: 'void' },
        { floor: 9, introEvent: 'final_boss_intro', fixed: true, zone: 'void' }
    ],
    events: {
        'intro_01': {
            script: [
                { type: 'dialogue', lines: [
                    { speaker: 'Captain Kael', text: 'We have breached the outer shell. The Spire awaits.' },
                    { speaker: 'Elara', text: 'Static... Receiving telemetry. The aether density is low here. Proceed with caution.' },
                    { speaker: 'Captain Kael', text: 'Stay sharp, everyone. We do not know what lives in this moss.' }
                ]}
            ]
        },
        'boss_warn_01': {
            script: [
                 { type: 'dialogue', lines: [
                    { speaker: 'Elara', text: 'Massive energy signature ahead! It matches the Guild\'s records of a Sentinel.' },
                    { speaker: 'Captain Kael', text: 'Shields up! It\'s waking up!' }
                ]},
                { type: 'battle', enemies: ['mossySentinel', 'rat', 'rat'] }
            ]
        },
        'boss_defeat_01': {
             script: [
                 { type: 'dialogue', lines: [
                    { speaker: 'Captain Kael', text: 'Target neutralized.' },
                    { speaker: 'Elara', text: 'Good work. The path deeper is open.' }
                ]}
            ]
        },
        'enter_zone_02': {
             script: [
                 { type: 'dialogue', lines: [
                    { speaker: 'Elara', text: 'The air is crystallizing. You are entering the Geode Layer.' },
                    { speaker: 'The Unbound', text: 'ERROR... GUESTS DETECTED... INITIATING PURGE...' },
                    { speaker: 'Captain Kael', text: 'Did you hear that voice?' }
                ]}
            ]
        },
        'boss_warn_02': {
             script: [
                 { type: 'dialogue', lines: [
                    { speaker: 'Elara', text: 'The Guardian of the Geode... it\'s made of pure focused light.' },
                    { speaker: 'Captain Kael', text: 'Don\'t look directly at it!' }
                ]},
                { type: 'battle', enemies: ['prismGuardian', 'crystalWisp', 'crystalWisp'] }
            ]
        },
        'enter_zone_03': {
             script: [
                 { type: 'dialogue', lines: [
                    { speaker: 'Elara', text: 'Kael? Can you hear me? The signal is...' },
                    { speaker: 'The Unbound', text: 'SILENCE.' },
                    { speaker: 'Captain Kael', text: 'Elara? Dammit. We are on our own now.' }
                ]}
            ]
        },
        'final_boss_intro': {
             script: [
                 { type: 'dialogue', lines: [
                    { speaker: 'The Unbound', text: 'REALITY IS A SHACKLE. I WILL BREAK IT.' },
                    { speaker: 'Elara', text: 'Kael! The fracture is widening! You must stop it now!' },
                    { speaker: 'Captain Kael', text: 'This ends now. For Oakhaven!' }
                ]},
                { type: 'battle', enemies: ['avatarUnbound', 'voidWalker', 'voidWalker'] }
            ]
        }
    }
};
