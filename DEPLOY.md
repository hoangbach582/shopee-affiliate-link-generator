# 🚀 Hướng dẫn Deploy lên Cloudflare Pages

## Tại sao Cloudflare?

|               | Vercel (cũ)       | Cloudflare Pages (mới)     |
| ------------- | ----------------- | -------------------------- |
| Cold start    | 200ms–1s          | **~5ms (zero cold start)** |
| Edge VN       | Singapore         | **Hà Nội + TP.HCM**        |
| Short URL db  | TinyURL API (~1s) | **KV in-edge (<5ms)**      |
| Free requests | 1M/tháng          | **100K/ngày (~3M/tháng)**  |
| Subdomain     | `*.vercel.app`    | `*.pages.dev`              |

---

## Bước 1 — Tạo tài khoản Cloudflare (miễn phí)

Truy cập https://dash.cloudflare.com/sign-up và tạo tài khoản.

---

## Bước 2 — Đăng nhập Wrangler CLI

```bash
npx wrangler login
```

Trình duyệt sẽ mở ra, đăng nhập Cloudflare và cho phép Wrangler.

---

## Bước 3 — Tạo KV Namespace

```bash
# KV cho production
npx wrangler kv namespace create LINKS_KV

# KV cho dev/preview (local testing)
npx wrangler kv namespace create LINKS_KV --preview
```

Output trông như này:

```
✅ Created KV namespace LINKS_KV with ID "abc123def456..."
```

Mở file `wrangler.toml` và thay:

- `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` → ID từ lệnh đầu
- `REPLACE_WITH_YOUR_KV_PREVIEW_NAMESPACE_ID` → ID từ lệnh thứ hai

---

## Bước 4 — Test local

```bash
npm install
npm run dev
```

Mở http://localhost:8788?key=bach123 để test tool.

---

## Bước 5 — Deploy lên Cloudflare Pages

### Option A: Deploy qua CLI (nhanh nhất)

```bash
npm run deploy
```

Sau lần đầu, Cloudflare sẽ tạo project và cho bạn subdomain:
`https://shopee-affiliate-link-generator.pages.dev`

### Option B: Deploy tự động qua GitHub (khuyến nghị cho production)

1. Push code lên GitHub:

   ```bash
   git add .
   git commit -m "feat: migrate to Cloudflare Pages + Workers + KV"
   git push
   ```

2. Vào https://dash.cloudflare.com → **Pages** → **Create a project** → **Connect to Git**

3. Chọn repo `shopee-affiliate-link-generator`

4. Build settings:
   - **Framework preset**: None
   - **Build command**: (để trống)
   - **Build output directory**: `/` (root)

5. **Environment Variables** → Add variable:
   - Không cần gì thêm (KV binding cấu hình riêng)

6. **Functions** → **KV namespace bindings**:
   - Variable name: `LINKS_KV`
   - KV namespace: chọn namespace vừa tạo ở Bước 3

7. Click **Save and Deploy** ✅

---

## Bước 6 — Gắn domain tùy chỉnh (tùy chọn)

Cloudflare Pages hỗ trợ **custom domain miễn phí** nếu bạn quản lý domain qua Cloudflare.

Nếu muốn domain miễn phí (ví dụ `.tk`, `.ml`, `.ga`):

1. Đăng ký tại https://www.freenom.com
2. Thêm domain vào Cloudflare (miễn phí): https://dash.cloudflare.com → **Add a Site**
3. Trong Pages project → **Custom domains** → **Set up a custom domain**

---

## URL sau khi deploy

```
Tool:        https://shopee-affiliate-link-generator.pages.dev?key=bach123
Short links: https://shopee-affiliate-link-generator.pages.dev/go/xxxxxxxx
```

---

## Lưu ý quan trọng

> **Short links cũ (TinyURL)** sẽ không còn hoạt động sau khi migration.
> Các link đã tạo bằng tool cũ trên Vercel sẽ 404 trên domain mới.
> Chỉ các link tạo mới sau khi deploy Cloudflare mới hoạt động.
