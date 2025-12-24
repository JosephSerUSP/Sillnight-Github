export const Materials = {
    default: {
        type: 'Lambert',
        color: 0x333333
    },
    default_wall: {
        type: 'Lambert',
        color: 0x1a1a1a
    },
    pearlescent: {
        type: 'Phong',
        color: 0xfdf5e6, // Old Lace / Warm Ivory
        emissive: 0x222222,
        specular: 0xffffff,
        shininess: 30,
        customEffect: 'pearlescent'
    },
    ivory_floor: {
        type: 'Phong',
        color: 0xfaf0e6, // Linen
        customEffect: 'pearlescent'
    },
    ivory_wall: {
        type: 'Phong',
        color: 0xfffff0, // Ivory
        customEffect: 'pearlescent'
    }
};
