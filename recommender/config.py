CONFIG_CODE = 
import os

MONGO_URI  = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME    = "ecommerce"

# Interaction weights (how much each signal matters)
WEIGHTS = {
    "order":    5.0,   # strongest — user paid money
    "review":   3.0,   # explicit feedback
    "wishlist": 2.0,   # intent signal
    "cart":     1.5,   # weaker intent
    "view":     0.5,   # weakest (if you track views)
}

# ALS hyperparameters
ALS_FACTORS        = 64
ALS_ITERATIONS     = 20
ALS_REGULARIZATION = 0.01

# LightFM
LFM_COMPONENTS     = 64
LFM_EPOCHS         = 30
LFM_LOSS           = "warp"   # warp = best for ranking

# API
TOP_N_DEFAULT      = 10
MODEL_PATH         = "models/saved/"