"""
Run this script ONCE inside the recommender_env_v1 conda environment:

    conda activate recommender_env_v1
    python "recommendation system/export_model.py"

It loads knnbaseline_recommender.pkl (which needs surprise) and re-saves all
the raw data arrays into knnbaseline_exported.pkl using only numpy + plain Python.
The exported file loads on any Python version with no surprise dependency.
"""

import pickle
import numpy as np
from pathlib import Path
from collections import Counter

INPUT  = Path(__file__).parent / "models" / "knnbaseline_recommender.pkl"
OUTPUT = Path(__file__).parent / "models" / "knnbaseline_exported.pkl"

print(f"Loading {INPUT} ...")
with open(INPUT, "rb") as f:
    bundle = pickle.load(f)

model    = bundle["model"]       # surprise KNNBaseline
trainset = bundle["trainset"]    # surprise Trainset

print(f"  model type   : {type(model).__name__}")
print(f"  n_users      : {trainset.n_users}")
print(f"  n_items      : {trainset.n_items}")
print(f"  n_ratings    : {trainset.n_ratings}")

# ── Extract raw arrays from the trained model ─────────────────────────────────

# Similarity matrix (n_users × n_users for user-based KNN)
sim = np.array(model.sim, dtype=np.float32)
print(f"  sim matrix   : {sim.shape}")

# Biases: bu (per user), bi (per item), global mean mu
bu = np.array(model.bu, dtype=np.float32)
bi = np.array(model.bi, dtype=np.float32)
mu = float(trainset.global_mean)
print(f"  bu shape     : {bu.shape}   bi shape: {bi.shape}   mu: {mu:.4f}")

# KNN hyperparams
k     = int(model.k)
min_k = int(model.min_k)
print(f"  k={k}  min_k={min_k}  user_based={model.sim_options.get('user_based', True)}")

# ── User / item ID mappings ───────────────────────────────────────────────────
# raw2inner: external ID → integer index used by the model
# inner2raw: integer index → external ID

raw2inner_u = dict(trainset._raw2inner_id_users)   # {raw_uid: inner_idx}
raw2inner_i = dict(trainset._raw2inner_id_items)   # {raw_iid: inner_idx}

inner2raw_u = {v: k for k, v in raw2inner_u.items()}
inner2raw_i = {v: k for k, v in raw2inner_i.items()}

# ── Per-user rated items (inner indices + ratings) ────────────────────────────
# ur[inner_uid] = [(inner_iid, rating), ...]
ur = {int(uid): [(int(iid), float(r)) for iid, r in items]
      for uid, items in trainset.ur.items()}

# ir[inner_iid] = [(inner_uid, rating), ...]
ir = {int(iid): [(int(uid), float(r)) for uid, r in users]
      for iid, users in trainset.ir.items()}

# ── Popularity scores (count how many users rated each item) ─────────────────
item_counts = Counter(iid for ratings in ur.values() for iid, _ in ratings)
# Map back to raw product IDs, sorted by count desc
popularity_sorted = [
    inner2raw_i[idx]
    for idx, _ in item_counts.most_common()
    if idx in inner2raw_i
]

# ── Build the surprise-free export bundle ─────────────────────────────────────
exported = {
    # Core model data
    "sim":          sim,            # (n_users × n_users) float32 numpy array
    "bu":           bu,             # (n_users,) user biases
    "bi":           bi,             # (n_items,) item biases
    "mu":           mu,             # global mean rating
    "k":            k,
    "min_k":        min_k,
    "user_based":   True,

    # ID mappings
    "raw2inner_u":  raw2inner_u,    # {raw_uid: int}
    "raw2inner_i":  raw2inner_i,    # {raw_iid: int}
    "inner2raw_u":  inner2raw_u,    # {int: raw_uid}
    "inner2raw_i":  inner2raw_i,    # {int: raw_iid}

    # Rating data (for neighbor lookup)
    "ur":           ur,             # {inner_uid: [(inner_iid, rating)]}
    "ir":           ir,             # {inner_iid: [(inner_uid, rating)]}

    # Convenience fields (carried over from original bundle)
    "all_product_ids":  bundle["all_product_ids"],
    "user_rated_items": {u: list(v) for u, v in bundle["user_rated_items"].items()},
    "popularity_sorted": popularity_sorted,

    "metadata": {
        **bundle.get("metadata", {}),
        "exported_by": "export_model.py",
        "surprise_free": True,
    },
}

print(f"\nSaving → {OUTPUT}")
with open(OUTPUT, "wb") as f:
    pickle.dump(exported, f, protocol=pickle.HIGHEST_PROTOCOL)

size_mb = OUTPUT.stat().st_size / 1024 ** 2
print(f"Done.  {size_mb:.1f} MB  (no surprise dependency)")

# ── Quick sanity check ────────────────────────────────────────────────────────
print("\nVerification:")
print(f"  users mapped : {len(raw2inner_u):,}")
print(f"  items mapped : {len(raw2inner_i):,}")
print(f"  popular[0]   : {popularity_sorted[0] if popularity_sorted else 'N/A'}")
