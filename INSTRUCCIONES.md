# 📋 Instrucciones para Iniciar Reputar AI

Este documento contiene las instrucciones paso a paso para iniciar y ejecutar el proyecto Reputar AI.

## 📌 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** versión 18 o superior
- **npm** (viene incluido con Node.js)
- Un navegador web moderno (Chrome, Firefox, Edge, Safari)
- (Opcional) Una wallet Web3 como MetaMask o Coinbase Wallet

### Verificar Instalación

Abre una terminal y verifica que tienes Node.js instalado:

```bash
node --version
# Debe mostrar v18.x.x o superior

npm --version
# Debe mostrar 9.x.x o superior
```

## 🚀 Pasos para Iniciar el Proyecto

### Paso 1: Navegar al Directorio del Frontend

Abre una terminal y navega a la carpeta del frontend:

```bash
cd reputar-front
```

### Paso 2: Instalar Dependencias

Instala todas las dependencias necesarias del proyecto:

```bash
npm install
```

**Nota:** Este proceso puede tardar varios minutos la primera vez. Asegúrate de tener conexión a internet.

### Paso 3: Iniciar el Servidor de Desarrollo

Una vez instaladas las dependencias, inicia el servidor de desarrollo:

```bash
npm run dev
```

### Paso 4: Abrir en el Navegador

El servidor se iniciará y verás un mensaje similar a:

```
  ▲ Next.js 16.0.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
```

Abre tu navegador web y visita:

**http://localhost:3000**

## 🎮 Uso de la Aplicación

### Interfaz Principal

Al abrir la aplicación, verás una interfaz estilo Windows 98 con:

- **Iconos en el Escritorio**: Diferentes funcionalidades disponibles
- **Barra de Tareas**: En la parte inferior con el menú "Start"
- **Ventanas**: Puedes abrir múltiples ventanas y moverlas

### Funcionalidades Disponibles

1. **Connect Wallet** 🔐
   - Conecta tu wallet Web3 (MetaMask, Coinbase Wallet, etc.)
   - Necesario para realizar transacciones

2. **Reputation Hub** 📊
   - Visualiza el leaderboard de agentes
   - Muestra reputaciones y calificaciones

3. **Register Agent** 🤖
   - Registra un nuevo agente de IA en la blockchain
   - Requiere wallet conectada

4. **Submit Rating** ⭐
   - Califica agentes de IA (rango: -100 a 100)
   - Requiere wallet conectada

5. **AI Agents List** 📋
   - Visualiza todos los agentes registrados en el contrato ERC-8004
   - Conectado a Arbitrum Sepolia
   - **No requiere wallet conectada** (solo lectura)

### Conectar Wallet

1. Haz clic en el icono "Connect Wallet" en el escritorio
2. Selecciona tu wallet preferida:
   - **MetaMask**: Si tienes la extensión instalada
   - **Coinbase Wallet**: Si tienes Coinbase Wallet instalado
   - **Other**: Para otras wallets compatibles
3. Acepta la conexión en tu wallet
4. ¡Listo! Tu dirección aparecerá en la barra de tareas

## 🔧 Comandos Disponibles

### Desarrollo

```bash
npm run dev
```
Inicia el servidor de desarrollo con hot-reload (recarga automática al guardar cambios).

### Producción

```bash
npm run build
```
Compila el proyecto para producción.

```bash
npm start
```
Inicia el servidor de producción (requiere ejecutar `npm run build` primero).

### Linting

```bash
npm run lint
```
Ejecuta el linter para verificar errores de código.

## 🌐 Redes Soportadas

La aplicación puede conectarse a diferentes redes blockchain:

- **Base Sepolia** (Chain ID: 84532) - Para registro de agentes
- **Arbitrum Sepolia** (Chain ID: 421614) - Para visualizar agentes ERC-8004
- Otras redes EVM compatibles

### Cambiar de Red

Si necesitas cambiar de red:

1. Haz clic en tu dirección de wallet en la barra de tareas
2. Selecciona "Switch to [Red]" si aparece la opción
3. O cambia manualmente en tu wallet

## 🐛 Solución de Problemas

### Error: "Cannot find module"

**Solución:** Ejecuta `npm install` nuevamente en la carpeta `reputar-front`.

### Error: "Port 3000 is already in use"

**Solución:** 
- Cierra otras aplicaciones que usen el puerto 3000
- O cambia el puerto: `npm run dev -- -p 3001`

### La wallet no se conecta

**Solución:**
- Asegúrate de tener una extensión de wallet instalada (MetaMask, Coinbase Wallet)
- Verifica que la extensión esté activada
- Revisa la consola del navegador (F12) para ver errores

### No se cargan los agentes

**Solución:**
- Verifica tu conexión a internet
- Los agentes se cargan desde Arbitrum Sepolia, puede tardar unos segundos
- Revisa la consola del navegador para errores específicos

### Error de compilación

**Solución:**
- Elimina `node_modules` y `package-lock.json`
- Ejecuta `npm install` nuevamente
- Si persiste, verifica que tienes Node.js 18+

## 📁 Estructura del Proyecto

```
reputar-ai/
├── reputar-front/          # Frontend (Next.js)
│   ├── app/                # Páginas y layouts
│   ├── components/          # Componentes React
│   ├── hooks/              # Hooks personalizados
│   ├── contexts/           # Contextos de React
│   ├── utils/              # Utilidades y configuraciones
│   └── public/             # Archivos estáticos
└── contracts/              # Contratos inteligentes (Hardhat)
```

## 🔗 Enlaces Útiles

- **Next.js Docs**: https://nextjs.org/docs
- **Ethers.js Docs**: https://docs.ethers.org/
- **MetaMask**: https://metamask.io/
- **Coinbase Wallet**: https://www.coinbase.com/wallet

## 📞 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador (F12 → Console)
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de estar usando Node.js 18+
4. Revisa este documento de instrucciones

## ✅ Checklist de Inicio Rápido

- [ ] Node.js 18+ instalado
- [ ] Navegador web moderno
- [ ] Navegado a `reputar-front`
- [ ] Ejecutado `npm install`
- [ ] Ejecutado `npm run dev`
- [ ] Abierto http://localhost:3000
- [ ] (Opcional) Wallet Web3 instalada

---

**¡Listo para usar!** 🎉

Si todo está correcto, deberías ver la interfaz estilo Windows 98 funcionando correctamente.

