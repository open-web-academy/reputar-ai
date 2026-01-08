import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  IDENTITY_REGISTRY_ADDRESS, 
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ADDRESS,
  REPUTATION_REGISTRY_ABI
} from '../utils/contracts';
import { useNetwork } from '../contexts/NetworkContext';
import { getNetworkRpcUrl, getNetworkName } from '../utils/networks';

export interface AgentMetadata {
  name: string;
  description: string;
  image?: string;
  imageUrl?: string; // Alias para image (procesado con gateway)
  endpoints: string[];
  capabilities?: string[];
  tags?: string[];
  metadataFailed?: boolean; // Flag para indicar que el fetch de IPFS falló
  metadataError?: string; // Mensaje de error si falló
  [key: string]: any; // Allow additional fields
}

export interface Agent {
  id: number; // ID numérico del agente
  tokenId: string; // ID como string (alias)
  owner: string; // Wallet del owner (on-chain)
  reputation: number; // Score de reputación on-chain (0-100)
  reputationScore: number | null; // Alias para reputation
  reputationCount: number; // Número de calificaciones recibidas
  name: string; // Nombre del agente (IPFS)
  description: string; // Descripción del agente (IPFS)
  imageUrl: string | undefined; // URL de la imagen procesada con gateway (IPFS)
  endpoints: string[]; // Endpoints del agente (IPFS)
  metadataURI: string; // URI original del metadata
  metadata: AgentMetadata; // Metadata completo (nunca null)
}

interface UseFetchAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Lista de gateways IPFS rápidos (en orden de preferencia)
 */
const IPFS_GATEWAYS = [
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/' // Fallback tradicional
];

/**
 * Helper para convertir URI de IPFS a URL HTTP de gateway público
 * Usa múltiples gateways para mayor resiliencia
 * 
 * @param uri - URI que puede ser ipfs://, http://, o https://
 * @param gatewayIndex - Índice del gateway a usar (para round robin)
 * @returns URL HTTP procesada
 */
function getIpfsUrl(uri: string, gatewayIndex: number = 0): string {
  if (!uri || uri.trim() === '') {
    return '';
  }
  
  // Si ya es HTTP/HTTPS, retornar tal cual
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  // Extraer hash IPFS
  let hash = '';
  if (uri.startsWith('ipfs://')) {
    hash = uri.replace('ipfs://', '').trim();
  } else if (uri.startsWith('Qm') || uri.startsWith('baf')) {
    // Si no tiene prefijo, asumir que es un hash IPFS
    hash = uri.trim();
  } else {
    // Retornar tal cual si no se puede procesar
    return uri;
  }
  
  // Usar gateway seleccionado (con round robin)
  const selectedGateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  return `${selectedGateway}${hash}`;
}

/**
 * Intenta descargar metadata desde múltiples gateways IPFS
 * 
 * @param uri - URI original (ipfs:// o http://)
 * @param agentId - ID del agente para logging
 * @returns Metadata del agente o null si todos los gateways fallan
 */
async function fetchMetadataFromGateways(uri: string, agentId: string): Promise<any | null> {
  // Si ya es HTTP, intentar directamente
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const finalUrl = uri;
    console.log(`🔍 [Agent #${agentId}] Intentando descargar metadata de: ${finalUrl}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(finalUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ [Agent #${agentId}] Metadata descargado exitosamente desde ${finalUrl}`);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error(`❌ [Agent #${agentId}] Error descargando desde ${finalUrl}:`, error.message);
      return null;
    }
  }
  
  // Si es IPFS, intentar múltiples gateways
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    const finalUrl = getIpfsUrl(uri, i);
    console.log(`🔍 [Agent #${agentId}] Intentando descargar metadata de gateway ${i + 1}/${IPFS_GATEWAYS.length}: ${finalUrl}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos por gateway
      
      const response = await fetch(finalUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ [Agent #${agentId}] Metadata descargado exitosamente desde ${finalUrl}`);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.warn(`⚠️ [Agent #${agentId}] Gateway ${i + 1} falló (${finalUrl}):`, error.message);
      // Continuar al siguiente gateway
      continue;
    }
  }
  
  // Todos los gateways fallaron
  console.error(`❌ [Agent #${agentId}] Todos los gateways IPFS fallaron para ${uri}`);
  return null;
}

/**
 * Obtiene los metadatos de un agente desde su URI (IPFS)
 * 
 * CRÍTICO: Si el fetch falla o el JSON es inválido, NO descarta al agente.
 * Retorna metadata con datos "Raw" (name: "Unknown", metadataFailed: true)
 * para que el agente se muestre aunque su IPFS esté caído.
 * 
 * @param uri - URI del metadata (ipfs:// o http://)
 * @param agentId - ID del agente para logging
 * @returns Metadata del agente (nunca null, siempre retorna un objeto)
 */
async function fetchAgentMetadata(uri: string, agentId: string): Promise<AgentMetadata> {
  // Si no hay URI, retornar metadata vacío con flag de fallo
  if (!uri || uri.trim() === '') {
    console.warn(`⚠️ [Agent #${agentId}] Empty URI, using default metadata`);
    return {
      name: 'Unknown',
      description: '',
      image: undefined,
      endpoints: [],
      metadataFailed: true,
      metadataError: 'Empty URI'
    };
  }

  // Intentar descargar desde múltiples gateways
  const data = await fetchMetadataFromGateways(uri, agentId);
  
  // Si todos los gateways fallaron, retornar metadata con datos "Raw"
  if (!data) {
    console.warn(`⚠️ [Agent #${agentId}] Todos los gateways fallaron, retornando metadata parcial`);
    return {
      name: `Agent #${agentId} (Metadata Error)`,
      description: 'Could not load metadata from IPFS.',
      image: undefined,
      endpoints: [],
      metadataFailed: true,
      metadataError: 'All IPFS gateways failed'
    };
  }
  
  // Procesar metadata del JSON exitosamente descargado
  const metadata: AgentMetadata = {
    name: 'Unknown',
    description: '',
    endpoints: []
  };
  
  // Name
  if (data.name !== undefined && data.name !== null && data.name !== '') {
    metadata.name = String(data.name);
  }
  
  // Description
  if (data.description !== undefined && data.description !== null && data.description !== '') {
    metadata.description = String(data.description);
  }
  
  // Image (procesar con gateway)
  if (data.image !== undefined && data.image !== null && data.image !== '') {
    metadata.image = getIpfsUrl(String(data.image));
    metadata.imageUrl = metadata.image; // Alias
  }
  
  // Endpoints
  if (data.endpoints !== undefined && Array.isArray(data.endpoints)) {
    metadata.endpoints = data.endpoints.map((ep: any) => String(ep));
  } else if (data.endpoint !== undefined) {
    metadata.endpoints = [String(data.endpoint)];
  } else if (data.api_url !== undefined) {
    metadata.endpoints = [String(data.api_url)];
  } else if (data.url !== undefined) {
    metadata.endpoints = [String(data.url)];
  } else {
    metadata.endpoints = [];
  }
  
  // Capabilities/Tags
  if (data.capabilities !== undefined && Array.isArray(data.capabilities)) {
    metadata.capabilities = data.capabilities.map((cap: any) => String(cap));
  } else if (data.tags !== undefined && Array.isArray(data.tags)) {
    metadata.capabilities = data.tags.map((tag: any) => String(tag));
  }
  
  // Preservar otros campos del JSON
  Object.keys(data).forEach(key => {
    if (!['name', 'description', 'image', 'capabilities', 'tags', 'endpoints', 'endpoint', 'api_url', 'url'].includes(key)) {
      metadata[key] = data[key];
    }
  });
  
  console.log(`✓ [Agent #${agentId}] Metadata procesado exitosamente`);
  return metadata;
}

/**
 * Hook personalizado para obtener la lista de agentes del contrato ERC-8004 v1.0
 * Usa totalAgents() para obtener el conteo y procesa todos los agentes en paralelo con Promise.all
 * Soporta múltiples redes (Multi-Chain)
 */
export function useFetchAgents(): UseFetchAgentsReturn {
  const { currentNetworkId } = useNetwork();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Función auxiliar para detectar si un error es de token inexistente
   */
  function isNonexistentTokenError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorReason = error?.reason?.toLowerCase() || '';
    const errorData = error?.data?.toLowerCase() || '';
    
    const definitiveKeywords = [
      'revert',
      'nonexistent',
      'invalid token',
      'query for nonexistent',
      'erc721: invalid token id',
      'token does not exist',
      'invalid token id',
      'token not found',
      'owner query for nonexistent token'
    ];
    
    const fullErrorText = `${errorMessage} ${errorReason} ${errorData}`.toLowerCase();
    
    return definitiveKeywords.some(keyword => fullErrorText.includes(keyword));
  }

  /**
   * Función helper de reintento con backoff para llamadas a blockchain
   * 
   * Si la llamada falla y el error NO es "nonexistent token", espera y reintenta.
   * Si el error ES "nonexistent token", lanza el error inmediatamente (no reintenta).
   * 
   * @param fn - Función que retorna una Promise (la llamada a blockchain)
   * @param retries - Número de reintentos (default: 3)
   * @param baseDelay - Delay base en ms para backoff exponencial (default: 1000ms)
   * @returns Resultado de la llamada exitosa
   */
  async function retryBlockchainCall<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Si es error de token inexistente, NO reintentar - lanzar inmediatamente
        if (isNonexistentTokenError(error)) {
          console.log(`🔍 Token inexistente detectado, no reintentando`);
          throw error;
        }
        
        // Si es el último intento, lanzar el error
        if (attempt === retries - 1) {
          console.error(`❌ Agotados los ${retries} intentos, último error:`, error.message);
          throw error;
        }
        
        // Calcular delay con backoff exponencial: 1s, 2s, 4s...
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`⚠️ Error en llamada blockchain (intento ${attempt + 1}/${retries}), reintentando en ${delay}ms...`, error.message);
        
        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Esto no debería ejecutarse, pero TypeScript lo requiere
    throw lastError;
  }

  /**
   * Función auxiliar para procesar un agente individual
   * Realiza las 3 llamadas on-chain y resuelve metadata IPFS
   * 
   * CRÍTICO: Si el token existe en blockchain, SIEMPRE retorna un Agent válido,
   * incluso si IPFS falla. Solo retorna null si el token no existe.
   * 
   * Usa reintentos con backoff para manejar errores de red/CORS del RPC.
   */
  async function processAgent(
    agentId: number,
    identityRegistry: ethers.Contract,
    reputationRegistry: ethers.Contract
  ): Promise<Agent | null> {
    let owner: string = '';
    let uri: string = '';
    let reputation: number = 0;
    let reputationCount: number = 0;
    
    try {
      // PASO B: Hidratación de Datos (3 llamadas on-chain con reintentos)
      
      // 1. Identity: ownerOf(id) -> Obtener la wallet (PRIMERO para verificar existencia)
      // Envuelto en retryBlockchainCall para manejar errores de red/CORS
      owner = await retryBlockchainCall(
        () => identityRegistry.ownerOf(agentId),
        3,
        1000
      );
      
      // 2. Identity: tokenURI(id) -> Obtener "ipfs://..."
      // Envuelto en retryBlockchainCall para manejar errores de red/CORS
      uri = await retryBlockchainCall(
        () => identityRegistry.tokenURI(agentId),
        3,
        1000
      );
      
      // 3. Reputation: getSummary(id...) -> Obtener el score
      // Envuelto en retryBlockchainCall, pero si falla no es crítico (usamos valores por defecto)
      try {
        const emptyAddressArray: string[] = [];
        const zeroBytes32 = ethers.ZeroHash;
        
        const summary = await retryBlockchainCall(
          () => reputationRegistry.getSummary(
            agentId,
            emptyAddressArray,
            zeroBytes32,
            zeroBytes32
          ),
          3,
          1000
        );
        
        reputationCount = Number(summary.count);
        reputation = Number(summary.averageScore);
      } catch (reputationError: any) {
        // Si no hay reputación o falla después de reintentos, usar valores por defecto
        // Esto NO es crítico, el agente puede existir sin reputación
        console.warn(`⚠️ [Agent #${agentId}] Could not fetch reputation after retries:`, reputationError.message);
        reputation = 0;
        reputationCount = 0;
      }
      
    } catch (error: any) {
      // Si es error de token inexistente, retornar null
      if (isNonexistentTokenError(error)) {
        return null;
      }
      // Otro tipo de error en blockchain después de todos los reintentos
      // Esto puede ser un error de red persistente o un problema con el RPC
      console.error(`❌ [Agent #${agentId}] Error en llamadas blockchain después de reintentos:`, error.message);
      return null;
    }
    
    // Si llegamos aquí, el token existe en blockchain
    // Ahora intentar obtener metadata IPFS (con fallback robusto)
    let metadata: AgentMetadata;
    
    try {
      // PASO C: Resolución de Metadata (IPFS) - ENVUELTO EN TRY/CATCH
      metadata = await fetchAgentMetadata(uri, agentId.toString());
    } catch (metadataError: any) {
      // CRÍTICO: Si el fetch de metadata falla, NO cancelar el agente
      // Retornar "Agente Parcial" con los datos que SÍ tenemos de blockchain
      console.error(`❌ [Agent #${agentId}] Error crítico en fetchAgentMetadata:`, metadataError.message);
      console.log(`⚠️ [Agent #${agentId}] Retornando agente parcial con datos blockchain únicamente`);
      
      metadata = {
        name: `Agent #${agentId} (Metadata Error)`,
        description: 'Could not load metadata from IPFS.',
        image: undefined,
        endpoints: [],
        metadataFailed: true,
        metadataError: metadataError.message
      };
    }
    
    // PASO D: Unificación - Retornar objeto unificado
    // SIEMPRE retornamos un Agent válido si el token existe
    return {
      id: agentId,
      tokenId: agentId.toString(),
      owner: owner,
      reputation: reputation,
      reputationScore: reputation, // Alias
      reputationCount: reputationCount,
      name: metadata.name || `Agent #${agentId}`,
      description: metadata.description || '',
      imageUrl: metadata.image || metadata.imageUrl || undefined,
      endpoints: metadata.endpoints || [],
      metadataURI: uri,
      metadata: metadata
    };
  }

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAgents([]); // Limpiar agentes anteriores

    try {
      // Obtener configuración de la red actual
      const rpcUrl = getNetworkRpcUrl(currentNetworkId);
      const networkName = getNetworkName(currentNetworkId);
      
      if (!rpcUrl) {
        throw new Error(`No RPC URL configured for network ${currentNetworkId}`);
      }

      // LOG CRÍTICO: Verificar que realmente estamos usando la URL correcta
      console.log(`🌐 [NETWORK SWITCH] Switching to ${networkName} (Chain ID: ${currentNetworkId})`);
      console.log(`🔗 [RPC URL] Using RPC: ${rpcUrl}`);
      console.log(`🔍 Starting hybrid agent discovery on ${networkName} (Chain ID: ${currentNetworkId})...`);
      
      // Crear provider para la red seleccionada (NUEVO provider cada vez)
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Verificar que el provider está conectado a la red correcta
      try {
        const network = await provider.getNetwork();
        console.log(`✅ [PROVIDER VERIFIED] Provider connected to Chain ID: ${network.chainId.toString()}`);
        if (Number(network.chainId) !== currentNetworkId) {
          console.warn(`⚠️ [WARNING] Provider chain ID (${network.chainId}) does not match selected network (${currentNetworkId})`);
        }
      } catch (networkError: any) {
        console.warn(`⚠️ [WARNING] Could not verify provider network:`, networkError.message);
      }
      
      // Crear instancias de los contratos
      const identityRegistry = new ethers.Contract(
        IDENTITY_REGISTRY_ADDRESS,
        IDENTITY_REGISTRY_ABI,
        provider
      );

      const reputationRegistry = new ethers.Contract(
        REPUTATION_REGISTRY_ADDRESS,
        REPUTATION_REGISTRY_ABI,
        provider
      );

      // ========================================================================
      // LOG DE VERDAD ABSOLUTA: Ver qué dice el contrato realmente
      // ========================================================================
      try {
        // Intentar obtener la URL de conexión del provider (método interno de ethers)
        let connectionUrl = rpcUrl;
        try {
          const connection = (provider as any)._getConnection?.();
          if (connection?.url) {
            connectionUrl = connection.url;
          }
        } catch {
          // Si no está disponible, usar la URL que pasamos
          connectionUrl = rpcUrl;
        }
        
        console.log(`📡 [VERDAD ABSOLUTA] Conectando a ${connectionUrl}...`);
        const rawCount = await identityRegistry.totalAgents();
        console.log(`🔥 [VERDAD ABSOLUTA] El contrato dice que hay: ${rawCount.toString()} agentes.`);
      } catch (e: any) {
        console.error(`💀 [VERDAD ABSOLUTA] ERROR CRÍTICO: No pude leer totalAgents(). Causa:`, e.message || e);
      }

      let agents: Agent[] = [];
      let totalCount: number | null = null;

      // ========================================================================
      // PLAN A: Intento Optimizado (totalAgents)
      // ========================================================================
      try {
        console.log(`📊 [Plan A] [NETWORK: ${currentNetworkId}] Attempting to call totalAgents() on ${IDENTITY_REGISTRY_ADDRESS}...`);
        const totalAgentsResult = await identityRegistry.totalAgents();
        totalCount = Number(totalAgentsResult);
        
        console.log(`✓ [Plan A] [NETWORK: ${currentNetworkId}] Found ${totalCount} agents via totalAgents()`);
        
        // Si no hay agentes, retornar inmediatamente
        if (totalCount === 0) {
          console.log(`📭 [NETWORK: ${currentNetworkId}] No agents found on ${networkName}, returning empty list`);
          setAgents([]);
          setLoading(false);
          return;
        }

        // Procesar todos los agentes en paralelo
        console.log(`🚀 [Plan A] [NETWORK: ${currentNetworkId}] Processing ${totalCount} agents in parallel on ${networkName}...`);
        
        const agentPromises: Promise<Agent | null>[] = [];
        
        for (let agentId = 1; agentId <= totalCount; agentId++) {
          agentPromises.push(processAgent(agentId, identityRegistry, reputationRegistry));
        }

        const results = await Promise.all(agentPromises);
        agents = results.filter((agent): agent is Agent => agent !== null);
        
        console.log(`✅ [Plan A] [NETWORK: ${currentNetworkId}] Successfully loaded ${agents.length} valid agents from ${networkName}`);
        
      } catch (planAError: any) {
        // PLAN A falló - capturar silenciosamente y usar PLAN B
        console.warn(`⚠️ [Plan A] [NETWORK: ${currentNetworkId}] Failed: ${planAError.message}`);
        console.log(`🔄 [Plan B] [NETWORK: ${currentNetworkId}] Falling back to manual discovery mode on ${networkName}...`);
        
        // ========================================================================
        // PLAN B: Descubrimiento Manual (fuerza bruta)
        // ========================================================================
        const MAX_ATTEMPTS = 50; // Límite de seguridad
        const foundAgents: Agent[] = [];
        
        for (let agentId = 1; agentId <= MAX_ATTEMPTS; agentId++) {
          try {
            console.log(`🔎 [Plan B] Checking Agent #${agentId}...`);
            
            const agent = await processAgent(agentId, identityRegistry, reputationRegistry);
            
            if (agent) {
              foundAgents.push(agent);
              console.log(`✓ [Plan B] Found Agent #${agentId}`);
            } else {
              // Token no existe - romper el bucle
              console.log(`❌ [Plan B] Agent #${agentId} does not exist, stopping discovery`);
              break;
            }
          } catch (error: any) {
            // Si es error de token inexistente, romper el bucle
            if (isNonexistentTokenError(error)) {
              console.log(`❌ [Plan B] Agent #${agentId} does not exist (error: ${error.message}), stopping discovery`);
            break;
            }
            // Otro tipo de error - continuar
            console.warn(`⚠️ [Plan B] Error checking Agent #${agentId}:`, error.message);
          }
        }
        
        agents = foundAgents;
        console.log(`✅ [Plan B] [NETWORK: ${currentNetworkId}] Successfully loaded ${agents.length} agents via manual discovery from ${networkName}`);
      }

      // Solo filtrar los nulos técnicos (tokens que no existen)
      // NO filtrar por metadata fallida - queremos ver la "verdad cruda" de la blockchain
      const validResults = agents.filter((agent): agent is Agent => agent !== null);
      
      console.log(`📊 [RAW BLOCKCHAIN DATA] Showing ${validResults.length} agents from ${networkName} (including agents with failed metadata)`);

      // Actualizar estado con TODOS los agentes (sin filtrado estricto)
      setAgents(validResults);

    } catch (err: any) {
      console.error('❌ Error crítico fetching agents:', err);
      setError(err.message || 'Failed to fetch agents');
      setAgents([]);
    } finally {
      setLoading(false);
      console.log(`🏁 [NETWORK: ${currentNetworkId}] Proceso de carga finalizado`);
    }
  }, [currentNetworkId]); // CRÍTICO: Incluir currentNetworkId en las dependencias

  // CRÍTICO: Cuando cambia el networkId, recargar los agentes
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents, currentNetworkId]);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents
  };
}

