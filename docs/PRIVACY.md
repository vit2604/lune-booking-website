# Quyền riêng tư AI Content

- Không đăng mặt khách, trẻ em, hộ chiếu, booking code, PMS, số liên hệ, biển số rõ hoặc nội dung riêng tư khi chưa có consent.
- Upload không tin checkbox/client. Mặc định giữ lại để review; quyết định review tạo `AiConsentRecord` và audit log.
- Original không nằm trong `public`, `dist`, service-worker cache hoặc response DTO path.
- Output ảnh được re-encode để bỏ EXIF. Không render SVG upload.
- Không thu thập danh tính người tương tác Meta; analytics chỉ lưu số tổng hợp.
- Khi nghi ngờ vùng nhạy cảm, chặn thay vì tự blur rồi đăng.

Xóa: admin yêu cầu xóa media, hệ thống chặn nếu draft còn tham chiếu, soft-delete record, xóa file và audit. Backup có retention riêng; cần xóa backup hết hạn theo chính sách vận hành.
