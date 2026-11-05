import zipfile
import pickletools
import os

checkpoint = os.path.expanduser(
    "~/Desktop/EarlyShield/backend/models/xlmr_unified_tanglish_best.pth"
)

with zipfile.ZipFile(checkpoint) as z:
    metadata = z.read("xlmr_unified_tanglish_best/data.pkl")

print("=" * 65)
print("EARLYSHIELD MODEL METADATA ANALYSIS")
print("=" * 65)

print("\n--- MODEL PARAMETER NAMES ---")

names = []

for opcode, argument, position in pickletools.genops(metadata):
    if opcode.name in ("BINUNICODE", "SHORT_BINUNICODE", "UNICODE"):
        if isinstance(argument, str):
            if any(x in argument.lower() for x in (
                "encoder", "classifier", "head", "weight",
                "bias", "embedding", "lstm", "attention",
                "pooler", "tactic", "risk"
            )):
                names.append(argument)

for name in dict.fromkeys(names):
    print(name)

print("\n--- INTEGER METADATA ---")

for opcode, argument, position in pickletools.genops(metadata):
    if opcode.name in ("BININT", "BININT1", "BININT2", "LONG1"):
        if isinstance(argument, int) and 0 <= argument <= 100000:
            print(argument, end=" ")

print("\n\n--- PICKLE STRUCTURE ---")
print("Metadata length:", len(metadata))
print("Analysis completed.")
