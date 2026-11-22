import os
import zipfile
import subprocess
import shutil
import re

BASE_DIR = r"E:\antigravity\dcai"
BUILD_DIR = os.path.join(BASE_DIR, "android_build")
JAVA_BIN = r"C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin"
JAVAC = os.path.join(JAVA_BIN, "javac.exe")
JAVA = os.path.join(JAVA_BIN, "java.exe")
TOOLS_DIR = r"E:\antigravity\appweblock"
AAPT = os.path.join(TOOLS_DIR, "aapt.exe")
R8_JAR = os.path.join(TOOLS_DIR, "r8.jar")
ANDROID_JAR = os.path.join(TOOLS_DIR, "android.jar")
UBER_SIGNER = os.path.join(TOOLS_DIR, "uber-apk-signer.jar")
KEYSTORE = os.path.join(TOOLS_DIR, "aegis_release.keystore")

DIST_INDEX = os.path.join(BASE_DIR, "dist", "index.html")
DIST_ASSETS = os.path.join(BASE_DIR, "dist", "assets")
OUTPUT_APK = os.path.join(BASE_DIR, "AuraAI.apk")

def build():
    print("=" * 65)
    print("BUILDING 100% NATIVE AURA AI APK (PACKAGE: com.aura.ai)")
    print("=" * 65)

    # 1. Inline dist assets into assets/index.html
    assets_dir = os.path.join(BUILD_DIR, "assets")
    os.makedirs(assets_dir, exist_ok=True)

    with open(DIST_INDEX, "r", encoding="utf-8") as f:
        html = f.read()

    css_files = [os.path.join(DIST_ASSETS, f) for f in os.listdir(DIST_ASSETS) if f.endswith(".css")]
    js_files = [os.path.join(DIST_ASSETS, f) for f in os.listdir(DIST_ASSETS) if f.endswith(".js")]

    css_content = ""
    for c in css_files:
        with open(c, "r", encoding="utf-8") as cf:
            css_content += cf.read() + "\n"

    js_content = ""
    for j in js_files:
        with open(j, "r", encoding="utf-8") as jf:
            js_content += jf.read() + "\n"

    # Place style in <head> and script at bottom of <body> AFTER <div id="root">
    parts_css = re.split(r'<link[^>]*rel="stylesheet"[^>]*>', html)
    html = f'<style>\n{css_content}\n</style>'.join(parts_css)

    # Remove existing script tags in head
    html = re.sub(r'<script[^>]*src="[^"]*"[^>]*></script>', '', html)

    # Insert script right before </body>
    script_bundle = f'<script defer>\ndocument.addEventListener("DOMContentLoaded", function() {{\n{js_content}\n}});\n</script>'
    html = html.replace('</body>', f'{script_bundle}\n</body>')

    target_html = os.path.join(assets_dir, "index.html")
    with open(target_html, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[1/6] Inlined web app into assets/index.html ({len(html)} bytes)")

    # 2. Compile resources with aapt
    gen_dir = os.path.join(BUILD_DIR, "gen")
    bin_dir = os.path.join(BUILD_DIR, "bin")
    res_dir = os.path.join(BUILD_DIR, "res")
    manifest_xml = os.path.join(BUILD_DIR, "AndroidManifest.xml")

    os.makedirs(gen_dir, exist_ok=True)
    os.makedirs(bin_dir, exist_ok=True)

    cmd_aapt_gen = [
        AAPT, "package", "-f", "-m",
        "-J", gen_dir,
        "-M", manifest_xml,
        "-S", res_dir,
        "-I", ANDROID_JAR
    ]
    subprocess.check_call(cmd_aapt_gen)
    print("[2/6] aapt generated com.aura.ai R.java")

    # 3. Compile Java with javac
    java_files = []
    for r, _, files in os.walk(os.path.join(BUILD_DIR, "src")):
        for file in files:
            if file.endswith(".java"):
                java_files.append(os.path.join(r, file))
    for r, _, files in os.walk(gen_dir):
        for file in files:
            if file.endswith(".java"):
                java_files.append(os.path.join(r, file))

    cmd_javac = [
        JAVAC, "-encoding", "UTF-8",
        "-cp", f"{ANDROID_JAR};{gen_dir}",
        "-d", bin_dir
    ] + java_files
    subprocess.check_call(cmd_javac)
    print("[3/6] javac compiled MainActivity.java and R.class")

    # 4. Compile with D8 to classes.dex
    class_files = []
    for root, _, files in os.walk(bin_dir):
        for file in files:
            if file.endswith(".class"):
                class_files.append(os.path.join(root, file))

    cmd_d8 = [
        JAVA, "-cp", R8_JAR,
        "com.android.tools.r8.D8",
        "--lib", ANDROID_JAR,
        "--output", bin_dir
    ] + class_files
    subprocess.check_call(cmd_d8)
    print("[4/6] D8 compiled native classes.dex for com.aura.ai")

    # 5. Package base APK with aapt
    raw_apk = os.path.join(BUILD_DIR, "raw_unsigned.apk")
    if os.path.exists(raw_apk):
        os.remove(raw_apk)

    cmd_aapt_pack = [
        AAPT, "package", "-f",
        "-M", manifest_xml,
        "-S", res_dir,
        "-A", assets_dir,
        "-I", ANDROID_JAR,
        "-F", raw_apk
    ]
    subprocess.check_call(cmd_aapt_pack)

    dex_path = os.path.join(bin_dir, "classes.dex")
    with zipfile.ZipFile(raw_apk, "a") as z:
        z.write(dex_path, "classes.dex")
    print(f"[5/6] aapt packaged raw APK ({os.path.getsize(raw_apk)} bytes)")

    # 6. Sign and Align with uber-apk-signer
    cmd_sign = [
        JAVA, "-jar", UBER_SIGNER,
        "--apks", raw_apk,
        "--ks", KEYSTORE,
        "--ksAlias", "aegis",
        "--ksPass", "aegisshield123",
        "--ksKeyPass", "aegisshield123",
        "--allowResign"
    ]
    res = subprocess.run(cmd_sign, capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)

    signed_candidate = os.path.join(BUILD_DIR, "raw_unsigned-aligned-signed.apk")
    if os.path.exists(signed_candidate):
        shutil.copy2(signed_candidate, OUTPUT_APK)
        print(f"🎉 FINAL RELEASE READY: {OUTPUT_APK} ({os.path.getsize(OUTPUT_APK)} Bytes)")
    else:
        print("ERROR: signed apk not found!")

if __name__ == "__main__":
    build()
