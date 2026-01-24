/**
 * API Route: /api/chat
 * 
 * 这是一个代理路由，将前端请求转发到实际的 AI API 服务器。
 * 解决了 HTTPS 页面无法直接请求 HTTP API 的 Mixed Content 问题。
 * 
 * 使用 Edge Runtime 以支持流式传输，无超时限制。
 */

export const runtime = 'edge';

// 从环境变量读取配置（安全，不会暴露给前端）
const API_BASE_URL = process.env.API_BASE_URL || 'http://59.110.36.43:8045/v1';
const API_KEY = process.env.API_KEY || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 构建目标 URL
    const targetUrl = `${API_BASE_URL}/chat/completions`;
    
    // 转发请求到实际 API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    // 如果是流式响应，直接透传
    if (body.stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 非流式响应
    const data = await response.json();
    return Response.json(data);
    
  } catch (error) {
    console.error('[API Route] Error:', error);
    return Response.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
