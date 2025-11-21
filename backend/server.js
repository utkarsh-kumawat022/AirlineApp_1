const express = require("express");
const axios = require("axios");
require("dotenv").config();
const exchangeRate = 90; // EUR → INR (static rate)

const app = express();
app.use(express.json());

const CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

let tokenCache = { token: null, expiry: 0 };

// Fetch new token if expired
async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiry - 60000) {
    return tokenCache.token;
  }

  const res = await axios.post(
    "https://test.api.amadeus.com/v1/security/oauth2/token",
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  tokenCache.token = res.data.access_token;
  tokenCache.expiry = Date.now() + res.data.expires_in * 1000;
  return tokenCache.token;
}
app.post("/search", async (req, res) => {
  try {
    console.log("📩 Incoming request:", req.body);

    const { origin, destination, departDate } = req.body;

    if (!origin || !destination || !departDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const token = await getToken();

    const response = await axios.get(
      "https://test.api.amadeus.com/v2/shopping/flight-offers",
      {
        params: {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: departDate,
          adults: 1,
          max: 20,
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // ✅ Extract offers
    const offers = response.data.data;

    // ✅ Log INR conversion test
    console.log("INR test:", offers[0]?.price?.total_in_inr);

    // ✅ Convert EUR → INR
    offers.forEach(offer => {
    const eur = parseFloat(offer.price.grandTotal);  // correct field
    const inr = eur * 90;                            // simple conversion
    offer.price.total_in_inr = inr.toFixed(2);       // send to frontend
});
console.log("EUR:", offers[0].price.grandTotal);
console.log("INR:", offers[0].price.total_in_inr);


    res.json(offers);

  } catch (error) {
    console.error("❌ Backend Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Search failed",
      details: error.response?.data || error.message,
    });
  }
});



app.listen(4000, () => console.log("🚀 Backend running on port 4000"));
