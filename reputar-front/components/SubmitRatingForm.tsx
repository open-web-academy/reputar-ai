import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { NETWORK_CONFIG, IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI, REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI } from '../utils/contracts';
import TransactionMonitor, { TransactionPhase } from './TransactionMonitor';

interface SubmitRatingFormProps {
  agentId?: string;
  onSuccess?: () => void;
}

export default function SubmitRatingForm({ agentId = '', onSuccess }: SubmitRatingFormProps) {
  const [rateeAgentId, setRateeAgentId] = useState(agentId);
  const [score, setScore] = useState(50);
  const [tag1, setTag1] = useState('');
  const [tag2, setTag2] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [feedbackURI, setFeedbackURI] = useState('');
  const [feedbackHash, setFeedbackHash] = useState('');
  
  // Estados de validación previa
  const [isValidatingAgent, setIsValidatingAgent] = useState(false);
  const [agentExists, setAgentExists] = useState<boolean | null>(null);
  const [agentValidationError, setAgentValidationError] = useState<string | null>(null);
  
  // Estados de transacción
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionPhase, setTransactionPhase] = useState<TransactionPhase | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { isConnected, signer, provider } = useWallet();

  const resetForm = () => {
    setRateeAgentId(agentId || '');
    setScore(50);
    setTag1('');
    setTag2('');
    setEndpoint('');
    setFeedbackURI('');
    setFeedbackHash('');
    setAgentExists(null);
    setAgentValidationError(null);
  };

  /**
   * Valida si el agentId existe en el IdentityRegistry
   */
  const validateAgentId = async (agentIdToValidate: string) => {
    if (!agentIdToValidate || isNaN(Number(agentIdToValidate))) {
      setAgentExists(null);
      setAgentValidationError(null);
      return;
    }

    if (!provider) {
      setAgentExists(null);
      setAgentValidationError('Provider not available');
      return;
    }

    setIsValidatingAgent(true);
    setAgentValidationError(null);

    try {
      const agentIdNumber = parseInt(agentIdToValidate, 10);
      if (agentIdNumber < 1) {
        setAgentExists(false);
        setAgentValidationError('Agent ID must be greater than 0');
        setIsValidatingAgent(false);
        return;
      }

      const identityRegistry = new ethers.Contract(
        IDENTITY_REGISTRY_ADDRESS,
        IDENTITY_REGISTRY_ABI,
        provider
      );

      // Intentar obtener el owner del token
      // Si el token no existe, ownerOf lanzará un error
      try {
        const owner = await identityRegistry.ownerOf(agentIdNumber);
        if (owner && owner !== ethers.ZeroAddress) {
          setAgentExists(true);
          setAgentValidationError(null);
        } else {
          setAgentExists(false);
          setAgentValidationError('Agent ID not found in Registry');
        }
      } catch (error: any) {
        // Error típico cuando el token no existe
        const errorMessage = error?.message?.toLowerCase() || '';
        if (
          errorMessage.includes('nonexistent') ||
          errorMessage.includes('invalid token') ||
          errorMessage.includes('token does not exist') ||
          errorMessage.includes('owner query for nonexistent token')
        ) {
          setAgentExists(false);
          setAgentValidationError('Agent ID not found in Registry');
        } else {
          throw error; // Re-lanzar si es otro tipo de error
        }
      }
    } catch (error: unknown) {
      console.error('Error validating agent ID:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setAgentExists(false);
      setAgentValidationError(`Validation error: ${errorMsg}`);
    } finally {
      setIsValidatingAgent(false);
    }
  };

  // Validar automáticamente cuando cambia el agentId (con debounce)
  useEffect(() => {
    if (!rateeAgentId || rateeAgentId === '') {
      setAgentExists(null);
      setAgentValidationError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      validateAgentId(rateeAgentId);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [rateeAgentId, provider]);

  const handleSubmit = async () => {
    setSuccessMessage(null);
    setTransactionHash(null);
    setErrorMessage(null);
    setTransactionPhase(null);

    if (!isConnected || !signer) {
      setErrorMessage('Error: Please connect your wallet first');
      return;
    }

    if (!rateeAgentId || isNaN(Number(rateeAgentId))) {
      setErrorMessage('Error: Please enter a valid Agent ID (number)');
      return;
    }

    // Validación previa: verificar que el agente existe
    if (agentExists === false) {
      setErrorMessage('Error: Agent ID not found in Registry. Please verify the Agent ID.');
      return;
    }

    // Si aún no se ha validado, validar ahora
    if (agentExists === null) {
      await validateAgentId(rateeAgentId);
      // Esperar un momento para que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      if (agentExists === false) {
        setErrorMessage('Error: Agent ID not found in Registry. Please verify the Agent ID.');
        return;
      }
    }

    if (score < 0 || score > 100) {
      setErrorMessage('Error: Score must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setTransactionPhase('signing'); // Fase 1: Esperando firma en wallet

    try {
      const agentIdNumber = parseInt(rateeAgentId, 10);
      const scoreUint8 = Math.round(score);
      const tag1String = tag1 || '';
      const tag2String = tag2 || '';
      const endpointString = endpoint || '';
      const feedbackURIString = feedbackURI || '';
      const feedbackHashBytes32 = feedbackHash ? ethers.zeroPadValue(ethers.getBytes(feedbackHash), 32) : ethers.ZeroHash;

      // Crear instancia del contrato
      const reputationRegistry = new ethers.Contract(
        REPUTATION_REGISTRY_ADDRESS,
        REPUTATION_REGISTRY_ABI,
        signer
      );

      // Fase 1: Enviar transacción (esto abrirá el wallet)
      console.log(`Submitting rating for Agent #${agentIdNumber}: score=${scoreUint8}`);
      
      const tx = await reputationRegistry.giveFeedback(
        agentIdNumber,
        scoreUint8,
        tag1String,
        tag2String,
        endpointString,
        feedbackURIString,
        feedbackHashBytes32
      ) as ethers.ContractTransactionResponse;

      // Fase 2: Transacción enviada, esperando confirmación
      setTransactionPhase('mining');
      setTransactionHash(tx.hash);
      console.log(`Transaction sent: ${tx.hash}`);

      // Fase 3: Esperar confirmación
      const receipt = await tx.wait() as ethers.ContractTransactionReceipt | null;

      if (receipt && receipt.status === 1) {
        // Éxito
        setTransactionPhase('success');
        setSuccessMessage('¡Calificación enviada!');
        setTransactionHash(tx.hash);
        
        // Resetear formulario después de un breve delay
        setTimeout(() => {
          resetForm();
          setTransactionPhase(null);
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else {
        throw new Error('Transaction failed or receipt status is 0');
      }
    } catch (err: unknown) {
      console.error('Error submitting rating:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      
      // Detectar si el usuario rechazó la firma
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('user rejected') ||
        errorMessage.includes('user denied') ||
        errorMessage.includes('rejected') ||
        errorMessage.includes('denied')
      ) {
        setTransactionPhase(null); // Cerrar el monitor si el usuario rechazó
        setErrorMessage('Transaction cancelled by user');
      } else {
        setTransactionPhase('error');
        setErrorMessage(`Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '450px',
      width: '100%',
      backgroundColor: '#c0c0c0',
      border: '2px solid white',
      boxSizing: 'border-box'
    }}>
      {/* 1. CABECERA */}
      <div style={{ padding: '10px', fontWeight: 'bold', borderBottom: '2px solid #888', backgroundColor: '#c0c0c0' }}>
        Rate Agent (ERC-8004 v1.1)
      </div>

      {/* 2. ÁREA DE SCROLL (Inputs) - ESTO OCUPA EL ESPACIO RESTANTE */}
      <div style={{ 
        flex: 1,
        overflowY: 'scroll',
        padding: '15px',
        backgroundColor: '#dfdfdf',
        border: '2px inset white',
        minHeight: 0
      }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Agent ID (Token ID):</label>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              type="number"
              value={rateeAgentId}
              onChange={(e) => setRateeAgentId(e.target.value)}
              onBlur={() => {
                if (rateeAgentId && !isNaN(Number(rateeAgentId))) {
                  validateAgentId(rateeAgentId);
                }
              }}
              placeholder="1, 2, 3..."
              min="1"
              disabled={isSubmitting}
              style={{ 
                flex: 1, 
                padding: '4px', 
                boxSizing: 'border-box',
                border: agentExists === false ? '2px solid #dc3545' : agentExists === true ? '2px solid #28a745' : '1px solid #ccc'
              }}
            />
            {isValidatingAgent && (
              <span style={{ fontSize: '12px', color: '#666' }}>⏳</span>
            )}
            {!isValidatingAgent && agentExists === true && (
              <span style={{ fontSize: '14px', color: '#28a745' }} title="Agent Verified">✅</span>
            )}
            {!isValidatingAgent && agentExists === false && (
              <span style={{ fontSize: '14px', color: '#dc3545' }} title="Agent Not Found">❌</span>
            )}
          </div>
          {/* Mensaje de validación */}
          {agentValidationError && (
            <div style={{ 
              marginTop: '4px', 
              padding: '4px 8px', 
              backgroundColor: '#ffebee', 
              border: '1px solid #dc3545', 
              fontSize: '10px', 
              color: '#721c24' 
            }}>
              {agentValidationError}
            </div>
          )}
          {agentExists === true && !agentValidationError && (
            <div style={{ 
              marginTop: '4px', 
              padding: '4px 8px', 
              backgroundColor: '#e8f5e9', 
              border: '1px solid #28a745', 
              fontSize: '10px', 
              color: '#155724' 
            }}>
              ✓ Agent Verified
            </div>
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Score (0 to 100):</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: '3rem', textAlign: 'right', fontWeight: 'bold' }}>{score}</span>
          </div>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            min="0"
            max="100"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Tags en la misma fila */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Tag 1 (optional):</label>
            <input
              type="text"
              value={tag1}
              onChange={(e) => setTag1(e.target.value)}
              placeholder="e.g., performance..."
              disabled={isSubmitting}
              style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Tag 2 (optional):</label>
            <input
              type="text"
              value={tag2}
              onChange={(e) => setTag2(e.target.value)}
              placeholder="e.g., reliability..."
              disabled={isSubmitting}
              style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Endpoint (optional):</label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="API endpoint or URL..."
            disabled={isSubmitting}
            style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Feedback URI (optional):</label>
          <input
            type="text"
            value={feedbackURI}
            onChange={(e) => setFeedbackURI(e.target.value)}
            placeholder="IPFS hash or URI..."
            disabled={isSubmitting}
            style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Feedback Hash (optional):</label>
          <input
            type="text"
            value={feedbackHash}
            onChange={(e) => setFeedbackHash(e.target.value)}
            placeholder="bytes32 hash..."
            disabled={isSubmitting}
            style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Mensaje de éxito */}
        {successMessage && (
          <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#d4edda', border: '2px solid #28a745', borderRadius: '4px' }}>
            <p style={{ fontWeight: 'bold', color: '#155724', margin: 0, marginBottom: '4px' }}>✅ {successMessage}</p>
            {transactionHash && (
              <p style={{ fontSize: '12px', margin: 0, color: '#155724' }}>
                <strong>Transaction Hash:</strong>{' '}
                <a
                  href={getExplorerUrl(transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0066cc', textDecoration: 'underline' }}
                >
                  {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </a>
                {' '}
                <span style={{ color: '#666' }}>(View on {NETWORK_CONFIG.name} Explorer)</span>
              </p>
            )}
          </div>
        )}

        {/* Mensaje de error */}
        {errorMessage && (
          <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f8d7da', border: '2px solid #dc3545', borderRadius: '4px' }}>
            <p style={{ fontWeight: 'bold', color: '#721c24', margin: 0, marginBottom: '4px' }}>❌ Error</p>
            <p style={{ fontSize: '12px', margin: 0, color: '#721c24' }}>{errorMessage}</p>
          </div>
        )}

        {/* Nota informativa al final del scroll */}
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>ℹ️ Note: ERC-8004 v1.1 simplified logic - no signature required!</p>
        </div>
      </div>

      {/* 3. FOOTER (Botón) - ESTO NUNCA SE MUEVE */}
      <div style={{ 
        height: '60px',
        flexShrink: 0,
        padding: '10px',
        borderTop: '2px solid #fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#c0c0c0',
        boxSizing: 'border-box'
      }}>
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || agentExists === false || isValidatingAgent}
          type="button"
          style={{
            width: '100%',
            height: '40px',
            fontWeight: 'bold',
            cursor: (isSubmitting || agentExists === false || isValidatingAgent) ? 'not-allowed' : 'pointer',
            backgroundColor: (isSubmitting || agentExists === false || isValidatingAgent) ? '#999' : '#c0c0c0',
            border: '2px outset white',
            color: '#000',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        >
          {isSubmitting ? 'SENDING...' : isValidatingAgent ? 'VALIDATING...' : agentExists === false ? '❌ AGENT NOT FOUND' : '✅ SUBMIT RATING NOW'}
        </button>
      </div>

      {/* Transaction Monitor Modal */}
      {transactionPhase && (
        <TransactionMonitor
          phase={transactionPhase}
          transactionHash={transactionHash}
          errorMessage={errorMessage}
          onClose={() => {
            setTransactionPhase(null);
            setErrorMessage(null);
            if (transactionPhase === 'error') {
              // Si hubo error, mantener el hash si existe para debugging
              // pero limpiar el estado de error
            }
          }}
        />
      )}
    </div>
  );
}
