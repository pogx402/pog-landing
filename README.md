# POG Landing Page

POG Token x402 Landing Page - Meme Edition 🐸

A beautiful, responsive landing page for the POG token that integrates with the x402 Protocol for seamless token minting via USDC payments on Base Mainnet.

## 🎯 Features

- ✅ **x402 Protocol Integration** - Seamless payment flow
- ✅ **MetaMask Wallet Connection** - Connect and verify payments
- ✅ **Real-time Stats** - Display mint count and supply
- ✅ **Responsive Design** - Works on all devices
- ✅ **Meme Aesthetic** - Fun, colorful UI with animations
- ✅ **API Integration** - Connects to pog-token-api backend
- ✅ **Payment Instructions** - Clear user guidance

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/pogx402/pog-landing.git
cd pog-landing
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally

```bash
npm run dev
```

Visit: `http://localhost:8000`

## 📋 Configuration

Edit `script.js` to configure:

```javascript
const CONFIG = {
    TOKEN_NAME: '$POG',
    TOTAL_SUPPLY: '1B',
    CONTRACT_ADDRESS: '0xd0260db02fb21faa5494dbfde0ebe12e78d9d844',
    EXCHANGE_RATE: '1 USDC = 10,000 $POG',
    API_ENDPOINT: 'https://pog-token-api.vercel.app/mint',
    PAYMENT_ADDRESS: '0x7AE34aD98ABB28797e044f7Fad37364031F19152',
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};
```

## 🔄 Payment Flow

1. **User clicks "Mint POG Now!"**
   - Frontend calls `/mint` endpoint
   - API returns 402 with x402 payment schema

2. **User sees payment instructions**
   - Option 1: Use x402scan.com
   - Option 2: Manual payment

3. **User sends 1 USDC**
   - Via x402scan.com or manual wallet transfer
   - Gets transaction hash

4. **User provides transaction hash**
   - Frontend calls `/mint` with `X-Payment-Tx` header
   - API verifies payment on blockchain

5. **Tokens are minted**
   - 10,000 POG tokens sent to user wallet
   - Success notification displayed

## 📁 Project Structure

```
pog-landing/
├── index.html          # Main HTML file
├── style.css           # Styling and animations
├── script.js           # JavaScript logic and API integration
├── package.json        # Project metadata
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## 🎨 Design Features

- **Gradient Background** - Dynamic animated gradients
- **Responsive Grid** - Two-column layout on desktop, single on mobile
- **Animations** - Bouncing logo, glowing text, rotating borders
- **Color Scheme**:
  - Primary: Orange (#FF6B00)
  - Secondary: Green (#00FF88)
  - Dark Background: Navy (#1a1a2e)

## 🔐 Security

- ✅ No private keys stored
- ✅ MetaMask for secure wallet connection
- ✅ CORS-enabled API calls
- ✅ Transaction verification on blockchain
- ✅ No sensitive data in frontend code

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

### GitHub Pages

1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Select main branch as source

## 🔗 API Integration

Frontend connects to:
- **Endpoint**: `https://pog-token-api.vercel.app/mint`
- **Method**: GET
- **Headers**: `X-Payment-Tx` (transaction hash)

## 🆘 Troubleshooting

### "MetaMask not installed"
- Install MetaMask extension from https://metamask.io

### "API Error"
- Verify API endpoint is correct
- Check CORS is enabled on backend
- Ensure API is deployed and running

### "Payment verification failed"
- Wait for transaction confirmation (1-2 minutes)
- Verify transaction hash is correct
- Check amount is at least 1 USDC

### "Connection refused"
- Check if API is running
- Verify API URL in CONFIG
- Check network connectivity

## 📊 Features in Detail

### Connect Wallet Button
- Connects MetaMask wallet
- Stores account address
- Shows connected address

### Mint POG Now Button
- Initiates x402 payment flow
- Shows payment instructions
- Displays API response
- Updates on successful mint

### Real-time Stats
- Fetches from `/stats` endpoint
- Updates every 30 seconds
- Shows total mints and supply

### API Response Display
- Shows full API response
- Useful for debugging
- Displays error messages

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check API documentation
- Visit x402scan.com for more info

---

**Version**: 1.0.0  
**Network**: Base Mainnet  
**Status**: ✅ Ready for Production  
**Last Updated**: October 2025

🐸 **POG to the moon!** 🚀

