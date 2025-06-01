import json
import os
import matplotlib.pyplot as plt

metrics_path = "cli/metrics/metrics.json"

with open(metrics_path, "r") as f:
    metrics = json.load(f)

raw = metrics["packagePrevalence"]
data = {
    "Nested quantifier": raw["nested"],
    "Greedy dot-star": raw["dotstar"],
    "Overlapping alternation": raw["overlap"]
}

output_dir = "figs"
os.makedirs(output_dir, exist_ok=True)

labels = list(data.keys())
values = list(data.values())

plt.figure()
plt.bar(labels, values)
plt.ylabel("Number of packages")
plt.title("How many packages include each issue type")
plt.xticks(rotation=15)
plt.tight_layout()

output_file = os.path.join(output_dir, "package_prevalence.png")
plt.savefig(output_file)
plt.show()  

print(f"Saved to {output_file}")
