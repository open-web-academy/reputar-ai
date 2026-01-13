import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI, NETWORK_CONFIG } from '../utils/contracts';
import { uploadToIPFS, buildAgentMetadata } from '../utils/ipfs';
import TransactionMonitor, { TransactionPhase } from './TransactionMonitor';

interface RegisterAgentWindowProps {
  onSuccess?: (agentId: number) => void;
  onClose?: () => void;
}

/**
 * Componente estilo Windows 95 para registrar un nuevo agente
 * Integra IPFS (Pinata) con el Smart Contract IdentityRegistry
 */
export default function RegisterAgentWindow({ onSuccess, onClose }: RegisterAgentWindowProps) {
  // Estados del formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [tags, setTags] = useState('');

  // Estados de proceso
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionPhase, setTransactionPhase] = useState<TransactionPhase | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  
  // Estados para upload solo
  const [ipfsOnlyHash, setIpfsOnlyHash] = useState<string | null>(null);
  const [isUploadingOnly, setIsUploadingOnly] = useState(false);

  const { isConnected, signer, address } = useWallet();

  const resetForm = () => {
    setName('');
    setDescription('');
    setExternalUrl('');
    setTags('');
    setTransactionPhase(null);
    setTransactionHash(null);
    setAgentId(null);
    setErrorMessage(null);
    setIpfsHash(null);
    setIpfsOnlyHash(null);
  };

  const handleUploadOnly = async () => {
    // Validaciones básicas
    if (!name || name.trim() === '') {
      setErrorMessage('Error: Agent name is required');
      return;
    }

    if (!description || description.trim() === '') {
      setErrorMessage('Error: Agent description is required');
      return;
    }

    setIsUploadingOnly(true);
    setErrorMessage(null);
    setIpfsOnlyHash(null);

    try {
      // Construir metadata
      const metadata = buildAgentMetadata(
        name.trim(),
        description.trim(),
        externalUrl.trim() || undefined,
        tags.trim() || undefined
      );

      console.log('☁️ Uploading metadata to IPFS only...');
      const ipfsResult = await uploadToIPFS(metadata);

      if (!ipfsResult.success || !ipfsResult.ipfsHash) {
        setErrorMessage(ipfsResult.error || 'Failed to upload metadata to IPFS');
        setIpfsOnlyHash(null);
      } else {
        const ipfsUri = `ipfs://${ipfsResult.ipfsHash}`;
        setIpfsOnlyHash(ipfsUri);
        setErrorMessage(null);
        console.log(`✅ Metadata uploaded to IPFS: ${ipfsUri}`);
        // Mostrar mensaje de éxito
        setErrorMessage(null);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setErrorMessage(`Error: ${error.message}`);
      setIpfsOnlyHash(null);
    } finally {
      setIsUploadingOnly(false);
    }
  };

  const handleRegister = async () => {
    // Validaciones
    if (!isConnected || !signer) {
      setErrorMessage('Error: Please connect your wallet first');
      return;
    }

    if (!name || name.trim() === '') {
      setErrorMessage('Error: Agent name is required');
      return;
    }

    if (!description || description.trim() === '') {
      setErrorMessage('Error: Agent description is required');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    let ipfsUri: string;

    try {
      // ============================================================
      // FASE 1: Obtener o subir metadata a IPFS
      // ============================================================
      if (ipfsOnlyHash && ipfsOnlyHash.startsWith('ipfs://')) {
        // Si ya existe un URI generado, usarlo directamente
        ipfsUri = ipfsOnlyHash;
        setIpfsHash(ipfsOnlyHash.replace('ipfs://', ''));
        console.log(`✅ Using existing IPFS URI: ${ipfsUri}`);
      } else {
        // Si no existe URI, subir primero
        setTransactionPhase('uploading'); // Fase 1: Upload a IPFS
        console.log('📡 Step 1: Building metadata...');
        
        const metadata = buildAgentMetadata(
          name.trim(),
          description.trim(),
          externalUrl.trim() || undefined,
          tags.trim() || undefined
        );

        console.log('📡 Step 2: Uploading to IPFS via Pinata...');
        const ipfsResult = await uploadToIPFS(metadata);

        if (!ipfsResult.success || !ipfsResult.ipfsHash) {
          // Si falla IPFS, NO abrir la wallet
          setTransactionPhase('error');
          setErrorMessage(ipfsResult.error || 'Failed to upload metadata to IPFS');
          setIsProcessing(false);
          return;
        }

        ipfsUri = `ipfs://${ipfsResult.ipfsHash}`;
        setIpfsHash(ipfsResult.ipfsHash);
        setIpfsOnlyHash(ipfsUri); // Guardar también en el estado de upload only
        console.log(`✅ IPFS Upload successful: ${ipfsUri}`);
      }

      // ============================================================
      // FASE 2: Registrar en el Smart Contract
      // ============================================================
      setTransactionPhase('signing'); // Fase 2: Esperando firma
      console.log('✍️ Step 3: Registering on blockchain...');

      const identityRegistry = new ethers.Contract(
        IDENTITY_REGISTRY_ADDRESS,
        IDENTITY_REGISTRY_ABI,
        signer
      );

      // Llamar a la función register(string agentURI)
      const tx = await identityRegistry.register(ipfsUri) as ethers.ContractTransactionResponse;

      // Fase 3: Transacción enviada, esperando confirmación
      setTransactionPhase('mining');
      setTransactionHash(tx.hash);
      console.log(`⛏️ Transaction sent: ${tx.hash}`);

      // Esperar confirmación
      const receipt = await tx.wait() as ethers.ContractTransactionReceipt | null;

      if (receipt && receipt.status === 1) {
        // Buscar el evento Registered para obtener el agentId
        let registeredAgentId: number | null = null;

        try {
          // Intentar obtener el agentId del evento
          const registeredEvent = receipt.logs.find((log) => {
            try {
              const parsedLog = identityRegistry.interface.parseLog(log as any);
              return parsedLog && parsedLog.name === 'Registered';
            } catch {
              return false;
            }
          });

          if (registeredEvent) {
            const parsedLog = identityRegistry.interface.parseLog(registeredEvent as any);
            if (parsedLog && parsedLog.args) {
              registeredAgentId = Number(parsedLog.args.agentId);
            }
          }

          // Si no encontramos el evento, intentar obtener el totalAgents() - 1
          if (!registeredAgentId) {
            const totalAgents = await identityRegistry.totalAgents();
            registeredAgentId = Number(totalAgents) - 1;
          }
        } catch (eventError) {
          console.warn('Could not extract agentId from event, using fallback method');
          // Fallback: obtener el último agentId
          try {
            const totalAgents = await identityRegistry.totalAgents();
            registeredAgentId = Number(totalAgents) - 1;
          } catch {
            registeredAgentId = null;
          }
        }

        setAgentId(registeredAgentId);
        setTransactionPhase('success');
        console.log(`✅ Agent registered successfully! Agent ID: ${registeredAgentId}`);

        // Resetear formulario después de un delay
        setTimeout(() => {
          if (onSuccess && registeredAgentId !== null) {
            onSuccess(registeredAgentId);
          }
          resetForm();
          setIsProcessing(false);
        }, 3000);
      } else {
        throw new Error('Transaction failed or receipt status is 0');
      }
    } catch (err: unknown) {
      console.error('❌ Error registering agent:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');

      // Detectar si el usuario rechazó la firma
      const errorMessageLower = error.message.toLowerCase();
      if (
        errorMessageLower.includes('user rejected') ||
        errorMessageLower.includes('user denied') ||
        errorMessageLower.includes('rejected') ||
        errorMessageLower.includes('denied')
      ) {
        setTransactionPhase(null); // Cerrar el monitor si el usuario rechazó
        setErrorMessage('Transaction cancelled by user');
      } else {
        setTransactionPhase('error');
        setErrorMessage(`Error: ${error.message}`);
      }
      setIsProcessing(false);
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#c0c0c0',
        border: '2px solid white',
        boxSizing: 'border-box',
        fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px',
          fontWeight: 'bold',
          borderBottom: '2px solid #888',
          backgroundColor: '#c0c0c0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Register New Agent</span>
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            disabled={isProcessing}
            style={{
              backgroundColor: '#c0c0c0',
              border: '1px solid',
              borderColor: '#808080 #ffffff #ffffff #808080',
              color: '#000',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '10px',
              padding: '1px 6px',
              fontWeight: 'bold',
              fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (!isProcessing) {
                e.currentTarget.style.borderColor = '#808080 #808080 #808080 #808080';
              }
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              if (!isProcessing) {
                e.currentTarget.style.borderColor = '#808080 #ffffff #ffffff #808080';
              }
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
          backgroundColor: '#dfdfdf',
          border: '2px inset white',
          minHeight: 0,
        }}
      >
        {!isConnected ? (
          <div
            style={{
              padding: '20px',
              backgroundColor: '#fff8e1',
              border: '2px solid #ffa500',
              borderRadius: '4px',
            }}
          >
            <p style={{ fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
              ⚠️ Wallet Not Connected
            </p>
            <p style={{ fontSize: '12px', margin: 0 }}>
              Please connect your wallet using the "Connect Wallet" window to register an agent.
            </p>
          </div>
        ) : (
          <>
            {/* Wallet Info */}
            <div
              style={{
                marginBottom: '16px',
                padding: '8px',
                backgroundColor: '#ffffff',
                border: '2px inset #808080',
                fontSize: '11px',
              }}
            >
              <strong>Connected:</strong>{' '}
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
            </div>

            {/* Form Fields */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                Name: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My AI Agent"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '6px',
                  boxSizing: 'border-box',
                  border: '2px inset #808080',
                  fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                  fontSize: '11px',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                Description: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your agent does..."
                disabled={isProcessing}
                rows={4}
                style={{
                  width: '100%',
                  padding: '6px',
                  boxSizing: 'border-box',
                  border: '2px inset #808080',
                  fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                  fontSize: '11px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                External URL: <span style={{ fontSize: '10px', color: '#666' }}>(optional)</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '6px',
                  boxSizing: 'border-box',
                  border: '2px inset #808080',
                  fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                  fontSize: '11px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                Tags: <span style={{ fontSize: '10px', color: '#666' }}>(optional, comma-separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., AI, chatbot, assistant"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '6px',
                  boxSizing: 'border-box',
                  border: '2px inset #808080',
                  fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                  fontSize: '11px',
                }}
              />
            </div>

            {/* IPFS Only Upload Result */}
            {ipfsOnlyHash && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: '#e8f5e9',
                  border: '2px solid #4caf50',
                  borderRadius: '4px',
                }}
              >
                <p style={{ fontWeight: 'bold', color: '#155724', margin: 0, marginBottom: '8px' }}>
                  ✅ Metadata uploaded to IPFS! URI generated.
                </p>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    color: '#155724',
                  }}
                >
                  IPFS URI (copy this):
                </label>
                <input
                  type="text"
                  value={ipfsOnlyHash}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '6px',
                    boxSizing: 'border-box',
                    border: '2px inset #808080',
                    backgroundColor: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    cursor: 'text',
                  }}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !transactionPhase && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: '#ffebee',
                  border: '2px solid #dc3545',
                  borderRadius: '4px',
                }}
              >
                <p style={{ fontWeight: 'bold', color: '#721c24', margin: 0, marginBottom: '4px' }}>
                  ❌ Error
                </p>
                <p style={{ fontSize: '11px', margin: 0, color: '#721c24' }}>{errorMessage}</p>
              </div>
            )}

            {/* Info Box */}
            <div
              style={{
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '4px',
                fontSize: '10px',
              }}
            >
              <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '4px' }}>
                ℹ️ Registration Process:
              </p>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Metadata will be uploaded to IPFS via Pinata</li>
                <li>Agent will be registered on the Identity Registry contract</li>
                <li>You'll receive a unique Agent ID (Token ID)</li>
              </ol>
            </div>
          </>
        )}
      </div>

      {/* Footer with Buttons */}
      <div
        style={{
          minHeight: '60px',
          flexShrink: 0,
          padding: '10px',
          borderTop: '2px solid #fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#c0c0c0',
          boxSizing: 'border-box',
        }}
      >
        {/* Upload Only Button */}
        <button
          onClick={handleUploadOnly}
          disabled={isUploadingOnly || isProcessing || !name.trim() || !description.trim()}
          type="button"
          style={{
            width: '100%',
            height: '32px',
            fontWeight: 'bold',
            cursor:
              isUploadingOnly || isProcessing || !name.trim() || !description.trim()
                ? 'not-allowed'
                : 'pointer',
            backgroundColor:
              isUploadingOnly || isProcessing || !name.trim() || !description.trim()
                ? '#999'
                : '#c0c0c0',
            border: '2px outset white',
            color: '#000',
            fontSize: '11px',
            boxSizing: 'border-box',
            fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
          }}
          onMouseDown={(e) => {
            if (
              !isUploadingOnly &&
              !isProcessing &&
              name.trim() &&
              description.trim()
            ) {
              e.currentTarget.style.borderStyle = 'inset';
            }
          }}
          onMouseUp={(e) => {
            if (
              !isUploadingOnly &&
              !isProcessing &&
              name.trim() &&
              description.trim()
            ) {
              e.currentTarget.style.borderStyle = 'outset';
            }
          }}
        >
          {isUploadingOnly
            ? 'UPLOADING...'
            : !name.trim() || !description.trim()
            ? 'FILL REQUIRED FIELDS'
            : '☁️ UPLOAD METADATA ONLY'}
        </button>

        {/* Main Register Button */}
        <button
          onClick={handleRegister}
          disabled={isProcessing || isUploadingOnly || !isConnected || !name.trim() || !description.trim()}
          type="button"
          style={{
            width: '100%',
            height: '40px',
            fontWeight: 'bold',
            cursor:
              isProcessing || isUploadingOnly || !isConnected || !name.trim() || !description.trim()
                ? 'not-allowed'
                : 'pointer',
            backgroundColor:
              isProcessing || isUploadingOnly || !isConnected || !name.trim() || !description.trim()
                ? '#999'
                : '#c0c0c0',
            border: '2px outset white',
            color: '#000',
            fontSize: '14px',
            boxSizing: 'border-box',
            fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
          }}
          onMouseDown={(e) => {
            if (
              !isProcessing &&
              !isUploadingOnly &&
              isConnected &&
              name.trim() &&
              description.trim()
            ) {
              e.currentTarget.style.borderStyle = 'inset';
            }
          }}
          onMouseUp={(e) => {
            if (
              !isProcessing &&
              !isUploadingOnly &&
              isConnected &&
              name.trim() &&
              description.trim()
            ) {
              e.currentTarget.style.borderStyle = 'outset';
            }
          }}
        >
          {isProcessing
            ? 'PROCESSING...'
            : !isConnected
            ? 'CONNECT WALLET FIRST'
            : !name.trim() || !description.trim()
            ? 'FILL REQUIRED FIELDS'
            : '💾 REGISTER AGENT (CHAIN)'}
        </button>
      </div>

      {/* Transaction Monitor Modal */}
      {transactionPhase && (
        <TransactionMonitor
          phase={transactionPhase}
          transactionHash={transactionHash}
          errorMessage={errorMessage}
          onClose={() => {
            if (transactionPhase === 'error' || transactionPhase === 'success') {
              setTransactionPhase(null);
              setErrorMessage(null);
              if (transactionPhase === 'success') {
                resetForm();
                setIsProcessing(false);
              }
            }
          }}
        />
      )}

      {/* Success Info (si hay agentId) */}
      {agentId !== null && transactionPhase === 'success' && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '15px',
            right: '15px',
            padding: '10px',
            backgroundColor: '#e8f5e9',
            border: '2px solid #4caf50',
            borderRadius: '4px',
            fontSize: '11px',
            zIndex: 10001,
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold', color: '#155724' }}>
            ✅ Agent Registered Successfully!
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#155724' }}>
            <strong>Agent ID:</strong> {agentId}
          </p>
          {ipfsHash && (
            <p style={{ margin: '4px 0 0 0', color: '#155724', fontSize: '10px' }}>
              <strong>IPFS Hash:</strong> {ipfsHash}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

