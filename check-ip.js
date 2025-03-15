const https = require("https");

function fetchIP(version) {
  return new Promise((resolve, reject) => {
    https.get(`https://${version}.ifconfig.me`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data.trim()));
    }).on("error", (err) => reject(err));
  });
}

(async () => {
  try {
    const ipv4 = await fetchIP("ipv4");
    const ipv6 = await fetchIP("ipv6");

    console.log(`Whitelist this: ${ipv4},${ipv6}`);
  } catch (error) {
    console.error("Error fetching IP:", error);
  }
})();
