# Plan: PWA + Accesibilidad WCAG 2.2

## Contexto
FamilyRewards necesita convertirse en PWA instalable (Android/iOS) y cumplir WCAG 2.2 nivel AA.

---

## Fase 1: PWA Core — COMPLETADA

- [x] 1.1 Generar iconos (192, 512, maskable, apple-icon, favicon) desde icon-family.png
- [x] 1.2 Crear `app/manifest.ts` con MetadataRoute.Manifest
- [x] 1.3 Metadata PWA en `app/layout.tsx` (applicationName, appleWebApp, formatDetection)
- [x] 1.4 Viewport export en `app/[locale]/layout.tsx` (themeColor, viewportFit)
- [x] 1.5 Service Worker (`public/sw.js`) — cache-first assets, network-first navigation, push ready
- [x] 1.6 ServiceWorkerRegistration.tsx + incluido en locale layout
- [x] 1.7 Headers de seguridad en `next.config.ts`
- [x] 1.8 Página offline (`/offline`)

## Fase 2: Accesibilidad WCAG 2.2 AA — COMPLETADA

- [x] 2.1 Formularios: htmlFor/id en TODOS los pares Label+Input (auth, settings, profile, onboarding, admin tasks/rewards/challenges, board)
- [x] 2.2 autoComplete en inputs de email, password, name, postal-code
- [x] 2.3 aria-label en PIN modal input, eye toggle buttons, board textarea
- [x] 2.4 Target size 44px mínimo en dispositivos touch (@media pointer:coarse)
- [x] 2.5 Focus visible — ya existía, verificado contraste OK
- [x] 2.6 Skip-to-main i18n con useTranslations (ES/EN)
- [x] 2.7 Sonner toaster — ya usa aria-live internamente
- [x] 2.8 Emojis decorativos con aria-hidden="true" (🔍, 🎉, 🔒, avatares en sidebar)
- [x] 2.9 Accessible authentication — no hay CAPTCHAs ni puzzles
- [x] 2.10 aria-hidden en iconos decorativos (Mail, Lock, User, Star, Home)

### Pendiente a11y (mejoras futuras, no bloqueantes)
- [ ] Migrar PIN modal a Dialog de Base UI (focus trap completo)
- [ ] aria-label en selectores de emoji/avatar
- [ ] Verificar contrastes oklch con herramienta (ratios WCAG)
- [ ] aria-live para cambios dinámicos (completar tarea, etc.)

## Fase 3: APK — DOCUMENTADA

- [x] Documentado en PENDIENTES.md: Bubblewrap (TWA) para Android, Capacitor para iOS+Android futuro

---

## Verificación
- [x] `pnpm build` sin errores
- [ ] Lighthouse PWA audit >= 90 (verificar en navegador)
- [ ] Instalar PWA en Chrome → standalone mode
- [ ] Verificar iconos en DevTools → Application → Manifest
- [ ] Verificar SW registrado en DevTools → Application → Service Workers
