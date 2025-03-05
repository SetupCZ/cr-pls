#!/usr/bin/env bun

interface MergeRequest {
  iid: number;
  title: string;
  web_url: string;
  project_id: number;
}

interface Project {
  id: number;
  name: string;
}

async function main() {
  // Check for help flag first
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0); // Exit with success code
  }

  // Get GitLab API token from environment variable
  const gitlabToken = process.env.GITLAB_TOKEN;
  if (!gitlabToken) {
    console.error("Error: GITLAB_TOKEN environment variable is required");
    printUsage();
    process.exit(1);
  }

  // Get GitLab base URL (optional, default to gitlab.com)
  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  if (!gitlabBaseUrl) {
    console.error("Error: GITLAB_BASE_URL environment variable is required");
    printUsage();
    process.exit(1)
  }
  const gitlabApiUrl = `${gitlabBaseUrl}/api/v4`;

  // Parse command line arguments
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const input = args[0];

  try {

    // Parse URL to extract project and MR information
    const {projectPath, mergeRequestIid} = parseMergeRequestUrl(input);

    // Get project ID from path
    const project = await getProject(gitlabApiUrl, projectPath, gitlabToken);

    // Fetch merge request details
    const mergeRequest = await fetchMergeRequest(gitlabApiUrl, project.id.toString(), mergeRequestIid, gitlabToken);

    // Fetch project details
    // const project = await fetchMergeRequest(gitlabApiUrl, mergeRequest.project_id, gitlabToken);

    // Generate formatted output
    const formattedOutput = `:pray: [${project.name}] [${mergeRequest.title}](${mergeRequest.web_url})`;

    // Print the result
    console.log(formattedOutput);

    return formattedOutput;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main()

function printUsage() {
  console.log(`
Usage: bun run index.ts <merge-request-url>

Environment variables:
  GITLAB_TOKEN       - Required GitLab personal access token with API scope
  GITLAB_BASE_URL    - Required GitLab instance URL

Examples:
  bunx cr-pls https://gitlab.com/my-group/my-project/-/merge_requests/123
`);
}

function parseMergeRequestUrl(url: string): { projectPath: string; mergeRequestIid: number } {
  try {
    // Parse the URL to extract components
    const parsedUrl = new URL(url);

    // Extract path without domain
    const pathParts = parsedUrl.pathname.split('/-/merge_requests/');

    if (pathParts.length !== 2) {
      throw new Error("Invalid GitLab merge request URL format");
    }

    // Remove leading slash from project path
    const projectPath = pathParts[0].replace(/^\//, '');
    const mergeRequestIid = parseInt(pathParts[1], 10);

    if (isNaN(mergeRequestIid)) {
      throw new Error("Invalid merge request ID in URL");
    }

    return {projectPath, mergeRequestIid};
  } catch (error) {
    if (error instanceof TypeError) {
      // URL parsing error
      throw new Error("Invalid URL format");
    }
    throw error;
  }
}

async function getProject(apiBaseUrl: string, projectPath: string, token: string): Promise<Project> {
  const encodedPath = encodeURIComponent(projectPath);
  const url = `${apiBaseUrl}/projects/${encodedPath}`;

  const response = await fetch(url, {
    headers: {
      "PRIVATE-TOKEN": token
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Project '${projectPath}' not found. Check the path and your access permissions.`);
    }
    throw new Error(`Failed to fetch project details (HTTP ${response.status})`);
  }

  const project = await response.json();
  return project;
}

async function fetchMergeRequest(apiBaseUrl: string, projectId: string, mrIid: number, token: string): Promise<MergeRequest> {
  const url = `${apiBaseUrl}/projects/${projectId}/merge_requests/${mrIid}`;

  const response = await fetch(url, {
    headers: {
      "PRIVATE-TOKEN": token
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Merge request #${mrIid} not found in project ${projectId}`);
    }
    throw new Error(`Failed to fetch merge request`);
  }

  return await response.json();
}
