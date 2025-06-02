# Claude GitHub Action Setup Guide

## Current Configuration

The repository uses OAuth authentication for Claude integration.

## Required GitHub Secrets

You need to set the following secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following repository secrets:

### OAuth Credentials (Primary Method)

Run the provided script to get your OAuth credentials:
```bash
./get_claude_tokens.sh
```

Then add these secrets:
- `CLAUDE_ACCESS_TOKEN`: The access token from the script output
- `CLAUDE_REFRESH_TOKEN`: The refresh token from the script output
- `CLAUDE_EXPIRES_AT`: The expiration timestamp from the script output

### Alternative: Anthropic API Key

If OAuth doesn't work, you can use:
- `ANTHROPIC_API_KEY`: Your Anthropic API key (starts with `sk-ant-api...`)

## Workflow Files

- **Primary**: `.github/workflows/claude.yml` - Uses OAuth authentication
- **Alternative**: `.github/workflows/claude-direct-api.yml` - Uses direct API authentication

## Troubleshooting OAuth Issues

If you encounter "invalid header value" errors:
1. Ensure the OAuth tokens don't contain any special characters that need escaping
2. Check that the tokens are not expired using `./get_claude_tokens.sh`
3. Re-login using `claude` command and `/login` if needed

## Testing

Once you've added the secrets, the Claude assistant should work by mentioning `@claude` in:
- Issue comments
- Pull request comments
- New issues
- Pull request reviews