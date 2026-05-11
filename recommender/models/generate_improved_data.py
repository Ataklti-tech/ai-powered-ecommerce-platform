"""
Generate improved synthetic datasets for the recommendation system.
Fixes:
  - 1000 products (vs 100)
  - Realistic power-law review distribution
  - Realistic rating distribution with negative reviews
  - Product descriptions, brands, subcategories, expanded tags
  - orders.csv WITH product_id (purchase signal)
  - views.csv (browse signal)
  - wishlist.csv (save signal)
"""

import numpy as np
import pandas as pd
import random
import os
from datetime import datetime, timedelta

np.random.seed(42)
random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "data_improved")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Constants ─────────────────────────────────────────────────────────────────
N_USERS    = 10_000
N_PRODUCTS = 1_000
N_REVIEWS  = 120_000
N_CARTS    = 30_000
N_ORDERS   = 60_000
N_VIEWS    = 200_000
N_WISHLIST = 25_000

START_DATE = datetime(2022, 1, 1)
END_DATE   = datetime(2024, 12, 31)

def rand_date(start=START_DATE, end=END_DATE):
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))

def fmt(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

# ── Product catalog ───────────────────────────────────────────────────────────
CATEGORIES = {
    "Electronics": {
        "subcategories": ["Smartphones", "Laptops", "Audio", "Cameras", "Accessories", "Wearables", "Networking"],
        "brands": ["Samsung", "Apple", "Sony", "LG", "Bose", "Logitech", "Anker", "JBL", "Xiaomi", "Lenovo"],
        "tags": ["electronics", "tech", "gadget", "wireless", "bluetooth", "usb-c", "portable", "smart",
                 "rechargeable", "noise-cancelling", "hd", "4k", "fast-charge", "waterproof", "voice-assistant"],
        "price_range": (15, 1500),
        "n_products": 180,
    },
    "Fashion": {
        "subcategories": ["Men's Clothing", "Women's Clothing", "Footwear", "Accessories", "Bags", "Activewear"],
        "brands": ["Nike", "Adidas", "Zara", "H&M", "Levi's", "Gucci", "Puma", "Under Armour", "Uniqlo", "Gap"],
        "tags": ["fashion", "clothing", "style", "casual", "formal", "outdoor", "seasonal", "slim-fit",
                 "breathable", "durable", "lightweight", "waterproof", "eco-friendly", "handmade", "premium"],
        "price_range": (10, 500),
        "n_products": 180,
    },
    "Home & Kitchen": {
        "subcategories": ["Cookware", "Storage", "Bedding", "Furniture", "Decor", "Appliances", "Cleaning"],
        "brands": ["Cuisinart", "KitchenAid", "Instant Pot", "Dyson", "OXO", "Lodge", "Rubbermaid", "IKEA", "Breville", "Ninja"],
        "tags": ["kitchen", "home", "cooking", "storage", "non-stick", "stainless-steel", "dishwasher-safe",
                 "bpa-free", "eco-friendly", "space-saving", "durable", "easy-clean", "multifunctional", "compact", "heavy-duty"],
        "price_range": (8, 600),
        "n_products": 150,
    },
    "Books": {
        "subcategories": ["Business", "Self-Help", "Fiction", "Science", "History", "Technology", "Cooking", "Biography"],
        "brands": ["Penguin", "HarperCollins", "Random House", "O'Reilly", "MIT Press", "Simon & Schuster", "Wiley", "Packt"],
        "tags": ["book", "reading", "bestseller", "paperback", "hardcover", "educational", "inspiring",
                 "award-winning", "illustrated", "updated-edition", "international", "classic", "nonfiction", "fiction", "practical"],
        "price_range": (8, 80),
        "n_products": 120,
    },
    "Sports & Fitness": {
        "subcategories": ["Gym Equipment", "Outdoor", "Team Sports", "Yoga", "Running", "Cycling", "Swimming"],
        "brands": ["Nike", "Adidas", "Reebok", "Garmin", "Fitbit", "Bowflex", "TRX", "Osprey", "Black Diamond", "Patagonia"],
        "tags": ["fitness", "sports", "workout", "training", "outdoor", "cardio", "strength", "yoga",
                 "running", "cycling", "waterproof", "lightweight", "adjustable", "high-performance", "ergonomic"],
        "price_range": (10, 800),
        "n_products": 100,
    },
    "Beauty": {
        "subcategories": ["Skincare", "Haircare", "Makeup", "Fragrance", "Men's Grooming", "Nail Care"],
        "brands": ["L'Oreal", "Neutrogena", "Maybelline", "CeraVe", "The Ordinary", "Fenty Beauty", "MAC", "Dove", "Olay", "Clinique"],
        "tags": ["beauty", "skincare", "natural", "vegan", "cruelty-free", "dermatologist-tested", "spf",
                 "moisturizing", "anti-aging", "organic", "sensitive-skin", "fragrance-free", "paraben-free", "vitamin-c", "hyaluronic-acid"],
        "price_range": (5, 200),
        "n_products": 100,
    },
    "Toys & Games": {
        "subcategories": ["Board Games", "Educational", "Action Figures", "Outdoor Toys", "STEM", "Puzzles", "Video Games"],
        "brands": ["LEGO", "Hasbro", "Mattel", "Fisher-Price", "Nintendo", "Ravensburger", "Melissa & Doug", "Hot Wheels", "Barbie", "Play-Doh"],
        "tags": ["toys", "games", "kids", "educational", "creative", "stem", "puzzle", "age-3+", "age-6+",
                 "age-10+", "family", "multiplayer", "award-winning", "safe-materials", "washable"],
        "price_range": (5, 200),
        "n_products": 80,
    },
    "Automotive": {
        "subcategories": ["Car Electronics", "Tools", "Car Care", "Interior", "Exterior", "Safety"],
        "brands": ["Bosch", "3M", "Meguiar's", "Garmin", "Thule", "WeatherTech", "Turtle Wax", "Chemical Guys", "AutoZone", "Michelin"],
        "tags": ["automotive", "car", "vehicle", "universal-fit", "waterproof", "heavy-duty", "professional",
                 "easy-install", "safety", "durable", "weather-resistant", "portable", "wireless", "oem-quality", "certified"],
        "price_range": (10, 500),
        "n_products": 90,
    },
}

PRODUCT_TEMPLATES = {
    "Electronics": [
        ("Wireless Earbuds", "True wireless earbuds with {feat1} and {feat2}. Features {feat3} for crystal-clear calls and {feat4} battery life."),
        ("Bluetooth Speaker", "Portable {feat1} speaker with {feat2} and {feat3}. Perfect for {feat4} use with IPX{n} waterproof rating."),
        ("Laptop Stand", "Ergonomic {feat1} stand with {feat2} design. Supports up to {n}kg and compatible with all laptops up to {n2}-inch."),
        ("Smart Watch", "{feat1} smartwatch with {feat2} monitoring, {feat3} GPS and {feat4} display. {n}-day battery life."),
        ("USB-C Hub", "{n}-in-1 USB-C hub with {feat1}, {feat2}, and {feat3}. Supports up to {feat4} data transfer."),
        ("Mechanical Keyboard", "{feat1} mechanical keyboard with {feat2} switches and {feat3} backlighting. {feat4} layout."),
        ("Webcam", "{feat1} webcam with {feat2} resolution and {feat3} autofocus. Built-in {feat4} microphone."),
        ("Gaming Mouse", "{feat1} gaming mouse with {feat2} DPI sensor and {feat3} buttons. {feat4} design for comfort."),
        ("Wireless Charger", "{n}W wireless charger with {feat1} technology. Compatible with {feat2} and {feat3} devices."),
        ("Power Bank", "{n}mAh power bank with {feat1} charging and {feat2} output ports. {feat3} safety protection."),
    ],
    "Fashion": [
        ("Running Sneakers", "High-performance {feat1} sneakers with {feat2} cushioning and {feat3} outsole. Ideal for {feat4} runs."),
        ("Slim-Fit Jeans", "{feat1} slim-fit jeans with {feat2} stretch fabric. {feat3} waistband and {feat4} pockets."),
        ("Formal Shirt", "{feat1} formal shirt made from {feat2} fabric. {feat3} collar design with {feat4} fit."),
        ("Winter Jacket", "{feat1} winter jacket with {feat2} insulation and {feat3} shell. {feat4} pockets and adjustable hood."),
        ("Canvas Backpack", "{feat1} canvas backpack with {feat2} laptop compartment and {feat3} storage. {feat4} straps for comfort."),
        ("Leather Belt", "Genuine {feat1} leather belt with {feat2} buckle. {feat3} width, available in {feat4} finish."),
        ("Sports Socks", "{feat1} athletic socks with {feat2} cushioning and {feat3} arch support. Pack of {n}."),
        ("Ankle Boots", "{feat1} ankle boots with {feat2} sole and {feat3} upper. {feat4} closure for easy wear."),
        ("Sunglasses", "{feat1} sunglasses with {feat2} UV protection and {feat3} lens. {feat4} frame material."),
        ("Hoodie", "{feat1} hoodie made from {feat2} cotton blend. {feat3} pocket and {feat4} drawstring hood."),
    ],
    "Home & Kitchen": [
        ("Mixing Bowl Set", "Set of {n} {feat1} mixing bowls with {feat2} base and {feat3} lids. {feat4} and microwave-safe."),
        ("Cast Iron Skillet", "{n}-inch {feat1} cast iron skillet with {feat2} handle. Pre-seasoned with {feat3} coating."),
        ("Food Storage Containers", "Set of {n} {feat1} food storage containers. {feat2} lids and {feat3} stackable design. {feat4}."),
        ("Coffee Maker", "{feat1} coffee maker with {feat2} brewing modes and {feat3} carafe. {feat4} auto shut-off."),
        ("Knife Set", "{n}-piece {feat1} knife set with {feat2} blades and {feat3} handles. Includes {feat4} block."),
        ("Bed Sheet Set", "{feat1} bed sheet set in {n} thread count. {feat2} weave with {feat3} finish. Fits up to {n2}-inch mattress."),
        ("Vacuum Cleaner", "{feat1} vacuum cleaner with {feat2} suction and {feat3} filtration. {feat4} cord-free operation."),
        ("Air Fryer", "{n}Qt {feat1} air fryer with {feat2} presets and {feat3} temperature control. {feat4} non-stick basket."),
        ("Throw Pillow", "Set of {n} {feat1} throw pillows with {feat2} covers and {feat3} fill. {feat4} design."),
        ("Bamboo Cutting Board", "{feat1} bamboo cutting board with {feat2} juice grooves and {feat3} handle. {feat4} resistant surface."),
    ],
}

FEAT_WORDS = {
    "feat1": ["premium", "advanced", "ultra", "professional", "enhanced", "deluxe", "smart", "compact", "ergonomic", "innovative"],
    "feat2": ["high-performance", "noise-cancelling", "fast-charging", "eco-friendly", "waterproof", "adjustable", "multi-function", "lightweight", "durable", "breathable"],
    "feat3": ["active noise cancellation", "360-degree sound", "deep bass", "crisp treble", "wide-angle", "auto-focus", "temperature control", "pressure sensor", "motion detection", "voice control"],
    "feat4": ["long-lasting", "energy-efficient", "user-friendly", "all-day", "heavy-duty", "travel-ready", "quick-dry", "odor-resistant", "scratch-resistant", "UV-protected"],
    "n":  [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 32, 50, 100],
    "n2": [13, 14, 15, 16, 17],
}

def fill_template(template, brand, subcategory):
    result = template
    for k, v in FEAT_WORDS.items():
        if "{" + k + "}" in result:
            result = result.replace("{" + k + "}", str(random.choice(v)), 1)
    return result

def make_description(name, category, subcategory, brand, tags):
    templates = [
        f"The {brand} {name} is a top-rated {subcategory.lower()} product designed for {random.choice(['everyday', 'professional', 'home', 'outdoor', 'travel'])} use. "
        f"It features {random.choice(tags)} and {random.choice(tags)} technology for superior performance. "
        f"Trusted by thousands of customers, it delivers excellent value and durability.",

        f"Introducing the {name} by {brand} — a premium {category.lower()} solution built for modern lifestyles. "
        f"Engineered with {random.choice(tags)} materials and {random.choice(tags)} design, it stands out in the {subcategory.lower()} market. "
        f"Whether you're a beginner or professional, this product meets your needs.",

        f"The {name} from {brand} combines {random.choice(tags)} functionality with sleek aesthetics. "
        f"As a leading {subcategory.lower()} product in the {category} category, it offers {random.choice(tags)} performance. "
        f"Backed by a manufacturer warranty and thousands of verified purchases.",
    ]
    return random.choice(templates)

# ── Generate Products ─────────────────────────────────────────────────────────
print("Generating products...")
products = []
pid = 1

for cat, meta in CATEGORIES.items():
    n = meta["n_products"]
    templates = PRODUCT_TEMPLATES.get(cat, [])
    for i in range(n):
        subcategory = random.choice(meta["subcategories"])
        brand       = random.choice(meta["brands"])

        if templates:
            tmpl_name, tmpl_desc = random.choice(templates)
            name = fill_template(f"{brand} {tmpl_name}", brand, subcategory)
            # add variant to make unique
            variant = random.choice(["Pro", "Plus", "Lite", "Max", "Mini", "Elite", "Ultra", "X", "SE", "HD", ""])
            if variant:
                name = f"{name} {variant}"
        else:
            name = f"{brand} {subcategory} #{i+1}"

        pmin, pmax = meta["price_range"]
        price = round(random.uniform(pmin, pmax), 2)

        # Realistic avg_rating: mostly 3.5-4.5, some outliers
        avg_rating = round(np.clip(np.random.normal(4.0, 0.5), 1.5, 5.0), 1)

        # Power-law review count: few products get thousands, most get hundreds
        review_count = int(np.random.lognormal(5.0, 1.2))
        review_count = max(10, min(review_count, 5000))

        # Expanded tags: 6-12 per product
        base_tags = random.sample(meta["tags"], min(len(meta["tags"]), random.randint(6, 12)))
        tags_str = str(base_tags)

        # Description
        description = make_description(name, cat, subcategory, brand, base_tags)

        products.append({
            "product_id":    f"prod_{pid:04d}",
            "name":          name,
            "category":      cat,
            "subcategory":   subcategory,
            "brand":         brand,
            "price":         price,
            "avg_rating":    avg_rating,
            "review_count":  review_count,
            "in_stock":      random.random() > 0.08,
            "tags":          tags_str,
            "description":   description,
        })
        pid += 1

products_df = pd.DataFrame(products)
products_df.to_csv(os.path.join(OUT_DIR, "products.csv"), index=False)
print(f"  products.csv: {len(products_df)} rows, {products_df['category'].nunique()} categories")

# ── Load existing users (reuse them) ─────────────────────────────────────────
print("Loading existing users...")
users_src = os.path.join(os.path.dirname(__file__), "data", "users.csv")
users_df  = pd.read_csv(users_src)
users_df.to_csv(os.path.join(OUT_DIR, "users.csv"), index=False)
user_ids = users_df["user_id"].tolist()
product_ids = products_df["product_id"].tolist()

# Pre-build fast lookup dicts to avoid slow pandas row-by-row filtering
user_persona_map   = dict(zip(users_df["user_id"], users_df["persona"]))
product_price_map  = dict(zip(products_df["product_id"], products_df["price"]))
product_cat_map    = dict(zip(products_df["product_id"], products_df["category"]))

PERSONAS = users_df["persona"].unique().tolist()

# Map persona → preferred categories (realistic affinity)
PERSONA_PREFS = {
    "tech_enthusiast":  {"Electronics": 0.50, "Books": 0.10, "Sports & Fitness": 0.08, "Home & Kitchen": 0.08, "Fashion": 0.08, "Automotive": 0.08, "Beauty": 0.04, "Toys & Games": 0.04},
    "fashionista":      {"Fashion": 0.50, "Beauty": 0.20, "Home & Kitchen": 0.10, "Electronics": 0.08, "Books": 0.05, "Sports & Fitness": 0.04, "Toys & Games": 0.02, "Automotive": 0.01},
    "home_chef":        {"Home & Kitchen": 0.50, "Books": 0.15, "Electronics": 0.10, "Beauty": 0.08, "Fashion": 0.07, "Sports & Fitness": 0.05, "Automotive": 0.03, "Toys & Games": 0.02},
    "fitness_buff":     {"Sports & Fitness": 0.50, "Electronics": 0.15, "Fashion": 0.12, "Home & Kitchen": 0.08, "Beauty": 0.07, "Books": 0.05, "Automotive": 0.02, "Toys & Games": 0.01},
    "bookworm":         {"Books": 0.55, "Electronics": 0.12, "Home & Kitchen": 0.10, "Fashion": 0.08, "Beauty": 0.05, "Sports & Fitness": 0.05, "Toys & Games": 0.03, "Automotive": 0.02},
    "parent":           {"Toys & Games": 0.30, "Home & Kitchen": 0.20, "Books": 0.15, "Fashion": 0.12, "Beauty": 0.08, "Sports & Fitness": 0.08, "Electronics": 0.05, "Automotive": 0.02},
    "gamer":            {"Electronics": 0.50, "Toys & Games": 0.20, "Books": 0.10, "Fashion": 0.08, "Sports & Fitness": 0.05, "Home & Kitchen": 0.04, "Beauty": 0.02, "Automotive": 0.01},
    "car_enthusiast":   {"Automotive": 0.55, "Electronics": 0.20, "Sports & Fitness": 0.08, "Home & Kitchen": 0.07, "Fashion": 0.05, "Books": 0.03, "Beauty": 0.01, "Toys & Games": 0.01},
    "general_shopper":  {"Fashion": 0.15, "Electronics": 0.15, "Home & Kitchen": 0.15, "Beauty": 0.12, "Books": 0.12, "Sports & Fitness": 0.12, "Toys & Games": 0.10, "Automotive": 0.09},
}

# Products per category lookup
cat_products = {}
for cat in CATEGORIES:
    cat_products[cat] = products_df[products_df["category"] == cat]["product_id"].tolist()

def sample_product_for_user(persona):
    prefs = PERSONA_PREFS.get(persona, PERSONA_PREFS["general_shopper"])
    cats  = list(prefs.keys())
    probs = list(prefs.values())
    cat   = random.choices(cats, weights=probs, k=1)[0]
    return random.choice(cat_products[cat])

# ── Realistic rating distribution ─────────────────────────────────────────────
def sample_rating(product_id, liked=True):
    """Bimodal: if liked, skew high; if not, skew low. Overall realistic distribution."""
    if liked:
        # User genuinely likes product
        r = random.choices([1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0],
                           weights=[0.5,1,2,3,6,12,22,30,23.5], k=1)[0]
    else:
        # Mixed feelings
        r = random.choices([1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0],
                           weights=[8,10,15,18,20,14,8,5,2], k=1)[0]
    return r

# ── Generate Reviews ──────────────────────────────────────────────────────────
print("Generating reviews...")
review_texts_positive = [
    "Excellent product, exactly as described. Highly recommend!",
    "Very happy with this purchase. Great quality for the price.",
    "Works perfectly. Fast delivery and well packaged.",
    "Impressed by the build quality. Will buy again.",
    "Exceeded my expectations. 5 stars well deserved.",
    "Fantastic value. Great performance and durable.",
    "Love it! Does everything it says on the packaging.",
    "Top quality product. Very satisfied with the results.",
    "My go-to recommendation for friends and family.",
    "Solid product, no complaints. Does the job perfectly.",
]
review_texts_neutral = [
    "Decent product for the price. Nothing extraordinary.",
    "Does what it says. Average quality.",
    "OK product. Arrived on time, works as expected.",
    "Not bad but not great either. Acceptable quality.",
    "Fair value. Some minor issues but overall functional.",
    "Works fine but wish the quality was a bit better.",
    "Gets the job done. Nothing to write home about.",
    "Average experience. Might look for alternatives next time.",
]
review_texts_negative = [
    "Disappointed with the quality. Expected much better.",
    "Broke after a few uses. Not worth the money.",
    "Poor quality control. Had to return it.",
    "Doesn't match the description at all. Very misleading.",
    "Waste of money. Would not recommend.",
    "Cheap materials. Fell apart quickly.",
    "Stopped working after two weeks. Very unreliable.",
    "Not as advertised. Major quality issues.",
]

reviews = []
rid = 1
for _ in range(N_REVIEWS):
    uid     = random.choice(user_ids)
    persona = user_persona_map[uid]
    pid_val = sample_product_for_user(persona)
    liked   = random.random() > 0.25
    rating  = sample_rating(pid_val, liked=liked)
    if rating >= 4.0:
        text = random.choice(review_texts_positive)
    elif rating >= 3.0:
        text = random.choice(review_texts_neutral)
    else:
        text = random.choice(review_texts_negative)
    reviews.append({
        "review_id":         f"rev_{rid:07d}",
        "user_id":           uid,
        "product_id":        pid_val,
        "rating":            rating,
        "review_text":       text,
        "helpful_votes":     int(np.random.lognormal(1.5, 1.5)),
        "verified_purchase": random.random() > 0.15,
        "created_at":        fmt(rand_date()),
    })
    rid += 1

reviews_df = pd.DataFrame(reviews)
reviews_df.to_csv(os.path.join(OUT_DIR, "reviews.csv"), index=False)
print(f"  reviews.csv: {len(reviews_df)} rows")
print(f"  Rating distribution: {reviews_df['rating'].value_counts().sort_index().to_dict()}")

# ── Generate Carts ─────────────────────────────────────────────────────────────
print("Generating carts...")
carts = []
cid = 1
for _ in range(N_CARTS):
    uid     = random.choice(user_ids)
    persona = user_persona_map[uid]
    pid_val = sample_product_for_user(persona)
    price   = float(product_price_map[pid_val])
    cat     = product_cat_map[pid_val]
    carts.append({
        "cart_id":      f"cart_{cid:06d}",
        "user_id":      uid,
        "product_id":   pid_val,
        "quantity":     random.choices([1,2,3,4,5], weights=[60,20,10,6,4], k=1)[0],
        "price_at_add": price,
        "added_at":     fmt(rand_date()),
        "category":     cat,
    })
    cid += 1

carts_df = pd.DataFrame(carts)
carts_df.to_csv(os.path.join(OUT_DIR, "carts.csv"), index=False)
print(f"  carts.csv: {len(carts_df)} rows")

# ── Generate Orders WITH product_id ──────────────────────────────────────────
print("Generating orders...")
order_rows = []
oid = 1
for _ in range(N_ORDERS):
    uid      = random.choice(user_ids)
    persona  = user_persona_map[uid]
    n_items  = random.choices([1,2,3,4,5], weights=[40,30,15,10,5], k=1)[0]
    order_dt = rand_date()
    status   = random.choices(
        ["delivered","shipped","processing","cancelled","returned"],
        weights=[65,10,10,9,6], k=1)[0]
    chosen_pids = [sample_product_for_user(persona) for _ in range(n_items)]
    total = sum(float(product_price_map[p]) for p in chosen_pids)
    for p in chosen_pids:
        order_rows.append({
            "order_id":   f"order_{oid:06d}",
            "user_id":    uid,
            "product_id": p,
            "order_date": fmt(order_dt),
            "status":     status,
            "total":      round(total, 2),
            "n_items":    n_items,
        })
    oid += 1

orders_df = pd.DataFrame(order_rows)
orders_df.to_csv(os.path.join(OUT_DIR, "orders.csv"), index=False)
print(f"  orders.csv: {len(orders_df)} rows (with product_id)")

# ── Generate Views ─────────────────────────────────────────────────────────────
print("Generating views...")
view_rows = []
for _ in range(N_VIEWS):
    uid     = random.choice(user_ids)
    persona = user_persona_map[uid]
    pid_val = sample_product_for_user(persona)
    view_rows.append({
        "user_id":    uid,
        "product_id": pid_val,
        "duration_s": int(np.random.lognormal(3.5, 1.0)),
        "viewed_at":  fmt(rand_date()),
        "source":     random.choice(["search","browse","recommendation","homepage","category"]),
    })

views_df = pd.DataFrame(view_rows)
views_df.to_csv(os.path.join(OUT_DIR, "views.csv"), index=False)
print(f"  views.csv: {len(views_df)} rows")

# ── Generate Wishlist ─────────────────────────────────────────────────────────
print("Generating wishlist...")
wish_rows = []
for _ in range(N_WISHLIST):
    uid     = random.choice(user_ids)
    persona = user_persona_map[uid]
    pid_val = sample_product_for_user(persona)
    wish_rows.append({
        "user_id":    uid,
        "product_id": pid_val,
        "added_at":   fmt(rand_date()),
    })

wishlist_df = pd.DataFrame(wish_rows)
wishlist_df.to_csv(os.path.join(OUT_DIR, "wishlist.csv"), index=False)
print(f"  wishlist.csv: {len(wishlist_df)} rows")

print("\nAll improved datasets saved to:", OUT_DIR)
print("Summary:")
print(f"  Users    : {len(users_df):,}")
print(f"  Products : {len(products_df):,}  (categories: {products_df['category'].nunique()})")
print(f"  Reviews  : {len(reviews_df):,}  (avg per product: {len(reviews_df)/len(products_df):.1f})")
print(f"  Carts    : {len(carts_df):,}")
print(f"  Orders   : {len(orders_df):,}  (with product_id!)")
print(f"  Views    : {len(views_df):,}")
print(f"  Wishlist : {len(wishlist_df):,}")
