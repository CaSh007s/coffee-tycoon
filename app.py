from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# --- CONFIGURATION ---
MENU = {
    "espresso": {
        "ingredients": {"water": 50, "coffee": 18, "milk": 0, "chocolate": 0},
        "cost": 1.50,
    },
    "latte": {
        "ingredients": {"water": 200, "coffee": 24, "milk": 150, "chocolate": 0},
        "cost": 2.50,
    },
    "cappuccino": {
        "ingredients": {"water": 250, "coffee": 24, "milk": 100, "chocolate": 0},
        "cost": 3.00,
    },
    "mocha": {
        "ingredients": {"water": 200, "coffee": 24, "milk": 100, "chocolate": 50},
        "cost": 3.50,
    },
    "macchiato": {
        "ingredients": {"water": 50, "coffee": 18, "milk": 20, "chocolate": 10},
        "cost": 2.80,
    }
}

# Shop Prices
SHOP_PRICES = {
    "water": {"amount": 500, "cost": 2.0},
    "milk": {"amount": 500, "cost": 5.0},
    "coffee": {"amount": 200, "cost": 8.0},
    "chocolate": {"amount": 200, "cost": 10.0}
}

resources = {
    "water": 500,
    "milk": 500,
    "coffee": 200,
    "chocolate": 100,
    "money": 10.0, # Start with $10 so they can buy stock if needed
}

# --- ROUTES ---

@app.route("/")
def index():
    return render_template("index.html", menu=MENU, resources=resources, shop=SHOP_PRICES)

@app.route("/get-status")
def get_status():
    return jsonify(resources)

@app.route("/process-order", methods=["POST"])
def process_order():
    data = request.json
    drink_name = data.get("drink")
    payment = float(data.get("money_inserted"))
    
    drink = MENU.get(drink_name)
    
    # 1. Check Resources
    for item, amount in drink["ingredients"].items():
        if resources[item] < amount:
            return jsonify({"success": False, "message": f"Out of {item}! Visit Shop."})

    # 2. Check Money
    if payment < drink["cost"]:
        return jsonify({"success": False, "message": "Insufficient Funds"})

    # 3. Transaction
    change = round(payment - drink["cost"], 2)
    resources["money"] += drink["cost"] # Add to revenue
    
    # Deduct ingredients
    for item, amount in drink["ingredients"].items():
        resources[item] -= amount

    return jsonify({
        "success": True, 
        "message": f"Here is your {drink_name.title()}!", 
        "change": change
    })

# New Route: Buying Supplies
@app.route("/buy-resource", methods=["POST"])
def buy_resource():
    item = request.json.get("item")
    shop_item = SHOP_PRICES.get(item)

    if not shop_item:
        return jsonify({"success": False, "message": "Invalid Item"})

    if resources["money"] >= shop_item["cost"]:
        resources["money"] -= shop_item["cost"]
        resources[item] += shop_item["amount"]
        return jsonify({"success": True, "message": f"Restocked {item}!"})
    else:
        return jsonify({"success": False, "message": "Not enough money to buy stock!"})

if __name__ == "__main__":
    app.run(debug=True)