# Kết nối Meta Page

Graph API duy nhất: `v26.0` tại một biến `META_GRAPH_VERSION`. Quyền tối thiểu cho đăng Page: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`; insights cần thêm `read_insights`. Không xin `publish_video` cho video/Reel thông thường.

Hệ thống cố định Page `61582233127486`, chỉ nhận Page từ `/me/accounts`, mã hóa Page token AES-256-GCM và không trả token cho frontend. Live mặc định tắt.

Các biến backend: `META_APP_ID`, `META_APP_SECRET`, `META_OAUTH_REDIRECT_URI`, `META_TOKEN_ENCRYPTION_KEY` (64 hex), `META_TOKEN_KEY_VERSION`, `META_GRAPH_VERSION=v26.0`, `META_PAGE_ID=61582233127486`.

Callback được frontend nhận `code/state`, sau đó POST bằng phiên admin tới `/api/admin/ai-content/integrations/meta/callback`; exchange diễn ra backend. OAuth state dùng một lần và hết hạn sau 10 phút.

Chỉ đặt `AI_CONTENT_LIVE_META_ENABLED=true` sau checklist cuối, App Review/Business Verification nếu Meta yêu cầu, dry-run pass và chủ Page xác nhận. Không chạy test tự động lên Page thật.

Ảnh được upload bằng multipart tới Page `/photos`. Video dọc dùng Page Reels ba bước `start → binary upload → finish`; worker theo dõi processing trước khi đánh dấu published. Kết quả mạng mơ hồ được giữ ở `PUBLISH_UNKNOWN` và chỉ reconciliation khi Page trả về đúng một bài có caption khớp tuyệt đối.
