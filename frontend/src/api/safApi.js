const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const { headers: customHeaders, ...restOptions } = options;
  
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
    ...restOptions,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

export const registerSAF = async (payload) => {
  return request("/saf/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const fetchMarketplaceListings = async () => {
  return request("/marketplace/listings");
};

export const fetchMyBids = async (walletAddress) => {
  return request("/marketplace/my-bids", {
    headers: walletAddress ? { "x-wallet-address": walletAddress } : undefined,
  });
};

export const placeMarketplaceBid = async ({ certId, quantity, price, walletAddress }) => {
  return request("/saf/bid", {
    method: "POST",
    headers: walletAddress ? { "x-wallet-address": walletAddress } : undefined,
    body: JSON.stringify({ certId, certificateId: certId, quantity, price }),
  });
};

export const fetchIncomingBids = async (walletAddress) => {
  return request("/marketplace/incoming-bids", {
    headers: walletAddress ? { "x-wallet-address": walletAddress } : undefined,
  });
};

export const acceptMarketplaceBid = async (bidId) => {
  return request("/marketplace/bid/accept", {
    method: "POST",
    body: JSON.stringify({ bidId }),
  });
};

export const counterMarketplaceBid = async (bidId, newPrice) => {
  return request("/marketplace/bid/counter", {
    method: "POST",
    body: JSON.stringify({ bidId, newPrice }),
  });
};

export const denyMarketplaceBid = async (bidId) => {
  return request("/marketplace/bid/deny", {
    method: "POST",
    body: JSON.stringify({ bidId }),
  });
};

export const listCertificateForSale = async (certId) => {
  return request("/saf/list", {
    method: "POST",
    body: JSON.stringify({ certId }),
  });
};
export const fetchPendingTradeApprovals = async () => {
  return request("/registry/trade-approvals");
};

export const approveTrade = async (bidId) => {
  return request("/saf/approve-trade", {
    method: "POST",
    body: JSON.stringify({ bidId }),
  });
};