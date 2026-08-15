# Kiến trúc AI Content

```text
Admin mobile web
  -> /api/admin/ai-content (JWT + RBAC + rate limit)
  -> PostgreSQL workflow / audit / queue
  -> local media quarantine -> Sharp / FFprobe / FFmpeg
  -> Ollama local -> deterministic template fallback
  -> MockPublisher (default) OR MetaPagePublisher (manual live enable)
```

## Adapter

- `LLMProvider`: `OllamaLLMProvider`, `DeterministicTemplateProvider`, `FallbackLLMProvider`.
- `MediaStorage`: `LocalMediaStorage`.
- `ImageRenderer`: `SharpImageRenderer`.
- `VideoRenderer`: `FFmpegVideoRenderer`.
- `SpeechToTextProvider`: `NoOpSpeechToTextProvider`; whisper.cpp có thể cắm sau.
- `ContentPublisher`: `MockPublisher`, `MetaPagePublisher`.
- `NotificationProvider`: `InAppNotificationProvider`.
- `JobScheduler`: `DatabaseJobScheduler` với PostgreSQL lease/fencing.

Trend/weather/event/analytics dùng model database và interface adapter; core hiện chỉ tạo evergreen khi không có source đã được xác minh. Không controller nào gọi SDK trả phí.

## An toàn publish

Publication khóa theo draft/version/publisher/Page, kiểm tra thời gian, emergency stop, version, content hash, FactGuard, quality và consent ngay trước dispatch. Kết quả mạng không chắc chắn chuyển `PUBLISH_UNKNOWN`; không blind retry.
