import axios from 'axios';

function getGithubClient() {
  const token = process.env.PAT_1;
  
  if (!token) {
    throw new Error('GitHub token (PAT_1) is required in .env file');
  }

  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
}

export async function getUserStats(username) {
  try {
    const github = getGithubClient();
    const [user, repos] = await Promise.all([
      github.get(`/users/${username}`),
      github.get(`/users/${username}/repos?per_page=100&sort=updated`),
    ]);

    const userData = user.data;
    const reposData = repos.data;

    let totalStars = 0;
    let totalCommits = 0;
    let totalPRs = 0;
    let totalIssues = 0;
    let contributedTo = 0;

    for (const repo of reposData) {
      totalStars += repo.stargazers_count;
      totalPRs += repo.open_issues_count;
      totalIssues += repo.open_issues_count;

      if (!repo.owner.login === username) {
        contributedTo++;
      }
    }

    // Get commits from last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const commits = await github.get(
      `/search/commits?q=author:${username}+committer-date:>${oneYearAgo.toISOString()}&per_page=1`
    );

    totalCommits = commits.data.total_count || 0;

    return {
      name: userData.name || userData.login,
      stars: totalStars,
      commits: totalCommits,
      prs: totalPRs,
      issues: totalIssues,
      contributedTo,
    };
  } catch (error) {
    throw new Error(`Failed to fetch user stats: ${error.message}`);
  }
}

export async function getTopLanguages(username) {
  try {
    const github = getGithubClient();
    const repos = await github.get(`/users/${username}/repos?per_page=100&sort=updated`);

    const languages = {};

    for (const repo of repos.data) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    }

    return Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lang, count]) => ({ language: lang, count }));
  } catch (error) {
    throw new Error(`Failed to fetch top languages: ${error.message}`);
  }
}
