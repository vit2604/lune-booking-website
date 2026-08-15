# Cài AI local

Core chạy được khi Ollama tắt. Để bật Ollama:

```powershell
$env:OLLAMA_NO_CLOUD='1'
ollama serve
ollama list
```

Chỉ tải model sau khi chạy `npm run ai-content:check` và kiểm tra RAM/GPU. Model gợi ý để benchmark là một Qwen3 quantized nhỏ có license Apache-2.0; không hard-code tên tag vì tag thay đổi. Ghi tên, digest, URL, license, RAM và kết quả JSON vào tài liệu vận hành, rồi đặt `OLLAMA_MODEL` trong `server/.env`.

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

Nếu health fail hoặc JSON không ổn định, hệ thống tự dùng template.
