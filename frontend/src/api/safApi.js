const BASE_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
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
