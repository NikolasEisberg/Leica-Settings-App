/**
 * Comprehensive Leica Camera Settings Schema & Dropdown Definitions
 * Covers Standard PTP (50xx) and Leica Maestro IV Vendor Extensions (D0xx-D8xx, FFxx).
 */

const CAMERA_MODELS = [
  'LEICA Q3',
  'LEICA Q3 43',
  'LEICA Q2',
  'LEICA Q2 MONOCHROM',
  'LEICA M11',
  'LEICA M11-P',
  'LEICA M11 MONOCHROM',
  'LEICA SL3',
  'LEICA SL2',
  'LEICA SL2-S'
];

const PROFILE_NAME_SUGGESTIONS = [
  'Nikolas',
  'Street',
  'Portrait',
  'Landscape',
  'Monochrom',
  'Action',
  'Night',
  'Cine',
  'Studio',
  'Travel'
];

const FN_BUTTON_OPTIONS = [
  { value: 0, label: 'Unassigned / Off' },
  { value: 1, label: 'Focus Magnification (Photo)' },
  { value: 2, label: 'Focus Assistance' },
  { value: 3, label: 'Magnification (Video Default)' },
  { value: 5, label: 'AF Mode' },
  { value: 8, label: 'Exposure Metering' },
  { value: 10, label: 'Exposure Compensation' },
  { value: 11, label: 'ISO Settings (Thumbwheel Default)' },
  { value: 14, label: 'White Balance' },
  { value: 18, label: 'File Format (DNG/JPG)' },
  { value: 20, label: 'Leica Looks / Film Style' },
  { value: 21, label: 'Digital Zoom / Crop (FN1 Default)' },
  { value: 24, label: 'Shutter Type' },
  { value: 27, label: 'AF-L / AE-L Lock' },
  { value: 30, label: 'Playback / Quick Review' },
  { value: 33, label: 'Self-Timer' },
  { value: 36, label: 'Mode Switch Photo/Video (FN2 Default)' },
  { value: 37, label: 'Toggle Info Levels (Center Default)' },
  { value: 38, label: 'User Profiles Menu' },
  { value: 40, label: 'Interval Shooting' },
  { value: 42, label: 'Exposure Bracketing' },
  { value: 45, label: 'Dial / Custom Control Function' }
];

const LOOK_OFFSET_OPTIONS = [
  { value: -2, label: '-2 (Low)' },
  { value: -1, label: '-1 (Medium Low)' },
  { value: 0, label: '0 (Standard / Default)' },
  { value: 1, label: '+1 (Medium High)' },
  { value: 2, label: '+2 (High)' }
];

const KELVIN_OPTIONS = [
  { value: 2000, label: '2000 K (Candlelight)' },
  { value: 2500, label: '2500 K (Warm Tungsten)' },
  { value: 2700, label: '2700 K (Soft White LED)' },
  { value: 3000, label: '3000 K (Halogen)' },
  { value: 3200, label: '3200 K (Studio Tungsten)' },
  { value: 3500, label: '3500 K (Neutral Warm)' },
  { value: 4000, label: '4000 K (Cool Fluorescent)' },
  { value: 4500, label: '4500 K (Early Morning)' },
  { value: 5000, label: '5000 K (Horizon Daylight)' },
  { value: 5200, label: '5200 K (Direct Sunlight)' },
  { value: 5500, label: '5500 K (Daylight / Flash — Default)' },
  { value: 5600, label: '5600 K (Cinema Daylight)' },
  { value: 6000, label: '6000 K (Overcast / Noon)' },
  { value: 6500, label: '6500 K (Cloudy Daylight)' },
  { value: 7000, label: '7000 K (Light Shade)' },
  { value: 7500, label: '7500 K (Open Shade)' },
  { value: 8000, label: '8000 K (Deep Shade)' },
  { value: 9000, label: '9000 K (Blue Sky)' },
  { value: 10000, label: '10000 K (Deep Blue Sky)' },
  { value: 11500, label: '11500 K (Maximum Cool)' }
];

const CATEGORIES = [
  {
    id: 'exposure',
    title: 'Exposure & ISO',
    icon: '◐',
    description: 'ISO sensitivity, Auto ISO limits, minimum shutter speed thresholds, and metering'
  },
  {
    id: 'focus_drive',
    title: 'Focus & Drive',
    icon: '⌖',
    description: 'Autofocus modes, subject tracking, AF field positions, and drive/capture modes'
  },
  {
    id: 'image_wb',
    title: 'Image, Crop & Looks',
    icon: '▣',
    description: 'Sensor resolution, digital zoom focal length, white balance, and Film Style tuning'
  },
  {
    id: 'video',
    title: 'Video & Cine',
    icon: '▶',
    description: 'Frame rates, slow-motion speed, shutter angle, codec profiles, and Cine ISO limits'
  },
  {
    id: 'buttons',
    title: 'Function Buttons (FN)',
    icon: '⌘',
    description: 'Custom physical button and dial assignments for Photo and Video modes'
  },
  {
    id: 'system_meta',
    title: 'Metadata & System',
    icon: '⚙',
    description: 'EXIF Artist/Copyright tags, standby timers, EVF refresh rates, and lens presets'
  }
];

/**
 * Curated Settings Dictionary.
 * Each entry defines category, human-readable label, description, control type, and options.
 */
const SETTINGS_SCHEMA = {
  // === EXPOSURE & ISO ===
  '500F': {
    category: 'exposure',
    label: 'ISO Sensitivity',
    description: 'Base ISO sensitivity or Auto ISO mode',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Auto ISO (Default)' },
      { value: 50, label: 'ISO 50' },
      { value: 100, label: 'ISO 100' },
      { value: 200, label: 'ISO 200' },
      { value: 400, label: 'ISO 400' },
      { value: 800, label: 'ISO 800' },
      { value: 1600, label: 'ISO 1600' },
      { value: 3200, label: 'ISO 3200' },
      { value: 6400, label: 'ISO 6400' },
      { value: 12500, label: 'ISO 12500' },
      { value: 25000, label: 'ISO 25000' },
      { value: 50000, label: 'ISO 50000' },
      { value: 100000, label: 'ISO 100000' }
    ]
  },
  D00B: {
    category: 'exposure',
    label: 'Max Auto ISO Limit (Photo)',
    description: 'Maximum sensitivity ceiling allowed when shooting in Auto ISO mode',
    type: 'dropdown',
    options: [
      { value: 200, label: 'ISO 200' },
      { value: 400, label: 'ISO 400' },
      { value: 800, label: 'ISO 800' },
      { value: 1600, label: 'ISO 1600' },
      { value: 3200, label: 'ISO 3200' },
      { value: 6400, label: 'ISO 6400 (Factory Default)' },
      { value: 12500, label: 'ISO 12500' },
      { value: 25000, label: 'ISO 25000 (Nikolas Profile)' },
      { value: 50000, label: 'ISO 50000' },
      { value: 100000, label: 'ISO 100000' }
    ]
  },
  D00C: {
    category: 'exposure',
    label: 'Auto ISO Min. Shutter Speed Limit',
    description: 'Slowest shutter speed before Auto ISO raises sensitivity',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Auto (Factory Default)' },
      { value: 256, label: '1/2 s' },
      { value: 512, label: '1/4 s' },
      { value: 768, label: '1/8 s' },
      { value: 1024, label: '1/15 s' },
      { value: 1280, label: '1/30 s' },
      { value: 1536, label: '1/60 s' },
      { value: 1792, label: '1/125 s (Nikolas Profile)' },
      { value: 2048, label: '1/250 s' },
      { value: 2304, label: '1/500 s' },
      { value: 2560, label: '1/1000 s' },
      { value: 2816, label: '1/2000 s' }
    ]
  },
  '500B': {
    category: 'exposure',
    label: 'Exposure Metering Mode',
    description: 'Light metering method across the sensor frame',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Spot Metering' },
      { value: 1, label: 'Center-Weighted Metering' },
      { value: 2, label: 'Multi-Field Metering (Default)' },
      { value: 3, label: 'Highlight-Weighted Metering' }
    ]
  },
  '5010': {
    category: 'exposure',
    label: 'Exposure Compensation (EV)',
    description: 'Exposure bias compensation offset',
    type: 'dropdown',
    options: [
      { value: -3000, label: '-3.0 EV' },
      { value: -2667, label: '-2.7 EV' },
      { value: -2333, label: '-2.3 EV' },
      { value: -2000, label: '-2.0 EV' },
      { value: -1667, label: '-1.7 EV' },
      { value: -1333, label: '-1.3 EV' },
      { value: -1000, label: '-1.0 EV' },
      { value: -667, label: '-0.7 EV' },
      { value: -333, label: '-0.3 EV' },
      { value: 0, label: '0.0 EV (Default)' },
      { value: 333, label: '+0.3 EV' },
      { value: 667, label: '+0.7 EV' },
      { value: 1000, label: '+1.0 EV' },
      { value: 1333, label: '+1.3 EV' },
      { value: 1667, label: '+1.7 EV' },
      { value: 2000, label: '+2.0 EV' },
      { value: 2333, label: '+2.3 EV' },
      { value: 2667, label: '+2.7 EV' },
      { value: 3000, label: '+3.0 EV' }
    ]
  },
  D040: {
    category: 'exposure',
    label: 'EV Step / Bracketing Increment',
    description: 'Exposure step interval for bracketing and compensation',
    type: 'dropdown',
    options: [
      { value: 333, label: '1/3 EV (Default)' },
      { value: 500, label: '1/2 EV' },
      { value: 667, label: '2/3 EV' },
      { value: 1000, label: '1.0 EV' },
      { value: 2000, label: '2.0 EV' },
      { value: 3000, label: '3.0 EV' }
    ]
  },
  D006: {
    category: 'exposure',
    label: 'Shutter Mode / Type',
    description: 'Controls Mechanical vs. Electronic / Hybrid shutter selection',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Mechanical Shutter' },
      { value: 1, label: 'Electronic Shutter' },
      { value: 2, label: 'Electronic Front Curtain (EFCS)' },
      { value: 3, label: 'Hybrid / Auto Shutter (Default)' }
    ]
  },
  D007: {
    category: 'exposure',
    label: 'Stored Shutter Speed Value',
    description: 'Manual / preset shutter speed',
    type: 'dropdown',
    options: [
      { value: 30, label: '1/30 s' },
      { value: 60, label: '1/60 s' },
      { value: 125, label: '1/125 s' },
      { value: 250, label: '1/250 s' },
      { value: 500, label: '1/500 s' },
      { value: 1000, label: '1/1000 s (Default)' },
      { value: 2000, label: '1/2000 s' },
      { value: 4000, label: '1/4000 s' },
      { value: 8000, label: '1/8000 s' },
      { value: 16000, label: '1/16000 s' }
    ]
  },
  D008: {
    category: 'exposure',
    label: 'Long Exposure Noise Reduction',
    description: 'Dark-frame subtraction after long exposures',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On (Default)' }
    ]
  },
  D189: {
    category: 'exposure',
    label: 'Base Manual ISO / Reference Value',
    description: 'Default manual ISO reference value',
    type: 'dropdown',
    options: [
      { value: 50, label: 'ISO 50' },
      { value: 100, label: 'ISO 100 (Default)' },
      { value: 200, label: 'ISO 200' },
      { value: 400, label: 'ISO 400' },
      { value: 800, label: 'ISO 800' },
      { value: 1600, label: 'ISO 1600' }
    ]
  },

  // === FOCUS, AF & DRIVE ===
  '5013': {
    category: 'focus_drive',
    label: 'Drive / Capture Mode',
    description: 'Single frame, continuous burst, interval, or bracketing drive mode',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Single Frame (Factory Default)' },
      { value: 1, label: 'Continuous Low (2 fps)' },
      { value: 2, label: 'Continuous Medium (4 fps)' },
      { value: 3, label: 'Continuous High (7 fps)' },
      { value: 4, label: 'Continuous Super Speed (15 fps)' },
      { value: 5, label: 'Interval Shooting' },
      { value: 6, label: 'Custom Drive / Self-Timer Mode (Nikolas Profile)' },
      { value: 7, label: 'Exposure Bracketing' }
    ]
  },
  '500A': {
    category: 'focus_drive',
    label: 'Focus / AF Field Mode',
    description: 'Autofocus area and focusing behavior',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Spot / Single Point AF (Nikolas Profile)' },
      { value: 1, label: 'Multi-Field AF' },
      { value: 2, label: 'Zone AF' },
      { value: 3, label: 'Tracking AF' },
      { value: 4, label: 'Eye / Face / Body Detection AF' },
      { value: 5, label: 'Field AF (Factory Default)' },
      { value: 6, label: 'Manual Focus (MF)' }
    ]
  },
  D137: {
    category: 'focus_drive',
    label: 'AF Subject Detection Mode',
    description: 'Human Eye/Face/Body and Animal detection configuration',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Off' },
      { value: 1, label: 'Eye / Face Only' },
      { value: 2, label: 'Eye / Face / Body' },
      { value: 3, label: 'Eye / Face / Body + Animals' },
      { value: 4, label: 'Tracking Priority' },
      { value: 5, label: 'Intelligent Subject AF (Default)' }
    ]
  },
  D138: {
    category: 'focus_drive',
    label: 'AF Tracking Sensitivity / Mode',
    description: 'Autofocus continuous tracking responsiveness',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Off / Locked' },
      { value: 1, label: 'Low Sensitivity' },
      { value: 2, label: 'Medium-Low' },
      { value: 3, label: 'Standard' },
      { value: 4, label: 'High Responsiveness (Default)' },
      { value: 5, label: 'Maximum Responsiveness' }
    ]
  },
  D09E: {
    category: 'focus_drive',
    label: 'AF Field Position (Photo)',
    description: 'Default grid coordinate of the AF frame in Photo mode',
    type: 'dropdown',
    options: [
      { value: 2570, label: 'Center [10, 10] (Default)' },
      { value: 1285, label: 'Upper-Left Third [5, 5]' },
      { value: 1295, label: 'Upper-Right Third [5, 15]' },
      { value: 3845, label: 'Lower-Left Third [15, 5]' },
      { value: 3855, label: 'Lower-Right Third [15, 15]' }
    ]
  },
  D0A0: {
    category: 'focus_drive',
    label: 'AF Field Position (Video)',
    description: 'Default grid coordinate of the AF frame in Video mode',
    type: 'dropdown',
    options: [
      { value: 2570, label: 'Center [10, 10] (Default)' },
      { value: 1285, label: 'Upper-Left Third [5, 5]' },
      { value: 1295, label: 'Upper-Right Third [5, 15]' },
      { value: 3845, label: 'Lower-Left Third [15, 5]' },
      { value: 3855, label: 'Lower-Right Third [15, 15]' }
    ]
  },

  // === IMAGE QUALITY, CROP & WHITE BALANCE ===
  D002: {
    category: 'image_wb',
    label: 'Sensor Resolution (DNG / JPG Size)',
    description: 'Triple Resolution Technology output size (60 MP / 36 MP / 18 MP)',
    type: 'dropdown',
    options: [
      { value: 'L', label: 'L — Large (60 MP — Default)' },
      { value: 'M', label: 'M — Medium (36 MP)' },
      { value: 'S', label: 'S — Small (18 MP)' }
    ]
  },
  D21D: {
    category: 'image_wb',
    label: 'Digital Zoom / Crop Focal Length',
    description: 'In-camera frame crop focal length simulation for Leica Q3 28mm',
    type: 'dropdown',
    options: [
      { value: 28, label: '28 mm — Uncropped Full Frame (60 MP — Default)' },
      { value: 35, label: '35 mm — 1.25× Crop (~39 MP)' },
      { value: 50, label: '50 mm — 1.8× Crop (~19 MP)' },
      { value: 75, label: '75 mm — 2.7× Crop (~8 MP)' },
      { value: 90, label: '90 mm — 3.2× Crop (~6 MP)' }
    ]
  },
  '5005': {
    category: 'image_wb',
    label: 'White Balance Mode',
    description: 'Color balance preset mode',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Automatic (AWB — Default)' },
      { value: 1, label: 'Daylight (5200K)' },
      { value: 2, label: 'Cloudy (6000K)' },
      { value: 3, label: 'Shadow (7000K)' },
      { value: 4, label: 'Tungsten (3200K)' },
      { value: 5, label: 'HMI (5600K)' },
      { value: 6, label: 'Fluorescent Warm (4000K)' },
      { value: 7, label: 'Fluorescent Cool (4500K)' },
      { value: 8, label: 'Flash (5400K)' },
      { value: 9, label: 'Gray Card (Pipette)' },
      { value: 10, label: 'Color Temperature (Kelvin)' }
    ]
  },
  D014: {
    category: 'image_wb',
    label: 'White Balance Kelvin (Photo)',
    description: 'Manual color temperature in Kelvin for Photo mode',
    type: 'dropdown',
    options: KELVIN_OPTIONS
  },
  D00F: {
    category: 'image_wb',
    label: 'Image File Format (DNG / JPG)',
    description: 'Primary recording file format combination',
    type: 'dropdown',
    options: [
      { value: 0, label: 'DNG Only' },
      { value: 1, label: 'JPG Fine Only' },
      { value: 2, label: 'DNG + JPG Standard' },
      { value: 3, label: 'DNG + JPG Fine (Default)' }
    ]
  },
  D013: {
    category: 'image_wb',
    label: 'JPG Color Space / Rendering',
    description: 'Color space profile embedded in captured files',
    type: 'dropdown',
    options: [
      { value: 0, label: 'sRGB' },
      { value: 1, label: 'Adobe RGB' },
      { value: 2, label: 'ECI RGB' },
      { value: 3, label: 'Standard sRGB / P3 (Default)' }
    ]
  },
  D017: {
    category: 'image_wb',
    label: 'Film Style / Leica Look Preset',
    description: 'Active color or monochrome film simulation profile',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Standard' },
      { value: 1, label: 'Vivid' },
      { value: 2, label: 'Natural' },
      { value: 3, label: 'Default Film Style' },
      { value: 4, label: 'Monochrome' },
      { value: 5, label: 'Monochrome High Contrast' },
      { value: 6, label: 'Leica Look Slot 1' },
      { value: 7, label: 'Leica Look Slot 2' }
    ]
  },
  D054: {
    category: 'image_wb',
    label: 'Film Style 1 — Contrast Offset',
    description: 'Fine adjustment for Film Style 1 Contrast',
    type: 'dropdown',
    options: LOOK_OFFSET_OPTIONS
  },
  D055: {
    category: 'image_wb',
    label: 'Film Style 1 — Highlights Offset',
    description: 'Fine adjustment for Film Style 1 Highlights',
    type: 'dropdown',
    options: LOOK_OFFSET_OPTIONS
  },
  D056: {
    category: 'image_wb',
    label: 'Film Style 1 — Shadows Offset',
    description: 'Fine adjustment for Film Style 1 Shadows',
    type: 'dropdown',
    options: LOOK_OFFSET_OPTIONS
  },
  D057: {
    category: 'image_wb',
    label: 'Film Style 1 — Saturation Offset',
    description: 'Fine adjustment for Film Style 1 Saturation',
    type: 'dropdown',
    options: LOOK_OFFSET_OPTIONS
  },
  D058: {
    category: 'image_wb',
    label: 'Film Style 1 — Sharpness Offset',
    description: 'Fine adjustment for Film Style 1 Sharpness',
    type: 'dropdown',
    options: LOOK_OFFSET_OPTIONS
  },

  // === VIDEO & CINE ===
  D104: {
    category: 'video',
    label: 'Video Frame Rate (Primary)',
    description: 'Primary video recording frame rate',
    type: 'dropdown',
    options: [
      { value: 23976, label: '23.98 fps — NTSC Cinema' },
      { value: 24000, label: '24.00 fps — True Cinema' },
      { value: 25000, label: '25.00 fps — PAL Standard' },
      { value: 29970, label: '29.97 fps — NTSC Standard (Default)' },
      { value: 50000, label: '50.00 fps — PAL High Frame Rate' },
      { value: 59940, label: '59.94 fps — NTSC High Frame Rate' },
      { value: 100000, label: '100.00 fps — Slow Motion PAL' },
      { value: 119880, label: '119.88 fps — Slow Motion NTSC' }
    ]
  },
  D1DD: {
    category: 'video',
    label: 'Video Frame Rate (Secondary / Sub-Format)',
    description: 'Secondary video profile frame rate',
    type: 'dropdown',
    options: [
      { value: 23976, label: '23.98 fps' },
      { value: 24000, label: '24.00 fps' },
      { value: 25000, label: '25.00 fps' },
      { value: 29970, label: '29.97 fps (Default)' },
      { value: 50000, label: '50.00 fps' },
      { value: 59940, label: '59.94 fps' }
    ]
  },
  D106: {
    category: 'video',
    label: 'Video Resolution & Codec Profile',
    description: 'Selects video container, resolution (8K / 4K / C4K / FHD), and compression',
    type: 'dropdown',
    options: [
      { value: 0, label: 'FHD 1080p H.264' },
      { value: 3, label: '4K UHD L-GOP' },
      { value: 6, label: '4K UHD ALL-I' },
      { value: 9, label: 'Standard 4K (Default Video Profile)' },
      { value: 12, label: 'C4K Cinema Profile' },
      { value: 15, label: '8K UHD Profile' },
      { value: 18, label: 'Apple ProRes 422 HQ' }
    ]
  },
  D108: {
    category: 'video',
    label: 'High-Speed / Slow-Motion Frame Rate',
    description: 'Frame rate used in Slow & Quick (S&Q) / High-Speed video mode',
    type: 'dropdown',
    options: [
      { value: 60, label: '60 fps' },
      { value: 100, label: '100 fps (PAL)' },
      { value: 120, label: '120 fps (NTSC — Default)' }
    ]
  },
  D109: {
    category: 'video',
    label: 'Cine Shutter Angle',
    description: 'Rotary shutter angle equivalent when shooting in Cine mode',
    type: 'dropdown',
    options: [
      { value: 45, label: '45° (Crisp Action)' },
      { value: 90, label: '90°' },
      { value: 144, label: '144°' },
      { value: 172, label: '172.8° (Anti-Flicker)' },
      { value: 180, label: '180° — Standard Cinema Motion Blur (Default)' },
      { value: 270, label: '270°' },
      { value: 360, label: '360° (Maximum Blur)' }
    ]
  },
  D0D3: {
    category: 'video',
    label: 'Max Auto ISO Limit (Video Mode 1)',
    description: 'Maximum Auto ISO sensitivity ceiling during video recording',
    type: 'dropdown',
    options: [
      { value: 800, label: 'ISO 800' },
      { value: 1600, label: 'ISO 1600' },
      { value: 3200, label: 'ISO 3200' },
      { value: 6400, label: 'ISO 6400 (Default)' },
      { value: 12500, label: 'ISO 12500' },
      { value: 25000, label: 'ISO 25000' },
      { value: 50000, label: 'ISO 50000' }
    ]
  },
  D0ED: {
    category: 'video',
    label: 'Max Auto ISO Limit (Video Mode 2 / L-Log)',
    description: 'Secondary Video Auto ISO sensitivity ceiling',
    type: 'dropdown',
    options: [
      { value: 800, label: 'ISO 800' },
      { value: 1600, label: 'ISO 1600' },
      { value: 3200, label: 'ISO 3200' },
      { value: 6400, label: 'ISO 6400 (Default)' },
      { value: 12500, label: 'ISO 12500' },
      { value: 25000, label: 'ISO 25000' },
      { value: 50000, label: 'ISO 50000' }
    ]
  },
  D0EF: {
    category: 'video',
    label: 'White Balance Kelvin (Video)',
    description: 'Manual color temperature in Kelvin for Video mode',
    type: 'dropdown',
    options: KELVIN_OPTIONS
  },

  // === FUNCTION BUTTONS (FN) & CONTROLS ===
  D191: {
    category: 'buttons',
    label: 'Photo Mode — FN Button 1',
    description: 'Function assigned to FN 1 button in Photo Mode (Default: Digital Zoom)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D193: {
    category: 'buttons',
    label: 'Photo Mode — FN Button 2',
    description: 'Function assigned to FN 2 button in Photo Mode (Default: Photo/Video Mode Switch)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D195: {
    category: 'buttons',
    label: 'Photo Mode — Center Button',
    description: 'Function assigned to Directional Pad Center Button in Photo Mode (Default: Info Levels)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1D6: {
    category: 'buttons',
    label: 'Photo Mode — Thumbwheel Button',
    description: 'Function assigned to Thumbwheel Press in Photo Mode (Default: ISO Settings)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1D7: {
    category: 'buttons',
    label: 'Photo Mode — Custom Control / Dial',
    description: 'Function assigned to secondary control / dial in Photo Mode',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1DA: {
    category: 'buttons',
    label: 'Photo Mode — AF-L / AE-L / FN3 Button',
    description: 'Function assigned to rear lock/custom button in Photo Mode',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1BD: {
    category: 'buttons',
    label: 'Video Mode — FN Button 1',
    description: 'Function assigned to FN 1 button in Video Mode (Default: Digital Zoom)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1D1: {
    category: 'buttons',
    label: 'Video Mode — FN Button 2',
    description: 'Function assigned to FN 2 button in Video Mode (Default: Photo/Video Mode Switch)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1D5: {
    category: 'buttons',
    label: 'Video Mode — Center Button',
    description: 'Function assigned to Center Button in Video Mode (Default: Magnification)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1D8: {
    category: 'buttons',
    label: 'Video Mode — Thumbwheel Button',
    description: 'Function assigned to Thumbwheel Press in Video Mode (Default: ISO Settings)',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1D9: {
    category: 'buttons',
    label: 'Video Mode — Custom Control / Dial',
    description: 'Function assigned to secondary control / dial in Video Mode',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D1DB: {
    category: 'buttons',
    label: 'Video Mode — AF-L / AE-L / FN3 Button',
    description: 'Function assigned to rear lock/custom button in Video Mode',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D190: {
    category: 'buttons',
    label: 'Secondary / Hold Control 1',
    description: 'Secondary / Long-press control slot 1',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D192: {
    category: 'buttons',
    label: 'Secondary / Hold Control 2',
    description: 'Secondary / Long-press control slot 2',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D194: {
    category: 'buttons',
    label: 'Secondary / Hold Control 3',
    description: 'Secondary / Long-press control slot 3',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },
  D20F: {
    category: 'buttons',
    label: 'Secondary / Hold Control 4',
    description: 'Secondary / Long-press control slot 4',
    type: 'dropdown',
    options: FN_BUTTON_OPTIONS
  },

  // === METADATA, TIMERS & SYSTEM ===
  '501E': {
    category: 'system_meta',
    label: 'EXIF Artist Name',
    description: 'Photographer / Artist name embedded in image EXIF metadata',
    type: 'text_with_presets',
    presets: ['Artist', 'Nikolas', 'Nikolas Werner', '']
  },
  '501F': {
    category: 'system_meta',
    label: 'EXIF Copyright Info',
    description: 'Copyright notice embedded in image EXIF metadata',
    type: 'text_with_presets',
    presets: ['Info', '© 2026 Nikolas', '© All Rights Reserved', '']
  },
  D18D: {
    category: 'system_meta',
    label: 'Auto Power-Off / Standby Timer',
    description: 'Idle time before the camera enters power-saving standby',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Off' },
      { value: 30000, label: '30 Seconds' },
      { value: 60000, label: '1 Minute (Default)' },
      { value: 120000, label: '2 Minutes' },
      { value: 300000, label: '5 Minutes' },
      { value: 600000, label: '10 Minutes' }
    ]
  },
  D051: {
    category: 'system_meta',
    label: 'EVF Refresh Rate / Anti-Flicker Frequency',
    description: 'Electronic Viewfinder frame rate and mains frequency',
    type: 'dropdown',
    options: [
      { value: 50, label: '50 Hz / Low Power' },
      { value: 60, label: '60 fps / 60 Hz (Default)' },
      { value: 120, label: '120 fps (High Smoothness)' }
    ]
  },
  D01E: {
    category: 'system_meta',
    label: 'Display / EVF Timeout (Photo)',
    description: 'Auto review / display timeout in seconds',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Off' },
      { value: 5, label: '5 Seconds' },
      { value: 10, label: '10 Seconds' },
      { value: 15, label: '15 Seconds (Default)' },
      { value: 30, label: '30 Seconds' },
      { value: 60, label: '60 Seconds' }
    ]
  },
  D133: {
    category: 'system_meta',
    label: 'Display / Audio / Secondary Timeout',
    description: 'Secondary timeout duration in seconds',
    type: 'dropdown',
    options: [
      { value: 0, label: 'Off' },
      { value: 5, label: '5 Seconds' },
      { value: 10, label: '10 Seconds' },
      { value: 15, label: '15 Seconds (Default)' },
      { value: 30, label: '30 Seconds' },
      { value: 60, label: '60 Seconds' }
    ]
  },
  D09C: {
    category: 'system_meta',
    label: 'Self-Timer Delay (Photo)',
    description: 'Countdown duration before shutter release',
    type: 'dropdown',
    options: [
      { value: 2, label: '2 Seconds' },
      { value: 12, label: '12 Seconds (Default)' }
    ]
  },
  D212: {
    category: 'system_meta',
    label: 'Self-Timer Delay (Video / Secondary)',
    description: 'Secondary countdown duration',
    type: 'dropdown',
    options: [
      { value: 2, label: '2 Seconds' },
      { value: 12, label: '12 Seconds (Default)' }
    ]
  },
  D1FD: {
    category: 'system_meta',
    label: 'Manual Lens Preset Slot 1 (Shared Firmware)',
    description: 'Manual lens preset stored in camera profile',
    type: 'dropdown',
    options: [
      { value: '36, 1, 95', label: '50mm f/0.95 Noctilux-M ASPH (Default)' },
      { value: '30, 1, 40', label: '35mm f/1.4 Summilux-M ASPH' },
      { value: '37, 1, 40', label: '50mm f/1.4 Summilux-M ASPH' },
      { value: '29, 2, 0', label: '28mm f/2.0 Summicron-M ASPH' },
      { value: '32, 2, 0', label: '35mm f/2.0 Summicron-M ASPH' },
      { value: '39, 2, 0', label: '50mm f/2.0 Summicron-M' }
    ]
  }
};

/**
 * Helper to generate safe dropdown options for ANY of the 346 keys,
 * ensuring the current value and factory default value are always selectable.
 */
function getOptionsForKey(key, currentValues = [], factoryDefaultVal = 0, customSchema = {}) {
  const schemaEntry = customSchema[key] || SETTINGS_SCHEMA[key];
  const baseOptions = schemaEntry && Array.isArray(schemaEntry.options)
    ? [...schemaEntry.options]
    : [];

  // If no predefined options exist, build a smart discrete dropdown based on observed value types
  if (baseOptions.length === 0) {
    const sample = currentValues.find((v) => v !== undefined) ?? factoryDefaultVal;
    if (typeof sample === 'string' && sample.includes(',')) {
      baseOptions.push(
        { value: '36, 1, 95', label: '36, 1, 95 (50mm f/0.95 Default)' },
        { value: '30, 1, 40', label: '30, 1, 40 (35mm f/1.4)' },
        { value: '37, 1, 40', label: '37, 1, 40 (50mm f/1.4)' },
        { value: '32, 2, 0', label: '32, 2, 0 (35mm f/2.0)' }
      );
    } else if (typeof sample === 'string') {
      baseOptions.push(
        { value: sample, label: `${sample}` }
      );
    } else if (typeof sample === 'number') {
      // Standard small integer enum range + observed values
      const candidates = new Set([-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]);
      if (typeof factoryDefaultVal === 'number') candidates.add(factoryDefaultVal);
      for (const v of currentValues) {
        if (typeof v === 'number') candidates.add(v);
      }
      const sorted = Array.from(candidates).sort((a, b) => a - b);
      for (const num of sorted) {
        const isDef = num === factoryDefaultVal;
        baseOptions.push({
          value: num,
          label: isDef ? `${num} (Factory Default)` : `${num}`
        });
      }
    }
  }

  // Ensure every currently present value in the file is in the dropdown list
  const seen = new Set(baseOptions.map((o) => String(o.value)));
  if (factoryDefaultVal !== undefined && !seen.has(String(factoryDefaultVal))) {
    baseOptions.push({
      value: factoryDefaultVal,
      label: `${factoryDefaultVal} (Factory Default)`
    });
    seen.add(String(factoryDefaultVal));
  }
  for (const val of currentValues) {
    if (val !== undefined && !seen.has(String(val))) {
      baseOptions.push({
        value: val,
        label: `${val} (Current File Value)`
      });
      seen.add(String(val));
    }
  }

  return baseOptions;
}

module.exports = {
  CAMERA_MODELS,
  PROFILE_NAME_SUGGESTIONS,
  CATEGORIES,
  SETTINGS_SCHEMA,
  getOptionsForKey
};
