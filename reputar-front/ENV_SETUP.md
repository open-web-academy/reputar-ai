# Environment Variables Setup

## Pinata IPFS Configuration

Para usar el registro de agentes con IPFS, necesitas configurar las credenciales de Pinata.

### Pasos:

1. Obtén tus API keys de Pinata:
   - Ve a https://app.pinata.cloud/keys
   - Crea un nuevo par de keys (API Key y Secret API Key)

2. Crea un archivo `.env.local` en la raíz del proyecto `reputar-front/` con el siguiente contenido:

```env
# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_API_KEY=your_pinata_secret_api_key_here
```

3. Reemplaza `your_pinata_api_key_here` y `your_pinata_secret_api_key_here` con tus keys reales.

4. **IMPORTANTE:** Nunca commitees el archivo `.env.local` al repositorio. Está en `.gitignore` por seguridad.

### Variables Requeridas:

- `NEXT_PUBLIC_PINATA_API_KEY`: Tu Pinata API Key (pública)
- `NEXT_PUBLIC_PINATA_SECRET_API_KEY`: Tu Pinata Secret API Key (mantén esto en secreto)

### Nota:

Las variables que empiezan con `NEXT_PUBLIC_` son expuestas al cliente. Asegúrate de que tus keys de Pinata tengan los permisos apropiados y considera usar keys con permisos limitados para producción.

