import os
import pickle
import zipfile
import hashlib

# Update this path if your checkpoint is stored elsewhere
CHECKPOINT = os.path.expanduser(
    "~/Desktop/EarlyShield/backend/models/xlmr_unified_tanglish_best.pth"
)

print("=" * 60)
print("EARLYSHIELD CHECKPOINT INSPECTOR")
print("=" * 60)

if not os.path.exists(CHECKPOINT):
    print("\nERROR: Checkpoint not found!")
    print("Current path:", CHECKPOINT)
    print("\nAvailable .pth files in project:")
    for root, dirs, files in os.walk(
        os.path.expanduser("~/Desktop/EarlyShield")
    ):
        for file in files:
            if file.endswith(".pth"):
                print(os.path.join(root, file))
    raise SystemExit

size = os.path.getsize(CHECKPOINT)

print("\nFile:", CHECKPOINT)
print("Size: {:.2f} MB".format(size / (1024 * 1024)))

print("\nCalculating SHA256...")
sha = hashlib.sha256()

with open(CHECKPOINT, "rb") as f:
    for chunk in iter(lambda: f.read(1024 * 1024), b""):
        sha.update(chunk)

print("SHA256:", sha.hexdigest())

print("\n" + "=" * 60)
print("CHECKPOINT FORMAT")
print("=" * 60)

if zipfile.is_zipfile(CHECKPOINT):
    print("Format: ZIP-based PyTorch checkpoint")
    with zipfile.ZipFile(CHECKPOINT) as z:
        for name in z.namelist():
            print(" ", name)

        # Inspect PyTorch's metadata pickle without loading tensor data
        pickle_files = [
            n for n in z.namelist()
            if n.endswith("data.pkl")
        ]

        if pickle_files:
            print("\nCheckpoint metadata file:", pickle_files[0])
            try:
                data = z.read(pickle_files[0])
                print("Metadata pickle size:", len(data), "bytes")
                print("First 100 bytes:", repr(data[:100]))
                print("\nThis metadata requires PyTorch's pickle")
                print("structure to interpret fully.")
            except Exception as e:
                print("Metadata read error:", e)
else:
    print("Format: Legacy/non-ZIP checkpoint")
    print("May require PyTorch to inspect.")

print("\n" + "=" * 60)
print("INSPECTION COMPLETE")
print("=" * 60)
