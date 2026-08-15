# Chính sách chi phí AI Content

Mục tiêu bắt buộc: **0 VND chi phí vận hành dịch vụ**. Điện, máy tính và Internet sẵn có không được tính là dịch vụ API.

## Quy tắc

1. Core không gọi OpenAI, Anthropic, Gemini trả phí, SaaS video/ảnh, Zapier/Make/Buffer hoặc Redis cloud.
2. Adapter cloud luôn tắt mặc định. Không bật nếu cần thẻ, trial có hạn hoặc có overage tự động.
3. Ollama chỉ được gọi qua loopback; đặt `OLLAMA_NO_CLOUD=1` ở môi trường máy để vô hiệu hóa cloud models.
4. `service_usage` và quota guard dừng adapter tùy chọn ở 80% hard quota.
5. Meta live chỉ dùng API chính thức; hệ thống không bot-click Facebook.
6. Dashboard phải hiển thị `0 VND`. Nếu một cấu hình mới có thể tính phí, build vận hành không được coi là đạt.

## Kiểm tra trước thay đổi

- Đọc pricing/terms/license chính thức trong ngày triển khai.
- Ghi card requirement, free limit, overage behavior và fallback vào `FREE_SERVICES.md`.
- Không dùng blog bên thứ ba làm bằng chứng.
