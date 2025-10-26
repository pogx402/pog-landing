// Configuration
const CONFIG = {
    TOKEN_NAME: '$POG',
    CONTRACT_ADDRESS: '0xd0260db02fb21faa5494dbfde0ebe12e78d9d844',
    EXCHANGE_RATE: '1 USDC = 10,000 $POG',
    
    // API Configuration
    API_ENDPOINT: 'https://pog-token-api.vercel.app/mint',
    STATS_ENDPOINT: 'https://pog-token-api.vercel.app/stats',
    PAYMENT_ADDRESS: '0x7AE34aD98ABB28797e044f7Fad37364031F19152',
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDC_AMOUNT: '1000000', // 1 USDC in wei (6 decimals)
    MINT_AMOUNT: '10000' // 10,000 POG tokens
};

// USDC ABI (minimal - only needed functions)
const USDC_ABI = [
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
];

// Store wallet state
let walletState = {
    isConnected: false,
    account: null,
    chainId: null,
    provider: null
};

// Store stats
let stats = {
    totalMints: 0,
    remainingSupply: '0',
    pricePerMint: '1 USDC',
    tokensPerMint: '10,000 POG'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadStats();
    checkWalletConnection();
    // Load stats every 30 seconds
    setInterval(loadStats, 30000);
});

function setupEventListeners() {
    // Connect Wallet Button
    document.getElementById('connectWalletBtn').addEventListener('click', openWalletModal);
    
    // Mint Button
    document.getElementById('mintBtn').addEventListener('click', handleMintClick);
    
    // Protocol Button
    document.getElementById('protocolBtn').addEventListener('click', handleProtocolClick);
}

// Open Wallet Modal
function openWalletModal() {
    console.log('Opening wallet modal');
    document.getElementById('walletModal').style.display = 'flex';
}

// Close Wallet Modal
function closeWalletModal() {
    console.log('Closing wallet modal');
    document.getElementById('walletModal').style.display = 'none';
}

// Connect Wallet
async function connectWallet(walletType) {
    console.log('Connecting wallet:', walletType);
    
    try {
        let provider = null;
        
        if (walletType === 'metamask') {
            if (typeof window.ethereum !== 'undefined') {
                provider = window.ethereum;
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                
                if (accounts && accounts.length > 0) {
                    handleWalletConnected(accounts[0], provider, 'MetaMask');
                }
            } else {
                showNotification('❌ MetaMask not installed. Install it from https://metamask.io', 'error');
            }
        } else if (walletType === 'okx') {
            if (typeof window.okxwallet !== 'undefined') {
                provider = window.okxwallet;
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                
                if (accounts && accounts.length > 0) {
                    handleWalletConnected(accounts[0], provider, 'OKX Wallet');
                }
            } else if (typeof window.ethereum !== 'undefined' && window.ethereum.isOkxWallet) {
                provider = window.ethereum;
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                
                if (accounts && accounts.length > 0) {
                    handleWalletConnected(accounts[0], provider, 'OKX Wallet');
                }
            } else {
                showNotification('❌ OKX Wallet not installed. Install it from https://www.okx.com/web3', 'error');
            }
        } else if (walletType === 'walletconnect') {
            showNotification('📱 WalletConnect - Scan QR code with your mobile wallet', 'info');
        } else if (walletType === 'coinbase') {
            if (typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet) {
                provider = window.ethereum;
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                
                if (accounts && accounts.length > 0) {
                    handleWalletConnected(accounts[0], provider, 'Coinbase Wallet');
                }
            } else {
                showNotification('❌ Coinbase Wallet not installed', 'error');
            }
        }
        
        closeWalletModal();
    } catch (error) {
        console.error('Wallet connection error:', error);
        showNotification('❌ Failed to connect wallet: ' + error.message, 'error');
    }
}

// Handle Wallet Connected
function handleWalletConnected(account, provider, walletName) {
    console.log('Wallet connected:', account, 'Provider:', walletName);
    
    walletState.isConnected = true;
    walletState.account = account;
    walletState.provider = provider;
    
    // Update button
    const btn = document.getElementById('connectWalletBtn');
    btn.textContent = `${account.substring(0, 6)}...${account.substring(38)}`;
    btn.style.background = '#00cc00';
    btn.style.color = '#000';
    btn.style.borderColor = '#00cc00';
    
    showNotification(`✅ Connected with ${walletName}!`, 'success');
    
    // Listen for account changes
    if (provider.on) {
        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', handleChainChanged);
    }
}

// Handle Account Changes
function handleAccountsChanged(accounts) {
    console.log('Accounts changed:', accounts);
    
    if (accounts.length === 0) {
        walletState.isConnected = false;
        walletState.account = null;
        
        const btn = document.getElementById('connectWalletBtn');
        btn.textContent = 'Connect Wallet';
        btn.style.background = 'transparent';
        btn.style.color = '#000';
        btn.style.borderColor = '#000';
        
        showNotification('❌ Wallet disconnected', 'error');
    } else {
        walletState.account = accounts[0];
        const btn = document.getElementById('connectWalletBtn');
        btn.textContent = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
    }
}

// Handle Chain Changes
function handleChainChanged(chainId) {
    console.log('Chain changed:', chainId);
    walletState.chainId = chainId;
    
    // Check if on Base Mainnet (chainId: 8453)
    if (parseInt(chainId) !== 8453) {
        showNotification('⚠️ Please switch to Base Mainnet', 'error');
    }
}

// Check if wallet is already connected
async function checkWalletConnection() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                handleWalletConnected(accounts[0], window.ethereum, 'MetaMask');
            }
        } else if (typeof window.okxwallet !== 'undefined') {
            const accounts = await window.okxwallet.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                handleWalletConnected(accounts[0], window.okxwallet, 'OKX Wallet');
            }
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
    }
}

// Load stats from Backend API
async function loadStats() {
    try {
        console.log('Loading stats from:', CONFIG.STATS_ENDPOINT);
        const response = await fetch(CONFIG.STATS_ENDPOINT);
        const data = await response.json();
        
        console.log('Stats received:', data);
        
        if (data) {
            stats.totalMints = data.totalMints || 0;
            stats.remainingSupply = data.remainingSupply || '0 POG';
            stats.pricePerMint = data.pricePerMint || '1 USDC';
            stats.tokensPerMint = data.tokensPerMint || '10,000 POG';
            
            // Update UI
            updateProgressBar();
            updateStats();
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Update progress bar
function updateProgressBar() {
    // Parse remaining supply (e.g., "999960000.0 POG" -> 999960000)
    const remainingStr = stats.remainingSupply.replace(/[^0-9.]/g, '');
    const remaining = parseInt(remainingStr) || 0;
    const total = 1000000000; // 1B
    const minted = total - remaining;
    const percentage = (minted / total) * 100;
    
    const progressFill = document.querySelector('.progress-fill');
    const progressLabel = document.querySelector('.progress-label');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    if (progressLabel) {
        const mintedM = (minted / 1000000).toFixed(1);
        const totalM = (total / 1000000).toFixed(0);
        progressLabel.textContent = `${mintedM}M / ${totalM}M`;
    }
    
    console.log(`Progress: ${percentage.toFixed(2)}% (${minted} / ${total})`);
}

// Update stats display
function updateStats() {
    // Update MINTS count
    const mintsElement = document.querySelector('[data-stat="mints"]');
    if (mintsElement) {
        mintsElement.textContent = stats.totalMints;
    }
    
    // Update SUPPLY LEFT
    const supplyElement = document.querySelector('[data-stat="supply"]');
    if (supplyElement) {
        supplyElement.textContent = stats.remainingSupply;
    }
}

// Handle Mint Button Click - Trigger USDC Transfer
async function handleMintClick() {
    console.log('Mint button clicked');
    
    if (!walletState.isConnected) {
        showNotification('❌ Please connect your wallet first', 'error');
        openWalletModal();
        return;
    }
    
    // Check if on Base Mainnet
    if (walletState.chainId && parseInt(walletState.chainId) !== 8453) {
        showNotification('⚠️ Please switch to Base Mainnet', 'error');
        return;
    }
    
    await sendUSDCTransaction();
}

// Send USDC Transaction
async function sendUSDCTransaction() {
    const btn = document.getElementById('mintBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Waiting for wallet...';
    
    try {
        console.log('Sending USDC transaction...');
        
        // Prepare transaction data for USDC transfer
        // transfer(address to, uint256 amount)
        const transferData = encodeTransferData(CONFIG.PAYMENT_ADDRESS, CONFIG.USDC_AMOUNT);
        
        // Send transaction
        const txHash = await walletState.provider.request({
            method: 'eth_sendTransaction',
            params: [{
                from: walletState.account,
                to: CONFIG.USDC_ADDRESS,
                data: transferData,
                value: '0'
            }]
        });
        
        console.log('Transaction sent:', txHash);
        btn.textContent = '⏳ Confirming...';
        showNotification(`📤 Transaction sent: ${txHash.substring(0, 10)}...`, 'info');
        
        // Wait for transaction confirmation
        await waitForTransaction(txHash);
        
        // Call backend API with transaction hash
        await callBackendWithTxHash(txHash);
        
        btn.textContent = '✅ Minted!';
        btn.style.background = '#00cc00';
        showNotification('🎉 POG tokens minted successfully!', 'success');
        
        // Reload stats
        setTimeout(loadStats, 2000);
        
    } catch (error) {
        console.error('Transaction failed:', error);
        
        if (error.code === 4001) {
            showNotification('❌ Transaction rejected by user', 'error');
        } else {
            showNotification('❌ Transaction failed: ' + error.message, 'error');
        }
        
        btn.textContent = '💵 1';
        btn.disabled = false;
    }
}

// Encode USDC transfer data
function encodeTransferData(to, amount) {
    // transfer(address to, uint256 amount)
    // Function selector: 0xa9059cbb
    const selector = '0xa9059cbb';
    
    // Pad address to 32 bytes
    const paddedTo = to.slice(2).padStart(64, '0');
    
    // Pad amount to 32 bytes
    const paddedAmount = amount.padStart(64, '0');
    
    return selector + paddedTo + paddedAmount;
}

// Wait for transaction confirmation
async function waitForTransaction(txHash) {
    return new Promise((resolve, reject) => {
        const checkTx = async () => {
            try {
                const receipt = await walletState.provider.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash]
                });
                
                if (receipt) {
                    if (receipt.status === '0x1') {
                        console.log('Transaction confirmed:', txHash);
                        resolve(receipt);
                    } else {
                        reject(new Error('Transaction failed'));
                    }
                } else {
                    // Still pending, check again
                    setTimeout(checkTx, 2000);
                }
            } catch (error) {
                reject(error);
            }
        };
        
        checkTx();
    });
}

// Call backend API with transaction hash
async function callBackendWithTxHash(txHash) {
    try {
        console.log('Calling backend API with tx hash:', txHash);
        
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Payment-Tx': txHash
            }
        });
        
        const data = await response.json();
        console.log('Backend response:', data);
        
        if (response.status === 200 && data.success) {
            console.log('✅ Minting confirmed by backend');
            return data;
        } else {
            throw new Error(data.error || 'Backend verification failed');
        }
    } catch (error) {
        console.error('Backend API call failed:', error);
        throw error;
    }
}

// Handle Protocol Button Click
async function handleProtocolClick() {
    console.log('Protocol button clicked');
    
    const btn = document.getElementById('protocolBtn');
    const responseDiv = document.getElementById('apiResponse');
    const responseContent = document.getElementById('responseContent');
    
    btn.textContent = '⏳ Loading...';
    btn.disabled = true;
    
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        responseContent.textContent = JSON.stringify(data, null, 2);
        responseDiv.style.display = 'block';
        responseDiv.scrollIntoView({ behavior: 'smooth' });
        
        btn.textContent = '✨ x402 Protocol integrated';
        
    } catch (error) {
        console.error('API call failed:', error);
        
        const errorResponse = {
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        responseContent.textContent = JSON.stringify(errorResponse, null, 2);
        responseDiv.style.display = 'block';
        
        showNotification('❌ API Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
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

// Close modal when clicking outside
document.getElementById('walletModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeWalletModal();
    }
});

