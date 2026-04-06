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

    for (const repo of reposData) {
      totalStars += repo.stargazers_count;
    }

    // Get total commits (all time)
    try {
      const commits = await github.get(
        `/search/commits?q=author:${username}&per_page=1`
      );
      totalCommits = commits.data.total_count || 0;
    } catch (error) {
      console.error('Error fetching commits:', error.message);
      totalCommits = 0;
    }

    // Get total PRs (all time)
    try {
      const prs = await github.get(
        `/search/issues?q=author:${username}+type:pr&per_page=1`
      );
      totalPRs = prs.data.total_count || 0;
    } catch (error) {
      console.error('Error fetching PRs:', error.message);
      totalPRs = 0;
    }

    // Get total issues created (all time, excluding PRs)
    try {
      const issues = await github.get(
        `/search/issues?q=author:${username}+type:issue&per_page=1`
      );
      totalIssues = issues.data.total_count || 0;
    } catch (error) {
      console.error('Error fetching issues:', error.message);
    }

    // Get contributed repositories (repos where user has contributed but is not the owner)
    let contributedTo = 0;
    try {
      // Obtener eventos recientes del usuario para encontrar repos donde ha contribuido
      const events = await github.get(`/users/${username}/events/public?per_page=100`);
      const contributedRepos = new Set();
      
      for (const event of events.data) {
        // Solo contar repos donde el usuario no es el owner
        if (event.repo && event.repo.name) {
          const repoOwner = event.repo.name.split('/')[0];
          if (repoOwner !== username) {
            contributedRepos.add(event.repo.name);
          }
        }
      }
      
      contributedTo = contributedRepos.size;
    } catch (error) {
      console.error('Error calculating contributed repos:', error.message);
      contributedTo = 0;
    }

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

    // Obtener bytes de código por lenguaje
    for (const repo of repos.data) {
      if (!repo.fork && repo.language) {
        try {
          const langStats = await github.get(`/repos/${repo.owner.login}/${repo.name}/languages`);
          
          for (const [lang, bytes] of Object.entries(langStats.data)) {
            languages[lang] = (languages[lang] || 0) + bytes;
          }
        } catch (error) {
          // Si falla, al menos contar el lenguaje principal
          if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
          }
        }
      }
    }

    return Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([lang, count]) => ({ language: lang, count }));
  } catch (error) {
    throw new Error(`Failed to fetch top languages: ${error.message}`);
  }
}
