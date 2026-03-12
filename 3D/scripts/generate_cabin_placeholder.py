"""
Inner Room Journal — Cabin Main Room Placeholder Generator v2
==============================================================
UPDATED to match concept art reference images from ChatGPT.

Open Blender, go to Scripting tab, paste this script, and click Run.
It generates clean placeholder geometry for the entire cabin interior.

Key changes from v1 (based on concept art):
- L-shaped sectional sofa replaces wooden chair
- Lower coffee table replaces tall dining table
- Exposed ceiling beams with string lights
- Barn-style cross-brace door
- Large panoramic window with built-in window seat
- Full writing desk with drawers, lamp, lantern, Bible, plant
- Large fluffy shag rug covering most of floor
- Chunky knit throw blankets on sofa
- Cross on fireplace mantel with multiple candles
- Potted plants as accent decor

Scale: 1 Blender unit = 1 meter
Origin: Center of floor
"""

import bpy
import math

# ── CLEANUP ──────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

for block in bpy.data.meshes:
    if block.users == 0:
        bpy.data.meshes.remove(block)
for block in bpy.data.materials:
    if block.users == 0:
        bpy.data.materials.remove(block)

# ── MATERIALS ────────────────────────────────────────────
def make_mat(name, color, roughness=0.7):
    mat = bpy.data.materials.new(name)
    # Blender 5.0+ materials always use nodes; older versions need explicit opt-in
    if bpy.app.version < (5, 0, 0):
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    return mat

# Warm cabin palette (matched to concept art)
mat_wood_floor   = make_mat("Wood_Floor",     (0.32, 0.20, 0.11, 1), 0.75)
mat_wood_wall    = make_mat("Wood_Wall",      (0.38, 0.26, 0.15, 1), 0.82)  # horizontal plank walls
mat_wood_dark    = make_mat("Wood_Dark",      (0.22, 0.14, 0.07, 1), 0.72)
mat_wood_light   = make_mat("Wood_Light",     (0.52, 0.38, 0.23, 1), 0.65)
mat_beam         = make_mat("Ceiling_Beam",   (0.35, 0.24, 0.14, 1), 0.78)  # exposed rafters
mat_ceiling      = make_mat("Ceiling_Panel",  (0.42, 0.32, 0.20, 1), 0.80)
mat_stone        = make_mat("Stone",          (0.42, 0.38, 0.33, 1), 0.92)
mat_glass        = make_mat("Glass",          (0.20, 0.25, 0.40, 1), 0.05)  # night sky blue tint
mat_iron         = make_mat("Iron",           (0.12, 0.12, 0.12, 1), 0.40)
mat_candle_wax   = make_mat("Candle_Wax",     (0.92, 0.87, 0.72, 1), 0.60)
mat_candle_flame = make_mat("Candle_Flame",   (1.00, 0.72, 0.22, 1), 0.00)
mat_book         = make_mat("Book",           (0.28, 0.16, 0.09, 1), 0.75)
mat_paper        = make_mat("Paper",          (0.92, 0.88, 0.78, 1), 0.85)
mat_rug          = make_mat("Shag_Rug",       (0.85, 0.80, 0.72, 1), 0.95)  # cream/white fluffy rug
mat_ember        = make_mat("Ember_Glow",     (0.92, 0.32, 0.06, 1), 0.00)
mat_sofa         = make_mat("Sofa_Fabric",    (0.30, 0.28, 0.30, 1), 0.88)  # grey-purple upholstery
mat_knit         = make_mat("Knit_Throw",     (0.88, 0.83, 0.75, 1), 0.92)  # cream chunky knit
mat_cushion      = make_mat("Cushion",        (0.35, 0.35, 0.40, 1), 0.85)  # muted blue-grey
mat_lamp_shade   = make_mat("Lamp_Shade",     (0.95, 0.90, 0.80, 1), 0.30)  # warm white glass
mat_lamp_brass   = make_mat("Lamp_Brass",     (0.72, 0.58, 0.30, 1), 0.25)  # brass/gold
mat_lantern      = make_mat("Lantern_Metal",  (0.18, 0.16, 0.14, 1), 0.50)
mat_plant_pot    = make_mat("Plant_Pot",      (0.78, 0.74, 0.68, 1), 0.80)  # ceramic white
mat_plant_leaf   = make_mat("Plant_Leaf",     (0.20, 0.40, 0.18, 1), 0.75)
mat_cross        = make_mat("Wooden_Cross",   (0.30, 0.20, 0.12, 1), 0.70)
mat_string_light = make_mat("String_Light",   (1.00, 0.85, 0.55, 1), 0.00)  # warm glow bulbs
mat_wicker       = make_mat("Wicker_Basket",  (0.50, 0.38, 0.22, 1), 0.85)

def assign_mat(obj, mat):
    obj.data.materials.append(mat)

def add_cube(name, location, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    assign_mat(obj, mat)
    bpy.ops.object.transform_apply(scale=True)
    return obj

def add_cylinder(name, location, radius, depth, mat):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=location)
    obj = bpy.context.active_object
    obj.name = name
    assign_mat(obj, mat)
    return obj

def add_sphere(name, location, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=12, ring_count=8)
    obj = bpy.context.active_object
    obj.name = name
    assign_mat(obj, mat)
    return obj

# ── ROOM DIMENSIONS ─────────────────────────────────────
ROOM_W = 6.5   # X axis (slightly wider for panoramic window feel)
ROOM_D = 5.5   # Y axis
ROOM_H = 3.2   # Z axis
WALL_T = 0.15

# ── FLOOR ────────────────────────────────────────────────
add_cube("cabin_floor",
    location=(0, 0, -0.05),
    scale=(ROOM_W, ROOM_D, 0.1),
    mat=mat_wood_floor)

# ── CEILING (panels between beams) ──────────────────────
add_cube("cabin_ceiling",
    location=(0, 0, ROOM_H + 0.05),
    scale=(ROOM_W, ROOM_D, 0.1),
    mat=mat_ceiling)

# ── EXPOSED CEILING BEAMS (from concept art) ────────────
# Main ridge beam (runs along Y axis, center peak)
add_cube("cabin_beam_ridge",
    location=(0, 0, ROOM_H + 0.15),
    scale=(0.18, ROOM_D, 0.20),
    mat=mat_beam)

# Cross beams (run along X axis)
for i, by in enumerate([-1.8, -0.6, 0.6, 1.8]):
    add_cube(f"cabin_beam_cross_{i+1}",
        location=(0, by, ROOM_H + 0.08),
        scale=(ROOM_W, 0.14, 0.16),
        mat=mat_beam)

# Diagonal support rafters
for i, bx in enumerate([-1.5, 1.5]):
    add_cube(f"cabin_beam_rafter_{i+1}",
        location=(bx, 0, ROOM_H + 0.06),
        scale=(0.12, ROOM_D * 0.7, 0.12),
        mat=mat_beam)

# ── WALLS (horizontal plank style) ──────────────────────
# North wall (fireplace wall, +Y)
add_cube("cabin_wall_north",
    location=(0, ROOM_D/2 + WALL_T/2, ROOM_H/2),
    scale=(ROOM_W + WALL_T*2, WALL_T, ROOM_H),
    mat=mat_wood_wall)

# South wall (door wall, -Y)
add_cube("cabin_wall_south",
    location=(0, -ROOM_D/2 - WALL_T/2, ROOM_H/2),
    scale=(ROOM_W + WALL_T*2, WALL_T, ROOM_H),
    mat=mat_wood_wall)

# West wall (-X)
add_cube("cabin_wall_west",
    location=(-ROOM_W/2 - WALL_T/2, 0, ROOM_H/2),
    scale=(WALL_T, ROOM_D, ROOM_H),
    mat=mat_wood_wall)

# East wall (+X) — mostly window
add_cube("cabin_wall_east",
    location=(ROOM_W/2 + WALL_T/2, 0, ROOM_H/2),
    scale=(WALL_T, ROOM_D, ROOM_H),
    mat=mat_wood_wall)

# ── LARGE FLUFFY SHAG RUG (from concept art) ────────────
# Cream/white, covers most of the central floor
add_cube("prop_rug_shag",
    location=(0, 0, 0.02),
    scale=(3.8, 3.2, 0.04),
    mat=mat_rug)

# ── COFFEE TABLE (low, from concept art) ─────────────────
# Replaced tall dining table with low coffee table
ct_x, ct_y = 0.0, 0.0

add_cube("furniture_coffee_table_top",
    location=(ct_x, ct_y, 0.40),
    scale=(1.2, 0.7, 0.04),
    mat=mat_wood_light)

for i, (lx, ly) in enumerate([(-0.52, -0.28), (0.52, -0.28), (-0.52, 0.28), (0.52, 0.28)]):
    add_cube(f"furniture_coffee_table_leg_{i+1}",
        location=(ct_x + lx, ct_y + ly, 0.20),
        scale=(0.04, 0.04, 0.38),
        mat=mat_wood_dark)

# ── OPEN BIBLE on coffee table ──────────────────────────
add_cube("prop_bible_left",
    location=(ct_x - 0.12, ct_y, 0.44),
    scale=(0.18, 0.24, 0.012),
    mat=mat_paper)
add_cube("prop_bible_right",
    location=(ct_x + 0.12, ct_y, 0.44),
    scale=(0.18, 0.24, 0.012),
    mat=mat_paper)
add_cube("prop_bible_spine",
    location=(ct_x, ct_y, 0.435),
    scale=(0.02, 0.24, 0.02),
    mat=mat_book)

# Small wooden cross next to Bible
add_cube("prop_table_cross_vertical",
    location=(ct_x + 0.35, ct_y, 0.48),
    scale=(0.02, 0.02, 0.10),
    mat=mat_cross)
add_cube("prop_table_cross_horizontal",
    location=(ct_x + 0.35, ct_y, 0.51),
    scale=(0.02, 0.02, 0.06),
    mat=mat_cross)

# Single candle on coffee table
add_cylinder("prop_table_candle",
    location=(ct_x + 0.42, ct_y + 0.05, 0.47),
    radius=0.025, depth=0.10,
    mat=mat_candle_wax)
add_cylinder("prop_table_candle_flame",
    location=(ct_x + 0.42, ct_y + 0.05, 0.54),
    radius=0.008, depth=0.03,
    mat=mat_candle_flame)

# ── L-SHAPED SECTIONAL SOFA (from concept art) ──────────
# Main section (along south side, facing north)
sofa_base_y = -1.2

# Long part of L (runs along X)
add_cube("furniture_sofa_seat_long",
    location=(-0.5, sofa_base_y, 0.28),
    scale=(2.4, 0.9, 0.22),
    mat=mat_sofa)
add_cube("furniture_sofa_back_long",
    location=(-0.5, sofa_base_y - 0.48, 0.58),
    scale=(2.4, 0.14, 0.55),
    mat=mat_sofa)

# Short part of L (runs along Y, left side)
add_cube("furniture_sofa_seat_short",
    location=(-1.75, sofa_base_y + 0.65, 0.28),
    scale=(0.9, 1.2, 0.22),
    mat=mat_sofa)
add_cube("furniture_sofa_back_short",
    location=(-2.22, sofa_base_y + 0.65, 0.58),
    scale=(0.14, 1.2, 0.55),
    mat=mat_sofa)

# Sofa armrests
add_cube("furniture_sofa_arm_right",
    location=(0.72, sofa_base_y, 0.42),
    scale=(0.14, 0.9, 0.30),
    mat=mat_sofa)

# ── THROW BLANKETS on sofa (from concept art) ───────────
# Chunky knit throw draped over left section
add_cube("prop_throw_blanket_1",
    location=(-1.75, sofa_base_y + 0.2, 0.44),
    scale=(0.7, 0.6, 0.06),
    mat=mat_knit)

# Smaller throw on long section
add_cube("prop_throw_blanket_2",
    location=(0.3, sofa_base_y + 0.1, 0.44),
    scale=(0.5, 0.4, 0.05),
    mat=mat_knit)

# ── CUSHIONS on sofa ────────────────────────────────────
cushion_positions = [(-1.1, sofa_base_y, 0.46), (-0.5, sofa_base_y, 0.46), (0.1, sofa_base_y, 0.46)]
for i, (cx, cy, cz) in enumerate(cushion_positions):
    add_cube(f"prop_cushion_{i+1}",
        location=(cx, cy, cz),
        scale=(0.35, 0.10, 0.30),
        mat=mat_cushion)

# ── BOOKSHELF (left of fireplace, north-west) ───────────
shelf_x = -ROOM_W/2 + 0.55
shelf_y = ROOM_D/2 - 0.22

add_cube("furniture_bookshelf_frame",
    location=(shelf_x, shelf_y, 1.15),
    scale=(1.1, 0.35, 2.3),
    mat=mat_wood_dark)

for i, h in enumerate([0.18, 0.60, 1.02, 1.44, 1.86]):
    add_cube(f"furniture_bookshelf_shelf_{i+1}",
        location=(shelf_x, shelf_y - 0.02, h),
        scale=(1.06, 0.32, 0.03),
        mat=mat_wood_light)

# Books on shelves (varied colors matching concept art)
book_colors = [
    (0.45, 0.18, 0.12, 1),   # maroon
    (0.15, 0.28, 0.15, 1),   # forest green
    (0.20, 0.18, 0.38, 1),   # navy/purple
    (0.52, 0.36, 0.16, 1),   # tan/gold
    (0.55, 0.15, 0.12, 1),   # red
    (0.12, 0.30, 0.40, 1),   # teal
]
for shelf_i, h in enumerate([0.30, 0.72, 1.14, 1.56]):
    n_books = 5 if shelf_i < 2 else 4
    for book_i in range(n_books):
        bx = shelf_x - 0.38 + book_i * 0.19
        bc = book_colors[(shelf_i + book_i) % len(book_colors)]
        bm = make_mat(f"Book_{shelf_i}_{book_i}", bc, 0.8)
        bh = 0.18 + (book_i % 3) * 0.03  # vary heights
        add_cube(f"prop_books_shelf{shelf_i+1}_{book_i+1}",
            location=(bx, shelf_y - 0.02, h + bh/2),
            scale=(0.14, 0.20, bh),
            mat=bm)

# Small lantern on top shelf
add_cube("prop_shelf_lantern",
    location=(shelf_x + 0.3, shelf_y - 0.02, 1.96),
    scale=(0.08, 0.08, 0.12),
    mat=mat_lantern)

# ── STONE FIREPLACE (north wall, left of center) ────────
fp_x = -ROOM_W/2 + 2.0
fp_y = ROOM_D/2 - 0.1

# Stone surround (taller, matching concept art)
add_cube("furniture_fireplace_surround",
    location=(fp_x, fp_y, 1.0),
    scale=(1.5, 0.55, 2.0),
    mat=mat_stone)

# Fireplace opening
add_cube("furniture_fireplace_opening",
    location=(fp_x, fp_y - 0.10, 0.45),
    scale=(0.95, 0.32, 0.80),
    mat=make_mat("FP_Interior", (0.06, 0.05, 0.04, 1), 0.95))

# Embers
add_cube("prop_embers",
    location=(fp_x, fp_y - 0.06, 0.10),
    scale=(0.75, 0.22, 0.06),
    mat=mat_ember)

# Log props inside
for i, lx_off in enumerate([-0.15, 0.10, 0.0]):
    add_cylinder(f"prop_fireplace_log_{i+1}",
        location=(fp_x + lx_off, fp_y - 0.06, 0.14 + i*0.04),
        radius=0.05, depth=0.55,
        mat=mat_wood_dark)
    bpy.context.active_object.rotation_euler = (0, math.radians(90), math.radians(10 * (i-1)))

# Mantel
add_cube("furniture_fireplace_mantel",
    location=(fp_x, fp_y - 0.14, 2.05),
    scale=(1.7, 0.24, 0.08),
    mat=mat_wood_dark)

# ── CROSS on mantel (from concept art) ──────────────────
cross_x = fp_x
add_cube("prop_mantel_cross_vertical",
    location=(cross_x, fp_y - 0.14, 2.28),
    scale=(0.04, 0.04, 0.30),
    mat=mat_cross)
add_cube("prop_mantel_cross_horizontal",
    location=(cross_x, fp_y - 0.14, 2.35),
    scale=(0.04, 0.04, 0.16),
    mat=mat_cross)
# Rotate cross arms
bpy.context.active_object.rotation_euler = (0, 0, math.radians(90))

# Candles on mantel (from concept art — white pillar candles)
mantel_candle_positions = [(-0.55, 0.12), (-0.30, 0.15), (0.30, 0.14), (0.50, 0.11), (0.65, 0.09)]
for i, (cx, ch) in enumerate(mantel_candle_positions):
    add_cylinder(f"prop_mantel_candle_{i+1}",
        location=(fp_x + cx, fp_y - 0.14, 2.09 + ch/2),
        radius=0.025, depth=ch,
        mat=mat_candle_wax)
    add_cylinder(f"prop_mantel_candle_{i+1}_flame",
        location=(fp_x + cx, fp_y - 0.14, 2.09 + ch + 0.015),
        radius=0.007, depth=0.025,
        mat=mat_candle_flame)

# Small potted plant next to fireplace
add_cylinder("prop_fireplace_plant_pot",
    location=(fp_x + 0.9, fp_y - 0.15, 0.12),
    radius=0.08, depth=0.12,
    mat=mat_plant_pot)
add_sphere("prop_fireplace_plant_leaves",
    location=(fp_x + 0.9, fp_y - 0.15, 0.28),
    radius=0.12,
    mat=mat_plant_leaf)

# ── PANORAMIC WINDOW + WINDOW SEAT (east wall) ──────────
win_x = ROOM_W/2 - 0.08
win_center_y = 0.3

# Large window frame
add_cube("cabin_window_panoramic_frame",
    location=(win_x, win_center_y, 1.55),
    scale=(0.22, 3.8, 1.9),
    mat=mat_wood_dark)

# Window glass (dark blue for night sky + pine trees)
add_cube("cabin_window_panoramic_glass",
    location=(win_x + 0.02, win_center_y, 1.55),
    scale=(0.04, 3.6, 1.75),
    mat=mat_glass)

# Window mullion (single vertical divider)
add_cube("cabin_window_mullion_v",
    location=(win_x - 0.02, win_center_y, 1.55),
    scale=(0.05, 0.04, 1.75),
    mat=mat_wood_dark)

# Built-in window seat / bench (from concept art)
add_cube("furniture_window_seat_base",
    location=(win_x - 0.35, win_center_y, 0.30),
    scale=(0.65, 3.6, 0.58),
    mat=mat_wood_light)

# Window seat top cushion area
add_cube("furniture_window_seat_top",
    location=(win_x - 0.35, win_center_y, 0.62),
    scale=(0.60, 3.5, 0.05),
    mat=mat_wood_light)

# Chunky knit blanket draped over window seat
add_cube("prop_window_blanket",
    location=(win_x - 0.35, win_center_y - 0.3, 0.68),
    scale=(0.55, 1.8, 0.08),
    mat=mat_knit)

# Cushions on window seat
for i, py in enumerate([-0.8, 0.0, 0.8, 1.3]):
    add_cube(f"prop_window_cushion_{i+1}",
        location=(win_x - 0.35, win_center_y + py, 0.72),
        scale=(0.30, 0.35, 0.22),
        mat=mat_cushion)

# Lantern on window seat
add_cube("prop_window_lantern_body",
    location=(win_x - 0.35, win_center_y - 1.2, 0.78),
    scale=(0.10, 0.10, 0.16),
    mat=mat_lantern)
add_cylinder("prop_window_lantern_candle",
    location=(win_x - 0.35, win_center_y - 1.2, 0.78),
    radius=0.02, depth=0.08,
    mat=mat_candle_wax)

# ── WRITING DESK (right side, near window — from concept art) ──
desk_x = ROOM_W/2 - 1.0
desk_y = win_center_y + 1.2

# Desk body with drawers (solid block for placeholder)
add_cube("furniture_desk_body",
    location=(desk_x, desk_y, 0.38),
    scale=(1.4, 0.60, 0.74),
    mat=mat_wood_light)

# Desk top surface
add_cube("furniture_desk_top",
    location=(desk_x, desk_y, 0.76),
    scale=(1.5, 0.65, 0.04),
    mat=mat_wood_light)

# Drawer fronts (visual detail)
for i, dx in enumerate([-0.35, 0.10]):
    add_cube(f"furniture_desk_drawer_{i+1}",
        location=(desk_x + dx, desk_y - 0.31, 0.30),
        scale=(0.35, 0.02, 0.22),
        mat=mat_wood_dark)

# Open Bible on desk
add_cube("prop_desk_bible_left",
    location=(desk_x - 0.05, desk_y + 0.05, 0.80),
    scale=(0.16, 0.22, 0.012),
    mat=mat_paper)
add_cube("prop_desk_bible_right",
    location=(desk_x + 0.19, desk_y + 0.05, 0.80),
    scale=(0.16, 0.22, 0.012),
    mat=mat_paper)

# Journal / notepad on desk
add_cube("prop_desk_journal",
    location=(desk_x - 0.40, desk_y + 0.05, 0.79),
    scale=(0.14, 0.18, 0.015),
    mat=mat_paper)

# Desk lamp (dome shade on brass arm — from concept art)
add_cylinder("prop_desk_lamp_base",
    location=(desk_x + 0.50, desk_y + 0.10, 0.78),
    radius=0.06, depth=0.02,
    mat=mat_lamp_brass)
add_cylinder("prop_desk_lamp_arm",
    location=(desk_x + 0.50, desk_y + 0.10, 0.92),
    radius=0.012, depth=0.26,
    mat=mat_lamp_brass)
add_sphere("prop_desk_lamp_shade",
    location=(desk_x + 0.50, desk_y + 0.10, 1.08),
    radius=0.10,
    mat=mat_lamp_shade)

# Potted plant on desk
add_cylinder("prop_desk_plant_pot",
    location=(desk_x + 0.55, desk_y - 0.10, 0.82),
    radius=0.05, depth=0.08,
    mat=mat_plant_pot)
add_sphere("prop_desk_plant_leaves",
    location=(desk_x + 0.55, desk_y - 0.10, 0.92),
    radius=0.09,
    mat=mat_plant_leaf)

# Desk chair (upholstered, from concept art)
add_cube("furniture_desk_chair_seat",
    location=(desk_x, desk_y - 0.50, 0.40),
    scale=(0.50, 0.45, 0.10),
    mat=mat_sofa)
add_cube("furniture_desk_chair_back",
    location=(desk_x, desk_y - 0.73, 0.65),
    scale=(0.48, 0.08, 0.45),
    mat=mat_sofa)
for i, (lx, ly) in enumerate([(-0.20, -0.18), (0.20, -0.18), (-0.20, 0.18), (0.20, 0.18)]):
    add_cube(f"furniture_desk_chair_leg_{i+1}",
        location=(desk_x + lx, desk_y - 0.50 + ly, 0.18),
        scale=(0.04, 0.04, 0.28),
        mat=mat_wood_dark)

# ── BARN-STYLE DOOR (south wall — from concept art) ─────
door_x = ROOM_W/2 - 1.5
door_y = -ROOM_D/2 - WALL_T/2
door_z = 1.05

# Main door panel
add_cube("cabin_door_panel",
    location=(door_x, door_y, door_z),
    scale=(1.0, 0.08, 2.1),
    mat=mat_wood_dark)

# Cross-brace (barn door style — X pattern)
# Horizontal brace
add_cube("cabin_door_brace_h",
    location=(door_x, door_y - 0.05, 1.05),
    scale=(0.90, 0.03, 0.06),
    mat=mat_wood_dark)

# Diagonal braces
add_cube("cabin_door_brace_diag1",
    location=(door_x, door_y - 0.05, 1.05),
    scale=(0.06, 0.03, 1.45),
    mat=mat_wood_dark)
bpy.context.active_object.rotation_euler = (0, math.radians(25), 0)

add_cube("cabin_door_brace_diag2",
    location=(door_x, door_y - 0.05, 1.05),
    scale=(0.06, 0.03, 1.45),
    mat=mat_wood_dark)
bpy.context.active_object.rotation_euler = (0, math.radians(-25), 0)

# Door handle (iron)
add_cube("cabin_door_handle",
    location=(door_x - 0.35, door_y - 0.06, 1.0),
    scale=(0.04, 0.06, 0.12),
    mat=mat_iron)

# ── PLANT BY DOOR (wicker basket — from concept art) ────
add_cylinder("prop_door_basket",
    location=(door_x + 0.7, -ROOM_D/2 + 0.3, 0.15),
    radius=0.14, depth=0.28,
    mat=mat_wicker)
add_sphere("prop_door_plant",
    location=(door_x + 0.7, -ROOM_D/2 + 0.3, 0.40),
    radius=0.18,
    mat=mat_plant_leaf)

# ── STRING LIGHTS (across ceiling beams — KEY from concept art) ─
# Two draped strands across the room
import random
random.seed(42)  # deterministic placement

for strand in range(2):
    strand_y_base = -1.0 + strand * 2.0
    n_bulbs = 18
    for i in range(n_bulbs):
        t = i / (n_bulbs - 1)
        bx = -ROOM_W/2 + 0.4 + t * (ROOM_W - 0.8)
        # Catenary-like droop
        droop = 0.25 * math.sin(t * math.pi)
        bz = ROOM_H - 0.15 - droop
        by = strand_y_base + 0.08 * math.sin(t * 5)

        # Bulb
        add_sphere(f"prop_string_light_{strand}_{i}",
            location=(bx, by, bz),
            radius=0.025,
            mat=mat_string_light)

        # Wire segment (thin cylinder between bulbs)
        if i < n_bulbs - 1:
            t2 = (i+1) / (n_bulbs - 1)
            bx2 = -ROOM_W/2 + 0.4 + t2 * (ROOM_W - 0.8)
            droop2 = 0.25 * math.sin(t2 * math.pi)
            bz2 = ROOM_H - 0.15 - droop2
            mid_x = (bx + bx2) / 2
            mid_z = (bz + bz2) / 2
            add_cylinder(f"prop_string_wire_{strand}_{i}",
                location=(mid_x, by, mid_z),
                radius=0.003, depth=0.38,
                mat=mat_iron)
            bpy.context.active_object.rotation_euler = (0, math.radians(90), 0)

# ── LIGHTING ─────────────────────────────────────────────
# Fireplace warm glow
bpy.ops.object.light_add(type='POINT', location=(fp_x, fp_y - 0.4, 0.6))
fl = bpy.context.active_object
fl.name = "light_fireplace"
fl.data.energy = 600
fl.data.color = (1.0, 0.60, 0.25)
fl.data.shadow_soft_size = 0.6

# String light ambient (warm overhead glow — main room illumination)
bpy.ops.object.light_add(type='POINT', location=(0, 0, ROOM_H - 0.4))
sl = bpy.context.active_object
sl.name = "light_string_ambient"
sl.data.energy = 500
sl.data.color = (1.0, 0.82, 0.50)
sl.data.shadow_soft_size = 3.0

# Second overhead fill (so no dark corners)
bpy.ops.object.light_add(type='POINT', location=(1.5, -0.8, ROOM_H - 0.5))
sl2 = bpy.context.active_object
sl2.name = "light_fill_overhead"
sl2.data.energy = 300
sl2.data.color = (1.0, 0.85, 0.60)
sl2.data.shadow_soft_size = 2.5

# Window light (cool blue night — from concept art nighttime feel)
bpy.ops.object.light_add(type='POINT', location=(ROOM_W/2 - 0.5, win_center_y, 1.5))
wl = bpy.context.active_object
wl.name = "light_window_night"
wl.data.energy = 150
wl.data.color = (0.55, 0.60, 0.85)
wl.data.shadow_soft_size = 2.0

# Desk lamp light
bpy.ops.object.light_add(type='POINT', location=(desk_x + 0.50, desk_y + 0.10, 1.0))
dl = bpy.context.active_object
dl.name = "light_desk_lamp"
dl.data.energy = 250
dl.data.color = (1.0, 0.88, 0.68)
dl.data.shadow_soft_size = 0.3

# Mantel candle glow
bpy.ops.object.light_add(type='POINT', location=(fp_x, fp_y - 0.14, 2.25))
mc = bpy.context.active_object
mc.name = "light_mantel_candles"
mc.data.energy = 100
mc.data.color = (1.0, 0.78, 0.40)
mc.data.shadow_soft_size = 0.2

# ── CAMERAS (multiple angles matching concept art) ───────
from mathutils import Vector

def point_camera_at(cam_obj, target_pos):
    """Rotate camera to look at a target world position."""
    direction = Vector(target_pos) - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

# Camera 1: Wide room overview from south-west corner looking at room center
bpy.ops.object.camera_add(location=(-1.5, -2.4, 2.0))
cam1 = bpy.context.active_object
cam1.name = "Camera_Wide_Overview"
cam1.data.lens = 22
point_camera_at(cam1, (0.5, 0.5, 0.8))  # look at center of room, slightly low
bpy.context.scene.camera = cam1

# Camera 2: From sofa area looking at desk + window corner
bpy.ops.object.camera_add(location=(-0.5, -0.8, 1.4))
cam2 = bpy.context.active_object
cam2.name = "Camera_Desk_Closeup"
cam2.data.lens = 30
point_camera_at(cam2, (desk_x, desk_y, 0.8))  # look directly at desk

# Camera 3: From fireplace area looking toward door + sofa
bpy.ops.object.camera_add(location=(0.8, 2.0, 1.7))
cam3 = bpy.context.active_object
cam3.name = "Camera_Door_View"
cam3.data.lens = 22
point_camera_at(cam3, (0.0, -1.2, 0.5))  # look at sofa/door area

# ── RENDER SETTINGS ──────────────────────────────────────
# Blender 4.0-4.x used BLENDER_EEVEE_NEXT; 3.x and 5.0+ use BLENDER_EEVEE
if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]:
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
else:
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080

# ── ORGANIZE INTO COLLECTIONS ────────────────────────────
def move_to_collection(pattern, collection_name):
    col = bpy.data.collections.new(collection_name)
    bpy.context.scene.collection.children.link(col)
    for obj in bpy.data.objects:
        if obj.name.startswith(pattern):
            for old_col in obj.users_collection:
                old_col.objects.unlink(obj)
            col.objects.link(obj)

move_to_collection("cabin_", "Cabin_Structure")
move_to_collection("furniture_", "Furniture")
move_to_collection("prop_", "Props")
move_to_collection("light_", "Lighting")
move_to_collection("Camera", "Cameras")

print("=" * 60)
print("  CABIN v2 — CONCEPT ART MATCHED — GENERATED!")
print("=" * 60)
print(f"  Room: {ROOM_W}m x {ROOM_D}m x {ROOM_H}m")
print(f"  Objects: {len(bpy.data.objects)}")
print(f"  Materials: {len(bpy.data.materials)}")
print()
print("  KEY ELEMENTS (from concept art):")
print("  - L-shaped sectional sofa with throws + cushions")
print("  - Low coffee table with Bible + cross + candle")
print("  - Stone fireplace with cross + candles on mantel")
print("  - Panoramic window with built-in seat + blankets")
print("  - Writing desk with lamp, Bible, journal, plant")
print("  - Barn-style cross-brace door")
print("  - Bookshelf with colorful books")
print("  - STRING LIGHTS across ceiling beams (36 bulbs)")
print("  - Potted plants by door and on desk")
print("  - Large cream shag rug")
print()
print("  CAMERAS:")
print("  - Camera_Wide_Overview (default)")
print("  - Camera_Desk_Closeup")
print("  - Camera_Door_View")
print()
print("  Next: F12 to render, then export GLB")
print("=" * 60)
