// The Color Code — the twelve season palettes.
//
// This one file is the only place colors come from. The AI only ever picks a season
// name from SEASON_NAMES; every swatch a customer sees is read from here, so the
// AI can never invent a color.
//
// PLACEHOLDER: these palettes are standard twelve-season starting points written by
// web-development so the app works end to end. Bella (color-analysis) is replacing
// them with the real palettes from her color theory. When she does, change only the
// hex values and names below and set PALETTES_ARE_PLACEHOLDER to false.

export const PALETTES_ARE_PLACEHOLDER = true;

export const SEASONS = {
  'Light Spring': {
    family: 'Spring', summary: 'Warm, light and clear — delicate warmth with a fresh glow.',
    wear: [['Peach', '#F7B99B'], ['Warm pink', '#F49AA0'], ['Light coral', '#F28C7A'], ['Buttercup', '#F6D77A'], ['Mint', '#A8DDB5'], ['Aqua', '#7FD1C9'], ['Periwinkle', '#9FB3E8'], ['Cream', '#FBF0DA']],
    avoid: [['Black', '#111111'], ['Burgundy', '#6B1F2E'], ['Charcoal', '#3A3A3C']],
    lip: [['Peachy pink', '#E98A7E'], ['Warm rose', '#D9716E']],
    blush: [['Apricot', '#F4A887'], ['Soft coral', '#F29B8C']],
    eye: [['Champagne', '#EBD5B3'], ['Soft bronze', '#B98B5E'], ['Light teal', '#6EB9B0']],
  },
  'True Spring': {
    family: 'Spring', summary: 'Warm and clear — golden, sunny color at full strength.',
    wear: [['Coral', '#F26B55'], ['Poppy', '#EE5A3C'], ['Golden yellow', '#F4B63F'], ['Kelly green', '#3DAA5C'], ['Turquoise', '#20B2AA'], ['Warm aqua', '#3FC1B0'], ['Camel', '#C49A6C'], ['Ivory', '#FFF4DE']],
    avoid: [['Black', '#111111'], ['Icy grey', '#D5D9DE'], ['Dusty mauve', '#A7858F']],
    lip: [['Coral red', '#E5533F'], ['Warm peach', '#E88467']],
    blush: [['Coral', '#F07F6A'], ['Warm peach', '#F3A07F']],
    eye: [['Golden brown', '#A87436'], ['Bronze', '#9C6B34'], ['Warm green', '#6B8E3D']],
  },
  'Bright Spring': {
    family: 'Spring', summary: 'Clear and bright with warmth — high contrast and vivid.',
    wear: [['Hot coral', '#FF5E57'], ['Bright watermelon', '#F2456B'], ['Lemon', '#FFE14D'], ['Emerald', '#16A06A'], ['Bright turquoise', '#00B5B8'], ['Cobalt', '#2B59C3'], ['Violet', '#8A4FD6'], ['Clear white', '#FFFFFF']],
    avoid: [['Dusty rose', '#C0939A'], ['Olive', '#6B6B3A'], ['Beige', '#D8C7AE']],
    lip: [['Bright coral', '#F2543F'], ['Watermelon', '#E73E61']],
    blush: [['Bright peach', '#FF8C6B'], ['Warm pink', '#F7728A']],
    eye: [['Bright bronze', '#B8762E'], ['Teal', '#00868B'], ['Black-brown liner', '#2E1E16']],
  },
  'Light Summer': {
    family: 'Summer', summary: 'Cool, light and soft — airy pastels with a blue base.',
    wear: [['Powder blue', '#A9C7E8'], ['Lavender', '#C3B1E1'], ['Rose pink', '#E7A4B8'], ['Soft raspberry', '#D57598'], ['Seafoam', '#9FD6C6'], ['Sky', '#8CB9E3'], ['Light grey', '#C9CDD2'], ['Soft white', '#F6F5F2']],
    avoid: [['Orange', '#F07D22'], ['Black', '#111111'], ['Mustard', '#C9A227']],
    lip: [['Rosy pink', '#D57A93'], ['Soft berry', '#B95F7E']],
    blush: [['Pink', '#EBA1B5'], ['Cool rose', '#DB8FA3']],
    eye: [['Taupe', '#A39289'], ['Dove grey', '#9A9AA1'], ['Soft plum', '#8E6C8A']],
  },
  'True Summer': {
    family: 'Summer', summary: 'Cool and soft — blue-based, gently muted color.',
    wear: [['Rose', '#C8768F'], ['Raspberry', '#B24A72'], ['Soft navy', '#3F5378'], ['Periwinkle', '#8A95D1'], ['Blue spruce', '#4E8A87'], ['Slate blue', '#6A83A6'], ['Cool grey', '#8E949C'], ['Soft white', '#F4F3F0']],
    avoid: [['Orange', '#F07D22'], ['Camel', '#C49A6C'], ['Bright yellow', '#FFD60A']],
    lip: [['Cool rose', '#B8627C'], ['Raspberry', '#A8456A']],
    blush: [['Cool pink', '#D88BA0'], ['Rose', '#C97A90']],
    eye: [['Slate grey', '#6E7580'], ['Soft navy', '#46557A'], ['Mauve', '#957585']],
  },
  'Soft Summer': {
    family: 'Summer', summary: 'Muted and cool-leaning — smoky, blended, gentle color.',
    wear: [['Dusty rose', '#B98A96'], ['Mauve', '#9F7A8C'], ['Sage', '#9AA994'], ['Soft teal', '#5F8E8C'], ['Denim', '#5E7896'], ['Cocoa', '#7D6660'], ['Pewter', '#8C8E91'], ['Oyster', '#E6E1D8']],
    avoid: [['Black', '#111111'], ['Bright orange', '#FF7A00'], ['Hot pink', '#FF1F8E']],
    lip: [['Dusty rose', '#A9707D'], ['Soft mauve', '#976A7A']],
    blush: [['Muted rose', '#C28E98'], ['Soft plum', '#A57B89']],
    eye: [['Taupe', '#8F8078'], ['Smoky grey', '#6C6E72'], ['Soft plum', '#7D6474']],
  },
  'Soft Autumn': {
    family: 'Autumn', summary: 'Muted and warm-leaning — earthy, gentle, sun-faded color.',
    wear: [['Salmon', '#E0937D'], ['Terracotta', '#C07A5C'], ['Sage', '#9AA47F'], ['Olive', '#7E7F4E'], ['Soft teal', '#5E8C84'], ['Camel', '#BE9A73'], ['Mushroom', '#9C8A78'], ['Warm cream', '#EFE3CC']],
    avoid: [['Black', '#111111'], ['Icy pink', '#F6D5E5'], ['Royal blue', '#2349B6']],
    lip: [['Warm nude', '#B97864'], ['Soft brick', '#A95E4E']],
    blush: [['Soft peach', '#DE9B82'], ['Warm rose', '#C98378']],
    eye: [['Soft bronze', '#9F7A55'], ['Olive', '#6E6B45'], ['Warm taupe', '#8B7866']],
  },
  'True Autumn': {
    family: 'Autumn', summary: 'Warm and rich — golden, earthy, spiced color.',
    wear: [['Rust', '#B5532C'], ['Pumpkin', '#D9762B'], ['Mustard', '#C99A2E'], ['Olive', '#6F7234'], ['Forest', '#2F5D3A'], ['Teal', '#1E6E6A'], ['Chocolate', '#5B3A29'], ['Cream', '#F3E6CC']],
    avoid: [['Icy blue', '#CFE4F5'], ['Fuchsia', '#D6259B'], ['Stark white', '#FFFFFF']],
    lip: [['Brick', '#9E3D2B'], ['Warm terracotta', '#B5563E']],
    blush: [['Terracotta', '#C86F55'], ['Warm peach', '#DA8E6C']],
    eye: [['Copper', '#A55A2D'], ['Bronze', '#8A6231'], ['Olive', '#5E6234']],
  },
  'Deep Autumn': {
    family: 'Autumn', summary: 'Deep and warm — rich, dark, earthy color with depth.',
    wear: [['Burgundy', '#6E1F2A'], ['Tomato red', '#B7321F'], ['Burnt orange', '#B9571F'], ['Deep teal', '#12524F'], ['Forest', '#28472E'], ['Aubergine', '#4B2338'], ['Espresso', '#3C2518'], ['Warm ivory', '#F1E4C8']],
    avoid: [['Pastel pink', '#F7C6D3'], ['Icy grey', '#D5D9DE'], ['Baby blue', '#A7CBEB']],
    lip: [['Brick red', '#8F2F22'], ['Deep berry-brown', '#6E2A2A']],
    blush: [['Deep terracotta', '#B25B45'], ['Warm brick', '#A34B3C']],
    eye: [['Dark bronze', '#6E4A24'], ['Deep olive', '#4B4A26'], ['Espresso', '#3A2418']],
  },
  'Bright Winter': {
    family: 'Winter', summary: 'Clear and bright with coolness — vivid, icy, high contrast.',
    wear: [['True red', '#D2102E'], ['Hot pink', '#E3207F'], ['Cobalt', '#1F4FC7'], ['Emerald', '#009A63'], ['Bright violet', '#7B2FD1'], ['Icy lemon', '#FFF7A8'], ['Black', '#111111'], ['Pure white', '#FFFFFF']],
    avoid: [['Camel', '#C49A6C'], ['Mustard', '#C99A2E'], ['Dusty mauve', '#A7858F']],
    lip: [['Blue red', '#C3102F'], ['Fuchsia', '#C71A76']],
    blush: [['Bright pink', '#E8619A'], ['Cool berry', '#C8497A']],
    eye: [['Charcoal', '#34363B'], ['Silver', '#C3C6CB'], ['Jewel plum', '#5A2466']],
  },
  'True Winter': {
    family: 'Winter', summary: 'Cool and clear — pure, crisp, blue-based color.',
    wear: [['Blue red', '#B5122E'], ['Magenta', '#B0126F'], ['Royal blue', '#1C3FAA'], ['Pine', '#0F5A45'], ['Icy pink', '#F6D5E5'], ['Icy blue', '#CFE4F5'], ['Navy', '#1B2447'], ['Pure white', '#FFFFFF']],
    avoid: [['Orange', '#F07D22'], ['Camel', '#C49A6C'], ['Olive', '#6B6B3A']],
    lip: [['Blue red', '#A9122B'], ['Cool berry', '#8E1D4F']],
    blush: [['Cool pink', '#D65C8B'], ['Berry', '#B3406E']],
    eye: [['Charcoal', '#2F3136'], ['Navy', '#1F2A4F'], ['Cool plum', '#4E2250']],
  },
  'Deep Winter': {
    family: 'Winter', summary: 'Deep and cool — dark, dramatic, jewel-toned color.',
    wear: [['Black cherry', '#5A0F24'], ['Ruby', '#9B111E'], ['Sapphire', '#0F3B8C'], ['Emerald', '#046A45'], ['Amethyst', '#5B2A7B'], ['Charcoal', '#2E2F33'], ['Black', '#111111'], ['Icy white', '#F7F9FB']],
    avoid: [['Peach', '#F7B99B'], ['Camel', '#C49A6C'], ['Pastel yellow', '#FBEAA0']],
    lip: [['Deep berry', '#7A1433'], ['Ruby red', '#8F1024']],
    blush: [['Deep rose', '#B04565'], ['Plum', '#8E3A5E']],
    eye: [['Charcoal', '#2C2D31'], ['Deep plum', '#3F1A40'], ['Sapphire', '#1B3570']],
  },
};

export const SEASON_NAMES = Object.keys(SEASONS);
