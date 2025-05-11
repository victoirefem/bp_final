import subprocess

log_file = "proof_benchmark_2.txt"

# Clear the previous log file
open(log_file, "w").close()

for n in range(90, 101):
    print(f"\n=== Running full pipeline for n = {n} ===")
    result = subprocess.run(
        ["python3", "proof_time.py"],
        input=str(n),  # simulate typing 'n' for input()
        text=True
    )

    if result.returncode != 0:
        print(f"❌ Pipeline failed for n = {n}")
        break
