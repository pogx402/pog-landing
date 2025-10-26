const CONFIG = {
    API_ENDPOINT: 'https://pog-token-api.vercel.app/mint',
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base Mainnet
    PAYMENT_ADDRESS: '0x7AE34aD98ABB28797e044f7Fad37364031F19152',
    USDC_AMOUNT: '1000000', // 1 USDC (6 decimals)
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
            loadStats();
            
            // Listen for changes
            window.ethereum.on('accountsChanged', (newAccounts) => {
                walletState.account = newAccounts[0] || null;
                updateWalletUI();
                loadStats();
            });
            window.ethereum.on('chainChanged', (newChainId) => {
                walletState.chainId = newChainId;
                updateWalletUI();
                loadStats();
            });

        } catch (error) {
            console.error('User rejected connection:', error);
            showNotification('❌ Wallet connection rejected', 'error');
        }
    } else {
        showNotification('❌ MetaMask or compatible wallet not detected', 'error');
    }
}

async function loadStats() {
    // This is a placeholder for loading token stats or other data
    // In a real app, you would fetch this from a contract or API
    console.log('Loading stats...');
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
                'Content-Type': 'application/json'
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
            console.log('402 Payment Required - x402 schema received. Proceeding to Step 2: Signing.');
            
            if (schemaData.accepts && schemaData.accepts.length > 0) {
                const paymentOption = schemaData.accepts[0];
                console.log('Payment option:', paymentOption);
                
                // Step 2: Prepare EIP-712 Typed Data for TransferWithAuthorization
                console.log('Step 2: Preparing EIP-712 Typed Data...');
                btn.textContent = '✍️ Preparing Tx...';

                // Nonce is required for TransferWithAuthorization. 
                // For simplicity, we use a random nonce. In a real app, this should be fetched from the contract.
                const nonce = '0x' + Array.from({length: 32}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
                const validAfter = 0; // Valid immediately
                const validBefore = Math.floor(Date.now() / 1000) + (60 * 5); // Valid for 5 minutes

                const domain = {
                    name: 'USD Coin',
                    version: '2',
                    chainId: 8453, // Base Mainnet
                    verifyingContract: CONFIG.USDC_ADDRESS,
                };

                const types = {
                    TransferWithAuthorization: [
                        { name: 'from', type: 'address' },
                        { name: 'to', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'validAfter', type: 'uint256' },
                        { name: 'validBefore', type: 'uint256' },
                        { name: 'nonce', type: 'bytes32' },
                    ],
                };

                const value = {
                    from: walletState.account,
                    to: CONFIG.PAYMENT_ADDRESS,
                    value: CONFIG.USDC_AMOUNT,
                    validAfter: validAfter,
                    validBefore: validBefore,
                    nonce: nonce,
                };

                const typedData = {
                    domain: domain,
                    types: types,
                    primaryType: 'TransferWithAuthorization',
                    message: value,
                };

                // messageData is the full EIP-712 structure sent to the backend
                const messageData = typedData; 
                
                try {
                    // Step 3: Sign the EIP-712 Typed Data
                    console.log('Step 3: Signing EIP-712 Typed Data...');
                    btn.textContent = '✍️ Signing EIP-712...';
                    
                    // Reset button state before signing, in case user rejects
                    btn.disabled = false;
                    btn.textContent = 'Sign EIP-712';
                    btn.style.background = 'linear-gradient(135deg, #FF6B00, #FFD700)';
                    btn.style.color = '#1a1a2e';

                    // Use eth_signTypedData_v4, sending the object directly
                    const signature = await walletState.provider.request({
                        method: 'eth_signTypedData_v4',
                        params: [walletState.account, typedData], 
                    });
                
                    console.log('Message signed:', signature);
                    
                    // Step 4: Send signature and EIP-712 message to Backend
                    console.log('Step 4: Sending EIP-712 Signature to Backend...');
                    btn.textContent = '📤 Processing Payment...';
                    btn.disabled = true; // Re-disable while processing
                    
                    // We send the signature in X-Payment and the full EIP-712 message object in X-Payment-Message
                    const mintResponse = await fetch(CONFIG.API_ENDPOINT, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Payment': signature,
                            'X-Account': walletState.account,
                            'X-Payment-Message': JSON.stringify(messageData) // Full EIP-712 Typed Data
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
                        
                        // Reload stats
                        setTimeout(loadStats, 2000);
                    } else {
                        // If minting failed, but it wasn't a signature error, display the error from the backend
                        showNotification('❌ Minting failed: ' + (mintData.message || mintData.error || 'Unknown error'), 'error');
                    }
                
                } catch (signError) {
                    console.error('Signature/Processing error:', signError);
                    if (signError.code === 4001) {
                        showNotification('❌ Message signing rejected by user', 'error');
                    } else {
                        showNotification('❌ Error: ' + (signError.message || 'Unknown error'), 'error');
                    }
                    // Reset button to initial state
                    btn.textContent = 'Mint 10,000 $POG (x402)';
                    btn.disabled = false;
                    btn.style.background = 'linear-gradient(135deg, #FF6B00, #FFD700)';
                    btn.style.color = '#1a1a2e';
                }
            } else {
                showNotification('❌ Payment schema not found in 402 response', 'error');
                btn.textContent = '⚠️ Error';
                btn.style.background = '#FF4444';
                btn.style.color = '#fff';
            }
        } else if (schemaResponse.status === 200 && schemaData.success) {
            // This case might be for when no payment is required
            console.log('Minting successful (no payment needed)!');
            btn.textContent = '✅ Minted Successfully!';
            btn.style.background = '#00cc00';
            btn.style.color = '#000';
            showNotification('🎉 POG tokens minted successfully!', 'success');
            setTimeout(loadStats, 2000);
        } else {
             // If it's not 402 and not 200, it's a true error
             showNotification('❌ Initial API call failed: ' + (schemaData.message || schemaData.error || 'Unknown API Error'), 'error');
             btn.textContent = '⚠️ Error';
             btn.style.background = '#FF4444';
             btn.style.color = '#fff';
        }
    } catch (error) {
        console.error('API call failed:', error);
        
        // Display error response
        const errorResponse = {
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        responseContent.textContent = JSON.stringify(errorResponse, null, 2);
        responseDiv.style.display = 'block';
        
        btn.textContent = '⚠️ Error';
        btn.style.background = '#FF4444';
        btn.style.color = '#fff';
        
        showNotification('❌ Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectWalletBtn').addEventListener('click', connectWallet);
    document.getElementById('protocolBtn').addEventListener('click', handleProtocolClick);
    
    // Initial check
    updateWalletUI();
    loadStats();
});
