# Sổ kiểm toán dịch vụ và công cụ miễn phí

Kiểm tra: 2026-08-01.

| Tên | Mục đích | Bắt buộc | Miễn phí / thẻ / rủi ro | Chặn quota | Fallback | Nguồn chính thức |
|---|---|---:|---|---|---|---|
| Ollama local | Caption local | Không | MIT; local 0 VND. Ollama Cloud có pricing riêng | Chỉ loopback; `OLLAMA_NO_CLOUD=1`; model local đã pin | Template deterministic | [License](https://github.com/ollama/ollama/blob/main/LICENSE), [cloud](https://docs.ollama.com/cloud) |
| Qwen3 local | Model ứng viên VI/EN | Không | Apache-2.0 cho model chính thức; kiểm lại từng digest | Không tự tải model lớn | Template | [Qwen3](https://github.com/QwenLM/Qwen3) |
| Sharp | Ảnh/preview | Có | Apache-2.0, không API/thẻ/quota | Local resource limits | Chặn render và giữ draft | [License](https://github.com/lovell/sharp/blob/main/LICENSE) |
| FFmpeg/FFprobe | Reel và probe | Có cho video | Local, không thẻ/quota; license tùy build, không dùng `--enable-nonfree` | Timeout, giới hạn 90 giây | Chỉ tạo bài ảnh | [Legal](https://ffmpeg.org/legal.html) |
| OpenCV/YuNet | Cảnh báo khuôn mặt | Khuyến nghị | Apache-2.0/MIT, local | Pin checksum/model | Admin review bắt buộc | [OpenCV license](https://opencv.org/license/) |
| Tesseract | OCR riêng tư | Khuyến nghị | Apache-2.0, local | Pin `vie+eng` traineddata | Admin review bắt buộc | [License](https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE) |
| whisper.cpp | Subtitle local | Không | MIT, local | Chỉ model đã duyệt/checksum | NoOp STT | [License](https://github.com/ggml-org/whisper.cpp/blob/master/LICENSE) |
| PostgreSQL | DB/queue | Có | PostgreSQL License, local | Disk warning/backup | Restore backup | [License](https://www.postgresql.org/about/licence/) |
| Meta Graph API v26.0 | Đăng Page | Chỉ khi live | Không có metered price được công bố; không coi là bảo đảm vĩnh viễn, có policy/quota | 3 bài/ngày local; parse usage/error; live opt-in | MockPublisher | [Pages posts](https://developers.facebook.com/docs/pages-api/posts), [permissions](https://developers.facebook.com/docs/apps/review/login-permissions) |
| MET Norway | Weather signal | Không | Không tài khoản/thẻ; yêu cầu User-Agent, cache, attribution | Cache dài, dừng khi 429 | Không dùng weather | [Terms](https://api.met.no/doc/TermsOfService) |
| Cloudflare Workers AI | Cloud AI tùy chọn | Không | 10.000 neurons/ngày Free; card-free không chứng minh chắc chắn | Tắt; nếu duyệt thì 8.000/day | Ollama → template | [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) |
| Cloudflare Tunnel | HTTPS ngoài LAN | Không | Named tunnel tùy tài khoản/domain; card-free không chứng minh chắc chắn | Không tự bật | LAN HTTP | [Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/) |
| Telegram Bot | Thông báo tùy chọn | Không | Bot platform miễn phí; không bật Paid Broadcasts | Low-rate only | In-app notification | [FAQ](https://core.telegram.org/bots/faq) |

Không dùng Open-Meteo hosted Free API trong production thương mại vì free tier là non-commercial. Google Trends chỉ được thêm sau khi tài khoản có quyền API alpha/chính thức. `pytrends` không thuộc core.
