import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { rateAgent, RateAgentParams } from '../utils/reputation';
import { NETWORK_CONFIG } from '../utils/contracts';

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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { isConnected, signer } = useWallet();

  const resetForm = () => {
    setRateeAgentId(agentId || '');
    setScore(50);
    setTag1('');
    setTag2('');
    setEndpoint('');
    setFeedbackURI('');
    setFeedbackHash('');
  };

  const handleSubmit = async () => {
    setSuccessMessage(null);
    setTransactionHash(null);
    setErrorMessage(null);

    if (!isConnected || !signer) {
      setErrorMessage('Error: Please connect your wallet first');
      return;
    }

    if (!rateeAgentId || isNaN(Number(rateeAgentId))) {
      setErrorMessage('Error: Please enter a valid Agent ID (number)');
      return;
    }

    if (score < 0 || score > 100) {
      setErrorMessage('Error: Score must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const params: RateAgentParams = {
        agentId: rateeAgentId,
        score: score,
        tag1: tag1 || undefined,
        tag2: tag2 || undefined,
        endpoint: endpoint || undefined,
        feedbackURI: feedbackURI || undefined,
        feedbackHash: feedbackHash || undefined,
        signer: signer
      };

      const result = await rateAgent(params);

      if (result.success && result.transactionHash) {
        setSuccessMessage('¡Calificación enviada!');
        setTransactionHash(result.transactionHash);
        resetForm();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(result.error || 'Failed to submit rating');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setErrorMessage(`Error: ${error.message}`);
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
          <input
            type="number"
            value={rateeAgentId}
            onChange={(e) => setRateeAgentId(e.target.value)}
            placeholder="1, 2, 3..."
            min="1"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
          />
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
          disabled={isSubmitting}
          type="button"
          style={{
            width: '100%',
            height: '40px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            backgroundColor: isSubmitting ? '#999' : '#c0c0c0',
            border: '2px outset white',
            color: '#000',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        >
          {isSubmitting ? 'SENDING...' : '✅ SUBMIT RATING NOW'}
        </button>
      </div>
    </div>
  );
}
