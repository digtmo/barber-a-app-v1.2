# Configuración de subdominios (dani.tubarber.com)

Para que **dani.tubarber.com** (y cualquier barbero) funcione en lugar de **www.tubarber.com/dani**, hay que configurar el dominio wildcard en Vercel y en GoDaddy.

## 1. Vercel – Añadir dominio wildcard

1. Entra a [vercel.com](https://vercel.com) → tu proyecto → **Settings** → **Domains**.
2. Añade el dominio raíz si no está: `tubarber.com` y `www.tubarber.com`.
3. **Añade el wildcard:** `*.tubarber.com`  
   Así, `dani.tubarber.com`, `carlos.tubarber.com`, etc. apuntan a esta app.
4. En **Environment Variables** del proyecto, define:
   - `BARBER_DOMAIN` = `tubarber.com`
   - `NEXT_PUBLIC_BARBER_DOMAIN` = `tubarber.com`

## 2. GoDaddy – DNS

1. Entra a GoDaddy → tu dominio **tubarber.com** → **Administrar DNS** (o **DNS**).
2. Añade un registro **CNAME**:
   - **Nombre/Host:** `*` (asterisco = wildcard).
   - **Valor/Apuntar a:** `cname.vercel-dns.com` (o el que indique Vercel al añadir `*.tubarber.com`).
3. Guarda. La propagación puede tardar unos minutos o hasta 48 h.

## 3. Comportamiento esperado

- **tubarber.com** o **www.tubarber.com** → landing (registro / acceso).
- **tubarber.com/dani** o **www.tubarber.com/dani** → redirección a **dani.tubarber.com**.
- **dani.tubarber.com** → agenda del barbero (clientes pueden agendar).
- **dani.tubarber.com/acceso** → login del barbero.
- **tubarber.com/acceso** → formulario “nombre de barbería” → redirige a **dani.tubarber.com/acceso**.

Si `*.tubarber.com` no está en Vercel y en el DNS, al entrar en **dani.tubarber.com** el navegador no llegará a esta app y seguirás viendo **www.tubarber.com/dani** o un error.
