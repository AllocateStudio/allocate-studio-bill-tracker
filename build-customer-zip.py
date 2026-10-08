#!/usr/bin/env python3
"""Pack the buyer-facing ZIP from this source folder.

Run this after shipping a code change, before re-uploading to Etsy. The
package root only shows what a buyer needs to look at: index.html and the
two onboarding PDFs. Everything else (the CSS, the bundled script, fonts,
logo, and the demo) lives tucked away in an app/ subfolder, so opening the
ZIP isn't a wall of technical files.

It bundles the individual .js files into one app/app.bundle.js (buyers
never need to see engine.js/calendar.js/etc. by name) and inlines demo.js
into app/demo.html. All buyer-facing instructions live in the two
onboarding PDFs and the in-app Help & guide — there is no separate text
file.

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
    app_dir = pkg / "app"
    app_dir.mkdir(parents=True)

    bundle = "\n".join(read(f) for f in BUNDLE_FILES)
    (app_dir / "app.bundle.js").write_text(bundle)

    old_scripts = "\n".join(f'<script src="{f}"></script>' for f in BUNDLE_FILES)

    # index.html stays at the package root; its asset/script/demo links now
    # point one level down, into app/.
    index_html = read("index.html")
    assert old_scripts in index_html, "index.html script tags changed — update this script"
    index_html = index_html.replace(old_scripts, '<script src="app/app.bundle.js"></script>')
    index_html = index_html.replace('href="styles.css"', 'href="app/styles.css"')
    index_html = index_html.replace('href="assets/', 'href="app/assets/')
    index_html = index_html.replace('href="demo.html"', 'href="app/demo.html"')
    (pkg / "index.html").write_text(index_html)

    # demo.html moves into app/ alongside its own assets, so its own
    # styles.css/app.bundle.js/assets references stay unchanged — only its
    # link back up to index.html needs the extra "../".
    demo_html = read("demo.html")
    old_demo_scripts = (
        '<script src="engine.js"></script>\n<script src="demo.js"></script>\n' + old_scripts.split("\n", 1)[1]
    )
    assert old_demo_scripts in demo_html, "demo.html script tags changed — update this script"
    demo_js = read("demo.js")
    inline = f"<script>\n{demo_js}\n</script>\n<script src=\"app.bundle.js\"></script>"
    demo_html = demo_html.replace(old_demo_scripts, inline)
    demo_html = demo_html.replace('href="index.html"', 'href="../index.html"')
    (app_dir / "demo.html").write_text(demo_html)

    shutil.copytree(SRC / "assets", app_dir / "assets")
    shutil.copy(SRC / "styles.css", app_dir / "styles.css")

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
