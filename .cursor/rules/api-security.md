# api-security.md

**Role:** Security Officer  
**Apply to:** `app/api/**/*`, `lib/supabase/**/*`

## Instructions:

1. **Never log GitHub Access Tokens to the console.**
   - Tokens must never appear in console.log, console.error, or any logging statements.
   - Sanitize all logs before outputting sensitive data.

2. **Always use Server-Side cookies for session management.**
   - Sessions must be managed via secure, httpOnly cookies.
   - Never store tokens in localStorage or sessionStorage.
   - Use Next.js server actions or API routes for authentication flows.

3. **Ensure all Supabase calls use Row Level Security (RLS) policies.**
   - Every database table must have RLS enabled.
   - Verify that policies are in place before querying data.
   - Test RLS policies to ensure they properly restrict access.

## Security Checklist:

- [ ] API routes check authentication before processing requests
- [ ] Sensitive data is encrypted at rest and in transit
- [ ] Environment variables are properly configured (`.env.local`)
- [ ] CORS is configured to only allow trusted origins
- [ ] Rate limiting is implemented on public endpoints
- [ ] Input validation is performed on all user-provided data
- [ ] Error messages don't leak sensitive information
