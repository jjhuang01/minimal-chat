# API Stability Monitor Requirements

## 1. Overview (概述)
开发一个 Python 脚本，用于监控家庭部署的 API 反向代理服务的稳定性。该服务将提供给公司内部人员使用，需要确保其在高频请求下的连通性和稳定性。

## 2. Core Features (核心功能)
- **多模型轮询**: 支持循环请求以下指定模型：
  - `claude-opus-4-5-thinking`
  - `claude-sonnet-4-5-thinking`
  - `gemini-3-flash`
  - `gemini-3-pro-high`
- **定时执行**: 每隔约 2 分钟执行一次完整的轮询测试。
- **稳定性记录**: 记录每次请求的状态（成功/失败）、耗时、响应内容摘要或错误信息。
- **长期运行**: 脚本需设计为后台长期运行模式（如死循环 + Sleep）。

## 3. Configuration (配置信息)
- **Base URL**: `http://59.110.36.43:8045/v1`
- **API Key**: `sk-934cc2b06f8d442388eaa9ca065fd63e`
- **Client**: 使用 `openai` Python SDK (兼容协议)。

## 4. Acceptance Criteria (验收标准)
- [ ] 脚本能成功连接指定 Base URL。
- [ ] 能够依次成功调用所有 4 个指定模型。
- [ ] 请求间隔控制在 2 分钟左右。
- [ ] 产生可读的日志文件 (`monitor.log`)，包含时间戳、模型名、状态码/错误信息、响应耗时。
- [ ] 遇到网络错误或 API 报错时，脚本不应崩溃，而是记录错误并继续下一次循环。
