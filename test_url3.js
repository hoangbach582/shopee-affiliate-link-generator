const shopeeRegex =
  /(https?:\/\/(?:www\.)?(?:shopee\.vn|s\.shopee\.vn|shope\.ee)[^\s]*[^\s.,!?;:)\]"'])/g;
const input =
  "Link: https://shopee.vn/product/123/456. Mua nhé! (https://shope.ee/abc) or https://s.shopee.vn/def,";
const links = [...input.matchAll(shopeeRegex)].map((m) => m[0]);
console.log(links);
