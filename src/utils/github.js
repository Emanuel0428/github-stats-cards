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

// Devuelve el login del dueño del token (o null si falla).
// Solo podemos leer repos privados cuando el username consultado coincide
// con el dueño del token.
async function getAuthenticatedLogin(github) {
  try {
    const me = await github.get('/user');
    return me.data.login;
  } catch (error) {
    console.error('Error fetching authenticated user:', error.message);
    return null;
  }
}

// Obtiene TODOS los repos paginando (GitHub limita per_page a 100).
// Si includePrivate y el username es el dueño del token, usa /user/repos
// (endpoint autenticado que sí devuelve privados); de lo contrario usa el
// endpoint público /users/{username}/repos.
async function fetchAllRepos(github, username, includePrivate) {
  const authLogin = includePrivate ? await getAuthenticatedLogin(github) : null;
  const usePrivateEndpoint =
    includePrivate &&
    authLogin &&
    authLogin.toLowerCase() === username.toLowerCase();

  if (includePrivate && !usePrivateEndpoint) {
    console.warn(
      `includePrivate=true pero el token no pertenece a "${username}" (dueño: ${authLogin || 'desconocido'}). Solo se contarán repos públicos.`
    );
  }

  const repos = [];
  let page = 1;

  while (true) {
    const path = usePrivateEndpoint
      ? `/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner`
      : `/users/${username}/repos?per_page=100&page=${page}&sort=updated`;

    const { data } = await github.get(path);
    repos.push(...data);

    if (!Array.isArray(data) || data.length < 100) break;
    page++;
  }

  return repos;
}

export async function getUserStats(username, options = {}) {
  try {
    const {
      includePrivate = false,
      includeStreaks = false
    } = options;

    const github = getGithubClient();
    const [user, reposData] = await Promise.all([
      github.get(`/users/${username}`),
      fetchAllRepos(github, username, includePrivate),
    ]);

    const userData = user.data;

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

    const publicFilter = includePrivate ? '' : '+is:public';

    // Get total PRs (all time)
    try {
      const prs = await github.get(
        `/search/issues?q=author:${username}+type:pr${publicFilter}&per_page=1`
      );
      totalPRs = prs.data.total_count || 0;
    } catch (error) {
      console.error('Error fetching PRs:', error.message);
      totalPRs = 0;
    }

    // Get total issues created (all time, excluding PRs)
    try {
      const issues = await github.get(
        `/search/issues?q=author:${username}+type:issue${publicFilter}&per_page=1`
      );
      totalIssues = issues.data.total_count || 0;
    } catch (error) {
      console.error('Error fetching issues:', error.message);
    }

    // Get contributed repositories (repos where user has contributed but is not the owner)
    let contributedTo = 0;
    try {
      // Obtener eventos recientes del usuario para encontrar repos donde ha contribuido.
      // /events incluye eventos privados cuando el token es del propio usuario;
      // /events/public se limita a actividad pública.
      const eventsPath = includePrivate
        ? `/users/${username}/events?per_page=100`
        : `/users/${username}/events/public?per_page=100`;
      const events = await github.get(eventsPath);
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
        const streaks = await calculateStreaks(github, username, includePrivate);
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

async function calculateStreaks(github, username, includePrivate = false) {
  try {
    // Obtener eventos recientes para calcular rachas (incluye privados si el
    // token es del propio usuario y includePrivate está activo).
    const eventsPath = includePrivate
      ? `/users/${username}/events?per_page=100`
      : `/users/${username}/events/public?per_page=100`;
    const events = await github.get(eventsPath);
    
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
    const { limit = 8, includeForks = false, includePrivate = false } = options;

    const github = getGithubClient();
    const repos = await fetchAllRepos(github, username, includePrivate);

    // Bytes por lenguaje de cada repo. En paralelo: en secuencia la respuesta
    // tardaba ~5s y el proxy de imágenes de GitHub (camo) la corta.
    const wanted = repos.filter((repo) => (includeForks || !repo.fork) && repo.language);
    const results = await Promise.all(wanted.map((repo) =>
      github.get(`/repos/${repo.owner.login}/${repo.name}/languages`)
        .then((res) => res.data)
        // Si falla, al menos contar el lenguaje principal
        .catch(() => ({ [repo.language]: 1 }))
    ));

    return tallyLanguages(results, limit);
  } catch (error) {
    throw new Error(`Failed to fetch top languages: ${error.message}`);
  }
}

// count = en cuántos repos se usa el lenguaje, no bytes: 30k líneas de un solo
// proyecto no dicen tanto como usarlo en 10 repos. Se ignora lo residual (el
// CSS suelto de un repo de Python) con un mínimo de peso dentro del repo.
const MIN_SHARE = 0.05;

export function tallyLanguages(repoLangStats, limit = 8) {
  const languages = {};
  for (const langStats of repoLangStats) {
    const repoBytes = Object.values(langStats).reduce((a, b) => a + b, 0) || 1;
    for (const [lang, bytes] of Object.entries(langStats)) {
      if (bytes / repoBytes < MIN_SHARE) continue;
      languages[lang] = (languages[lang] || 0) + 1;
    }
  }

  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([lang, count]) => ({ language: lang, count }));
}
