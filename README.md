# 🚀 GitHub Stats Cards

Generador de tarjetas SVG dinámicas con estadísticas de GitHub. Diseño futurista con efectos de neón y gradientes.

## ✨ Características

- 📊 Tarjeta de estadísticas (stars, commits, PRs, issues, contribuciones)
- 🔤 Tarjeta de lenguajes más usados con barras animadas
- 🎨 Diseño cyberpunk con efectos de glow y gradientes
- ⚡ Generación dinámica en tiempo real
- 🔄 Cache automático de 1 hora
- 📱 Responsive y listo para usar en README

## 🖼️ Preview

```markdown
![GitHub Stats](https://tu-dominio.vercel.app/stats?username=tu_usuario)
![Top Languages](https://tu-dominio.vercel.app/top-languages?username=tu_usuario)
```

## 🛠️ Instalación Local

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/github-stats-personal.git
cd github-stats-personal
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Edita `.env` y añade tu token de GitHub:
```env
PAT_1=ghp_tu_token_aqui
PORT=3000
```

> 💡 Crea tu token en [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
> 
> Permisos necesarios: `public_repo`, `read:user`

5. Inicia el servidor:
```bash
npm start
```

## 🚀 Deploy en Vercel

1. Haz fork del repositorio
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Añade la variable de entorno `PAT_1` con tu token de GitHub
4. Deploy automático ✨

## 📖 Uso

### Tarjeta de Estadísticas
```
https://tu-dominio.vercel.app/stats?username=USUARIO
```

### Tarjeta de Lenguajes
```
https://tu-dominio.vercel.app/top-languages?username=USUARIO
```

### En tu README.md
```markdown
![GitHub Stats](https://tu-dominio.vercel.app/stats?username=tu_usuario)
![Top Languages](https://tu-dominio.vercel.app/top-languages?username=tu_usuario)
```

## 🎨 Personalización

Los colores y estilos se pueden modificar en:
- `src/cards/stats.js` - Tarjeta de estadísticas
- `src/cards/topLanguages.js` - Tarjeta de lenguajes

## 🏗️ Estructura del Proyecto

```
├── src/
│   ├── cards/
│   │   ├── stats.js           # Tarjeta de estadísticas
│   │   └── topLanguages.js    # Tarjeta de lenguajes
│   ├── utils/
│   │   ├── github.js          # API de GitHub
│   │   └── rank.js            # Sistema de ranking
│   ├── public/
│   │   └── index.html         # Página de inicio
│   └── server.js              # Servidor Express
├── .env                       # Variables de entorno
├── package.json
└── vercel.json               # Configuración de Vercel
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - siéntete libre de usar este proyecto para lo que quieras.

## 🙏 Créditos

Inspirado en [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) con un diseño completamente renovado.
