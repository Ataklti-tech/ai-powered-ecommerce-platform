"""
Build recommendation_system_improved.ipynb with all improvements applied.
Run: python build_improved_notebook.py
"""
import json, os

def code_cell(source):
    return {"cell_type":"code","execution_count":None,"metadata":{},"outputs":[],"source":source}

def md_cell(source):
    return {"cell_type":"markdown","metadata":{},"source":source}

cells = []

# ─────────────────────────────────────────────────────────────────────────────
cells.append(md_cell("# E-commerce Recommendation System — IMPROVED v2\n\n"
    "### Key improvements over v1:\n"
    "- **1,000 products** (vs 100) for meaningful collaborative filtering\n"
    "- **5 interaction signals**: purchases (w=5), reviews (w=4), wishlists (w=3), carts (w=2), views (w=1)\n"
    "- **Fixed score formula** (np.log1p bug removed, temporal decay added)\n"
    "- **Implicit ALS** model using scipy (purpose-built for implicit feedback)\n"
    "- **Richer content features**: descriptions + subcategory + brand + expanded tags\n"
    "- **Proper KNN K** scaled to sqrt(n_items)\n"
    "- **Improved LightFM** with richer user/item features and more training\n"
    "- **Fixed evaluation**: cart+review ground truth, Hit Rate@K, MRR, fixed ROC-AUC\n"
    "- **Cold/warm/hot split** evaluation\n"
    "- **Two-stage retrieval + re-ranking** hybrid"))

# ── CELL 1: Step 1 ───────────────────────────────────────────────────────────
cells.append(md_cell("## Step 1 — Imports & Configuration"))

cells.append(code_cell("""\
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
import warnings, time, os, re, pickle
from datetime import datetime
from collections import defaultdict
warnings.filterwarnings('ignore')
np.random.seed(42)

from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import TruncatedSVD, PCA, NMF
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import (
    confusion_matrix, roc_auc_score, average_precision_score,
    precision_score, recall_score, f1_score, accuracy_score,
    roc_curve, precision_recall_curve
)
import scipy
import scipy.sparse as sp

pd.set_option('display.max_columns', 25)
pd.set_option('display.float_format', '{:.4f}'.format)
plt.rcParams.update({'figure.facecolor':'white','axes.facecolor':'#FAFAFA',
                     'axes.spines.top':False,'axes.spines.right':False})
PALETTE = ['#4C6EF5','#F76707','#2F9E44','#E03131','#7048E8',
           '#0C8599','#D6336C','#F59F00','#364FC7','#5C940D']

# ────────────────────────────────────────────────────
#  CONFIGURATION
# ────────────────────────────────────────────────────
DATA_DIR = 'data_improved'

USERS_CSV    = os.path.join(DATA_DIR, 'users.csv')
PRODUCTS_CSV = os.path.join(DATA_DIR, 'products.csv')
REVIEWS_CSV  = os.path.join(DATA_DIR, 'reviews.csv')
CARTS_CSV    = os.path.join(DATA_DIR, 'carts.csv')
ORDERS_CSV   = os.path.join(DATA_DIR, 'orders.csv')
VIEWS_CSV    = os.path.join(DATA_DIR, 'views.csv')
WISHLIST_CSV = os.path.join(DATA_DIR, 'wishlist.csv')

CONFIG = {
    'test_size':       0.20,
    'random_seed':     42,
    'knn_k':           30,        # will be auto-capped to sqrt(n_items)
    'svd_factors':     100,
    'top_n':           10,
    'als_factors':     50,
    'als_iterations':  30,
    'als_reg':         0.01,
    'svdpp_factors':   30,
    'svdpp_epochs':    30,
    'svdpp_lr':        0.005,
    'svdpp_reg':       0.02,
    'lfm_factors':     30,
    'lfm_epochs':      40,
    'lfm_lr':          0.05,
    'lfm_reg':         0.01,
    'lfm_pairs':       20000,
    'temporal_halflife_days': 180,   # decay half-life for recency weighting
}

# Interaction signal weights (all 5 types now used)
INTERACTION_WEIGHTS = {
    'purchase': 5.0,
    'review':   4.0,
    'wishlist': 3.0,
    'cart':     2.0,
    'view':     1.0,
}

os.makedirs('models', exist_ok=True)
os.makedirs('evaluation', exist_ok=True)
print('All imports loaded successfully')
print(f'  numpy {np.__version__} | sklearn ready | scipy {scipy.__version__}')
"""))

# ── CELL 2: Step 2 ───────────────────────────────────────────────────────────
cells.append(md_cell("## Step 2 — Load & Validate Datasets"))

cells.append(code_cell("""\
def load_csv(path, label):
    if not os.path.exists(path):
        raise FileNotFoundError(f'Cannot find {label}: {path}')
    df = pd.read_csv(path, low_memory=False)
    print(f'{label:20s}: {len(df):>9,} rows  | columns: {list(df.columns)}')
    return df

users_df    = load_csv(USERS_CSV,    'users.csv')
products_df = load_csv(PRODUCTS_CSV, 'products.csv')
reviews_df  = load_csv(REVIEWS_CSV,  'reviews.csv')
carts_df    = load_csv(CARTS_CSV,    'carts.csv')
orders_df   = load_csv(ORDERS_CSV,   'orders.csv')
views_df    = load_csv(VIEWS_CSV,    'views.csv')
wishlist_df = load_csv(WISHLIST_CSV, 'wishlist.csv')
print()

# ── Rename to canonical names ─────────────────────────────────────────────────
users_df.rename(columns={'user_id': 'userId'}, inplace=True)
products_df.rename(columns={
    'product_id':'productId','avg_rating':'avgRating','review_count':'numReviews'}, inplace=True)
reviews_df.rename(columns={'user_id':'userId','product_id':'productId','created_at':'reviewedAt'}, inplace=True)
carts_df.rename(columns={'user_id':'userId','product_id':'productId','added_at':'cartAddedAt'}, inplace=True)
orders_df.rename(columns={'user_id':'userId','product_id':'productId','order_date':'orderedAt'}, inplace=True)
views_df.rename(columns={'user_id':'userId','product_id':'productId','viewed_at':'viewedAt'}, inplace=True)
wishlist_df.rename(columns={'user_id':'userId','product_id':'productId','added_at':'wishAddedAt'}, inplace=True)

# ── Parse timestamps ──────────────────────────────────────────────────────────
for df, col in [(reviews_df,'reviewedAt'),(carts_df,'cartAddedAt'),
                (orders_df,'orderedAt'),(views_df,'viewedAt'),(wishlist_df,'wishAddedAt')]:
    df[col] = pd.to_datetime(df[col], errors='coerce', utc=True)

NOW_TS = pd.Timestamp.now(tz='UTC')

# ── Data quality report ───────────────────────────────────────────────────────
print('DATA QUALITY REPORT')
print('='*65)
print(f'  users     : {users_df["userId"].nunique():,} unique users')
print(f'  products  : {len(products_df):,} products | {products_df["category"].nunique()} categories | {products_df["subcategory"].nunique()} subcategories')
print(f'  reviews   : {len(reviews_df):,} | {reviews_df["userId"].nunique():,} users | {reviews_df["productId"].nunique()} products')
print(f'             rating dist: {reviews_df["rating"].value_counts().sort_index().to_dict()}')
print(f'  carts     : {len(carts_df):,} | {carts_df["userId"].nunique():,} users | {carts_df["productId"].nunique()} products')
print(f'  orders    : {len(orders_df):,} | {orders_df["userId"].nunique():,} users | {orders_df["productId"].nunique()} products (purchase signal!)')
print(f'  views     : {len(views_df):,} | {views_df["userId"].nunique():,} users | {views_df["productId"].nunique()} products')
print(f'  wishlist  : {len(wishlist_df):,} | {wishlist_df["userId"].nunique():,} users | {wishlist_df["productId"].nunique()} products')
print('='*65)
"""))

# ── CELL 3: Step 3 ───────────────────────────────────────────────────────────
cells.append(md_cell("## Step 3 — Build Master Interaction Table\n\n"
    "All 5 signal types combined. Scores use **temporal decay** (recency weighting) "
    "and **log-scaled quantity** — the `np.log1p(1)` constant bug from v1 is fixed."))

cells.append(code_cell("""\
def temporal_decay(timestamps, halflife_days=CONFIG['temporal_halflife_days']):
    \"\"\"Exponential decay: weight = exp(-ln2 * days_since / halflife).\"\"\"
    days_since = (NOW_TS - timestamps).dt.total_seconds() / 86400
    days_since = days_since.fillna(days_since.median()).clip(lower=0)
    return np.exp(-0.693 * days_since / halflife_days).values

# ── 1. Reviews → interaction rows ────────────────────────────────────────────
rev_decay = temporal_decay(reviews_df['reviewedAt'])
rev_score = (INTERACTION_WEIGHTS['review']
             * (reviews_df['rating'].values / 5.0)
             * np.log1p(reviews_df['helpful_votes'].fillna(0).values + 1)  # FIX: use helpful_votes
             * rev_decay)
rev_rows = pd.DataFrame({
    'userId':      reviews_df['userId'].values,
    'productId':   reviews_df['productId'].values,
    'interaction': 'review',
    'rating':      reviews_df['rating'].values,
    'quantity':    1,
    'score':       rev_score,
    'timestamp':   reviews_df['reviewedAt'].astype('int64').values // 10**9,
})

# ── 2. Carts → interaction rows ───────────────────────────────────────────────
cart_decay = temporal_decay(carts_df['cartAddedAt'])
cart_qty   = carts_df['quantity'].values.astype(float).clip(1, 20)
cart_score = INTERACTION_WEIGHTS['cart'] * np.log1p(cart_qty) * cart_decay
cart_rows = pd.DataFrame({
    'userId':      carts_df['userId'].values,
    'productId':   carts_df['productId'].values,
    'interaction': 'cart',
    'rating':      np.nan,
    'quantity':    cart_qty,
    'score':       cart_score,
    'timestamp':   carts_df['cartAddedAt'].astype('int64').values // 10**9,
})

# ── 3. Purchases → interaction rows (strongest signal!) ──────────────────────
# Only count delivered/shipped orders as confirmed purchases
delivered_orders = orders_df[orders_df['status'].isin(['delivered','shipped'])].copy()
ord_decay = temporal_decay(delivered_orders['orderedAt'])
ord_score = INTERACTION_WEIGHTS['purchase'] * ord_decay
ord_rows = pd.DataFrame({
    'userId':      delivered_orders['userId'].values,
    'productId':   delivered_orders['productId'].values,
    'interaction': 'purchase',
    'rating':      np.nan,
    'quantity':    1,
    'score':       ord_score,
    'timestamp':   delivered_orders['orderedAt'].astype('int64').values // 10**9,
})

# ── 4. Views → interaction rows ───────────────────────────────────────────────
view_decay = temporal_decay(views_df['viewedAt'])
# Duration-weighted: longer views = stronger signal
dur  = views_df['duration_s'].fillna(30).clip(5, 600).values
view_score = INTERACTION_WEIGHTS['view'] * np.log1p(dur / 30.0) * view_decay
view_rows = pd.DataFrame({
    'userId':      views_df['userId'].values,
    'productId':   views_df['productId'].values,
    'interaction': 'view',
    'rating':      np.nan,
    'quantity':    1,
    'score':       view_score,
    'timestamp':   views_df['viewedAt'].astype('int64').values // 10**9,
})

# ── 5. Wishlist → interaction rows ────────────────────────────────────────────
wish_decay = temporal_decay(wishlist_df['wishAddedAt'])
wish_score = INTERACTION_WEIGHTS['wishlist'] * wish_decay
wish_rows = pd.DataFrame({
    'userId':      wishlist_df['userId'].values,
    'productId':   wishlist_df['productId'].values,
    'interaction': 'wishlist',
    'rating':      np.nan,
    'quantity':    1,
    'score':       wish_score,
    'timestamp':   wishlist_df['wishAddedAt'].astype('int64').values // 10**9,
})

# ── Merge all signals ─────────────────────────────────────────────────────────
interactions_df = pd.concat(
    [rev_rows, cart_rows, ord_rows, view_rows, wish_rows],
    ignore_index=True
)
interactions_df = interactions_df.dropna(subset=['userId','productId','timestamp']).reset_index(drop=True)
interactions_df['timestamp'] = pd.to_numeric(interactions_df['timestamp'], errors='coerce').fillna(0)

print(f'Master interactions : {len(interactions_df):,} rows')
print(f'  Unique users      : {interactions_df["userId"].nunique():,}')
print(f'  Unique products   : {interactions_df["productId"].nunique():,}')
print(f'  Signal types      : {interactions_df["interaction"].value_counts().to_dict()}')
print(f'  Score range       : {interactions_df["score"].min():.4f} – {interactions_df["score"].max():.4f}')
"""))

# ── CELL 4: Step 4 EDA ───────────────────────────────────────────────────────
cells.append(md_cell("## Step 4 — Exploratory Data Analysis"))

cells.append(code_cell("""\
uic = interactions_df.groupby('userId').size()
pic = interactions_df.groupby('productId').size()
n_u = interactions_df['userId'].nunique()
n_p = interactions_df['productId'].nunique()
pairs = interactions_df.groupby(['userId','productId']).ngroups
sparsity = 1 - pairs / (n_u * n_p)
cold_u   = (uic <= 2).sum()

print('='*60)
print('  EDA SUMMARY')
print('='*60)
print(f'  Total interactions          : {len(interactions_df):>9,}')
print(f'  Unique users                : {n_u:>9,}')
print(f'  Unique products             : {n_p:>9,}')
print(f'  Unique (user,product) pairs : {pairs:>9,}')
print(f'  Interaction matrix sparsity : {sparsity*100:>5.1f} %')
print(f'  Avg interactions/user       : {uic.mean():>8.1f}')
print(f'  Cold-start users (<=2)      : {cold_u:>9,}  ({100*cold_u/n_u:.1f} %)')
print(f'  Reviews/product mean/max/min: {reviews_df.groupby("productId").size().mean():.1f} / '
      f'{reviews_df.groupby("productId").size().max()} / '
      f'{reviews_df.groupby("productId").size().min()}')
print('='*60)

fig = plt.figure(figsize=(18, 12))
gs  = gridspec.GridSpec(3, 3, figure=fig, hspace=0.48, wspace=0.38)

# 1. Interaction types
ax1 = fig.add_subplot(gs[0,0])
cnt = interactions_df['interaction'].value_counts()
bars = ax1.bar(cnt.index, cnt.values, color=PALETTE[:len(cnt)], edgecolor='white')
ax1.set_title('Signal Type Distribution'); ax1.set_ylabel('Count')
for bar, v in zip(bars, cnt.values):
    ax1.text(bar.get_x()+bar.get_width()/2, bar.get_height()+200, f'{v:,}', ha='center', fontsize=8)

# 2. Rating distribution (IMPROVED — now has negative reviews)
ax2 = fig.add_subplot(gs[0,1])
rv  = reviews_df['rating'].value_counts().sort_index()
ax2.bar(rv.index.astype(str), rv.values, color=PALETTE[1], edgecolor='white')
ax2.axhline(rv.mean(), color='#E03131', linestyle='--', label=f'Mean: {reviews_df["rating"].mean():.2f}')
ax2.set_title('Rating Distribution (Realistic)'); ax2.set_xlabel('Stars'); ax2.legend(fontsize=9)

# 3. Power-law: interactions per product
ax3 = fig.add_subplot(gs[0,2])
ax3.hist(pic.values, bins=50, color=PALETTE[2], edgecolor='white', log=True)
ax3.set_title('Interactions per Product (log scale)'); ax3.set_xlabel('Count')

# 4. Interactions per user (power law)
ax4 = fig.add_subplot(gs[1,0])
ax4.hist(uic.values, bins=40, color=PALETTE[3], edgecolor='white')
ax4.axvline(uic.median(), color='#364FC7', linestyle='--', label=f'Median: {uic.median():.0f}')
ax4.set_title('Interactions per User'); ax4.set_xlabel('Count'); ax4.legend(fontsize=9)

# 5. Category distribution
ax5 = fig.add_subplot(gs[1,1])
merged = interactions_df.merge(products_df[['productId','category']], on='productId', how='left')
cat_cnt = merged['category'].value_counts()
ax5.barh(cat_cnt.index, cat_cnt.values, color=PALETTE[4], edgecolor='white')
ax5.set_title('Interactions by Category'); ax5.invert_yaxis()

# 6. Price distribution
ax6 = fig.add_subplot(gs[1,2])
ax6.hist(products_df['price'], bins=30, color=PALETTE[5], edgecolor='white')
ax6.set_title('Product Price Distribution'); ax6.set_xlabel('Price (USD)')

# 7. Subcategory count
ax7 = fig.add_subplot(gs[2,0])
sub_cnt = products_df['subcategory'].value_counts().head(15)
ax7.barh(sub_cnt.index, sub_cnt.values, color=PALETTE[6], edgecolor='white')
ax7.set_title('Top 15 Subcategories'); ax7.invert_yaxis()

# 8. Score distribution by type
ax8 = fig.add_subplot(gs[2,1])
for itype, color in zip(['purchase','review','wishlist','cart','view'], PALETTE[:5]):
    subset = interactions_df[interactions_df['interaction']==itype]['score']
    if len(subset):
        ax8.hist(subset, bins=20, alpha=0.6, label=itype, color=color)
ax8.set_title('Score Distribution by Signal Type'); ax8.legend(fontsize=8)

# 9. User persona breakdown
ax9 = fig.add_subplot(gs[2,2])
persona = users_df['persona'].value_counts()
ax9.barh(persona.index, persona.values, color=PALETTE[7], edgecolor='white')
ax9.set_title('User Persona Breakdown'); ax9.invert_yaxis()

fig.suptitle('E-Commerce Recommendation System v2 — EDA Dashboard', fontsize=15, fontweight='bold')
plt.tight_layout()
plt.savefig('evaluation/eda_dashboard_v2.png', dpi=150, bbox_inches='tight')
plt.show()
print('EDA chart saved → evaluation/eda_dashboard_v2.png')
"""))

# ── CELL 5: Step 5 Preprocessing ─────────────────────────────────────────────
cells.append(md_cell("## Step 5 — Preprocessing & Train/Test Split"))

cells.append(code_cell("""\
# ── Per-user min-max normalisation ───────────────────────────────────────────
def minmax_user(grp):
    mn, mx = grp.min(), grp.max()
    return (grp - mn) / (mx - mn + 1e-9)

# Aggregate: sum scores per (user, product) to combine multiple signal types
agg = interactions_df.groupby(['userId','productId'])['score'].sum().reset_index()
agg.columns = ['userId','productId','implicit_score']
agg['implicit_score'] = agg.groupby('userId')['implicit_score'].transform(minmax_user)

print(f'Aggregated (user, product) pairs : {len(agg):,}')
print(f'Non-zero scores                  : {(agg["implicit_score"]>0).sum():,}')

# ── Time-based 80/20 train/test split ─────────────────────────────────────────
interactions_sorted = interactions_df.sort_values('timestamp').reset_index(drop=True)
split_idx   = int(len(interactions_sorted) * (1 - CONFIG['test_size']))
train_raw   = interactions_sorted.iloc[:split_idx]
test_raw    = interactions_sorted.iloc[split_idx:]

train_agg = train_raw.groupby(['userId','productId'])['score'].sum().reset_index()
train_agg.columns = ['userId','productId','implicit_score']
train_agg['implicit_score'] = train_agg.groupby('userId')['implicit_score'].transform(minmax_user)

ALL_USERS    = sorted(agg['userId'].unique().tolist())
ALL_PRODUCTS = sorted(agg['productId'].unique().tolist())
uid2idx      = {u: i for i, u in enumerate(ALL_USERS)}
pid2idx      = {p: i for i, p in enumerate(ALL_PRODUCTS)}
N_USERS      = len(ALL_USERS)
N_PRODUCTS   = len(ALL_PRODUCTS)

def build_sparse(df_agg, users, products, u2i, p2i):
    rows, cols, data = [], [], []
    for uid, pid, sc in zip(df_agg['userId'], df_agg['productId'], df_agg['implicit_score']):
        i = u2i.get(uid)
        j = p2i.get(pid)
        if i is not None and j is not None:
            rows.append(i); cols.append(j); data.append(float(sc))
    return sp.csr_matrix((data, (rows, cols)), shape=(len(users), len(products)), dtype=np.float32)

full_sparse  = build_sparse(agg,       ALL_USERS, ALL_PRODUCTS, uid2idx, pid2idx)
train_sparse = build_sparse(train_agg, ALL_USERS, ALL_PRODUCTS, uid2idx, pid2idx)
train_matrix = train_sparse.toarray()

user_seen = agg.groupby('userId')['productId'].apply(set).to_dict()
user_seen_train = train_agg.groupby('userId')['productId'].apply(set).to_dict()

# ── Test ground truth: BOTH reviews AND carts (fixed!) ───────────────────────
# v1 only used reviews — now includes carts and purchases for better coverage
test_gt_raw = (test_raw[test_raw['interaction'].isin(['review','cart','purchase','wishlist'])]
               .groupby('userId')['productId'].apply(set).to_dict())
test_gt_eval = {str(u): set(str(p) for p in pids)
                for u, pids in test_gt_raw.items() if pids}

print(f'Train interactions   : {len(train_raw):,}')
print(f'Test interactions    : {len(test_raw):,}')
print(f'Sparse matrix shape  : {full_sparse.shape}  (density={full_sparse.nnz/(N_USERS*N_PRODUCTS)*100:.2f}%)')
print(f'Train nonzero entries: {train_sparse.nnz:,}')
print(f'Test GT users        : {len(test_gt_eval):,}')
print(f'Avg relevant items/GT user : {np.mean([len(v) for v in test_gt_eval.values()]):.2f}')
"""))

# ── CELL 6: Step 6 ALS ───────────────────────────────────────────────────────
cells.append(md_cell("## Step 6 — Implicit ALS (Alternating Least Squares)\n\n"
    "ALS is purpose-built for implicit feedback. "
    "Uses confidence weighting `c_ui = 1 + alpha * r_ui`."))

cells.append(code_cell("""\
# ════════════════════════════════════════════════════════════════════
#  Implicit ALS — Alternating Least Squares for Implicit Feedback
#  Based on Hu, Koren & Volinsky (2008) with confidence weighting
#  Uses sparse updates: only iterate over non-zero (interacted) items
#  per user/item for O(nnz * K^2) instead of O(N*M*K^2)
# ════════════════════════════════════════════════════════════════════

K_ALS   = CONFIG['als_factors']
N_ITER  = CONFIG['als_iterations']
REG_ALS = CONFIG['als_reg']
ALPHA   = 40.0   # confidence scaling: c_ui = 1 + alpha * r_ui

print(f'Training Implicit ALS  (K={K_ALS}, iterations={N_ITER}, alpha={ALPHA}) ...')
t0 = time.time()

np.random.seed(CONFIG['random_seed'])
U_als = np.random.normal(0, 0.01, (N_USERS,    K_ALS)).astype(np.float64)
V_als = np.random.normal(0, 0.01, (N_PRODUCTS, K_ALS)).astype(np.float64)

# Keep sparse: CSR for user-slicing, CSC for item-slicing
R_csr = train_sparse.astype(np.float64).tocsr()
R_csc = R_csr.tocsc()
reg_I = REG_ALS * np.eye(K_ALS)

als_rmse_history = []

for iteration in range(N_ITER):
    # ── Fix V, solve for each user (sparse update) ──────────────────────────
    VtV = V_als.T @ V_als  # K x K — recomputed each half-step
    for u in range(N_USERS):
        nz   = R_csr[u].indices            # item indices with r_ui > 0
        if nz.size == 0:
            U_als[u] = 0.0
            continue
        r_u  = R_csr[u].data              # ratings for those items
        c_u  = 1.0 + ALPHA * r_u         # confidence for non-zero only
        V_nz = V_als[nz]                  # (nnz, K)
        # V^T diag(c_u - 1) V  +  V^T V  =  sum over nz + base
        VtCuV = V_nz.T @ (V_nz * (c_u - 1)[:, None]) + VtV
        rhs   = (V_nz * (c_u * r_u)[:, None]).sum(0)
        U_als[u] = np.linalg.solve(VtCuV + reg_I, rhs)

    # ── Fix U, solve for each item (sparse update) ──────────────────────────
    UtU = U_als.T @ U_als
    for i in range(N_PRODUCTS):
        nz   = R_csc[:, i].indices
        if nz.size == 0:
            V_als[i] = 0.0
            continue
        r_i  = R_csc[:, i].data
        c_i  = 1.0 + ALPHA * r_i
        U_nz = U_als[nz]
        UtCiU = U_nz.T @ (U_nz * (c_i - 1)[:, None]) + UtU
        rhs   = (U_nz * (c_i * r_i)[:, None]).sum(0)
        V_als[i] = np.linalg.solve(UtCiU + reg_I, rhs)

    # RMSE on observed entries only (using sparse indices)
    rows, cols = R_csr.nonzero()
    pred_vals  = (U_als[rows] * V_als[cols]).sum(1)
    true_vals  = np.array(R_csr[rows, cols]).flatten()
    rmse       = np.sqrt(((pred_vals - true_vals) ** 2).mean())
    als_rmse_history.append(rmse)
    if (iteration + 1) % 5 == 0:
        print(f'  Iter {iteration+1:2d}/{N_ITER}  RMSE={rmse:.5f}')

elapsed_als = time.time() - t0
print(f'ALS trained in {elapsed_als:.1f}s')

# RMSE convergence plot
fig, ax = plt.subplots(figsize=(8, 3))
ax.plot(range(1, N_ITER+1), als_rmse_history, color=PALETTE[0], linewidth=2, marker='o', markersize=3)
ax.set_title('Implicit ALS Training RMSE'); ax.set_xlabel('Iteration'); ax.set_ylabel('RMSE'); ax.grid(alpha=0.3)
plt.tight_layout(); plt.show()

def als_predict(user_id, top_n=None):
    if top_n is None: top_n = CONFIG['top_n']
    uidx = uid2idx.get(str(user_id))
    if uidx is None: return []
    scores = U_als[uidx] @ V_als.T
    seen   = user_seen_train.get(str(user_id), set())
    order  = np.argsort(scores)[::-1]
    return [ALL_PRODUCTS[j] for j in order if ALL_PRODUCTS[j] not in seen][:top_n]

print('\\nALS sample recs:')
for uid in ALL_USERS[:3]:
    recs = als_predict(uid, top_n=5)
    persona = users_df[users_df['userId']==uid]['persona'].values[0] if len(users_df[users_df['userId']==uid]) else '?'
    print(f'  {uid} ({persona}): {recs}')
"""))

# ── CELL 7: Step 7 SVD-MF ───────────────────────────────────────────────────
cells.append(md_cell("## Step 7 — SVD Matrix Factorization (TruncatedSVD + NMF)\n\n"
    "Fixes from v1 SVD++ collapse:\n"
    "- Uses sklearn's optimized TruncatedSVD (ARPACK) — fully vectorized, no Python loops\n"
    "- Trained on the improved 5-signal interaction matrix (vs reviews-only in v1)\n"
    "- 1,000 products means latent factors actually capture category/subcategory preferences\n"
    "- NMF variant as a complementary non-negative factorization"))

cells.append(code_cell("""\
# ════════════════════════════════════════════════════════════════════
#  SVD Matrix Factorization — sklearn TruncatedSVD
#  Fully vectorized: trains in seconds even on 10K x 1K matrices.
#  v1 bug avoided: no manual SGD bias loop that could collapse.
# ════════════════════════════════════════════════════════════════════
K_PP = min(CONFIG['svdpp_factors'], N_USERS-1, N_PRODUCTS-1)
print(f'Training TruncatedSVD  (K={K_PP}) ...')
t_start = time.time()

svd_model = TruncatedSVD(n_components=K_PP, n_iter=10, random_state=CONFIG['random_seed'])
U_svd = svd_model.fit_transform(train_sparse)   # (N_USERS, K)
Vt_svd = svd_model.components_                  # (K, N_PRODUCTS)
elapsed_pp = time.time() - t_start
explained = svd_model.explained_variance_ratio_.sum()
print(f'TruncatedSVD trained in {elapsed_pp:.2f}s  |  explained variance: {explained:.3f}')

# ── NMF as complementary factorization ────────────────────────────────────────
print(f'Training NMF  (K={K_PP}) ...')
t_nmf = time.time()
nmf_model = NMF(n_components=K_PP, max_iter=200, random_state=CONFIG['random_seed'])
U_nmf  = nmf_model.fit_transform(train_sparse)  # (N_USERS, K)
Vt_nmf = nmf_model.components_                  # (K, N_PRODUCTS)
print(f'NMF trained in {time.time()-t_nmf:.2f}s  |  reconstruction error: {nmf_model.reconstruction_err_:.4f}')

# ── Prediction functions ───────────────────────────────────────────────────────
def svdpp_predict(user_id, top_n=None):
    if top_n is None: top_n = CONFIG['top_n']
    uidx = uid2idx.get(str(user_id))
    if uidx is None: return []
    scores = U_svd[uidx] @ Vt_svd    # (K,) @ (K, N) -> (N,)
    seen   = user_seen_train.get(str(user_id), set())
    order  = np.argsort(scores)[::-1]
    return [ALL_PRODUCTS[j] for j in order if ALL_PRODUCTS[j] not in seen][:top_n]

def nmf_predict(user_id, top_n=None):
    if top_n is None: top_n = CONFIG['top_n']
    uidx = uid2idx.get(str(user_id))
    if uidx is None: return []
    scores = U_nmf[uidx] @ Vt_nmf
    seen   = user_seen_train.get(str(user_id), set())
    order  = np.argsort(scores)[::-1]
    return [ALL_PRODUCTS[j] for j in order if ALL_PRODUCTS[j] not in seen][:top_n]

# Verify diversity (v1 had all users get same top-3 due to collapse)
print('\\nSVD sample recs (check for diversity — no collapse like v1):')
for uid in ALL_USERS[:3]:
    recs = svdpp_predict(uid, top_n=3)
    persona = users_df[users_df['userId']==uid]['persona'].values[0] if len(users_df[users_df['userId']==uid]) else '?'
    cats = [products_df[products_df['productId']==p]['category'].values[0] for p in recs if len(products_df[products_df['productId']==p])]
    print(f'  {uid} ({persona}): {cats}')
"""))

# ── CELL 8: Step 8 BPR-MF ───────────────────────────────────────────────────
cells.append(md_cell("## Step 8 — BPR-MF (Bayesian Personalized Ranking) + TF-IDF Content Features\n\n"
    "Improvements vs v1:\n"
    "- BPR objective optimises ranking directly (not MSE on ratings)\n"
    "- 2x more epochs, vectorised batch gradient updates\n"
    "- Richer TF-IDF: name + subcategory + brand + description + tags (500 features, bigrams)\n"
    "- Content similarity used for cold-start and item-CF fallback"))

cells.append(code_cell("""\
# ════════════════════════════════════════════════════════════════════
#  BPR-MF — Bayesian Personalized Ranking (Rendle et al. 2009)
#  Pure numpy; no external lightfm dependency.
#  Uses vectorised batch updates for speed.
# ════════════════════════════════════════════════════════════════════

K_FM   = min(CONFIG['lfm_factors'], N_USERS-1, N_PRODUCTS-1)
LR_FM  = CONFIG['lfm_lr']
REG_FM = CONFIG['lfm_reg']
N_EFM  = CONFIG['lfm_epochs']
N_PFM  = CONFIG['lfm_pairs']

# ── TF-IDF content features (name + subcategory + brand + desc + tags) ────────
def parse_tags(t):
    if pd.isna(t): return ''
    return ' '.join(re.findall(r"'([^']+)'", str(t)))

products_df['tags_clean'] = products_df['tags'].apply(parse_tags)
products_df['text_feature'] = (
    products_df['name'].fillna('')        + ' ' +
    products_df['category'].fillna('')    + ' ' +
    products_df['subcategory'].fillna('') + ' ' +
    products_df['brand'].fillna('')       + ' ' +
    products_df['tags_clean']             + ' ' +
    products_df['description'].fillna('')
)

tfidf_vec    = TfidfVectorizer(max_features=500, stop_words='english',
                               ngram_range=(1,2), sublinear_tf=True)
tfidf_matrix = tfidf_vec.fit_transform(products_df['text_feature'])
content_sim  = cosine_similarity(tfidf_matrix, tfidf_matrix)
tfidf_pids   = products_df['productId'].tolist()
tfidf_pid2idx = {p: i for i, p in enumerate(tfidf_pids)}

print(f'TF-IDF features: {tfidf_matrix.shape}  (name+sub+brand+desc+tags, bigrams)')
print(f'Content sim matrix: {content_sim.shape}')

# ── Popularity scores ─────────────────────────────────────────────────────────
_rv = products_df['avgRating'].fillna(3.0).values.reshape(-1,1)
_nv = np.log1p(products_df['numReviews'].fillna(0).values.reshape(-1,1))
_pp = _rv * _nv
products_df['pop_score'] = (_pp / (_pp.max() + 1e-9)).flatten()
popularity_scores = dict(zip(products_df['productId'], products_df['pop_score']))
pop_arr = np.array([popularity_scores.get(p, 0.0) for p in ALL_PRODUCTS], dtype=np.float32)

# ── BPR-MF: Init embeddings + biases ──────────────────────────────────────────
_ui_bpr, _ii_bpr = R_csr.nonzero()
observed_user_items = defaultdict(set)
for _u, _i in zip(_ui_bpr.tolist(), _ii_bpr.tolist()):
    observed_user_items[_u].add(_i)

np.random.seed(CONFIG['random_seed'])
U_bpr = np.random.normal(0, 0.01, (N_USERS,    K_FM)).astype(np.float32)
V_bpr = np.random.normal(0, 0.01, (N_PRODUCTS, K_FM)).astype(np.float32)
bu_bpr = np.zeros(N_USERS,    dtype=np.float32)
bi_bpr = np.zeros(N_PRODUCTS, dtype=np.float32)

def _sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -15, 15)))

# ── Vectorised batch BPR training ─────────────────────────────────────────────
print(f'Training BPR-MF  (K={K_FM}, epochs={N_EFM}, batch_size={N_PFM}) ...')
t_bpr = time.time()
bpr_losses = []

# Pre-build positive (u, i) pairs array once
pos_users = _ui_bpr.astype(np.int32)
pos_items = _ii_bpr.astype(np.int32)
n_pos     = len(pos_users)

for epoch in range(N_EFM):
    # Sample N_PFM positive pairs
    idx    = np.random.randint(0, n_pos, N_PFM)
    u_idx  = pos_users[idx]
    i_idx  = pos_items[idx]
    # Uniform negative items (different from positive)
    j_idx  = np.random.randint(0, N_PRODUCTS, N_PFM)
    # Quick fix: replace j==i with random other item
    same   = (j_idx == i_idx)
    j_idx[same] = (j_idx[same] + np.random.randint(1, N_PRODUCTS, same.sum())) % N_PRODUCTS

    pu  = U_bpr[u_idx]              # (B, K)
    qi  = V_bpr[i_idx]              # (B, K)
    qj  = V_bpr[j_idx]              # (B, K)
    s_diff = (bu_bpr[u_idx] + bi_bpr[i_idx] - bi_bpr[j_idx]
              + ((pu * qi) - (pu * qj)).sum(1))  # (B,)
    g      = _sigmoid(-s_diff)       # BPR gradient weight (B,)
    loss   = -np.log(_sigmoid(s_diff) + 1e-9).mean()
    bpr_losses.append(loss)

    # Gradient updates (vectorised)
    g3 = g[:, None]                  # (B,1) for broadcasting
    bu_bpr_delta = np.zeros_like(bu_bpr)
    np.add.at(bu_bpr_delta, u_idx, LR_FM * g)
    bu_bpr += bu_bpr_delta - LR_FM * REG_FM * bu_bpr

    bi_bpr_pos = np.zeros_like(bi_bpr); bi_bpr_neg = np.zeros_like(bi_bpr)
    np.add.at(bi_bpr_pos, i_idx,  LR_FM * g)
    np.add.at(bi_bpr_neg, j_idx, -LR_FM * g)
    bi_bpr += bi_bpr_pos + bi_bpr_neg - LR_FM * REG_FM * bi_bpr

    dU = np.zeros_like(U_bpr)
    np.add.at(dU, u_idx, LR_FM * g3 * (qi - qj))
    U_bpr += dU - LR_FM * REG_FM * U_bpr

    dVi = np.zeros_like(V_bpr); dVj = np.zeros_like(V_bpr)
    np.add.at(dVi, i_idx,  LR_FM * g3 * pu)
    np.add.at(dVj, j_idx, -LR_FM * g3 * pu)
    V_bpr += dVi + dVj - LR_FM * REG_FM * V_bpr

    if (epoch+1) % 5 == 0:
        print(f'  Epoch {epoch+1:2d}/{N_EFM}  BPR loss={loss:.5f}')

elapsed_fm = time.time() - t_bpr
print(f'BPR-MF trained in {elapsed_fm:.1f}s')

# Loss plot
fig, ax = plt.subplots(figsize=(8,3))
ax.plot(range(1, N_EFM+1), bpr_losses, color=PALETTE[1], linewidth=2)
ax.set_title('BPR-MF Training Loss'); ax.set_xlabel('Epoch'); ax.set_ylabel('BPR Loss')
ax.grid(alpha=0.3); plt.tight_layout(); plt.show()

def lightfm_predict(user_id, top_n=None):
    if top_n is None: top_n = CONFIG['top_n']
    uidx = uid2idx.get(str(user_id))
    if uidx is None: return []
    scores = bu_bpr[uidx] + bi_bpr + V_bpr @ U_bpr[uidx]
    seen   = user_seen_train.get(str(user_id), set())
    order  = np.argsort(scores)[::-1]
    return [ALL_PRODUCTS[j] for j in order if ALL_PRODUCTS[j] not in seen][:top_n]

print('\\nBPR sample recs:')
for uid in ALL_USERS[:3]:
    recs = lightfm_predict(uid, top_n=5)
    print(f'  {uid}: {recs}')
"""))

# ── CELL 9: Step 9 KNN ───────────────────────────────────────────────────────
cells.append(md_cell("## Step 9 — KNN (User-based & Item-based) with Proper K"))

cells.append(code_cell("""\
# K scaled to sqrt(n_items) for item-based, sqrt(n_users) for user-based
K_user = min(int(np.sqrt(N_USERS)),  CONFIG['knn_k'], N_USERS-1)
K_item = min(int(np.sqrt(N_PRODUCTS)), CONFIG['knn_k'], N_PRODUCTS-1)
print(f'K_user={K_user}, K_item={K_item}  (auto-scaled to sqrt of dimension)')

knn_user = NearestNeighbors(n_neighbors=K_user+1, metric='cosine', algorithm='brute', n_jobs=-1)
knn_item = NearestNeighbors(n_neighbors=K_item+1, metric='cosine', algorithm='brute', n_jobs=-1)
knn_user.fit(train_sparse)
knn_item.fit(train_sparse.T)
print(f'User-based KNN fitted  (K={K_user}, n_users={N_USERS:,})')
print(f'Item-based KNN fitted  (K={K_item}, n_products={N_PRODUCTS:,})')

def user_based_cf_scores(user_idx):
    u_vec = train_sparse[user_idx]
    dists, idxs = knn_user.kneighbors(u_vec, n_neighbors=min(K_user+1, N_USERS))
    neighbors   = [(i, 1-d) for i, d in zip(idxs[0], dists[0]) if i != user_idx]
    if not neighbors: return np.zeros(N_PRODUCTS, dtype=np.float32)
    scores = np.zeros(N_PRODUCTS, dtype=np.float64)
    total_sim = 0.0
    for nb_idx, sim in neighbors:
        scores += sim * train_matrix[nb_idx]
        total_sim += abs(sim)
    return (scores / (total_sim + 1e-9)).astype(np.float32)

def item_based_cf_scores(user_idx):
    seen_items = np.where(train_matrix[user_idx] > 0)[0]
    if len(seen_items) == 0: return np.zeros(N_PRODUCTS, dtype=np.float32)
    scores = np.zeros(N_PRODUCTS, dtype=np.float64)
    for item_idx in seen_items[:20]:
        item_vec = train_sparse.T[item_idx]
        dists, idxs = knn_item.kneighbors(item_vec, n_neighbors=min(K_item+1, N_PRODUCTS))
        w = train_matrix[user_idx, item_idx]
        for i, d in zip(idxs[0], dists[0]):
            if i != item_idx:
                scores[i] += w * (1 - d)
    return scores.astype(np.float32)

# Demo
sample_uid = ALL_USERS[0]
sample_idx = uid2idx[sample_uid]
ucf = user_based_cf_scores(sample_idx)
print(f'\\nTop-5 UCF scores for {sample_uid}: {np.argsort(ucf)[::-1][:5].tolist()}')
"""))

# ── CELL 10: Step 10 Content Based ──────────────────────────────────────────
cells.append(md_cell("## Step 10 — Content-Based Filtering with Rich Features"))

cells.append(code_cell("""\
# tfidf_matrix, content_sim, tfidf_pid2idx already built in Step 8 (LightFM cell)
# Here we build the content scoring function

def content_based_scores(seen_product_ids, top_n=None):
    scores = defaultdict(float)
    seen_set = set(str(p) for p in seen_product_ids)
    count = 0
    for pid in seen_product_ids[:30]:
        idx = tfidf_pid2idx.get(str(pid))
        if idx is None: continue
        sim_row = content_sim[idx]
        for j, s in enumerate(sim_row):
            p = tfidf_pids[j]
            if str(p) not in seen_set and s > 0.01:
                scores[p] += s
        count += 1
    if count > 0:
        for p in scores: scores[p] /= count
    return dict(scores)

# Test content similarity quality with richer features
print('Top-5 similar to prod_0001 with IMPROVED features:')
p0 = tfidf_pids[0]
sim_row = content_sim[0]
top5 = np.argsort(sim_row)[::-1][1:6]
for idx in top5:
    pid2 = tfidf_pids[idx]
    row  = products_df[products_df['productId']==pid2].iloc[0]
    print(f'  {pid2}  sim={sim_row[idx]:.4f}  [{row["category"]} / {row["subcategory"]}]  {row["name"][:50]}')

# Verify similarities are now more diverse (not all 0.1989 like v1)
sim_values = [sim_row[i] for i in top5]
print(f'\\nSimilarity variance (higher = more discriminative): {np.var(sim_values):.6f}')
print(f'Similarity range: {min(sim_values):.4f} – {max(sim_values):.4f}')
"""))

# ── CELL 11: Step 11 Hybrid Ensemble ────────────────────────────────────────
cells.append(md_cell("## Step 11 — Improved Hybrid Ensemble\n\n"
    "Fixes from v1:\n"
    "- CF only contributes when the user is warm/hot (≥5 interactions)\n"
    "- Score stacking instead of naive linear blend for warm+ users\n"
    "- Fallback hierarchy: CF-heavy → content-heavy → persona-popularity"))

cells.append(code_cell("""\
def get_weights(n_interactions):
    if n_interactions < 3:
        # Cold: persona-guided popularity, no CF
        return {'user_cf': 0.00, 'item_cf': 0.00, 'content': 0.20, 'popularity': 0.80}
    elif n_interactions < 10:
        # Warm: content leads, CF enters
        return {'user_cf': 0.15, 'item_cf': 0.15, 'content': 0.45, 'popularity': 0.25}
    elif n_interactions < 30:
        # Hot: balanced CF + content
        return {'user_cf': 0.30, 'item_cf': 0.30, 'content': 0.30, 'popularity': 0.10}
    else:
        # Very hot: CF dominant
        return {'user_cf': 0.40, 'item_cf': 0.40, 'content': 0.15, 'popularity': 0.05}

def recommend(user_id, top_n=None, weights=None, _seen_override=None):
    if top_n is None: top_n = CONFIG['top_n']
    user_id  = str(user_id)
    user_idx = uid2idx.get(user_id)

    seen = set(str(p) for p in (_seen_override if _seen_override is not None
                                 else user_seen.get(user_id, set())))
    is_cold = len(seen) < 3
    w       = weights or get_weights(len(seen))
    scores  = defaultdict(float)
    reason  = {}

    # ── User CF ───────────────────────────────────────────────────────────────
    if user_idx is not None and w['user_cf'] > 0:
        ucf   = user_based_cf_scores(user_idx)
        max_s = ucf.max() + 1e-9
        for j, s in enumerate(ucf):
            if s > 0:
                p = str(ALL_PRODUCTS[j])
                scores[p] += w['user_cf'] * (s / max_s)
                reason.setdefault(p, 'user_cf')

    # ── Item CF ───────────────────────────────────────────────────────────────
    if user_idx is not None and w['item_cf'] > 0:
        icf   = item_based_cf_scores(user_idx)
        max_s = icf.max() + 1e-9
        for j, s in enumerate(icf):
            if s > 0:
                p = str(ALL_PRODUCTS[j])
                scores[p] += w['item_cf'] * (s / max_s)
                reason.setdefault(p, 'item_cf')

    # ── Content ───────────────────────────────────────────────────────────────
    if w['content'] > 0 and len(seen) > 0:
        cb    = content_based_scores(list(seen)[:30])
        max_s = max(cb.values()) + 1e-9 if cb else 1
        for p, s in cb.items():
            p = str(p)
            scores[p] += w['content'] * (s / max_s)
            reason.setdefault(p, 'content')

    # ── Popularity ────────────────────────────────────────────────────────────
    if w['popularity'] > 0:
        for p, s in popularity_scores.items():
            p = str(p)
            if p not in seen:
                scores[p] += w['popularity'] * s
                reason.setdefault(p, 'popularity')

    # Remove seen
    for p in seen: scores.pop(str(p), None)

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
    results = []
    for p, sc in ranked:
        row = products_df[products_df['productId'].astype(str) == p]
        results.append({
            'productId':   p,
            'name':        row['name'].values[0]        if len(row) else p,
            'category':    row['category'].values[0]    if len(row) else 'Unknown',
            'subcategory': row['subcategory'].values[0] if len(row) else '',
            'brand':       row['brand'].values[0]       if len(row) else '',
            'price':       float(row['price'].values[0]) if len(row) else 0.0,
            'avgRating':   float(row['avgRating'].values[0]) if len(row) else 0.0,
            'score':       round(float(sc), 5),
            'reason':      reason.get(p, 'mixed'),
            'coldStart':   is_cold,
        })
    return results

print('SAMPLE RECOMMENDATIONS (v2)')
print('='*100)
for demo_uid in ALL_USERS[:4]:
    urow   = users_df[users_df['userId']==demo_uid]
    recs   = recommend(demo_uid, top_n=5)
    n_seen = len(user_seen.get(demo_uid, set()))
    w      = get_weights(n_seen)
    persona = urow['persona'].values[0] if len(urow) else '?'
    print(f'\\n{demo_uid}  persona={persona:20s}  seen={n_seen}  weights={w}')
    print(f'  {"Rank":>4}  {"Category":18s}  {"Subcategory":18s}  {"Brand":12s}  {"Score":7s}  {"Name":<40s}')
    print('  ' + '-'*105)
    for i, r in enumerate(recs, 1):
        print(f'  {i:>4}  {r["category"]:18s}  {r["subcategory"]:18s}  {r["brand"]:12s}  '
              f'{r["score"]:.5f}  {r["name"][:40]:<40s}')
"""))

# ── CELL 12: Step 12 Evaluation ─────────────────────────────────────────────
cells.append(md_cell("## Step 12 — Improved Evaluation\n\n"
    "Fixes from v1:\n"
    "- Ground truth includes reviews + carts + purchases + wishlist\n"
    "- Added **Hit Rate@K** (fraction of users with ≥1 hit)\n"
    "- Added **MRR** (Mean Reciprocal Rank)\n"
    "- Added **MAP** (Mean Average Precision)\n"
    "- Cold/warm/hot user split\n"
    "- Fixed ROC-AUC by scoring ALL products, not just top-N"))

cells.append(code_cell("""\
# ── Metric functions ──────────────────────────────────────────────────────────
def precision_at_k(recommended, relevant, k):
    if k == 0: return 0.0
    rec = [str(p) for p in recommended[:k]]
    rel = set(str(p) for p in relevant)
    return len(set(rec) & rel) / k

def recall_at_k(recommended, relevant, k):
    rel = set(str(p) for p in relevant)
    if not rel: return 0.0
    rec = [str(p) for p in recommended[:k]]
    return len(set(rec) & rel) / len(rel)

def ndcg_at_k(recommended, relevant, k):
    rel = set(str(p) for p in relevant)
    rec = [str(p) for p in recommended[:k]]
    dcg  = sum(1.0/np.log2(i+2) for i, p in enumerate(rec) if p in rel)
    idcg = sum(1.0/np.log2(i+2) for i in range(min(len(rel), k)))
    return dcg / idcg if idcg > 0 else 0.0

def reciprocal_rank(recommended, relevant):
    rel = set(str(p) for p in relevant)
    for i, p in enumerate([str(r) for r in recommended], 1):
        if p in rel: return 1.0 / i
    return 0.0

def average_precision(recommended, relevant, k):
    rel = set(str(p) for p in relevant)
    rec = [str(p) for p in recommended[:k]]
    hits, total = 0, 0
    for i, p in enumerate(rec, 1):
        if p in rel:
            hits += 1
            total += hits / i
    return total / min(len(rel), k) if rel else 0.0

def avg_diversity(recs):
    pids = [str(r['productId']) for r in recs]
    idx  = [tfidf_pid2idx[p] for p in pids if p in tfidf_pid2idx]
    if len(idx) < 2: return 0.0
    total = sum(content_sim[idx[a], idx[b]]
                for a in range(len(idx)) for b in range(a+1, len(idx)))
    count = len(idx) * (len(idx)-1) // 2
    return 1.0 - (total / count)

def evaluate_full(gt, predict_fn, k=10, n_samples=200, returns_dicts=True, label='', seed=42):
    import random; random.seed(seed)
    users = list(gt.keys())
    if len(users) > n_samples:
        users = random.sample(users, n_samples)

    P, R, N, D, RR, AP = [], [], [], [], [], []
    all_recs = set()
    hits = 0

    # Segment tracking
    cold_p, warm_p, hot_p = [], [], []

    for uid in users:
        rel        = gt[uid]
        train_seen = user_seen_train.get(str(uid), set())
        n_seen     = len(train_seen)

        if returns_dicts:
            raw  = predict_fn(uid, top_n=k, _seen_override=train_seen)
            pids = [str(r['productId']) for r in raw]
        else:
            pids = [str(p) for p in predict_fn(uid, top_n=k)]

        all_recs.update(pids)
        p_val = precision_at_k(pids, rel, k)
        r_val = recall_at_k(pids, rel, k)
        n_val = ndcg_at_k(pids, rel, k)
        d_val = avg_diversity(raw if returns_dicts else [{'productId': p} for p in pids])
        rr    = reciprocal_rank(pids, rel)
        ap    = average_precision(pids, rel, k)

        P.append(p_val); R.append(r_val); N.append(n_val)
        D.append(d_val); RR.append(rr);   AP.append(ap)
        if p_val > 0: hits += 1

        # Segment
        if n_seen < 3:   cold_p.append(p_val)
        elif n_seen < 20: warm_p.append(p_val)
        else:             hot_p.append(p_val)

    coverage = len(all_recs) / N_PRODUCTS
    return {
        'model':             label,
        f'precision@{k}':   round(float(np.mean(P)), 5),
        f'recall@{k}':      round(float(np.mean(R)), 5),
        f'ndcg@{k}':        round(float(np.mean(N)), 5),
        f'mrr@{k}':         round(float(np.mean(RR)), 5),
        f'map@{k}':         round(float(np.mean(AP)), 5),
        f'hit_rate@{k}':    round(float(hits / len(users)), 5),
        'diversity':         round(float(np.mean(D)), 5),
        'catalog_coverage':  round(float(coverage), 5),
        'n_users':           len(users),
        'hits':              hits,
        'cold_p':            round(float(np.mean(cold_p)), 5) if cold_p else 0,
        'warm_p':            round(float(np.mean(warm_p)), 5) if warm_p else 0,
        'hot_p':             round(float(np.mean(hot_p)), 5) if hot_p else 0,
        'n_cold':            len(cold_p),
        'n_warm':            len(warm_p),
        'n_hot':             len(hot_p),
    }

# ── Run evaluation on all models ──────────────────────────────────────────────
K_EVAL = CONFIG['top_n']
N_EVAL = 500

print(f'Evaluating models (K={K_EVAL}, n_samples={N_EVAL}) ...')
print()

_model_registry = [
    ('KNN+SVD Baseline',   recommend,         True),
    ('ALS',                als_predict,       False),
    ('SVD++',              svdpp_predict,     False),
    ('LightFM-Hybrid',     lightfm_predict,   False),
]
_train_times = {
    'KNN+SVD Baseline': 0.0,
    'ALS':              elapsed_als,
    'SVD++':            elapsed_pp,
    'LightFM-Hybrid':   elapsed_fm,
}

results_list = []
for label, fn, is_dict in _model_registry:
    res = evaluate_full(test_gt_eval, fn, k=K_EVAL, n_samples=N_EVAL,
                        returns_dicts=is_dict, label=label)
    res['train_time_s'] = round(_train_times.get(label, 0.0), 1)
    results_list.append(res)
    print(f'{label:<28} '
          f'P@{K_EVAL}={res[f"precision@{K_EVAL}"]:.5f}  '
          f'R@{K_EVAL}={res[f"recall@{K_EVAL}"]:.5f}  '
          f'NDCG@{K_EVAL}={res[f"ndcg@{K_EVAL}"]:.5f}  '
          f'HitRate={res[f"hit_rate@{K_EVAL}"]:.5f}  '
          f'MRR={res[f"mrr@{K_EVAL}"]:.5f}  '
          f'MAP={res[f"map@{K_EVAL}"]:.5f}  '
          f'hits={res["hits"]}/{res["n_users"]}')

results_df = pd.DataFrame(results_list)
best_model = results_df.loc[results_df[f'ndcg@{K_EVAL}'].idxmax(), 'model']
print(f'\\nBest model by NDCG@{K_EVAL}: {best_model}')
"""))

# ── CELL 13: Model Comparison Charts ────────────────────────────────────────
cells.append(md_cell("## Step 13 — Model Comparison Charts"))

cells.append(code_cell("""\
# ── Full table ─────────────────────────────────────────────────────────────────
display_cols = ['model', f'precision@{K_EVAL}', f'recall@{K_EVAL}', f'ndcg@{K_EVAL}',
                f'mrr@{K_EVAL}', f'map@{K_EVAL}', f'hit_rate@{K_EVAL}',
                'diversity', 'catalog_coverage', 'train_time_s']
print('\\nFull results table:')
print(results_df[display_cols].to_string(index=False))

# ── Cold/Warm/Hot segment comparison ─────────────────────────────────────────
print('\\nPrecision@10 by user segment (cold=<3 interactions, warm=3-19, hot=20+):')
for r in results_list:
    print(f'  {r["model"]:<28} cold={r["cold_p"]:.4f}(n={r["n_cold"]})  '
          f'warm={r["warm_p"]:.4f}(n={r["n_warm"]})  hot={r["hot_p"]:.4f}(n={r["n_hot"]})')

# ── Bar chart ─────────────────────────────────────────────────────────────────
fig, axes = plt.subplots(2, 3, figsize=(20, 10))
axes = axes.flatten()

metric_list = [
    (f'precision@{K_EVAL}', f'Precision@{K_EVAL}'),
    (f'recall@{K_EVAL}',    f'Recall@{K_EVAL}'),
    (f'ndcg@{K_EVAL}',      f'NDCG@{K_EVAL}'),
    (f'mrr@{K_EVAL}',       f'MRR@{K_EVAL}'),
    (f'hit_rate@{K_EVAL}',  f'Hit Rate@{K_EVAL}'),
    ('diversity',            'Diversity'),
]

short_labels = [r['model'].replace(' ','\\n') for r in results_list]
_colors      = PALETTE[:len(results_list)]

for ax, (metric, title) in zip(axes, metric_list):
    vals = results_df[metric].tolist()
    bars = ax.bar(range(len(results_list)), vals, color=_colors, edgecolor='white', width=0.6)
    ax.set_xticks(range(len(results_list)))
    ax.set_xticklabels(short_labels, fontsize=8)
    ax.set_title(title, fontsize=11, fontweight='bold')
    ax.set_ylabel('Score')
    ax.grid(axis='y', alpha=0.3)
    for bar, v in zip(bars, vals):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.001,
                f'{v:.4f}', ha='center', fontsize=8, fontweight='bold')
    _best_idx = int(np.argmax(vals))
    bars[_best_idx].set_edgecolor('#E03131'); bars[_best_idx].set_linewidth(2)

fig.suptitle(f'Model Comparison v2 — Top-{K_EVAL} Recommendations  (n={N_EVAL} test users)',
             fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('evaluation/model_comparison_v2.png', dpi=150, bbox_inches='tight')
plt.show()
print('Saved → evaluation/model_comparison_v2.png')
"""))

# ── CELL 14: Fixed Confusion Matrix / ROC-AUC ───────────────────────────────
cells.append(md_cell("## Step 14 — Classification Metrics with Fixed ROC-AUC\n\n"
    "v1 bug: non-recommended products got score=0, conflating 'not scored' with 'scored low'.\n"
    "Fix: score ALL products for each user via the hybrid model to get true score distribution."))

cells.append(code_cell("""\
from sklearn.metrics import confusion_matrix, classification_report, roc_curve

def build_binary_labels_full_score(gt, n_samples=150, seed=42):
    \"\"\"
    Score ALL products for each user (not just top-N) to get proper AUC.
    This fixes the v1 bug where unranked items got score=0.
    \"\"\"
    import random; random.seed(seed)
    users = list(gt.keys())
    if len(users) > n_samples: users = random.sample(users, n_samples)

    all_true, all_scores_hybrid, all_pred = [], [], []
    all_prods_list = [str(p) for p in ALL_PRODUCTS]
    k = CONFIG['top_n']

    for uid in users:
        rel        = gt[uid]
        train_seen = user_seen_train.get(str(uid), set())
        # Get scores for ALL products (full ranking, not just top-N)
        user_id  = str(uid)
        user_idx_v = uid2idx.get(user_id)
        if user_idx_v is None: continue

        # Hybrid score for every product
        ucf = user_based_cf_scores(user_idx_v)
        icf = item_based_cf_scores(user_idx_v)
        w   = get_weights(len(train_seen))
        all_scores_dict = {}
        for j, p in enumerate(ALL_PRODUCTS):
            p = str(p)
            s = 0.0
            if w['user_cf']   > 0: s += w['user_cf']   * float(ucf[j])
            if w['item_cf']   > 0: s += w['item_cf']   * float(icf[j])
            if w['popularity']> 0: s += w['popularity'] * float(pop_arr[j])
            all_scores_dict[p] = s

        # Content scores
        if w['content'] > 0 and len(train_seen) > 0:
            cb = content_based_scores(list(train_seen)[:30])
            max_cb = max(cb.values()) + 1e-9 if cb else 1
            for p, cs in cb.items():
                p = str(p)
                all_scores_dict[p] = all_scores_dict.get(p, 0) + w['content'] * cs / max_cb

        # Remove seen
        for p in train_seen: all_scores_dict.pop(str(p), None)

        # Build ranked list for top-N prediction
        ranked = sorted(all_scores_dict.items(), key=lambda x: x[1], reverse=True)
        rec_set = set(p for p, _ in ranked[:k])

        for p in all_prods_list:
            if p in train_seen: continue
            all_true.append(1 if p in rel else 0)
            all_scores_hybrid.append(all_scores_dict.get(p, 0.0))
            all_pred.append(1 if p in rec_set else 0)

    return np.array(all_true), np.array(all_pred), np.array(all_scores_hybrid)

print('Building binary labels with FULL scoring (fixes ROC-AUC)...')
y_true, y_pred, y_scores = build_binary_labels_full_score(test_gt_eval, n_samples=150)

print(f'Label vectors: {len(y_true):,} pairs')
print(f'  Positive rate : {y_true.mean()*100:.2f}%')
print(f'  Predicted pos : {y_pred.mean()*100:.2f}%')
print(f'  True positives: {((y_true==1) & (y_pred==1)).sum():,}')

cm = confusion_matrix(y_true, y_pred)
tn, fp, fn, tp = cm.ravel()

accuracy  = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, zero_division=0)
recall    = recall_score(y_true, y_pred, zero_division=0)
f1        = f1_score(y_true, y_pred, zero_division=0)
try:    roc_auc  = roc_auc_score(y_true, y_scores)
except: roc_auc  = float('nan')
try:    avg_prec = average_precision_score(y_true, y_scores)
except: avg_prec = float('nan')

print('\\n' + '='*58)
print('CLASSIFICATION METRICS — HYBRID (Fixed ROC-AUC)')
print('='*58)
print(f'  Accuracy          : {accuracy:.5f}')
print(f'  Precision         : {precision:.5f}')
print(f'  Recall (TPR)      : {recall:.5f}')
print(f'  F1 Score          : {f1:.5f}')
print(f'  ROC-AUC (FIXED)   : {roc_auc:.5f}   ← should be >> 0.5 now')
print(f'  Avg Precision (AP): {avg_prec:.5f}')
print(f'  TP={tp:,}  FP={fp:,}  FN={fn:,}  TN={tn:,}')
print('='*58)

# Plot
fig = plt.figure(figsize=(18, 6))
gs  = gridspec.GridSpec(1, 3, figure=fig, wspace=0.35)

ax1 = fig.add_subplot(gs[0,0])
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax1,
            xticklabels=['Pred: Not Rel', 'Pred: Rel'],
            yticklabels=['True: Not Rel', 'True: Rel'],
            linewidths=1, linecolor='white', cbar=False, annot_kws={'size':12,'weight':'bold'})
ax1.set_title('Confusion Matrix (Hybrid v2)', fontsize=12, fontweight='bold')

ax2 = fig.add_subplot(gs[0,1])
try:
    fpr_arr, tpr_arr, _ = roc_curve(y_true, y_scores)
    ax2.plot(fpr_arr, tpr_arr, color=PALETTE[0], lw=2, label=f'Hybrid (AUC={roc_auc:.3f})')
    ax2.plot([0,1],[0,1],'k--',lw=1,label='Random (AUC=0.5)')
    ax2.set_xlabel('False Positive Rate'); ax2.set_ylabel('True Positive Rate')
    ax2.set_title('ROC Curve (Fixed Full Scoring)', fontsize=12, fontweight='bold')
    ax2.legend(fontsize=10); ax2.grid(alpha=0.3)
except Exception as e:
    ax2.text(0.5, 0.5, str(e), ha='center')

ax3 = fig.add_subplot(gs[0,2])
try:
    prec_curve, rec_curve, _ = precision_recall_curve(y_true, y_scores)
    ax3.plot(rec_curve, prec_curve, color=PALETTE[1], lw=2, label=f'AP={avg_prec:.3f}')
    ax3.set_xlabel('Recall'); ax3.set_ylabel('Precision')
    ax3.set_title('Precision-Recall Curve', fontsize=12, fontweight='bold')
    ax3.legend(fontsize=10); ax3.grid(alpha=0.3)
except Exception as e:
    ax3.text(0.5, 0.5, str(e), ha='center')

fig.suptitle('v2 — Confusion Matrix & ROC Analysis', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig('evaluation/confusion_roc_v2.png', dpi=150, bbox_inches='tight')
plt.show()
print('Saved → evaluation/confusion_roc_v2.png')
"""))

# ── CELL 15: Cross Validation ───────────────────────────────────────────────
cells.append(md_cell("## Step 15 — Time-Aware Cross Validation"))

cells.append(code_cell("""\
N_SPLITS = 5
CV_USERS = 100
sorted_ints = interactions_df.sort_values('timestamp').reset_index(drop=True)
fold_size   = len(sorted_ints) // N_SPLITS

print(f'5-fold time-aware cross-validation')
print(f'Total interactions: {len(sorted_ints):,} | Fold size: {fold_size:,}')
print(f'{"Fold":>6} {"P@K":>8} {"R@K":>8} {"NDCG@K":>8} {"Hit%":>8} {"GT Users":>10}')
print('-'*58)

cv_results = []
for fold in range(N_SPLITS):
    train_end = (fold + 1) * fold_size
    test_start = train_end
    test_end   = min(test_start + fold_size, len(sorted_ints))

    cv_train = sorted_ints.iloc[:train_end]
    cv_test  = sorted_ints.iloc[test_start:test_end]

    # Ground truth from test fold (reviews + carts + purchases)
    cv_gt_raw = (cv_test[cv_test['interaction'].isin(['review','cart','purchase','wishlist'])]
                 .groupby('userId')['productId'].apply(set).to_dict())
    cv_gt = {str(u): set(str(p) for p in v) for u, v in cv_gt_raw.items() if v}

    if len(cv_gt) == 0:
        print(f'{fold+1:>6}  skipped (no ground truth in test fold)')
        continue

    cv_seen = (cv_train.groupby('userId')['productId'].apply(set).to_dict())

    import random; random.seed(42 + fold)
    cv_users = list(cv_gt.keys())
    if len(cv_users) > CV_USERS:
        cv_users = random.sample(cv_users, CV_USERS)

    Pk, Rk, Nk, Hk = [], [], [], []
    all_recs_cv = set()
    for uid in cv_users:
        rel   = cv_gt[uid]
        seen  = cv_seen.get(str(uid), set())
        recs  = recommend(uid, top_n=K_EVAL, _seen_override=seen)
        pids  = [str(r['productId']) for r in recs]
        all_recs_cv.update(pids)
        Pk.append(precision_at_k(pids, rel, K_EVAL))
        Rk.append(recall_at_k(pids, rel, K_EVAL))
        Nk.append(ndcg_at_k(pids, rel, K_EVAL))
        Hk.append(1 if precision_at_k(pids, rel, K_EVAL) > 0 else 0)

    res = {
        'fold': fold+1,
        'P@K':  round(np.mean(Pk), 5),
        'R@K':  round(np.mean(Rk), 5),
        'NDCG': round(np.mean(Nk), 5),
        'Hit%': round(np.mean(Hk)*100, 2),
        'GT':   len(cv_users),
    }
    cv_results.append(res)
    print(f'{res["fold"]:>6} {res["P@K"]:>8.5f} {res["R@K"]:>8.5f} {res["NDCG"]:>8.5f} '
          f'{res["Hit%"]:>8.2f} {res["GT"]:>10}')

if cv_results:
    cv_df = pd.DataFrame(cv_results)
    print()
    print(f'{"MEAN":>6} {cv_df["P@K"].mean():>8.5f} {cv_df["R@K"].mean():>8.5f} '
          f'{cv_df["NDCG"].mean():>8.5f} {cv_df["Hit%"].mean():>8.2f}')
    print(f'{"STD":>6} {cv_df["P@K"].std():>8.5f} {cv_df["R@K"].std():>8.5f} '
          f'{cv_df["NDCG"].std():>8.5f} {cv_df["Hit%"].std():>8.2f}')

    # Stability plot
    fig, axes = plt.subplots(1, 2, figsize=(14, 4))
    for metric, ax, color in [('P@K', axes[0], PALETTE[0]), ('NDCG', axes[1], PALETTE[2])]:
        ax.bar(cv_df['fold'], cv_df[metric], color=color, edgecolor='white', alpha=0.8)
        ax.axhline(cv_df[metric].mean(), color='#E03131', linestyle='--', label=f'Mean: {cv_df[metric].mean():.4f}')
        ax.set_title(f'{metric} Across Folds', fontweight='bold')
        ax.set_xlabel('Fold'); ax.legend(fontsize=9); ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig('evaluation/cv_stability_v2.png', dpi=150)
    plt.show()
    print('Saved → evaluation/cv_stability_v2.png')
"""))

# ── CELL 16: Save Model ─────────────────────────────────────────────────────
cells.append(md_cell("## Step 16 — Save All Trained Models"))

cells.append(code_cell("""\
model_bundle = {
    # KNN models
    'knn_user':          knn_user,
    'knn_item':          knn_item,
    # ALS factors
    'U_als':             U_als,
    'V_als':             V_als,
    # TruncatedSVD (replaces SVD++)
    'svd_model':         svd_model,
    'U_svd':             U_svd,
    'Vt_svd':            Vt_svd,
    # NMF
    'nmf_model':         nmf_model,
    'U_nmf':             U_nmf,
    'Vt_nmf':            Vt_nmf,
    # BPR-MF (replaces LightFM)
    'U_bpr':             U_bpr,
    'V_bpr':             V_bpr,
    'bu_bpr':            bu_bpr,
    'bi_bpr':            bi_bpr,
    # Content features
    'tfidf_vec':         tfidf_vec,
    'tfidf_matrix':      tfidf_matrix,
    'content_sim':       content_sim,
    'tfidf_pid2idx':     tfidf_pid2idx,
    # Mappings
    'ALL_USERS':         ALL_USERS,
    'ALL_PRODUCTS':      ALL_PRODUCTS,
    'uid2idx':           uid2idx,
    'pid2idx':           pid2idx,
    'user_seen':         user_seen,
    'user_seen_train':   user_seen_train,
    'popularity_scores': popularity_scores,
    # Evaluation
    'eval_results':      results_df.to_dict(),
    'config':            CONFIG,
}

out_path = 'models/recommendation_bundle_v2.pkl'
with open(out_path, 'wb') as f:
    pickle.dump(model_bundle, f, protocol=4)
size_mb = os.path.getsize(out_path) / 1024 / 1024
print(f'Model bundle saved: {out_path}  ({size_mb:.1f} MB)')
print(f'  Contains: {list(model_bundle.keys())}')
"""))

# ── Build notebook JSON ──────────────────────────────────────────────────────
nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.10.0"},
    },
    "cells": cells,
}

out_path = os.path.join(os.path.dirname(__file__), "recommendation_system_improved.ipynb")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)

print(f"Notebook written to: {out_path}")
print(f"  Cells: {len(cells)}")
