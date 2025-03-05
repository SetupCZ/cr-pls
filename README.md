# cr-pls
The tool generates formatted output for code review requests:
```
:pray: [project-name] [merge-request-title](merge-request-url)
```

## Usage
```
bunx cr-pls https://gitlab.jablotron.cloud/your-group/your-project/-/merge_requests/123
```

## Configuration
Set the following environment variables:
```
GITLAB_TOKEN=your_gitlab_personal_access_token
GITLAB_BASE_URL=https://gitlab.jablotron.cloud
```

## Help
```
bunx cr-pls --help
```

## Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```
