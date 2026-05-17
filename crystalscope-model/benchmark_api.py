import os
import time
import statistics
import requests

# MODEL_URL = "http://16.59.206.79:5001/analyze"
# For local test later:
MODEL_URL = "http://127.0.0.1:5001/analyze"

IMAGE_FOLDER = r"C:\Users\Von\Documents\GitHub\THESIS\test_images"
TIMEOUT_SECONDS = 300

valid_ext = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
image_paths = [
    os.path.join(IMAGE_FOLDER, f)
    for f in os.listdir(IMAGE_FOLDER)
    if f.lower().endswith(valid_ext)
]

if not image_paths:
    raise RuntimeError(f"No images found in {IMAGE_FOLDER}")

times = []
failures = []

print(f"Testing {len(image_paths)} images using: {MODEL_URL}")
print(f"Timeout per image: {TIMEOUT_SECONDS} seconds\n")

for index, path in enumerate(image_paths, start=1):
    name = os.path.basename(path)
    print(f"[{index}/{len(image_paths)}] Testing {name}...")

    try:
        with open(path, "rb") as img:
            files = {"image": (name, img, "image/jpeg")}

            start = time.perf_counter()
            response = requests.post(MODEL_URL, files=files, timeout=TIMEOUT_SECONDS)
            end = time.perf_counter()

        elapsed_ms = (end - start) * 1000

        if response.ok:
            times.append(elapsed_ms)
            print(f"  OK: {elapsed_ms:.2f} ms")
        else:
            failures.append((name, f"HTTP {response.status_code}", elapsed_ms))
            print(f"  FAILED HTTP {response.status_code}: {elapsed_ms:.2f} ms")
            print(f"  Response: {response.text[:300]}")

    except requests.exceptions.Timeout:
        failures.append((name, "TIMEOUT", TIMEOUT_SECONDS * 1000))
        print(f"  TIMEOUT after {TIMEOUT_SECONDS} seconds")

    except Exception as e:
        failures.append((name, str(e), 0))
        print(f"  ERROR: {e}")

print("\n=== BENCHMARK RESULTS ===")
print(f"Total images        : {len(image_paths)}")
print(f"Successful images   : {len(times)}")
print(f"Failed images       : {len(failures)}")

if times:
    print(f"Average time/image  : {statistics.mean(times):.2f} ms")
    print(f"Median time/image   : {statistics.median(times):.2f} ms")
    print(f"Fastest image       : {min(times):.2f} ms")
    print(f"Slowest image       : {max(times):.2f} ms")

    if len(times) > 1:
        print(f"Std deviation       : {statistics.stdev(times):.2f} ms")
else:
    print("No successful images. Cannot compute average time.")

if failures:
    print("\n=== FAILURES ===")
    for name, reason, elapsed in failures:
        print(f"{name}: {reason}")