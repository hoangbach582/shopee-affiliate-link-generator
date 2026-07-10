function getCleanBaseURL(url) {
  return url.split("?")[0];
}

function process(input, affId, subId) {
  const shopeeRegex =
    /(https?:\/\/(?:www\.)?(?:shopee\.vn|s\.shopee\.vn|shope\.ee)[^\s]*)/g;
  const links = [...input.matchAll(shopeeRegex)].map((m) => m[0]);

  for (const link of links) {
    let targetUrl = link;
    // simulating no expand for now
    targetUrl = getCleanBaseURL(targetUrl);

    let decodedUrl = targetUrl;
    try {
      decodedUrl = decodeURIComponent(targetUrl);
    } catch (e) {}

    const encoded = encodeURIComponent(decodedUrl);
    const affiliateLink = `https://s.shopee.vn/an_redir?origin_link=${encoded}&affiliate_id=${affId}&sub_id=${encodeURIComponent(subId)}`;
    console.log("Original:", link);
    console.log("Universal:", affiliateLink);
  }
}

process(
  "Mua ngay tại https://shopee.vn/product/123/456?smtt=1.2.3 nhé",
  "17376590044",
  "test"
);
