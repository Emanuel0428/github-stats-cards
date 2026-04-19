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

export async function getUserStats(username, options = {}) {
  try {
    const {
      includePrivate = false,
      includeStreaks = false
    } = options;

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
      let commitQuery = `author:${username}`;
      if (!includePrivate) {
        commitQuery += '+is:public';
      }
      const commits = await github.get(
        `/search/commits?q=${commitQuery}&per_page=1`
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

    const result = {
      name: userData.name || userData.login,
      stars: totalStars,
      commits: totalCommits,
      prs: totalPRs,
      issues: totalIssues,
      contributedTo,
    };

    // Calcular rachas si se solicita
    if (includeStreaks) {
      try {
        const streaks = await calculateStreaks(github, username);
        result.streaks = streaks;
      } catch (error) {
        console.error('Error calculating streaks:', error.message);
        result.streaks = { current: 0, longest: 0 };
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to fetch user stats: ${error.message}`);
  }
}

async function calculateStreaks(github, username) {
  try {
    // Obtener eventos recientes para calcular rachas
    const events = await github.get(`/users/${username}/events/public?per_page=100`);
    
    const commitDates = new Set();
    
    // Extraer fechas únicas de commits
    for (const event of events.data) {
      if (event.type === 'PushEvent' && event.created_at) {
        const date = event.created_at.split('T')[0];
        commitDates.add(date);
      }
    }

    const sortedDates = Array.from(commitDates).sort().reverse();
    
    if (sortedDates.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Calcular racha actual
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      date.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === i || (i === 0 && diffDays <= 1)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calcular racha más larga
    let longestStreak = 0;
    let tempStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      current: currentStreak,
      longest: longestStreak
    };
  } catch (error) {
    console.error('Error in calculateStreaks:', error.message);
    return { current: 0, longest: 0 };
  }
}

export async function getTopLanguages(username, options = {}) {
  try {
    const { limit = 8, includeForks = false } = options;

    const github = getGithubClient();
    const repos = await github.get(`/users/${username}/repos?per_page=100&sort=updated`);

    const languages = {};

    // Obtener bytes de código por lenguaje
    for (const repo of repos.data) {
      if ((includeForks || !repo.fork) && repo.language) {
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
      .slice(0, limit)
      .map(([lang, count]) => ({ language: lang, count }));
  } catch (error) {
    throw new Error(`Failed to fetch top languages: ${error.message}`);
  }
}
