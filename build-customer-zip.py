#!/usr/bin/env python3
"""Pack the buyer-facing ZIP from this source folder.

Run this after shipping a code change, before re-uploading to Etsy. It bundles
the individual .js files into one app.bundle.js (buyers never need to see
engine.js/calendar.js/etc. by name), inlines demo.js into demo.html, copies
the assets, and zips everything to Desktop/etsy. All buyer-facing
instructions live in the two onboarding PDFs and the in-app Help & guide —
there is no separate text file.

This script only touches a temp staging copy — it never modifies the files
in this repo.
"""
import pathlib
import shutil
import zipfile

SRC = pathlib.Path(__file__).parent
STAGE = pathlib.Path("/tmp/allocate-studio-bill-tracker-stage")
OUT_DIR = pathlib.Path.home() / "Desktop" / "etsy"
PACKAGE_NAME = "AllocateStudio-BillTracker"

BUNDLE_FILES = ["engine.js", "app.js", "month-picker.js", "calendar.js", "guide.js", "forms.js"]


def read(name):
    return (SRC / name).read_text()


def main():
    if STAGE.exists():
        shutil.rmtree(STAGE)
    pkg = STAGE / PACKAGE_NAME
    pkg.mkdir(parents=True)

    bundle = "\n".join(read(f) for f in BUNDLE_FILES)
    (pkg / "app.bundle.js").write_text(bundle)

    old_scripts = "\n".join(f'<script src="{f}"></script>' for f in BUNDLE_FILES)

    index_html = read("index.html")
    assert old_scripts in index_html, "index.html script tags changed — update this script"
    (pkg / "index.html").write_text(
        index_html.replace(old_scripts, '<script src="app.bundle.js"></script>')
    )

    demo_html = read("demo.html")
    old_demo_scripts = (
        '<script src="engine.js"></script>\n<script src="demo.js"></script>\n' + old_scripts.split("\n", 1)[1]
    )
    assert old_demo_scripts in demo_html, "demo.html script tags changed — update this script"
    demo_js = read("demo.js")
    inline = f"<script>\n{demo_js}\n</script>\n<script src=\"app.bundle.js\"></script>"
    (pkg / "demo.html").write_text(demo_html.replace(old_demo_scripts, inline))

    shutil.copytree(SRC / "assets", pkg / "assets")
    shutil.copy(SRC / "styles.css", pkg / "styles.css")

    for pdf in ["Bill_Tracker_Welcome.pdf", "Bill_Tracker_StartHere.pdf"]:
        p = OUT_DIR / pdf
        if p.exists():
            shutil.copy(p, pkg / pdf)
        else:
            print(f"WARNING: {pdf} not found in {OUT_DIR}, skipping")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = OUT_DIR / f"{PACKAGE_NAME}.zip"
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(pkg.rglob("*")):
            if f.is_file():
                zf.write(f, pathlib.Path(PACKAGE_NAME) / f.relative_to(pkg))

    print(f"Wrote {zip_path}")


if __name__ == "__main__":
    main()
