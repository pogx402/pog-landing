const CONFIG = {
    API_ENDPOINT: 'https://pog-token-api.vercel.app/mint',
    PAYMENT_ADDRESS: '0x7AE34aD98ABB28797e044f7Fad37364031F19152',
};

const walletState = {
    provider: null,
    account: null,
    chainId: null,
};

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

function updateWalletUI() {
    const walletStatus = document.getElementById('walletStatus');
    const protocolBtn = document.getElementById('protocolBtn');
    
    if (walletState.account) {
        walletStatus.textContent = `Connected: ${walletState.account.substring(0, 6)}...${walletState.account.substring(walletState.account.length - 4)}`;
        walletStatus.className = 'status-connected';
        protocolBtn.disabled = false;
        protocolBtn.textContent = 'Mint 10,000 $POG (x402)';
    } else {
        walletStatus.textContent = 'Disconnected';
        walletStatus.className = 'status-disconnected';
        protocolBtn.disabled = true;
        protocolBtn.textContent = 'Connect Wallet First';
    }
}

async function connectWallet() {
    const connectBtn = document.getElementById('connectWalletBtn');
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting...';

    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            walletState.provider = window.ethereum;
            walletState.account = accounts[0];
            walletState.chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            // Check for Base Mainnet (Chain ID 8453)
            if (walletState.chainId !== '0x2105') { // 0x2105 is 8453 in hex
                 showNotification('❌ Please switch to Base Mainnet (Chain ID 8453)', 'error');
            }
            
            updateWalletUI();
            
            // Listen for changes
            window.ethereum.on('accountsChanged', (newAccounts) => {
                walletState.account = newAccounts[0] || null;
                updateWalletUI();
            });
            window.ethereum.on('chainChanged', (newChainId) => {
                walletState.chainId = newChainId;
                updateWalletUI();
            });

        } catch (error) {
            console.error('Wallet connection error:', error);
            showNotification('❌ Wallet connection failed: ' + (error.message || 'Unknown error'), 'error');
        }
    } else {
        showNotification('❌ MetaMask or compatible wallet not detected (window.ethereum is undefined).', 'error');
    }
    
    connectBtn.disabled = false;
    connectBtn.textContent = 'Connect Wallet';
}

async function handleProtocolClick() {
    console.log('Protocol button clicked - Starting x402 flow');
    
    const btn = document.getElementById('protocolBtn');
    const responseDiv = document.getElementById('apiResponse');
    const responseContent = document.getElementById('responseContent');
    
    // Show loading state
    btn.textContent = '⏳ Loading...';
    btn.disabled = true;
    
    try {
        // Step 1: Get x402 schema from API
        const schemaResponse = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Account': walletState.account // Send account address for context
            }
        });
        
        const schemaData = await schemaResponse.json();
        console.log('Schema received:', schemaData);
        
        // Display schema (even if it's 402, we show the schema)
        responseContent.textContent = JSON.stringify(schemaData, null, 2);
        responseDiv.style.display = 'block';
        responseDiv.scrollIntoView({ behavior: 'smooth' });
        
        // --- Core x402 Logic ---
        
        if (schemaResponse.status === 402 ) {
            console.log('402 Payment Required - x402 schema received. Proceeding to Step 2: Payment Proof.');
            
            if (schemaData.accepts && schemaData.accepts.length > 0) {
                const paymentOption = schemaData.accepts[0];
                
                // Step 2: Request Transaction Hash from User
                const paymentMessage = `
                To mint 10,000 $POG, you must first pay 1 USDC on Base.
                
                1. Transfer 1 USDC to: ${CONFIG.PAYMENT_ADDRESS}
                2. Network: Base Mainnet
                
                Please enter the Transaction Hash (Tx Hash) of your successful transfer below:
                `;

                const txHash = prompt(paymentMessage);

                if (!txHash) {
                    showNotification('❌ Payment cancelled by user', 'error');
                    return; // Exit function
                }
                
                // Step 3: Send Transaction Hash to Backend
                console.log('Step 3: Sending Transaction Hash to Backend...');
                btn.textContent = '📤 Verifying Tx...';
                
                const mintResponse = await fetch(CONFIG.API_ENDPOINT, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Payment-Tx': txHash, // Send the transaction hash
                        'X-Account': walletState.account // Send account address for minting
                    }
                });
            
                const mintData = await mintResponse.json();
                console.log('Mint response:', mintData);
                
                // Update response display
                responseContent.textContent = JSON.stringify(mintData, null, 2);
                
                if (mintResponse.status === 200 && mintData.success) {
                    console.log('✅ Minting successful!');
                    btn.textContent = '✅ Minted Successfully!';
                    btn.style.background = '#00cc00';
                    btn.style.color = '#000';
                    showNotification('🎉 POG tokens minted successfully!', 'success');
                } else {
                    // Display the error from the backend
                    showNotification('❌ Verification failed: ' + (mintData.message || mintData.error || 'Unknown error'), 'error');
                }
                
            } else {
                showNotification('❌ Payment schema not found in 402 response', 'error');
            }
        } else if (schemaResponse.status === 200 && schemaData.success) {
            // This case might be for when no payment is required
            console.log('Minting successful (no payment needed)!');
            btn.textContent = '✅ Minted Successfully!';
            btn.style.background = '#00cc00';
            btn.style.color = '#000';
            showNotification('🎉 POG tokens minted successfully!', 'success');
        } else {
             // If it's not 402 and not 200, it's a true error
             showNotification('❌ Initial API call failed: ' + (schemaData.message || schemaData.error || 'Unknown API Error'), 'error');
        }
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('❌ Error: ' + error.message, 'error');
    } finally {
        // Ensure button is reset if not in success state
        if (!btn.textContent.includes('Successfully')) {
            btn.textContent = 'Mint 10,000 $POG (x402)';
            btn.style.background = 'linear-gradient(135deg, #FF6B00, #FFD700)';
            btn.style.color = '#1a1a2e';
        }
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectWalletBtn').addEventListener('click', connectWallet);
    document.getElementById('protocolBtn').addEventListener('click', handleProtocolClick);
    
    // Initial check
    updateWalletUI();
});
