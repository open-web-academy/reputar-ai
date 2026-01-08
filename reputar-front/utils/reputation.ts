import { ethers, ContractTransactionResponse, ContractTransactionReceipt } from 'ethers';
import { 
  REPUTATION_REGISTRY_ADDRESS, 
  REPUTATION_REGISTRY_ABI,
  IDENTITY_REGISTRY_ADDRESS,
  ETHEREUM_SEPOLIA_CHAIN_ID
} from './contracts';

/**
 * Estructura FeedbackAuth según ERC-8004 v1.0
 * Esta estructura debe ser firmada por el Agente (EIP-191) para autorizar el feedback
 */
export interface FeedbackAuth {
  agentId: number;
  clientAddress: string;
  indexLimit: number;
  expiry: number;
  chainId: number;
  identityRegistry: string;
  signerAddress: string;
}

/**
 * Parámetros para enviar una calificación a un agente (ERC-8004 v1.0)
 */
export interface RateAgentParams {
  agentId: number | string; // Token ID del agente
  score: number; // Puntaje de 0 a 100
  tag1?: string; // bytes32 tag1 (opcional, default: bytes32(0))
  tag2?: string; // bytes32 tag2 (opcional, default: bytes32(0))
  fileuri?: string; // URI del archivo asociado (opcional)
  filehash?: string; // Hash del archivo (opcional, default: bytes32(0))
  feedbackAuth?: string; // Firma FeedbackAuth en bytes (requerida para v1.0)
  signer: ethers.Signer; // Signer para firmar la transacción
}

/**
 * Parámetros para crear FeedbackAuth
 */
export interface CreateFeedbackAuthParams {
  agentId: number;
  clientAddress: string;
  indexLimit?: number; // Límite de índice (default: 0)
  expiry?: number; // Timestamp de expiración (default: ahora + 1 hora)
  chainId?: number; // Chain ID (default: ETHEREUM_SEPOLIA_CHAIN_ID)
  identityRegistry?: string; // Dirección del Identity Registry (default: IDENTITY_REGISTRY_ADDRESS)
  agentSigner: ethers.Signer; // Signer del agente para firmar FeedbackAuth
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
 * Crea y firma una estructura FeedbackAuth según ERC-8004 v1.0 (EIP-191)
 * 
 * DEMO MODE: Para esta demo, el usuario (cliente) firma su propia autorización (self-signing)
 * En producción, el Agente debería firmar esta estructura.
 * 
 * @param params - Parámetros para crear FeedbackAuth
 * @returns bytes codificados de FeedbackAuth firmado
 */
export async function createFeedbackAuth(
  params: CreateFeedbackAuthParams
): Promise<string> {
  const {
    agentId,
    clientAddress,
    indexLimit = 0,
    expiry = Math.floor(Date.now() / 1000) + 3600, // Default: 1 hora desde ahora
    chainId = ETHEREUM_SEPOLIA_CHAIN_ID,
    identityRegistry = IDENTITY_REGISTRY_ADDRESS,
    agentSigner // En demo, este es el signer del usuario/cliente (self-signing)
  } = params;

  const signerAddress = await agentSigner.getAddress();
  
  // Crear estructura FeedbackAuth
  const feedbackAuth: FeedbackAuth = {
    agentId,
    clientAddress,
    indexLimit,
    expiry,
    chainId,
    identityRegistry,
    signerAddress
  };

  console.log('📝 Creating FeedbackAuth structure:', feedbackAuth);

  // Codificar FeedbackAuth usando ABI encoding
  const types = [
    'uint256', // agentId
    'address', // clientAddress
    'uint256', // indexLimit
    'uint256', // expiry
    'uint256', // chainId
    'address', // identityRegistry
    'address'  // signerAddress
  ];

  const values = [
    feedbackAuth.agentId,
    feedbackAuth.clientAddress,
    feedbackAuth.indexLimit,
    feedbackAuth.expiry,
    feedbackAuth.chainId,
    feedbackAuth.identityRegistry,
    feedbackAuth.signerAddress
  ];

  // Codificar usando ABI
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(types, values);
  console.log('🔐 Encoded FeedbackAuth:', encoded);
  
  // Crear mensaje para EIP-191 signing
  // EIP-191 format: "\x19Ethereum Signed Message:\n" + length + message
  const messageBytes = ethers.getBytes(encoded);
  const messageLength = messageBytes.length.toString();
  const prefix = ethers.toUtf8Bytes(`\x19Ethereum Signed Message:\n${messageLength}`);
  const prefixedMessage = ethers.concat([prefix, messageBytes]);
  const messageHash = ethers.keccak256(prefixedMessage);

  console.log('✍️ Requesting signature from user (self-signing for demo)...');
  
  // DEMO MODE: El usuario firma su propia autorización
  // En producción, esto debería ser firmado por el Agente
  const signature = await agentSigner.signMessage(ethers.getBytes(messageHash));
  
  console.log('✅ FeedbackAuth signed:', signature);
  
  // Retornar la firma en formato bytes
  return signature;
}

/**
 * Envía una calificación a un agente usando el ReputationRegistry ERC-8004 v1.0
 * 
 * @param params - Parámetros de la calificación
 * @returns Resultado de la transacción
 * 
 * @note ERC-8004 v1.0 requiere FeedbackAuth firmado por el agente.
 *       Si no se proporciona feedbackAuth, la transacción fallará.
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
      fileuri, 
      filehash, 
      feedbackAuth, 
      signer 
    } = params;

    // Validar score (0-100 según ERC-8004 v1.0)
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

    // Preparar tags (bytes32)
    const tag1Bytes32 = tag1 ? ethers.zeroPadValue(ethers.getBytes(tag1), 32) : ethers.ZeroHash;
    const tag2Bytes32 = tag2 ? ethers.zeroPadValue(ethers.getBytes(tag2), 32) : ethers.ZeroHash;

    // Preparar fileuri y filehash
    const fileuriString = fileuri || '';
    const filehashBytes32 = filehash ? ethers.zeroPadValue(ethers.getBytes(filehash), 32) : ethers.ZeroHash;

    // Validar que feedbackAuth esté presente
    if (!feedbackAuth || feedbackAuth === '0x') {
      throw new Error('FeedbackAuth is required for ERC-8004 v1.0. Please provide a signed FeedbackAuth from the agent.');
    }

    // Crear instancia del contrato con signer
    const reputationRegistry = new ethers.Contract(
      REPUTATION_REGISTRY_ADDRESS,
      REPUTATION_REGISTRY_ABI,
      signer
    );

    // Llamar a giveFeedback según ERC-8004 v1.0
    // giveFeedback(uint256 agentId, uint8 score, bytes32 tag1, bytes32 tag2, string fileuri, bytes32 filehash, bytes feedbackAuth)
    console.log(`Submitting rating for Agent #${agentIdNumber}: score=${scoreUint8}, tag1=${tag1Bytes32}, tag2=${tag2Bytes32}`);
    
    const tx = await reputationRegistry.giveFeedback(
      agentIdNumber,
      scoreUint8,
      tag1Bytes32,
      tag2Bytes32,
      fileuriString,
      filehashBytes32,
      feedbackAuth
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
 * Obtiene el resumen de reputación de un agente desde el contrato (ERC-8004 v1.0)
 * 
 * @param agentId - ID del agente
 * @param provider - Provider de ethers
 * @param clientAddresses - Array de direcciones de clientes (opcional, default: [])
 * @param tag1 - Tag 1 para filtrar (opcional, default: bytes32(0))
 * @param tag2 - Tag 2 para filtrar (opcional, default: bytes32(0))
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

    // Preparar parámetros para getSummary v1.0
    const clientAddressArray = clientAddresses || [];
    const tag1Bytes32 = tag1 ? ethers.zeroPadValue(ethers.getBytes(tag1), 32) : ethers.ZeroHash;
    const tag2Bytes32 = tag2 ? ethers.zeroPadValue(ethers.getBytes(tag2), 32) : ethers.ZeroHash;

    // Llamar a getSummary según ERC-8004 v1.0
    // getSummary(uint256 agentId, address[] clientAddresses, bytes32 tag1, bytes32 tag2)
    const summary = await reputationRegistry.getSummary(
      agentIdNumber,
      clientAddressArray,
      tag1Bytes32,
      tag2Bytes32
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

