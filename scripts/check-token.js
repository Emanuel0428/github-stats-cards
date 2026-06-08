import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Enmascara un token mostrando solo prefijo y longitud, nunca el valor completo.
function maskToken(token) {
  if (!token) return '(no definido)';
  return `${token.slice(0, 7)}…(${token.length} chars)`;
}

function line() {
  console.log('─'.repeat(56));
}

async function main() {
  const token = process.env.PAT_1;

  line();
  console.log('  Verificación del token de GitHub (PAT_1)');
  line();

  if (!token) {
    console.error('❌ PAT_1 no está definido en .env');
    console.error('   Copia .env.example a .env y agrega tu token.');
    process.exit(1);
  }

  console.log(`Token:            ${maskToken(token)}`);

  const github = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  let me;
  try {
    me = await github.get('/user');
  } catch (error) {
    console.error('\n❌ El token no es válido o fue revocado.');
    console.error(`   GitHub respondió: ${error.response?.status} ${error.message}`);
    process.exit(1);
  }

  const login = me.data.login;
  const scopesHeader = me.headers['x-oauth-scopes'];
  const isClassic = token.startsWith('ghp_');
  const scopes = (scopesHeader || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Tipo:             ${isClassic ? 'clásico (ghp_)' : 'fine-grained / otro'}`);
  console.log(`Dueño del token:  ${login}`);
  console.log(`Repos públicos:   ${me.data.public_repos}`);
  console.log(`Scopes:           ${scopes.length ? scopes.join(', ') : '(ninguno)'}`);
  line();

  const hasRepoScope = scopes.includes('repo');
  const hasReadUser = scopes.includes('read:user') || scopes.includes('user');

  // Para tokens fine-grained el header de scopes viene vacío; en ese caso
  // probamos el acceso real consultando los repos privados directamente.
  let canSeePrivate = hasRepoScope;
  let privateCount = null;
  try {
    const all = await github.get(
      '/user/repos?per_page=100&visibility=all&affiliation=owner'
    );
    privateCount = all.data.filter((r) => r.private).length;
    if (privateCount > 0) canSeePrivate = true;
  } catch (error) {
    // sin permiso para listar repos privados
  }

  const checks = [];
  if (isClassic) {
    checks.push([
      hasRepoScope,
      "scope 'repo' (necesario para repos PRIVADOS)",
    ]);
    checks.push([hasReadUser, "scope 'read:user'"]);
  } else {
    checks.push([
      canSeePrivate || privateCount !== null,
      'acceso a repositorios (fine-grained: Repository → Contents/Metadata)',
    ]);
  }

  console.log('Comprobaciones:');
  for (const [ok, label] of checks) {
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
  }

  if (privateCount !== null) {
    console.log(`\nRepos privados visibles para este token: ${privateCount}`);
  }
  line();

  if (canSeePrivate) {
    console.log('✅ El token PUEDE leer repos privados.');
    console.log('   Llama a la API con includePrivate=true para incluirlos.');
    process.exit(0);
  } else {
    console.log('⚠️  El token NO puede leer repos privados.');
    if (isClassic) {
      console.log("   → Edita el token y marca el scope 'repo':");
    } else {
      console.log('   → Otorga acceso de lectura a los repositorios privados:');
    }
    console.log('     https://github.com/settings/tokens');
    process.exit(2);
  }
}

main().catch((error) => {
  console.error('Error inesperado:', error.message);
  process.exit(1);
});
