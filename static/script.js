let currentCredit = 0.0;
let isCupFull = false;

// FETCH: Get current machine status
function updateStatus() {
    fetch('/get-status').then(r => r.json()).then(data => {
        document.getElementById('money-stat').innerText = data.money.toFixed(2);
        
        // Update bars
        document.getElementById('bar-water').style.width = (data.water/1000 * 100) + "%";
        document.getElementById('bar-milk').style.width = (data.milk/1000 * 100) + "%";
        document.getElementById('bar-coffee').style.width = (data.coffee/500 * 100) + "%";
        document.getElementById('bar-chocolate').style.width = (data.chocolate/300 * 100) + "%";
    });
}

// --- COIN LOGIC ---
function insertCoin(amount) {
    if (isCupFull) return; 
    currentCredit += amount;
    updateCreditDisplay();
}

function clearCoins() {
    if (currentCredit > 0) {
        // FIX: Actually tell the user they got their money back
        alert(`Refunded $${currentCredit.toFixed(2)} to your wallet!`);
        currentCredit = 0.0;
        updateCreditDisplay();
        document.getElementById('main-display').innerText = "Insert Coin";
    } else {
        document.getElementById('main-display').innerText = "No Credit";
    }
}

function updateCreditDisplay() {
    document.getElementById('current-credit').innerText = currentCredit.toFixed(2);
    document.getElementById('main-display').innerText = "Credit: $" + currentCredit.toFixed(2);
}

// --- ORDER LOGIC ---
function order(btn) {
    if (isCupFull) {
        alert("Please take your coffee first!");
        return;
    }

    let drinkName = btn.getAttribute('data-drink');
    let cost = parseFloat(btn.getAttribute('data-cost'));
    let display = document.getElementById('main-display');

    if (currentCredit < cost) {
        display.innerText = "Need $" + (cost - currentCredit).toFixed(2);
        return;
    }

    // Prepare Visuals
    let cupContainer = document.getElementById('cup-container');
    let liquid = document.getElementById('liquid');
    
    // Show empty cup
    cupContainer.style.opacity = '1';
    liquid.style.height = '0%';
    liquid.style.transition = 'none';

    display.innerText = "Brewing...";

    fetch('/process-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ drink: drinkName, money_inserted: currentCredit })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // FIX: Instead of wiping credit, we set it to the Change amount
            // The backend returns 'change', which is what's left over.
            currentCredit = data.change; 
            updateCreditDisplay(); // Update the display to show the leftover money

            // Animate
            setTimeout(() => {
                liquid.style.backgroundColor = getDrinkColor(drinkName);
                liquid.style.transition = 'height 3s ease-in-out'; 
                liquid.style.height = '85%'; 
            }, 100);

            setTimeout(() => {
                document.getElementById('steam').style.opacity = '1';
                // Update status message but keep the credit visible in the coin pad
                display.innerText = "Done! Tap Cup";
                isCupFull = true;
                updateStatus();
            }, 3000);
        } else {
            display.innerText = "Error";
            alert(data.message);
        }
    });
}

// --- TAKE CUP LOGIC ---
function takeCup() {
    if (!isCupFull) return;

    let cupContainer = document.getElementById('cup-container');
    cupContainer.style.opacity = '0';
    
    isCupFull = false;
    document.getElementById('steam').style.opacity = '0';
    
    // After taking cup, show credit again so they know they can buy another
    if (currentCredit > 0) {
        document.getElementById('main-display').innerText = "Credit: $" + currentCredit.toFixed(2);
    } else {
        document.getElementById('main-display').innerText = "Next Order?";
    }
}

// --- SHOP LOGIC ---
function buyResource(itemName) {
    fetch('/buy-resource', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ item: itemName })
    })
    .then(r => r.json())
    .then(data => {
        if(data.success) {
            updateStatus();
        } else {
            alert(data.message);
        }
    });
}

function getDrinkColor(name) {
    const colors = { 'espresso': '#3b2f2f', 'latte': '#d7ccc8', 'cappuccino': '#a1887f', 'mocha': '#5d4037', 'macchiato': '#8d6e63' };
    return colors[name] || '#3b2f2f';
}

updateStatus();