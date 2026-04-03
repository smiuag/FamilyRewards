# Pendientes FamilyRewards

## 🔴 Urgente — Deploy Vercel
- Verificar que https://family-rewards-zeta.vercel.app funciona tras el fix del middleware.ts
- Si sigue fallando, revisar los logs de build en Vercel dashboard
- El fix: se creó `apps/web/middleware.ts` con default export (el antiguo proxy.ts no lo reconocía Vercel)

## 🟡 Plugin Vercel en Claude Code
- Diego instaló `npx plugins add vercel/vercel-plugin` pero necesita reiniciar Claude Code para activarlo
- Una vez activo, Claude puede ver logs de deploy y redesplegar directamente

## 🟡 APK de pruebas (TWA)
Pasos pendientes una vez el deploy de Vercel funcione:
1. Añadir `manifest.json` y meta PWA a la web (iconos, theme-color, display: standalone)
2. Instalar Bubblewrap: `npm i -g @bubblewrap/cli`
3. `bubblewrap init --manifest https://family-rewards-zeta.vercel.app/manifest.json`
4. `bubblewrap build` → genera el .apk
5. Necesita Java 11+ y Android SDK (Bubblewrap puede descargarlos)

## 🟢 Mejoras pendientes de la maqueta
- [ ] Botones sin handler pendientes de revisar (tras las correcciones de admin, quedan por comprobar: profile edit, settings save, board pin/delete mensajes)
- [ ] El multiplicador activo debería mostrarse también en la vista de Tareas junto a cada tarea afectada
- [ ] Admin/Stats — página existe pero podría enriquecerse con los datos de reports
- [ ] Eliminar o deprecar `proxy.ts` una vez confirmado que middleware.ts funciona en producción
