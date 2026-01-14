import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  REPUTATION_REGISTRY_ABI 
} from '../utils/contracts';
import { useNetwork } from '../contexts/NetworkContext';
import { getNetworkRpcUrl, getNetworkReputationRegistry, getNetworkDeploymentBlock, NETWORKS } from '../utils/networks';

export interface Review {
  client: string;
  score: number;
  tag: string;
  tag1?: string;
  tag2?: string;
  fileuri: string;
  filehash?: string;
  blockNumber?: number;
  transactionHash?: string;
}

interface UseAgentFeedbackReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function getIpfsUrl(uri: string): string {
  if (!uri || uri.trim() === '') {
    return '';
  }
  
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  let hash = '';
  if (uri.startsWith('ipfs://')) {
    hash = uri.replace('ipfs://', '').trim();
  } else if (uri.startsWith('Qm') || uri.startsWith('baf')) {
    hash = uri.trim();
  } else {
    return uri;
  }
  
  return `https://dweb.link/ipfs/${hash}`;
}
export function useAgentFeedback(agentId: number | string): UseAgentFeedbackReturn {
  const { currentNetworkId } = useNetwork();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!agentId) {
      setReviews([]);
      return;
    }

    setLoading(true);
    setError(null);
    setReviews([]);

    try {
      const rpcUrl = getNetworkRpcUrl(currentNetworkId);
      const reputationRegistryAddress = getNetworkReputationRegistry(currentNetworkId);
      
      if (!rpcUrl || !reputationRegistryAddress) {
        throw new Error(`No RPC URL or contract address configured for network ${currentNetworkId}`);
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      const reputationRegistry = new ethers.Contract(
        reputationRegistryAddress,
        REPUTATION_REGISTRY_ABI,
        provider
      );

      console.log(`📊 [Feedback] Fetching reviews for Agent #${agentId} on network ${currentNetworkId} using events...`);

      const networkConfig = NETWORKS[currentNetworkId];
      
      // Convertir agentId a BigInt para el filtro
      const agentIdBigInt = BigInt(agentId);
      
      // Obtener el bloque actual (latest)
      let latestBlock: number;
      try {
        const blockNumber = await provider.getBlockNumber();
        latestBlock = blockNumber;
        console.log(`📦 [Feedback] Current block: ${latestBlock}`);
      } catch (blockError: any) {
        console.warn(`⚠️ [Feedback] Could not get latest block, using 'latest' as fallback:`, blockError.message);
        latestBlock = -1; // Usar -1 como señal para usar 'latest' en queryFilter
      }
      
      // Calcular el fromBlock: usar los últimos 10,000 bloques o un mínimo de 7500000 para Sepolia
      // Esto evita el error "exceed maximum block range" del RPC
      let actualStartBlock: number;
      if (latestBlock > 0) {
        // Usar los últimos 10,000 bloques
        const recentStartBlock = latestBlock - 10000;
        // Para Sepolia (11155111), usar un mínimo de 7500000 si el cálculo es menor
        const minBlockForSepolia = currentNetworkId === 11155111 ? 7500000 : 0;
        actualStartBlock = Math.max(recentStartBlock, minBlockForSepolia);
        console.log(`📦 [Feedback] Using recent block range: from ${actualStartBlock} (last 10,000 blocks or min ${minBlockForSepolia})`);
      } else {
        // Fallback: usar bloque fijo para Sepolia o el deploymentBlock de la red
        if (currentNetworkId === 11155111) {
          actualStartBlock = 7500000;
          console.log(`📦 [Feedback] Using fixed start block for Sepolia: ${actualStartBlock}`);
        } else {
          actualStartBlock = networkConfig?.deploymentBlock || 0;
          console.log(`📦 [Feedback] Using deployment block: ${actualStartBlock}`);
        }
      }
      
      const actualEndBlock = latestBlock > 0 ? latestBlock : 'latest';
      const totalBlocks = latestBlock > 0 ? latestBlock - actualStartBlock : 0;
      
      console.log(`🔍 [Feedback] Fetching feedback on chain ${currentNetworkId} from block ${actualStartBlock} to ${actualEndBlock} (${totalBlocks > 0 ? totalBlocks : 'unknown'} blocks)...`);
      console.log(`🔍 [Feedback] Querying events for Agent #${agentId} (BigInt: ${agentIdBigInt})...`);

      // Función helper para hacer chunking de queries
      const queryFilterInChunks = async (
        filter: ethers.EventFilter,
        fromBlock: number,
        toBlock: number | string,
        chunkSize: number = 40000
      ): Promise<ethers.Log[]> => {
        const allResults: ethers.Log[] = [];
        
        // Si toBlock es 'latest' o un string, necesitamos obtener el número de bloque actual
        let endBlock: number;
        if (typeof toBlock === 'string') {
          // Intentar obtener latestBlock si no lo tenemos
          let currentLatestBlock = latestBlock;
          if (currentLatestBlock <= 0) {
            try {
              currentLatestBlock = await provider.getBlockNumber();
              console.log(`📦 [Feedback] Obtained current block inside chunking function: ${currentLatestBlock}`);
            } catch (blockErr: any) {
              console.warn(`⚠️ [Feedback] Could not get block number, using fallback strategy:`, blockErr.message);
              // Fallback: usar un rango reciente (últimos 40,000 bloques desde un bloque estimado)
              // Esto es mejor que fallar completamente
              try {
                const estimatedLatest = await provider.getBlockNumber();
                currentLatestBlock = estimatedLatest;
              } catch {
                // Si todo falla, usar un rango pequeño desde el startBlock
                endBlock = fromBlock + chunkSize;
                console.log(`📦 [Feedback] Using fallback range: blocks ${fromBlock} to ${endBlock}`);
              }
            }
          }
          endBlock = currentLatestBlock > 0 ? currentLatestBlock : fromBlock + chunkSize;
        } else {
          endBlock = toBlock;
        }
        
        // Si el rango es menor que chunkSize, hacer una sola query
        if (endBlock - fromBlock <= chunkSize) {
          try {
            const events = await reputationRegistry.queryFilter(filter, fromBlock, endBlock);
            console.log(`📦 [Feedback] Single chunk query: blocks ${fromBlock} to ${endBlock} (${events.length} events)`);
            return events;
          } catch (err: any) {
            console.warn(`⚠️ [Feedback] Error in single chunk query:`, err.message);
            return [];
          }
        }
        
        // Dividir en chunks
        let currentFrom = fromBlock;
        let chunkIndex = 0;
        
        while (currentFrom < endBlock) {
          const currentTo = Math.min(currentFrom + chunkSize - 1, endBlock);
          chunkIndex++;
          
          try {
            console.log(`📦 [Feedback] Chunk ${chunkIndex}: querying blocks ${currentFrom} to ${currentTo}...`);
            const chunkEvents = await reputationRegistry.queryFilter(filter, currentFrom, currentTo);
            console.log(`📦 [Feedback] Chunk ${chunkIndex}: found ${chunkEvents.length} events`);
            allResults.push(...chunkEvents);
          } catch (chunkError: any) {
            console.warn(`⚠️ [Feedback] Error in chunk ${chunkIndex} (blocks ${currentFrom}-${currentTo}):`, chunkError.message);
            // Continuar con el siguiente chunk en lugar de fallar completamente
          }
          
          currentFrom = currentTo + 1;
        }
        
        return allResults;
      };

      // Buscar AMBOS tipos de eventos (no solo uno u otro) usando chunking
      let allEvents: ethers.Log[] = [];
      
      // 1. Buscar NewFeedback events
      try {
        const newFeedbackFilter = reputationRegistry.filters.NewFeedback(agentIdBigInt);
        const newFeedbackEvents = await queryFilterInChunks(newFeedbackFilter, actualStartBlock, actualEndBlock);
        console.log(`📡 [Feedback] Found ${newFeedbackEvents.length} NewFeedback events (across all chunks)`);
        allEvents = allEvents.concat(newFeedbackEvents);
      } catch (newFeedbackError: any) {
        console.warn(`⚠️ [Feedback] Error querying NewFeedback events:`, newFeedbackError.message);
      }
      
      // 2. Buscar FeedbackGiven events
      try {
        const feedbackGivenFilter = reputationRegistry.filters.FeedbackGiven(agentIdBigInt);
        const feedbackGivenEvents = await queryFilterInChunks(feedbackGivenFilter, actualStartBlock, actualEndBlock);
        console.log(`📡 [Feedback] Found ${feedbackGivenEvents.length} FeedbackGiven events (across all chunks)`);
        allEvents = allEvents.concat(feedbackGivenEvents);
      } catch (feedbackGivenError: any) {
        console.warn(`⚠️ [Feedback] Error querying FeedbackGiven events:`, feedbackGivenError.message);
      }

      // Log total de eventos históricos encontrados
      console.log(`✅ [Feedback] Eventos históricos encontrados: ${allEvents.length} total (NewFeedback + FeedbackGiven)`);
      
      // Ordenar eventos por blockNumber (más antiguos primero para procesar en orden)
      allEvents.sort((a, b) => a.blockNumber - b.blockNumber);
      
      const events = allEvents;

      const processedReviews: Review[] = [];

      console.log(`🔄 [Feedback] Processing ${events.length} events...`);

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        try {
          console.log(`📋 [Feedback] Event ${i + 1}/${events.length}: Block ${event.blockNumber}, Tx ${event.transactionHash.substring(0, 10)}...`);
          
          const decodedEvent = reputationRegistry.interface.parseLog({
            topics: event.topics as string[],
            data: event.data
          });

          if (!decodedEvent) {
            console.warn(`⚠️ [Feedback] Could not decode event ${i + 1}:`, {
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              topics: event.topics,
              dataLength: event.data.length
            });
            continue;
          }

          const args = decodedEvent.args;
          if (!args) {
            console.warn(`⚠️ [Feedback] Event ${i + 1} has no args:`, decodedEvent.name);
            continue;
          }

          const isNewFeedback = decodedEvent.name === 'NewFeedback';
          
          // Log detallado para debugging
          console.log(`🔍 [Feedback] Processing ${decodedEvent.name} event ${i + 1}:`, {
            eventName: decodedEvent.name,
            argsType: Array.isArray(args) ? 'array' : 'object',
            argsLength: Array.isArray(args) ? args.length : Object.keys(args).length,
            argsKeys: typeof args === 'object' && !Array.isArray(args) ? Object.keys(args) : 'N/A',
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          });
          
          let client: string;
          let score: number;
          let tag1: string = '';
          let tag2: string = '';
          let endpoint: string = '';
          let feedbackURI: string = '';
          let feedbackHash: string | undefined = undefined;

          if (isNewFeedback) {
            // NewFeedback event structure según ABI:
            // event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, 
            //                  uint8 score, string indexed tag1, string tag2, string endpoint, 
            //                  string feedbackURI, bytes32 feedbackHash)
            // 
            // En ethers v6, cuando parseLog decodifica, args puede ser:
            // - Un array: [agentId, clientAddress, feedbackIndex, score, tag1, tag2, endpoint, feedbackURI, feedbackHash]
            // - Un objeto: { agentId, clientAddress, feedbackIndex, score, tag1, tag2, endpoint, feedbackURI, feedbackHash }
            // Los indexed también están en topics
            
            // Función helper para obtener valor de args (por nombre o índice)
            const getArg = (name: string, index: number, defaultValue: any = '') => {
              if (typeof args === 'object' && !Array.isArray(args) && name in args) {
                return args[name];
              }
              if (Array.isArray(args) && args[index] !== undefined) {
                return args[index];
              }
              return defaultValue;
            };
            
            // Para NewFeedback, los argumentos en orden son:
            // 0: agentId (indexed, también en topics[1])
            // 1: clientAddress (indexed, también en topics[2])
            // 2: feedbackIndex
            // 3: score
            // 4: tag1 (indexed, también en topics[3])
            // 5: tag2
            // 6: endpoint
            // 7: feedbackURI
            // 8: feedbackHash
            
            client = (getArg('clientAddress', 1) || '').toString();
            score = Number(getArg('score', 3) || 0);
            tag1 = (getArg('tag1', 4) || '').toString();
            tag2 = (getArg('tag2', 5) || '').toString();
            endpoint = (getArg('endpoint', 6) || '').toString();
            feedbackURI = (getArg('feedbackURI', 7) || '').toString();
            feedbackHash = getArg('feedbackHash', 8);
            
            // Log de valores extraídos antes de normalizar
            console.log(`📊 [Feedback] Extracted values from NewFeedback event ${i + 1}:`, {
              client: client.substring(0, 10) + '...',
              score,
              tag1,
              tag2,
              endpoint,
              feedbackURI: feedbackURI.substring(0, 30) + (feedbackURI.length > 30 ? '...' : ''),
              feedbackHashRaw: feedbackHash ? feedbackHash.toString().substring(0, 20) + '...' : 'null/undefined'
            });
            
            // Normalizar feedbackHash: si es ZeroHash o vacío, establecer como undefined
            // Esto evita errores al intentar usar el hash vacío y permite mostrar reviews sin hash
            if (feedbackHash !== undefined && feedbackHash !== null) {
              const hashStr = feedbackHash.toString();
              const zeroHashPattern = /^0x0+$/i; // Matches 0x, 0x0, 0x00, 0x0000..., etc.
              
              if (hashStr === ethers.ZeroHash || 
                  hashStr === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
                  zeroHashPattern.test(hashStr) ||
                  !hashStr || hashStr.trim() === '') {
                feedbackHash = undefined;
                console.log(`ℹ️ [Feedback] Normalized empty feedbackHash to undefined for review ${i + 1}`);
              }
            } else {
              feedbackHash = undefined;
            }
          } else {
            // FeedbackGiven event structure:
            // event FeedbackGiven(uint256 indexed agentId, address indexed rater, uint8 score, 
            //                     string tag1, string tag2, string endpoint)
            // args: [agentId, rater, score, tag1, tag2, endpoint] o { agentId, rater, score, tag1, tag2, endpoint }
            
            const getArg = (name: string, index: number, defaultValue: any = '') => {
              if (typeof args === 'object' && !Array.isArray(args) && name in args) {
                return args[name];
              }
              if (Array.isArray(args) && args[index] !== undefined) {
                return args[index];
              }
              return defaultValue;
            };
            
            client = (getArg('rater', 1) || '').toString();
            score = Number(getArg('score', 2) || 0);
            tag1 = (getArg('tag1', 3) || '').toString();
            tag2 = (getArg('tag2', 4) || '').toString();
            endpoint = (getArg('endpoint', 5) || '').toString();
            feedbackURI = '';
            feedbackHash = undefined;
            
            // Log de valores extraídos para FeedbackGiven
            console.log(`📊 [Feedback] Extracted values from FeedbackGiven event ${i + 1}:`, {
              client: client.substring(0, 10) + '...',
              score,
              tag1,
              tag2,
              endpoint
            });
          }

          // Construir tag combinado (usar tag1 o tag2, priorizando tag1)
          let tag = '';
          if (tag1 && tag1.trim() !== '') {
            tag = tag1.trim();
          } else if (tag2 && tag2.trim() !== '') {
            tag = tag2.trim();
          }

          // Usar feedbackURI como fileuri, o endpoint como fallback
          const fileuri = feedbackURI || endpoint || '';
          const filehash = feedbackHash;

          // IMPORTANTE: No filtrar reviews aunque tengan hash vacío
          // Mostrar todas las reviews que tengan al menos un score válido
          // El score puede ser 0, pero debe ser un número válido
          if (isNaN(score)) {
            console.warn(`⚠️ [Feedback] Skipping review with invalid score:`, { client, score, event: decodedEvent.name });
            continue;
          }

          const review = {
            client: client,
            score: score,
            tag: tag,
            tag1: tag1,
            tag2: tag2,
            fileuri: fileuri,
            filehash: filehash,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          };
          
          processedReviews.push(review);
          
          console.log(`✅ [Feedback] Added review ${i + 1}/${events.length} to processedReviews:`, {
            client: client.substring(0, 10) + '...',
            score,
            tag,
            hasFileuri: !!fileuri,
            hasFilehash: !!filehash,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash.substring(0, 10) + '...'
          });

        } catch (eventError: any) {
          console.warn(`⚠️ [Feedback] Error processing event:`, eventError.message);
          continue;
        }
      }

      processedReviews.sort((a, b) => {
        const blockA = a.blockNumber || 0;
        const blockB = b.blockNumber || 0;
        return blockB - blockA;
      });

      console.log(`✅ [Feedback] Loaded ${processedReviews.length} reviews from events for Agent #${agentId}`);
      setReviews(processedReviews);

    } catch (err: any) {
      console.error('❌ [Feedback] Error crítico fetching feedback:', err);
      setError(err.message || 'Failed to fetch feedback');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [agentId, currentNetworkId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchFeedback
  };
}
