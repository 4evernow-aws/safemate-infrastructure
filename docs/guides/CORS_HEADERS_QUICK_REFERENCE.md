# CORS Headers Quick Reference

## For AWS Console Configuration

Copy and paste these headers into the "Integration Response" section for both OPTIONS and POST methods:

### Header 1
- **Name**: `Access-Control-Allow-Credentials`
- **Value**: `'true'`

### Header 2
- **Name**: `Access-Control-Allow-Headers`
- **Value**: `'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'`

### Header 3
- **Name**: `Access-Control-Allow-Methods`
- **Value**: `'GET,POST,PUT,DELETE,OPTIONS'`

### Header 4
- **Name**: `Access-Control-Allow-Origin`
- **Value**: `'http://localhost:5173'`

## Quick Copy-Paste Format

When adding headers in AWS Console, use these exact values:

```
Access-Control-Allow-Credentials: 'true'
Access-Control-Allow-Headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'
Access-Control-Allow-Methods: 'GET,POST,PUT,DELETE,OPTIONS'
Access-Control-Allow-Origin: 'http://localhost:5173'
```

## Notes
- Add these headers to BOTH OPTIONS and POST methods
- Make sure to include the single quotes around the values
- These headers enable CORS for localhost development
