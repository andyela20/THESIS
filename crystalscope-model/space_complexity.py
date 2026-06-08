import os
import time
import subprocess
from pathlib import Path

try:
    import psutil
except ImportError:
    print("Missing psutil. Install it using:")
    print("py -3.11 -m pip install psutil")
    raise


ROOT = Path(r"C:\Users\Von\Documents\GitHub\THESIS")

MODEL_FILES = [
    ROOT / "crystalscope-model" / "model-final" / "RAFA LATEST.pt",
    ROOT / "crystalscope-model" / "model-final" / "dinov2_classifier.pt",
]

MODEL_API_EXE = ROOT / "crystalscope-model" / "dist" / "model-api" / "model-api.exe"
MODEL_API_FOLDER = ROOT / "crystalscope-model" / "dist" / "model-api"

DESKTOP_DIST_FOLDER = ROOT / "crystal app" / "dist"
DESKTOP_INSTALLER = DESKTOP_DIST_FOLDER / "MagniTect Setup 0.1.0.exe"


def bytes_to_mb(size_bytes):
    return round(size_bytes / (1024 * 1024), 2)


def bytes_to_gb(size_bytes):
    return round(size_bytes / (1024 * 1024 * 1024), 2)


def file_size(path):
    if path.exists() and path.is_file():
        return path.stat().st_size
    return 0


def folder_size(path):
    total = 0

    if not path.exists():
        return 0

    for root, dirs, files in os.walk(path):
        for file in files:
            fp = Path(root) / file
            try:
                total += fp.stat().st_size
            except OSError:
                pass

    return total


def find_processes(names):
    matched = []

    for proc in psutil.process_iter(["pid", "name", "memory_info", "cpu_percent"]):
        try:
            proc_name = (proc.info["name"] or "").lower()

            if any(name.lower() in proc_name for name in names):
                mem = proc.info["memory_info"]
                matched.append({
                    "pid": proc.info["pid"],
                    "name": proc.info["name"],
                    "ram_mb": bytes_to_mb(mem.rss),
                    "peak_info_available": hasattr(mem, "peak_wset"),
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return matched


def get_nvidia_smi():
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-compute-apps=pid,process_name,used_memory",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )

        if result.returncode != 0:
            return []

        rows = []

        for line in result.stdout.strip().splitlines():
            parts = [p.strip() for p in line.split(",")]

            if len(parts) >= 3:
                rows.append({
                    "pid": parts[0],
                    "process": parts[1],
                    "gpu_memory_mb": parts[2],
                })

        return rows

    except Exception:
        return []


def print_line():
    print("-" * 70)


print("\n=== SPACE COMPLEXITY / STORAGE REQUIREMENT REPORT ===")
print_line()

print("\n[1] Trained Model File Sizes")
total_model_size = 0

for model_file in MODEL_FILES:
    size = file_size(model_file)
    total_model_size += size

    status = "FOUND" if size > 0 else "MISSING"
    print(f"{model_file.name:30} {bytes_to_mb(size):10} MB   {status}")

print(f"\nTotal trained model storage: {bytes_to_mb(total_model_size)} MB")
print_line()


print("\n[2] Packaged Model API Size")
model_api_exe_size = file_size(MODEL_API_EXE)
model_api_folder_size = folder_size(MODEL_API_FOLDER)

print(f"model-api.exe size          : {bytes_to_mb(model_api_exe_size)} MB")
print(f"model-api folder total size : {bytes_to_mb(model_api_folder_size)} MB")
print_line()


print("\n[3] Desktop Installer / Distribution Size")
installer_size = file_size(DESKTOP_INSTALLER)
dist_size = folder_size(DESKTOP_DIST_FOLDER)

print(f"Desktop installer size      : {bytes_to_mb(installer_size)} MB")
print(f"Desktop dist folder size    : {bytes_to_mb(dist_size)} MB")
print_line()


print("\n[4] Runtime RAM Usage")
print("Checking running processes: model-api.exe, python.exe, MagniTect.exe, electron.exe")

processes = find_processes(["model-api", "python", "magnitect", "electron"])

if not processes:
    print("No related running process found.")
    print("Start the app/model API first, then run this script again.")
else:
    total_ram = 0

    for proc in processes:
        total_ram += proc["ram_mb"]
        print(f"PID {proc['pid']:8} | {proc['name']:25} | RAM: {proc['ram_mb']:10} MB")

    print(f"\nTotal detected runtime RAM usage: {round(total_ram, 2)} MB")

print_line()


print("\n[5] Runtime GPU VRAM Usage")
gpu_rows = get_nvidia_smi()

if not gpu_rows:
    print("No NVIDIA GPU process detected, or nvidia-smi is unavailable.")
    print("Run analysis while this script is open to check if GPU memory is used.")
else:
    for row in gpu_rows:
        print(
            f"PID {row['pid']:8} | {row['process']:45} | GPU VRAM: {row['gpu_memory_mb']} MB"
        )

print_line()


print("\n=== SUMMARY FOR THESIS ===")
print(f"Model storage size          : {bytes_to_mb(total_model_size)} MB")
print(f"Packaged model API size     : {bytes_to_mb(model_api_folder_size)} MB")
print(f"Desktop installer size      : {bytes_to_mb(installer_size)} MB")

if processes:
    print(f"Runtime RAM usage observed  : {round(total_ram, 2)} MB")
else:
    print("Runtime RAM usage observed  : Not measured because app/model was not running")

if gpu_rows:
    total_gpu = 0
    for row in gpu_rows:
        try:
            total_gpu += float(row["gpu_memory_mb"])
        except ValueError:
            pass
    print(f"Runtime GPU VRAM observed   : {round(total_gpu, 2)} MB")
else:
    print("Runtime GPU VRAM observed   : Not detected")

print("\nDone.")