# Media pipeline

1. Multer stream file vào quarantine trên disk: tối đa 6 file, 50 MB/file, 150 MB/request.
2. Magic-byte allowlist chỉ nhận JPEG/PNG/WebP/MP4/QuickTime; Sharp/FFprobe mới là validation cấu trúc.
3. SHA-256 phát hiện upload trùng. Filename lưu là UUID; tên gốc chỉ là metadata và không thành path.
4. Original chuyển vào `originals/`, ngoài public root. API download cần auth và `no-store`.
5. Ảnh kiểm tra dimension/exposure; video kiểm tra codec, dimension và duration ≤90 giây.
6. Mọi file mặc định `BLOCKED_FOR_REVIEW`. Admin phải xác nhận consent hoặc `NOT_REQUIRED`; bước này được audit.
7. Sharp render 1080×1350 JPEG không giữ EXIF. FFmpeg render 1080×1920 H.264/AAC với subprocess env tối thiểu.
8. Final nằm trong `renders/`, có hash và metadata renderer. Xóa media là soft-delete + xóa file; media đang được draft dùng không thể xóa.

OpenCV local helper nằm tại `server/ai-content/detect_privacy.py`: lấy tối đa 5 frame, gắn cờ mặt người, biển số khả nghi và QR. Ảnh/video còn có perceptual hash; video lấy sample frame để đo sáng/độ nét. Detector không bao giờ tự cấp consent. Nếu Python/OpenCV không có, cờ `LOCAL_PRIVACY_ANALYZER_UNAVAILABLE` được lưu và file vẫn chờ duyệt thủ công. OCR/Tesseract nâng cao chưa phải điều kiện để core chạy và không được dùng để tự phê duyệt.
