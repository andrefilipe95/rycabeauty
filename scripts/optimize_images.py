"""Create web-ready derivatives while preserving every original image."""

from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]


def webp(source: str, destination: str, width: int, quality: int = 80) -> None:
    src = ROOT / source
    dst = ROOT / destination
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        if image.width > width:
            height = round(image.height * width / image.width)
            image = image.resize((width, height), Image.Resampling.LANCZOS)
        image.save(dst, "WEBP", quality=quality, method=6)


webp(
    "images/hero-erica-ryca-beauty.png",
    "assets/images/hero-erica-ryca-beauty.webp",
    2560,
    88,
)
webp(
    "images/hero-erica-ryca-beauty.png",
    "assets/images/hero-erica-ryca-beauty-1600.webp",
    1600,
    86,
)
webp(
    "images/hero-erica-ryca-beauty.png",
    "assets/images/hero-erica-ryca-beauty-960.webp",
    960,
    82,
)
webp(
    "images/hero-erica-ryca-beauty-mobile.png",
    "assets/images/hero-erica-ryca-beauty-mobile.webp",
    941,
    82,
)
webp(
    "images/hero-erica-ryca-beauty-mobile.png",
    "assets/images/hero-erica-ryca-beauty-mobile-600.webp",
    600,
    80,
)
webp("images/erica.png", "assets/images/erica-ryca-beauty.webp", 690, 82)
webp("images/erica.png", "assets/images/erica-ryca-beauty-480.webp", 480, 80)
webp(
    "images/erica-sobre.png",
    "assets/images/erica-sobre-ryca-beauty.webp",
    1100,
    82,
)
webp(
    "images/erica-sobre.png",
    "assets/images/erica-sobre-ryca-beauty-480.webp",
    480,
    80,
)

for source, name in [
    ("limpeza.png", "limpeza-pele-profunda-seixal.webp"),
    ("laser.png", "depilacao-laser-seixal.webp"),
    ("microagulhamento.png", "microagulhamento-seixal.webp"),
    ("dermaplaning.png", "dermaplaning-seixal.webp"),
    ("peeling-rose-de-mer.png", "peeling-rose-de-mer-seixal.webp"),
    ("hifu.png", "hifu-facial-seixal.webp"),
]:
    webp(f"images/tratamentos/{source}", f"assets/images/tratamentos/{name}", 836, 80)
    webp(
        f"images/tratamentos/{source}",
        f"assets/images/tratamentos/{name.removesuffix('.webp')}-480.webp",
        480,
        78,
    )

webp("images/slider/antes.jpeg", "assets/images/resultados/antes-tratamento-facial.webp", 600, 80)
webp("images/slider/depois.jpeg", "assets/images/resultados/depois-tratamento-facial.webp", 600, 80)

for source, name in [
    ("andre-antes.jpeg", "andre-antes.webp"),
    ("andre-depois.jpeg", "andre-depois.webp"),
    ("edite-antes.jpeg", "edite-antes.webp"),
    ("edite-depois.jpeg", "edite-depois.webp"),
]:
    webp(f"images/galeria/{source}", f"assets/images/resultados/{name}", 600, 80)

for name in [
    "acne-pele-acneica-v2",
    "manchas-hiperpigmentacao-v2",
    "pele-oleosa-v2",
    "poros-obstruidos-v2",
    "pelos-indesejados-encravados-v2",
    "marcas-acne-v2",
    "textura-irregular-v2",
    "excesso-penugem-v2",
    "flacidez-facial-v2",
    "linhas-finas-envelhecimento-v2",
    "pele-baca-luminosidade-v2",
]:
    source = f"images/problemas/{name}.png"
    webp(source, f"assets/images/problemas/{name}-1600.webp", 1600, 88)
    webp(source, f"assets/images/problemas/{name}.webp", 836, 80)
    webp(source, f"assets/images/problemas/{name}-480.webp", 480, 78)

favicon = ROOT / "assets/images/favicon.png"
favicon.parent.mkdir(parents=True, exist_ok=True)
with Image.open(ROOT / "images/icon.png") as image:
    image = ImageOps.exif_transpose(image).convert("RGBA")
    image.thumbnail((96, 96), Image.Resampling.LANCZOS)
    image.save(favicon, "PNG", optimize=True)

print("Imagens otimizadas criadas sem remover os originais.")
