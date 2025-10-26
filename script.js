// Configuration
const CONFIG = {
    TOKEN_NAME: '$POG',
    TOTAL_SUPPLY: '1B',
    CONTRACT_ADDRESS: '0xd0260db02fb21faa5494dbfde0ebe12e78d9d844',
    EXCHANGE_RATE: '1 USDC = 10,000 $POG',
    TIER: 'Tier 1 Meme',
    
    // API Configuration
    API_ENDPOINT: 'https://pog-token-api.vercel.app/mint',
    PAYMENT_ADDRESS: '0x7AE34aD98ABB28797e044f7Fad37364031F19152',
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};

// Store payment state
let paymentState = {
    isPending: false,
    txHash: null,
    paymentAddress: null,
    connectedAccount: null
};

// Update page on load
document.addEventListener('DOMContentLoaded', function() {
    updatePageContent();
    setupEventListeners();
    checkForPendingPayment();
    loadStats();
});

function updatePageContent() {
    // Update title
    document.querySelector('.title').textContent = CONFIG.TOKEN_NAME;
    
    // Update exchange rate
    document.querySelector('.rate-label').textContent = CONFIG.EXCHANGE_RATE;
    
    // Update tier
    document.querySelector('.tier-text').textContent = CONFIG.TIER;
}

function setupEventListeners() {
    // Connect Wallet Button
    document.getElementById('connectWallet').addEventListener('click', handleConnectWallet);
    
    // Protocol Button
    document.getElementById('protocolBtn').addEventListener('click', handleProtocolClick);
}

// Handle Connect Wallet
async function handleConnectWallet() {
    console.log('Connect Wallet clicked');
    
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            console.log('Connected account:', accounts[0]);
            
            // Store connected account
            paymentState.paymentAddress = accounts[0];
            paymentState.connectedAccount = accounts[0];
            
            // Update button text
            const btn = document.getElementById('connectWallet');
            btn.textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            btn.style.background = '#00FF88';
            btn.style.color = '#1a1a2e';
            btn.style.borderColor = '#00FF88';
            
            showNotification('✅ Wallet connected!', 'success');
        } catch (error) {
            console.error('User rejected connection:', error);
            showNotification('❌ Failed to connect wallet', 'error');
        }
    } else {
        showNotification('❌ MetaMask not installed. Please install it first.', 'error');
    }
}

// Handle Protocol Button Click - x402 Flow
async function handleProtocolClick() {
    console.log('Protocol button clicked - Starting x402 flow');
    
    const btn = document.getElementById('protocolBtn');
    const responseDiv = document.getElementById('apiResponse');
    const responseContent = document.getElementById('responseContent');
    
    // Show loading state
    btn.textContent = '⏳ Loading...';
    btn.disabled = true;
    
    try {
        // Step 1: Call /mint endpoint without payment header
        console.log('Step 1: Fetching x402 payment schema...');
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Display API response
        responseContent.textContent = JSON.stringify(data, null, 2);
        responseDiv.style.display = 'block';
        
        // Scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Handle different response scenarios
        if (response.status === 402) {
            // This is expected - API requires payment
            console.log('402 Payment Required - x402 schema received');
            
            if (data.accepts && data.accepts.length > 0) {
                const paymentOption = data.accepts[0];
                console.log('Payment option:', paymentOption);
                
                btn.textContent = '💳 Ready to Pay';
                btn.style.background = 'linear-gradient(135deg, #FF6B00, #FFD700)';
                btn.style.color = '#1a1a2e';
                
                // Store payment info
                paymentState.isPending = true;
                
                // Show payment instructions
                showPaymentInstructions(paymentOption);
            }
        } else if (data.error === 'X-Payment-Tx header is required') {
            // Same as 402 - need payment
            console.log('Payment required - showing options');
            
            if (data.accepts && data.accepts.length > 0) {
                const paymentOption = data.accepts[0];
                btn.textContent = '💳 Ready to Pay';
                btn.style.background = 'linear-gradient(135deg, #FF6B00, #FFD700)';
                btn.style.color = '#1a1a2e';
                
                paymentState.isPending = true;
                showPaymentInstructions(paymentOption);
            }
        } else if (data.success || response.status === 200) {
            // Payment already processed or minting successful
            console.log('Minting successful!');
            btn.textContent = '✅ Minted Successfully!';
            btn.style.background = '#00FF88';
            btn.style.color = '#1a1a2e';
            paymentState.isPending = false;
            showNotification('🎉 POG tokens minted successfully!', 'success');
            loadStats();
        }
    } catch (error) {
        console.error('API call failed:', error);
        
        // Display error response
        const errorResponse = {
            error: error.message,
            timestamp: new Date().toISOString(),
            note: 'Make sure your API endpoint is correct and CORS is enabled'
        };
        
        responseContent.textContent = JSON.stringify(errorResponse, null, 2);
        responseDiv.style.display = 'block';
        
        btn.textContent = '⚠️ Error';
        btn.style.background = '#FF4444';
        btn.style.color = '#fff';
        
        showNotification('❌ API Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// Show payment instructions
function showPaymentInstructions(paymentOption) {
    const instructions = `
🔔 PAYMENT INSTRUCTIONS:

Token: ${paymentOption.extra?.name || 'POG'}
Amount: ${(paymentOption.maxAmountRequired / 1e6).toFixed(2)} USDC
Network: ${paymentOption.network}
Pay to: ${paymentOption.payTo}

📱 Option 1: Use x402scan.com (Recommended)
1. Go to https://x402scan.com
2. Search for "POG" or paste: ${CONFIG.API_ENDPOINT}
3. Click "Fetch" and authorize payment
4. Confirm transaction in your wallet

📱 Option 2: Manual Payment (Advanced)
1. Send ${(paymentOption.maxAmountRequired / 1e6).toFixed(2)} USDC to: ${paymentOption.payTo}
2. Copy the transaction hash from blockchain
3. Come back here and provide the tx hash

⏱️ Timeout: ${paymentOption.maxTimeoutSeconds} seconds

After payment, you'll receive 10,000 POG tokens! 🚀
    `;
    
    alert(instructions);
}

// Check for pending payment and retry
async function checkForPendingPayment() {
    // This could be called after user completes payment
    // to verify and mint tokens
    const urlParams = new URLSearchParams(window.location.search);
    const txHash = urlParams.get('tx');
    
    if (txHash) {
        console.log('Found tx hash in URL:', txHash);
        await retryMintWithPayment(txHash);
    }
}

// Retry mint with payment proof
async function retryMintWithPayment(txHash) {
    console.log('Retrying mint with payment proof:', txHash);
    
    const btn = document.getElementById('protocolBtn');
    const responseDiv = document.getElementById('apiResponse');
    const responseContent = document.getElementById('responseContent');
    
    btn.textContent = '⏳ Verifying Payment...';
    btn.disabled = true;
    
    try {
        // Step 2: Call /mint with payment header
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Payment-Tx': txHash  // Send transaction hash
            }
        });
        
        const data = await response.json();
        console.log('Mint response:', data);
        
        // Display response
        responseContent.textContent = JSON.stringify(data, null, 2);
        responseDiv.style.display = 'block';
        
        if (response.status === 200 || data.success) {
            console.log('✅ Minting successful!');
            btn.textContent = '✅ Tokens Minted!';
            btn.style.background = '#00FF88';
            btn.style.color = '#1a1a2e';
            paymentState.isPending = false;
            paymentState.txHash = txHash;
            showNotification('🎉 POG tokens minted successfully!', 'success');
            loadStats();
        } else {
            console.error('Minting failed:', data);
            btn.textContent = '❌ Minting Failed';
            btn.style.background = '#FF4444';
            btn.style.color = '#fff';
            showNotification('❌ Minting failed: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Retry failed:', error);
        btn.textContent = '⚠️ Verification Error';
        btn.style.background = '#FF9800';
        btn.style.color = '#fff';
        showNotification('❌ Verification error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// Load stats from API
async function loadStats() {
    try {
        const response = await fetch(CONFIG.API_ENDPOINT.replace('/mint', '/stats'));
        const data = await response.json();
        
        console.log('Stats:', data);
        
        // Update stats display
        if (data.totalMints !== undefined) {
            document.getElementById('mintCount').textContent = data.totalMints;
        }
        
        if (data.remainingSupply) {
            document.getElementById('supplyLeft').textContent = data.remainingSupply;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Copy contract address to clipboard
function copyAddress() {
    const address = CONFIG.CONTRACT_ADDRESS;
    navigator.clipboard.writeText(address).then(() => {
        showNotification('✅ Address copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('❌ Failed to copy address', 'error');
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#00FF88' : type === 'error' ? '#FF4444' : '#FF6B00'};
        color: ${type === 'success' || type === 'error' ? '#fff' : '#1a1a2e'};
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Utility: Get current connected account
async function getConnectedAccount() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });
            return accounts[0] || null;
        } catch (error) {
            console.error('Failed to get accounts:', error);
            return null;
        }
    }
    return null;
}

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function(accounts) {
        console.log('Account changed:', accounts[0]);
        const btn = document.getElementById('connectWallet');
        if (accounts.length > 0) {
            btn.textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            paymentState.connectedAccount = accounts[0];
            paymentState.paymentAddress = accounts[0];
        } else {
            btn.textContent = 'Connect Wallet';
            paymentState.connectedAccount = null;
            paymentState.paymentAddress = null;
        }
    });
}

// Load stats periodically
setInterval(loadStats, 30000); // Every 30 seconds

