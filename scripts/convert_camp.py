from PIL import Image
import os

d = "C:/Users/Administrator/CodeBuddy/20260915085729/src/assets/camp"

# source PNG -> target JPG mapping (年级阶段)
mapping = {
    "Transform_this_image__replace__2026-09-22T08-56-51.png": "primary.jpg",  # 小学：篝火营地
    "Children_s_storybook_illustrat_2026-09-22T08-57-18.png": "junior.jpg",    # 初中：草地观星
    "Children_s_storybook_illustrat_2026-09-22T08-57-16.png": "senior.jpg",    # 高中：毕业礼
}

MAX_W = 1280
QUALITY = 82

for src, dst in mapping.items():
    p = os.path.join(d, src)
    im = Image.open(p).convert("RGB")
    w, h = im.size
    if w > MAX_W:
        im = im.resize((MAX_W, round(h * MAX_W / w)), Image.LANCZOS)
    out = os.path.join(d, dst)
    im.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    size = os.path.getsize(out)
    print(f"{dst}: {im.size[0]}x{im.size[1]}  {size/1024:.0f} KB")
    # 删除原 PNG，保持仓库干净
    os.remove(p)
    print(f"removed {src}")

print("done")
