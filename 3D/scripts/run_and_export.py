"""
Wrapper script: runs the cabin generator then exports GLB + renders preview images.
Run via command line: blender --background --python run_and_export.py
"""

import bpy
import os
import sys

# ── Paths ────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_3D = os.path.dirname(SCRIPT_DIR)
CABIN_DIR = os.path.join(PROJECT_3D, "cabin")
EXPORTS_DIR = os.path.join(CABIN_DIR, "exports")
RENDERS_DIR = os.path.join(CABIN_DIR, "renders")

os.makedirs(EXPORTS_DIR, exist_ok=True)
os.makedirs(RENDERS_DIR, exist_ok=True)

# ── Step 1: Run the cabin generator ─────────────────────
generator_path = os.path.join(SCRIPT_DIR, "generate_cabin_placeholder.py")
print(f"\n>>> Running cabin generator: {generator_path}")
exec(open(generator_path).read())

# ── Step 2: Save .blend file ────────────────────────────
blend_path = os.path.join(EXPORTS_DIR, "cabin_main_room.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"\n>>> Saved .blend: {blend_path}")

# ── Step 3: Export GLB ──────────────────────────────────
glb_path = os.path.join(EXPORTS_DIR, "cabin_main_room.glb")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_cameras=True,
    export_lights=True,
    export_materials='EXPORT',
)
print(f"\n>>> Exported GLB: {glb_path}")

# ── Step 4: Render preview images from each camera ──────
if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]:
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
else:
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.render.film_transparent = False

cameras = ["Camera_Wide_Overview", "Camera_Desk_Closeup", "Camera_Door_View"]
for cam_name in cameras:
    cam_obj = bpy.data.objects.get(cam_name)
    if cam_obj:
        bpy.context.scene.camera = cam_obj
        render_path = os.path.join(RENDERS_DIR, f"render_{cam_name}.png")
        bpy.context.scene.render.filepath = render_path
        bpy.ops.render.render(write_still=True)
        print(f">>> Rendered: {render_path}")
    else:
        print(f">>> Camera not found: {cam_name}")

# ── Done ────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  ALL DONE!")
print(f"  .blend: {blend_path}")
print(f"  .glb:   {glb_path}")
print(f"  Renders: {RENDERS_DIR}/")
print("=" * 60)
