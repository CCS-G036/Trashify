from pymongo import MongoClient
import pandas as pd
from sklearn.linear_model import LinearRegression

# MongoDB Configuration
client = MongoClient("mongodb://localhost:27017/")
db = client["Trashify"]
waste_types_collection = db["waste_types"]
deposits_collection = db["deposits"]

# Machine Learning Training Data
training_data = {
    "weight": [5.0, 10.0, 15.0, 20.0, 25.0],
    "copper": [1.0, 2.5, 3.8, 5.0, 6.5],
    "aluminum": [0.8, 1.5, 2.2, 3.0, 3.8],
    "gold": [0.02, 0.04, 0.06, 0.08, 0.10],
    "plastic": [2.5, 4.8, 6.5, 8.0, 10.5],
    "steel": [0.6, 1.2, 2.0, 2.8, 3.5],
    "glass": [0.4, 0.9, 1.2, 1.8, 2.3],
    "circuit_boards": [0.9, 1.8, 2.5, 3.2, 4.0],
    "other_metals": [0.3, 0.7, 1.1, 1.4, 1.8],
    "rubber": [0.2, 0.4, 0.7, 0.9, 1.1],
    "price_inr": [1500, 3200, 5000, 6800, 8500]
}

# Train Machine Learning Model
df = pd.DataFrame(training_data)
X = df.drop("price_inr", axis=1)
y = df["price_inr"]
model = LinearRegression().fit(X, y)

# Constants
BREAKDOWN_RATIOS = {
    "copper": 0.18, "aluminum": 0.15, "gold": 0.01,
    "plastic": 0.20, "steel": 0.16, "glass": 0.10,
    "circuit_boards": 0.12, "other_metals": 0.05, "rubber": 0.03
}
FEATURE_COLUMNS = ["weight"] + list(BREAKDOWN_RATIOS.keys())

# Helper Functions
def predict_price_in_inr(components):
    """
    Predicts the price of e-waste based on its components using the trained model.
    """
    input_data = pd.DataFrame([components], columns=FEATURE_COLUMNS)
    return round(model.predict(input_data)[0], 2)

def fetch_total_weight(waste_type_id):
    """
    Fetches the total weight of deposits for a given waste type.
    """
    deposits = deposits_collection.aggregate([
        {"$match": {"waste_type": waste_type_id, "status": "active"}},
        {"$group": {"_id": None, "total_weight": {"$sum": "$weight"}}}
    ])
    result = next(deposits, None)
    return result["total_weight"] if result else 0

def calculate_component_breakdown(total_weight):
    """
    Calculates the weight breakdown of e-waste components based on predefined ratios.
    """
    return {component: round(total_weight * ratio, 2) for component, ratio in BREAKDOWN_RATIOS.items()}

def process_category(category):
    """
    Processes a single e-waste category, calculating weights, prices, and breakdowns.
    """
    waste_type = waste_types_collection.find_one({"name": category.lower(), "status": "active"})
    if not waste_type:
        return None

    waste_type_id = waste_type["_id"]
    waste_type_price_inr = waste_type.get("price", 0)
    total_weight = fetch_total_weight(waste_type_id)

    if total_weight == 0:
        return None

    stored_price_inr = round(waste_type_price_inr * total_weight, 2)
    components = calculate_component_breakdown(total_weight)
    components["weight"] = total_weight
    predicted_price_inr = predict_price_in_inr(components)

    return {
        "category": category.capitalize(),
        "total_weight": total_weight,
        "stored_price_inr": stored_price_inr,
        "predicted_price_inr": predicted_price_inr,
        "components": components
    }

# Main Analysis Function
def analyze_e_waste_by_category():
    """
    Analyzes e-waste data by category and generates a detailed price breakdown.
    """
    e_waste_categories = ["small electronics", "laptops & desktops", "cables & wires", "other e-waste"]
    total_stored_price_inr = 0
    total_predicted_price_inr = 0

    print("---- Detailed E-Waste Price Breakdown ----\n")

    for category in e_waste_categories:
        result = process_category(category)
        if not result:
            continue

        # Print category details
        print(f"Category: {result['category']}")
        print(f"Total Weight (kg): {result['total_weight']}")
        print(f"Stored Price in INR: ₹{result['stored_price_inr']}")
        print(f"Predicted Price Using AI in INR: ₹{result['predicted_price_inr']}")
        print("Component Breakdown (kg):")
        for material, weight in result["components"].items():
            if material != "weight":
                print(f"  - {material.capitalize()}: {weight} kg")
        print("-" * 60)

        total_stored_price_inr += result["stored_price_inr"]
        total_predicted_price_inr += result["predicted_price_inr"]

    # Print combined results
    if total_stored_price_inr > 0 or total_predicted_price_inr > 0:
        print("\n---- Combined E-Waste Price Summary ----")
        print(f"Total Stored Price in INR: ₹{round(total_stored_price_inr, 2)}")
        print(f"Total Predicted Price Using AI in INR: ₹{round(total_predicted_price_inr, 2)}")
        print("-" * 60)
    else:
        print("No valid E-Waste entries found with non-zero weight.")

if __name__ == "__main__":
    analyze_e_waste_by_category()
