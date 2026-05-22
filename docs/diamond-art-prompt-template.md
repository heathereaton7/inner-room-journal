# Premium Diamond Art Image-Generation Prompt

Use this template in ChatGPT (image generation), DALL·E, Midjourney, or
Stable Diffusion to produce artwork that converts beautifully through the
in-app **Import Artwork** flow.

After generating, save the image and import it via:
**Cabin → Book → Choose Your Path → Diamond Art → Import → upload**

Pick **Detailed (150×150)** for most scenes, **Premium (200×200)** for
portraits or richly textured pieces, **Masterpiece (320×320)** for
collectible-quality kits.

---

## The Prompt

```
You are generating PREMIUM diamond-art-ready artwork intended for conversion
into highly detailed diamond painting canvases.

GOAL
Create visually stunning, highly detailed artwork that converts exceptionally
well into diamond art patterns with rich gradients, clean segmentation,
dramatic lighting, and strong readability at large grid sizes.

STYLE
- ultra detailed
- sharp edges
- high local contrast
- rich cinematic lighting
- strong foreground/background separation
- intricate textures
- vivid color gradients
- glowing highlights
- stained-glass-like color clarity
- premium diamond painting aesthetic
- optimized for 80–120 color palette conversion
- visually impressive when pixelated into drill grids
- avoid muddy blending, flat watercolor softness, low-contrast areas,
  excessive blur, tiny unreadable micro-details

LIGHTING
- cinematic lighting
- glowing rim light
- volumetric light rays
- luminous highlights
- dramatic shadows
- radiant atmosphere

COMPOSITION
- strong centered focal point
- visually balanced
- decorative but readable
- clean silhouette separation
- no cluttered backgrounds

SUBJECT
[INSERT SUBJECT HERE — e.g. "A lion lying peacefully with a lamb under a
sunrise sky, surrounded by blossoms"]

TEXT
Include elegant readable Bible verse typography integrated artistically
into the image:
"[INSERT VERSE HERE — e.g. 'The Lord is my shepherd; I shall not want.']"
— [INSERT REFERENCE — e.g. Psalm 23:1]

OUTPUT
Premium collectible diamond painting kit artwork.
```

---

## Recommended Subjects (verse-paired)

| Verse | Reference | Subject seed |
|---|---|---|
| Be still, and know that I am God. | Psalm 46:10 | A peaceful lake at sunset with mountains in the distance and a bench facing the water, cinematic golden light. |
| For God so loved the world that He gave His one and only Son. | John 3:16 | A wooden cross draped with white cloth on a hilltop, sunrise behind, wildflowers in the foreground. |
| The Lord is my shepherd; I shall not want. | Psalm 23:1 | A regal lion lying beside a young lamb on green pasture, sunset rim-light, pink flowers around. |
| Come to me, all you who are weary, and I will give you rest. | Matthew 11:28 | Christ embracing a tired traveler, warm sunset glow, robes flowing, soft floral surround. |
| I can do all this through Him who strengthens me. | Philippians 4:13 | A small cabin by a waterfall at dawn, mountains glowing, light streaming through pines. |
| Let all that you do be done in love. | 1 Corinthians 16:14 | A vintage bicycle leaning on a wooden fence overflowing with a basket of wildflowers, soft cottagecore light. |
| Your word is a lamp to my feet and a light to my path. | Psalm 119:105 | A lighthouse at twilight standing on cliffs, glowing beam cutting through purple sky over the sea. |
| Trust in the Lord with all your heart. | Proverbs 3:5 | A sunrise over the ocean seen through a fence-lined boardwalk path, golden water, soft pink clouds. |
| The joy of the Lord is my strength. | Nehemiah 8:10 | A blossoming cherry tree at sunset arching over a stone bridge above a glowing river. |
| He has made everything beautiful in its time. | Ecclesiastes 3:11 | A mountain reflected in a still alpine lake, snow caps, pine forest, painterly cinematic sky. |
| I am the way, the truth, and the life. | John 14:6 | A wooden bridge leading up into glowing clouds at sunrise, rose blossoms flanking the path. |
| When I am afraid, I put my trust in You. | Psalm 56:3 | A serene moonlit night over the sea, full moon, blooming pink roses along the shore. |

---

## Import Settings Cheat Sheet

| Image type | Recommended preset | Sparkle |
|---|---|---|
| Landscape with bright sky / water | Detailed (150²) | on |
| Portrait or detailed face | Premium (200²) | on |
| Simple symbolic art (cross, dove) | Standard (120²) | on |
| Highly detailed scene with text | Masterpiece (320²) | on |
| Logo or flat illustration | Quick (80²) | off |

---

## Notes on the Pipeline

1. Image is **downscaled** to a 1024-px canvas (longest side).
2. **Unsharp-mask sharpening** recovers edge crispness.
3. **80-color palette** is extracted via Wu Quantization (image-q).
4. Image is **resized to the chosen grid** with box filtering.
5. **Floyd–Steinberg dithering** maps every drill to the nearest palette
   color, simulating gradients the palette can't represent directly.
6. The **brightest 3% of palette entries** become sparkle gems
   automatically (capped at 6% of all drills).
7. A small base64 thumbnail is stored for the template picker.

If results feel too pixelated, choose a higher preset. If they feel too
muddy, the source image may need more contrast — try regenerating with
more cinematic lighting in the prompt.
