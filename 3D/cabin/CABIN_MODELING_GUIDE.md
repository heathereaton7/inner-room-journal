# Cabin Main Room — 3D Modeling Guide (v2)

## Overview
The cabin is the player's home base in Inner Room Journal. It should feel warm, cozy, handcrafted, and spiritually inviting — like a mountain retreat where you'd want to sit with your Bible and a cup of tea.

**This guide was updated to match the concept art reference images generated in ChatGPT (March 2026).**

## Style Reference
- **Tone:** Cozy life sim (think: A Short Hike, Unpacking, Stardew Valley interiors)
- **Realism:** Warm and slightly stylized — NOT cartoonish, NOT hyper-realistic
- **Materials:** Handcrafted wood, warm stone, soft fabrics, string lights, knit throws
- **Mood:** Peaceful, contemplative, safe, lived-in
- **Time of Day:** Evening/night — warm interior glow against dark windows

## Room Dimensions
- **Floor:** ~6.5m x 5.5m (wider than v1 for panoramic window)
- **Ceiling Height:** ~3.2m with exposed beam structure
- **Orientation:** Door on south wall, fireplace on north wall, panoramic window on east wall
- **Wall Style:** Horizontal wood plank walls

## Floor Plan (Top Down)
```
         NORTH (fireplace wall)
    ┌─────────────────────────────────┐
    │                                 │
    │  [bookshelf] [fireplace+mantel] │
    │    (tall)     (stone, cross,    │
    │               candles)          │
    │                                 │
W   │           [coffee               │  E
E   │            table]               │  A  [panoramic
S   │  [sofa L-shape      [rug]      │  S   window +
T   │   + throws                     │  T   window seat
    │   + cushions]      [desk area  │      + blankets
    │                     + lamp     │      + cushions]
    │                     + chair]   │
    │                                 │
    │  [plant     [door]              │
    │   basket]   (barn-style)        │
    └─────────────────────────────────┘
         SOUTH (door wall)
```

## Ceiling Structure
- **Exposed beams** (key visual feature from concept art)
- Main ridge beam running along Y axis (center)
- 4 cross beams running along X axis
- 2 diagonal support rafters
- **String lights** draped between beams (2 strands, 36 total bulbs with catenary droop)
- Ceiling panels between beams (warm wood tone)

## Furniture Pieces

### 1. L-Shaped Sectional Sofa (South-West Area)
- **Replaces:** Simple wooden chair from v1
- L-shaped with long section (2.4m) running along X and short section (0.9m x 1.2m) on left
- Grey-purple upholstery fabric
- Back cushion on long section (2.4m x 0.55m high)
- Back cushion on short section (1.2m x 0.55m high)
- Right armrest (0.14m wide x 0.30m high)
- **Accessories:** 2 chunky cream knit throw blankets draped over sections, 3 muted blue-grey cushions
- This is where the player sits for Bible reading

### 2. Low Coffee Table (Center)
- **Replaces:** Tall dining table from v1
- Low rectangular table, center of room on rug
- Size: ~1.2m x 0.7m x 0.40m (much lower than v1's 0.75m)
- Warm light wood tone
- 4 dark wood legs (0.04m square)
- **Props on table:**
  - Open Bible (two page halves + spine)
  - Small wooden cross standing upright
  - Single candle with flame

### 3. Bookshelf (North-West, Left of Fireplace)
- Tall wooden bookshelf against north-west wall
- Size: ~1.1m x 0.35m x 2.3m (dark wood frame)
- 5 shelves with colorful book blocks (varied heights, 6 color palette)
- Small lantern prop on top shelf
- Book colors: maroon, forest green, navy/purple, tan/gold, red, teal

### 4. Stone Fireplace (North Wall)
- Stone surround fireplace, taller than v1
- Size: ~1.5m x 0.55m x 2.0m (full surround)
- Stone material: warm grey-brown
- Fireplace opening with dark interior
- Log props inside (3 cylinders at angles)
- Embers glowing at base
- **Mantel:** Dark wood, 1.7m wide, extending beyond stone
- **On mantel:** Wooden cross (center, 0.30m tall) + 5 white pillar candles (varied heights 0.09-0.15m) with flames
- Small potted plant next to fireplace base

### 5. Panoramic Window + Window Seat (East Wall)
- **Replaces:** Small 1.5m x 1.8m window from v1
- Large panoramic window spanning most of east wall
- Frame: ~3.8m wide x 1.9m tall (dark wood)
- Glass: dark blue tint (night sky with pine trees)
- Single vertical mullion divider
- **Built-in window seat/bench:**
  - Solid wood base (0.65m deep x 3.6m long x 0.58m tall)
  - Light wood top surface
  - Chunky knit blanket draped over seat
  - 4 muted blue-grey cushions along seat
  - Small lantern with candle on one end

### 6. Writing Desk (East Side, Near Window)
- **Upgraded from** small journal desk in v1
- Full desk body with drawers: ~1.4m x 0.6m x 0.74m (light wood)
- Desk top surface: 1.5m x 0.65m
- 2 drawer fronts (dark wood, visual detail)
- **Props on desk:**
  - Open Bible (two page halves)
  - Journal/notepad
  - Dome desk lamp (brass base + arm + warm white glass shade)
  - Small potted plant (ceramic white pot, green leaves)
- **Desk chair:** Upholstered seat (grey-purple, matching sofa), dark wood legs, padded backrest

### 7. Barn-Style Door (South Wall)
- **Replaces:** Simple plank door from v1
- Dark wood panel, ~1.0m x 2.1m
- Cross-brace pattern (X-shape with horizontal bar — barn door style)
- Iron handle on left side
- No arch — straight-cut top

### 8. Large Cream Shag Rug (Center Floor)
- **New in v2** (seen in all concept art)
- Covers most of the central floor area
- Size: ~3.8m x 3.2m
- Cream/white color, fluffy texture
- Sits under the coffee table and in front of the sofa

### 9. Plant in Wicker Basket (By Door)
- **New in v2** (accent piece from concept art)
- Wicker basket (brown, 0.14m radius x 0.28m tall)
- Green leafy plant sphere on top
- Placed near the door on the south wall

## String Lights (Critical Visual Feature)
- 2 strands of warm-glow bulb lights
- Draped across ceiling beams with catenary (arc) droop
- 18 bulbs per strand = 36 total
- Thin wire segments connecting bulbs
- Warm golden glow color (1.0, 0.85, 0.55)
- This is one of the most prominent features from the concept art

## Lighting Setup
- **Fireplace:** Point light, warm amber (1.0, 0.60, 0.25), energy 200, soft shadows
- **String Light Ambient:** Area light, warm gold (1.0, 0.82, 0.50), energy 60, size 4.0m
- **Window (Night):** Area light, cool blue (0.55, 0.60, 0.85), energy 30, size 2.0m
- **Desk Lamp:** Point light, warm white (1.0, 0.88, 0.68), energy 80, soft shadows
- **Mantel Candles:** Point light, warm amber (1.0, 0.78, 0.40), energy 25
- **Overall:** Warm, golden, cozy evening glow — string lights are key mood setter

## Material Palette (25+ materials)

### Wood
| Material | Color (RGBA) | Roughness | Use |
|----------|-------------|-----------|-----|
| Wood_Floor | (0.32, 0.20, 0.11) | 0.75 | Floor planks |
| Wood_Wall | (0.38, 0.26, 0.15) | 0.82 | Horizontal plank walls |
| Wood_Dark | (0.22, 0.14, 0.07) | 0.72 | Door, shelf frame, legs, drawers |
| Wood_Light | (0.52, 0.38, 0.23) | 0.65 | Coffee table, desk, window seat |
| Ceiling_Beam | (0.35, 0.24, 0.14) | 0.78 | Exposed rafters |
| Ceiling_Panel | (0.42, 0.32, 0.20) | 0.80 | Panels between beams |

### Stone & Metal
| Material | Color | Roughness | Use |
|----------|-------|-----------|-----|
| Stone | (0.42, 0.38, 0.33) | 0.92 | Fireplace surround |
| Iron | (0.12, 0.12, 0.12) | 0.40 | Door hardware, string light wire |
| Lamp_Brass | (0.72, 0.58, 0.30) | 0.25 | Desk lamp base/arm |
| Lantern_Metal | (0.18, 0.16, 0.14) | 0.50 | Lanterns on shelf/window seat |

### Fabric & Soft
| Material | Color | Roughness | Use |
|----------|-------|-----------|-----|
| Sofa_Fabric | (0.30, 0.28, 0.30) | 0.88 | Sectional sofa, desk chair |
| Knit_Throw | (0.88, 0.83, 0.75) | 0.92 | Chunky knit throws on sofa/window |
| Cushion | (0.35, 0.35, 0.40) | 0.85 | Muted blue-grey cushions |
| Shag_Rug | (0.85, 0.80, 0.72) | 0.95 | Cream fluffy rug |

### Props & Glow
| Material | Color | Roughness | Use |
|----------|-------|-----------|-----|
| Candle_Wax | (0.92, 0.87, 0.72) | 0.60 | Candle bodies |
| Candle_Flame | (1.00, 0.72, 0.22) | 0.00 | Flame tips (emissive) |
| Ember_Glow | (0.92, 0.32, 0.06) | 0.00 | Fireplace embers (emissive) |
| String_Light | (1.00, 0.85, 0.55) | 0.00 | Bulb glow (emissive) |
| Book | (0.28, 0.16, 0.09) | 0.75 | Bible spine/covers |
| Paper | (0.92, 0.88, 0.78) | 0.85 | Open pages, journal |
| Glass | (0.20, 0.25, 0.40) | 0.05 | Window panes (night sky tint) |
| Lamp_Shade | (0.95, 0.90, 0.80) | 0.30 | Desk lamp dome |
| Wooden_Cross | (0.30, 0.20, 0.12) | 0.70 | Crosses on mantel/table |
| Plant_Pot | (0.78, 0.74, 0.68) | 0.80 | Ceramic white plant pots |
| Plant_Leaf | (0.20, 0.40, 0.18) | 0.75 | Green plant foliage |
| Wicker_Basket | (0.50, 0.38, 0.22) | 0.85 | Door basket |

## Cameras (3 Angles — Matching Concept Art)
1. **Camera_Wide_Overview** (default) — Wide room shot from south, looking north
   - Position: (0, -4.2, 2.0), Rotation: 72deg X
2. **Camera_Desk_Closeup** — Close-up of desk/window corner
   - Position: offset from desk, Rotation: 75deg X, 30deg Z
3. **Camera_Door_View** — Looking from north toward door/bookshelf
   - Position: (1.5, 2.0, 1.8), Rotation: 78deg X, 160deg Z

## Blender Collections
```
Cabin_Structure  — floor, walls, ceiling, beams, door, window
Furniture        — sofa, coffee table, bookshelf, fireplace, desk, chair, window seat
Props            — Bible, candles, books, throws, cushions, rug, plants, cross, string lights
Lighting         — 5 light sources
Cameras          — 3 camera angles
```

## Export Settings
- **Format:** GLB (binary glTF)
- **Scale:** 1 unit = 1 meter
- **Origin:** Center of floor
- **Up axis:** +Y
- **File:** `3D/cabin/exports/cabin_main_room.glb`
- **Individual meshes:** Also export each piece separately to `3D/cabin/meshes/`

## Naming Convention
```
cabin_floor
cabin_ceiling
cabin_beam_ridge, cabin_beam_cross_1..4, cabin_beam_rafter_1..2
cabin_wall_north, cabin_wall_south, cabin_wall_east, cabin_wall_west
cabin_door_panel, cabin_door_brace_h, cabin_door_brace_diag1..2, cabin_door_handle
cabin_window_panoramic_frame, cabin_window_panoramic_glass, cabin_window_mullion_v
furniture_coffee_table_top, furniture_coffee_table_leg_1..4
furniture_sofa_seat_long, furniture_sofa_back_long, furniture_sofa_seat_short, furniture_sofa_back_short, furniture_sofa_arm_right
furniture_bookshelf_frame, furniture_bookshelf_shelf_1..5
furniture_fireplace_surround, furniture_fireplace_opening, furniture_fireplace_mantel
furniture_window_seat_base, furniture_window_seat_top
furniture_desk_body, furniture_desk_top, furniture_desk_drawer_1..2
furniture_desk_chair_seat, furniture_desk_chair_back, furniture_desk_chair_leg_1..4
prop_bible_left, prop_bible_right, prop_bible_spine
prop_table_cross_vertical, prop_table_cross_horizontal
prop_table_candle, prop_table_candle_flame
prop_throw_blanket_1..2
prop_cushion_1..3
prop_books_shelf1_1..5 (varied colors per shelf)
prop_shelf_lantern
prop_embers
prop_fireplace_log_1..3
prop_mantel_cross_vertical, prop_mantel_cross_horizontal
prop_mantel_candle_1..5, prop_mantel_candle_1..5_flame
prop_fireplace_plant_pot, prop_fireplace_plant_leaves
prop_window_blanket, prop_window_cushion_1..4
prop_window_lantern_body, prop_window_lantern_candle
prop_desk_bible_left, prop_desk_bible_right
prop_desk_journal
prop_desk_lamp_base, prop_desk_lamp_arm, prop_desk_lamp_shade
prop_desk_plant_pot, prop_desk_plant_leaves
prop_rug_shag
prop_door_basket, prop_door_plant
prop_string_light_0_0..17, prop_string_light_1_0..17
prop_string_wire_0_0..16, prop_string_wire_1_0..16
```

## Changelog
- **v1:** Original layout with simple chair, tall table, small window, flat ceiling, candle table
- **v2:** Rewritten to match concept art — sectional sofa, low coffee table, exposed beams + string lights, panoramic window with seat, barn door, upgraded desk, large rug, accent plants
