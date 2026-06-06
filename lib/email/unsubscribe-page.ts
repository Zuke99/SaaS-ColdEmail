export const UNSUBSCRIBE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0a0a0a;
      color: #ededed;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .box {
      text-align: center;
      max-width: 400px;
      padding: 40px;
    }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p { color: #666; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="box">
    <h1>You've been unsubscribed</h1>
    <p>You won't receive any more emails from us.<br/>
    If this was a mistake, please reply to our last email.</p>
  </div>
</body>
</html>`;

export const INVALID_UNSUBSCRIBE_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribe</title></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#ededed;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <p>Invalid unsubscribe link.</p>
</body>
</html>`;
