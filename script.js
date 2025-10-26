// Configuration
const CONFIG = {
    TOKEN_NAME: '$POG',
    TOTAL_SUPPLY: '1B',
    CONTRACT_ADDRESS: '0xd0260db02fb21faa5494dbfde0ebe12e78d9d844',
    EXCHANGE_RATE: '1 USDC = 10,000 $POG',
    
    // API Configuration
    API_ENDPOINT: 'https://pog-token-api.vercel.app/mint',
    PAYMENT_ADDRESS: '0x7AE34aD98ABB28797e044f7Fad37364031F19152',
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};

// Store wallet state
let walletState = {
    isConnected: false,
    account: null,
    chainId: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadStats();
    checkWalletConnection();
});

function setupEventListeners() {
    // Connect Wallet Button
    document.getElementById('connectWalletBtn').addEventListener('click', handleConnectWallet);
    
    // Mint Button
    document.getElementById('mintBtn').addEventListener('click', handleMintClick);
    
    // Protocol Button
    document.getElementById('protocolBtn').addEventListener('click', handleProtocolClick);
}

// Handle Connect Wallet with Web3Modal
async function handleConnectWallet() {
    console.log('Connect Wallet clicked');
    
    try {
        // Check if Web3Modal is available
        if (typeof web3modal === 'undefined') {
            showNotification('❌ Web3Modal not loaded. Please refresh the page.', 'error');
            return;
        }

        // Open Web3Modal
        const result = await web3modal.open();
        
        if (result) {
            console.log('Wallet connected:', result);
            
            // Get provider and accounts
            const provider = result.provider;
            const accounts = await provider.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
                const account = accounts[0];
                walletState.isConnected = true;
                walletState.account = account;
                
                // Update button
                const btn = document.getElementById('connectWalletBtn');
                btn.textContent = `${account.substring(0, 6)}...${account.substring(38)}`;
                btn.style.background = '#00cc00';
                btn.style.color = '#000';
                btn.style.borderColor = '#00cc00';
                
                showNotification('✅ Wallet connected!', 'success');
                console.log('Connected account:', account);
            }
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        showNotification('❌ Failed to connect wallet: ' + error.message, 'error');
    }
}

// Check if wallet is already connected
async function checkWalletConnection() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                walletState.isConnected = true;
                walletState.account = accounts[0];
                
                const btn = document.getElementById('connectWalletBtn');
                btn.textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
                btn.style.background = '#00cc00';
                btn.style.color = '#000';
                btn.style.borderColor = '#00cc00';
            }
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
    }
}

// Handle Mint Button Click
async function handleMintClick() {
    console.log('Mint button clicked');
    
    if (!walletState.isConnected) {
        showNotification('❌ Please connect your wallet first', 'error');
        return;
    }
    
    handleProtocolClick();
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
        if (response.status === 402 || data.error === 'X-Payment-Tx header is required') {
            console.log('402 Payment Required - x402 schema received');
            
            if (data.accepts && data.accepts.length > 0) {
                const paymentOption = data.accepts[0];
                console.log('Payment option:', paymentOption);
                
                btn.textContent = '💳 Ready to Pay';
                btn.style.background = 'linear-gradient(135deg, #FF6B00, #FFD700)';
                btn.style.color = '#1a1a2e';
                
                // Show payment instructions
                showPaymentInstructions(paymentOption);
            }
        } else if (data.success || response.status === 200) {
            console.log('Minting successful!');
            btn.textContent = '✅ Minted Successfully!';
            btn.style.background = '#00cc00';
            btn.style.color = '#000';
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

// Load stats from API
async function loadStats() {
    try {
        const response = await fetch(CONFIG.API_ENDPOINT.replace('/mint', '/stats'));
        const data = await response.json();
        
        console.log('Stats:', data);
        
        // You can update stats display here if needed
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
        background: ${type === 'success' ? '#00cc00' : type === 'error' ? '#FF4444' : '#FF6B00'};
        color: ${type === 'success' ? '#000' : '#fff'};
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

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function(accounts) {
        console.log('Account changed:', accounts[0]);
        const btn = document.getElementById('connectWalletBtn');
        if (accounts.length > 0) {
            btn.textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            walletState.isConnected = true;
            walletState.account = accounts[0];
        } else {
            btn.textContent = 'Connect Wallet';
            walletState.isConnected = false;
            walletState.account = null;
        }
    });
}

// Load stats periodically
setInterval(loadStats, 30000); // Every 30 seconds

