document.addEventListener('DOMContentLoaded', async () => {
  const connectWalletButton = document.getElementById('connectWallet');
  const walletForm = document.getElementById('walletForm');
  const walletAddressInput = document.getElementById('walletAddress');
  const walletAddressDisplay = document.getElementById('walletAddressDisplay');
  const tokenDisplay = document.getElementById('tokenDisplay');
  const nftDisplay = document.getElementById('nftDisplay');

  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjFhNDUzZGE0LWJlNmQtNGI1Yi05YTlmLTE2M2Y1YjZjOGYxZCIsIm9yZ0lkIjoiMzk5OTA2IiwidXNlcklkIjoiNDEwOTE5IiwidHlwZUlkIjoiZWNlZjg3N2YtM2JmNy00OWI5LWI0NTYtYTUyYjQxNjA4MTBhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MjA3OTA3MDcsImV4cCI6NDg3NjU1MDcwN30.r0hy-7OxVSk28uXIsbNCRNvyLFjVitp1bnbN0iChp0U";

  connectWalletButton.addEventListener('click', async () => {
      try {
          const provider = window.solana;
          if (!provider.isPhantom) {
              alert('Please install Phantom Wallet');
              return;
          }
          await provider.connect();
          const address = provider.publicKey.toString();
          walletAddressDisplay.textContent = `Connected Wallet: ${address}`;

          await fetchNFTs(address);
      } catch (error) {
          console.error(error);
          walletAddressDisplay.textContent = 'An error occurred while connecting to the wallet.';
      }
  });

  walletForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const address = walletAddressInput.value;
      walletAddressDisplay.textContent = `Wallet Address: ${address}`;

      await fetchNFTs(address);
  });

  async function fetchNFTs(address) {
      // Fetch tokens
      const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new solanaWeb3.PublicKey(address),
          { programId: solanaWeb3.TOKEN_PROGRAM_ID }
      );
      const tokens = tokenAccounts.value.map(account => ({
          pubkey: account.pubkey.toString(),
          amount: account.account.data.parsed.info.tokenAmount.uiAmount
      }));
      tokenDisplay.innerHTML = '<h2 class="text-xl font-bold mb-2">Tokens</h2>';
      tokens.forEach(token => {
          const tokenElement = document.createElement('div');
          tokenElement.className = 'bg-gray-200 p-2 rounded-md shadow-md mb-2';
          tokenElement.innerHTML = `
              <p><strong>Token Pubkey:</strong> ${token.pubkey}</p>
              <p><strong>Amount:</strong> ${token.amount}</p>
          `;
          tokenDisplay.appendChild(tokenElement);
      });

      // Fetch NFTs using Moralis API
      await Moralis.start({
          apiKey: apiKey
      });

      const response = await Moralis.SolApi.account.getNFTs({
          network: "mainnet",
          address: address
      });

      const nfts = response.raw.result;
      nftDisplay.innerHTML = '<h2 class="text-xl font-bold mb-2">NFTs</h2>';
      if (nfts.length === 0) {
          nftDisplay.innerHTML += '<p>No NFTs found in this wallet.</p>';
      } else {
          nfts.forEach(async (nft) => {
              const metadata = await fetchNFTMetadata(nft.mint);
              const floorPrice = await fetchFloorPrice(nft.mint);
              const nftElement = document.createElement('div');
              nftElement.className = 'bg-gray-200 p-4 rounded-md shadow-md';
              nftElement.innerHTML = `
                  <p><strong>Mint:</strong> ${nft.mint}</p>
                  <p><strong>Name:</strong> ${metadata.name || 'N/A'}</p>
                  <p><strong>Symbol:</strong> ${metadata.symbol || 'N/A'}</p>
                  <p><strong>Description:</strong> ${metadata.description || 'N/A'}</p>
                  <p><strong>Token Address:</strong> ${nft.tokenAddress}</p>
                  <p><strong>Floor Price:</strong> ${floorPrice || 'N/A'} SOL</p>
                  <p><strong>Metadata:</strong> ${JSON.stringify(metadata)}</p>
              `;
              nftDisplay.appendChild(nftElement);
          });
      }
  }

  async function fetchNFTMetadata(mint) {
      try {
          const response = await fetch(`https://solana-gateway.moralis.io/nft/mainnet/${mint}/metadata`, {
              method: 'GET',
              headers: {
                  'accept': 'application/json',
                  'X-API-Key': apiKey
              }
          });
          const data = await response.json();
          return data;
      } catch (error) {
          console.error(error);
          return {};
      }
  }

  async function fetchFloorPrice(mint) {
      try {
          const response = await fetch(`https://api.example.com/nft-floor-price/${mint}`);
          const data = await response.json();
          return data.floorPrice;
      } catch (error) {
          console.error(error);
          return 'N/A';
      }
  }
});
