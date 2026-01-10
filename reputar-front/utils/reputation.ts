import { ethers, ContractTransactionResponse, ContractTransactionReceipt } from 'ethers';
import { 
  REPUTATION_REGISTRY_ADDRESS, 
  REPUTATION_REGISTRY_ABI
} from './contracts';

/**
 * Parámetros para enviar una calificación a un agente (ERC-8004 v1.1)
 */
export interface RateAgentParams {
  agentId: number | string; // Token ID del agente
  score: number; // Puntaje de 0 a 100
  tag1?: string; // string tag1 (opcional, default: "")
  tag2?: string; // string tag2 (opcional, default: "")
  endpoint?: string; // string endpoint (opcional, default: "")
  feedbackURI?: string; // URI del feedback asociado (opcional, default: "")
  feedbackHash?: string; // Hash del feedback (opcional, default: bytes32(0))
  signer: ethers.Signer; // Signer para firmar la transacción
}

/**
 * Resultado de enviar una calificación
 */
export interface SubmitRatingResult {
  transactionHash: string;
  success: boolean;
  error?: string;
}

interface ReputationSummaryResult {
    count: bigint;
    averageScore: bigint;
    [key: string]: unknown;
}

/**
 * Envía una calificación a un agente usando el ReputationRegistry ERC-8004 v1.1
 * 
 * @param params - Parámetros de la calificación
 * @returns Resultado de la transacción
 * 
 * @note ERC-8004 v1.1 simplificó el proceso eliminando la necesidad de FeedbackAuth.
 *       La función ahora acepta parámetros simples sin firma digital.
 */
export async function rateAgent(
  params: RateAgentParams
): Promise<SubmitRatingResult> {
  try {
    const { 
      agentId, 
      score, 
      tag1, 
      tag2, 
      endpoint,
      feedbackURI,
      feedbackHash,
      signer 
    } = params;

    // Validar score (0-100 según ERC-8004 v1.1)
    if (score < 0 || score > 100) {
      throw new Error('Score must be between 0 and 100');
    }

    // Convertir agentId a número si es string
    const agentIdNumber = typeof agentId === 'string' ? parseInt(agentId, 10) : agentId;
    if (isNaN(agentIdNumber) || agentIdNumber < 0) {
      throw new Error('Invalid agent ID');
    }

    // Convertir score a uint8 (0-100)
    const scoreUint8 = Math.round(score);

    // Preparar parámetros opcionales (strings vacíos si no se proporcionan)
    const tag1String = tag1 || '';
    const tag2String = tag2 || '';
    const endpointString = endpoint || '';
    const feedbackURIString = feedbackURI || '';
    const feedbackHashBytes32 = feedbackHash ? ethers.zeroPadValue(ethers.getBytes(feedbackHash), 32) : ethers.ZeroHash;

    // Crear instancia del contrato con signer
    const reputationRegistry = new ethers.Contract(
      REPUTATION_REGISTRY_ADDRESS,
      REPUTATION_REGISTRY_ABI,
      signer
    );

    // Llamar a giveFeedback según ERC-8004 v1.1
    // giveFeedback(uint256 agentId, uint8 score, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)
    console.log(`Submitting rating for Agent #${agentIdNumber}: score=${scoreUint8}, tag1="${tag1String}", tag2="${tag2String}", endpoint="${endpointString}"`);
    
    const tx = await reputationRegistry.giveFeedback(
      agentIdNumber,
      scoreUint8,
      tag1String,
      tag2String,
      endpointString,
      feedbackURIString,
      feedbackHashBytes32
    ) as ContractTransactionResponse;

    console.log(`Transaction sent: ${tx.hash}`);
    
    // Esperar confirmación
    const receipt = await tx.wait() as ContractTransactionReceipt | null;
    
    if (receipt && receipt.status === 1) {
      return {
        transactionHash: tx.hash,
        success: true
      };
    } else {
      throw new Error('Transaction failed or receipt status is 0');
    }
  } catch (error: unknown) {
    console.error('Error rating agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      transactionHash: '',
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Alias para backward compatibility
 */
export const submitRating = rateAgent;
export const submitAgentRating = rateAgent;

/**
 * Obtiene el resumen de reputación de un agente desde el contrato (ERC-8004 v1.1)
 * 
 * @param agentId - ID del agente
 * @param provider - Provider de ethers
 * @param clientAddresses - Array de direcciones de clientes (opcional, default: [])
 * @param tag1 - Tag 1 para filtrar (opcional, default: "")
 * @param tag2 - Tag 2 para filtrar (opcional, default: "")
 * @returns Resumen de reputación o null si hay error
 */
export async function getAgentReputation(
  agentId: number | string,
  provider: ethers.Provider,
  clientAddresses?: string[],
  tag1?: string,
  tag2?: string
): Promise<{ averageScore: number; count: number } | null> {
  try {
    const agentIdNumber = typeof agentId === 'string' ? parseInt(agentId, 10) : agentId;
    if (isNaN(agentIdNumber) || agentIdNumber < 0) {
      throw new Error('Invalid agent ID');
    }

    const reputationRegistry = new ethers.Contract(
      REPUTATION_REGISTRY_ADDRESS,
      REPUTATION_REGISTRY_ABI,
      provider
    );

    // Preparar parámetros para getSummary v1.1 (tags son strings directos)
    const clientAddressArray = clientAddresses || [];
    const tag1String = tag1 || '';
    const tag2String = tag2 || '';

    // Llamar a getSummary según ERC-8004 v1.1
    // getSummary(uint256 agentId, address[] calldata clientAddresses, string tag1, string tag2)
    const summary = await reputationRegistry.getSummary(
      agentIdNumber,
      clientAddressArray,
      tag1String,
      tag2String
    ) as unknown as ReputationSummaryResult;

    // getSummary retorna (uint64 count, uint8 averageScore)
    // Convertir BigInt a Number para Ethers v6
    return {
      averageScore: Number(summary.averageScore),
      count: Number(summary.count)
    };
  } catch (error: unknown) {
    console.error(`Error fetching reputation for Agent #${agentId}:`, error);
    return null;
  }
}

