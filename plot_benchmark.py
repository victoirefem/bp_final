import matplotlib.pyplot as plt

# Load data
commitments = []
times = []

with open("proof_benchmark.txt", "r") as f:
    for line in f:
        if "," in line:
            n, t = line.strip().split(",")
            commitments.append(int(n))
            times.append(float(t))

# Plotting
plt.figure(figsize=(10, 6))
plt.plot(commitments, times, marker="o", linestyle="-")

# plt.title("ZK Proof Generation Time vs Number of Commitments")
plt.xlabel("Number of Commitments")
plt.ylabel("Proof Generation Time (seconds)")
plt.grid(True)
plt.tight_layout()
plt.savefig("proof_generation_time_plot.png")
plt.show()


