import React from 'react';
import { NETWORK_CONFIG } from '../utils/contracts';

export type TransactionPhase = 'uploading' | 'signing' | 'mining' | 'success' | 'error';

interface TransactionMonitorProps {
  phase: TransactionPhase;
  transactionHash?: string | null;
  errorMessage?: string | null;
  onClose?: () => void;
}

/**
 * Componente estilo Windows 95 para monitorear el estado de una transacción blockchain
 * Muestra 3 fases: Signing, Mining, Success/Error
 */
export default function TransactionMonitor({ 
  phase, 
  transactionHash, 
  errorMessage,
  onClose 
}: TransactionMonitorProps) {
  const getPhaseInfo = () => {
    switch (phase) {
      case 'uploading':
        return {
          icon: '📡',
          title: 'Uploading metadata to IPFS...',
          message: 'Please wait while we upload your agent metadata to IPFS.',
          color: '#9c27b0',
          bgColor: '#f3e5f5'
        };
      case 'signing':
        return {
          icon: '🟡',
          title: 'Please sign in your wallet...',
          message: 'Waiting for you to confirm the transaction in your wallet.',
          color: '#ffa500',
          bgColor: '#fff8e1'
        };
      case 'mining':
        return {
          icon: '⛏️',
          title: 'Transaction Sent. Mining...',
          message: transactionHash 
            ? `Transaction submitted. Waiting for blockchain confirmation.`
            : 'Transaction submitted. Waiting for blockchain confirmation.',
          color: '#2196f3',
          bgColor: '#e3f2fd'
        };
      case 'success':
        return {
          icon: '✅',
          title: 'Success!',
          message: 'Transaction confirmed on the blockchain.',
          color: '#4caf50',
          bgColor: '#e8f5e9'
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Transaction Failed',
          message: errorMessage || 'An error occurred during the transaction.',
          color: '#f44336',
          bgColor: '#ffebee'
        };
      default:
        return {
          icon: '⏳',
          title: 'Processing...',
          message: 'Please wait...',
          color: '#757575',
          bgColor: '#f5f5f5'
        };
    }
  };

  const phaseInfo = getPhaseInfo();
  const getExplorerUrl = (txHash: string) => {
    return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
      }}
      onClick={(e) => {
        // Cerrar al hacer clic fuera del modal (solo si no es error o success)
        if (e.target === e.currentTarget && (phase === 'error' || phase === 'success')) {
          onClose?.();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#c0c0c0',
          border: '2px solid',
          borderColor: '#ffffff #808080 #808080 #ffffff',
          boxShadow: 'inset 1px 1px 0px 0px #000000, inset -1px -1px 0px 0px #ffffff',
          padding: '0',
          minWidth: '400px',
          maxWidth: '500px',
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header estilo Windows 95 */}
        <div
          style={{
            backgroundColor: '#000080',
            color: '#ffffff',
            padding: '4px 8px',
            fontWeight: 'bold',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #808080',
          }}
        >
          <span>Transaction Monitor</span>
          {(phase === 'error' || phase === 'success') && onClose && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#c0c0c0',
                border: '1px solid',
                borderColor: '#808080 #ffffff #ffffff #808080',
                color: '#000',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '1px 6px',
                fontWeight: 'bold',
                fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.borderColor = '#808080 #808080 #808080 #808080';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.borderColor = '#808080 #ffffff #ffffff #808080';
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#c0c0c0',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Icono y título */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: phaseInfo.bgColor,
              border: '2px solid',
              borderColor: phaseInfo.color,
            }}
          >
            <span style={{ fontSize: '32px' }}>{phaseInfo.icon}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: phaseInfo.color,
                  marginBottom: '4px',
                }}
              >
                {phaseInfo.title}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#000',
                }}
              >
                {phaseInfo.message}
              </div>
            </div>
          </div>

          {/* Transaction Hash (si está disponible) */}
          {transactionHash && phase !== 'signing' && (
            <div
              style={{
                padding: '10px',
                backgroundColor: '#ffffff',
                border: '1px inset #808080',
                fontSize: '10px',
              }}
            >
              <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                Transaction Hash:
              </div>
              <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '8px' }}>
                {transactionHash}
              </div>
              <a
                href={getExplorerUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0000ff',
                  textDecoration: 'underline',
                  fontSize: '10px',
                }}
              >
                View on {NETWORK_CONFIG.name} Explorer ↗
              </a>
            </div>
          )}

          {/* Error details (si hay error) */}
          {phase === 'error' && errorMessage && (
            <div
              style={{
                padding: '10px',
                backgroundColor: '#ffebee',
                border: '2px solid #f44336',
                fontSize: '11px',
                color: '#721c24',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Error Details:</div>
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Botón de acción (solo en error o success) */}
          {(phase === 'error' || phase === 'success') && onClose && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={onClose}
                style={{
                  fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                  fontSize: '11px',
                  padding: '4px 16px',
                  backgroundColor: '#c0c0c0',
                  border: '2px outset #c0c0c0',
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#808080',
                  borderBottomColor: '#808080',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#000',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.borderStyle = 'inset';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.borderStyle = 'outset';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderStyle = 'outset';
                }}
              >
                {phase === 'success' ? 'OK' : 'Close'}
              </button>
            </div>
          )}

          {/* Loading indicator (para uploading, signing y mining) */}
          {(phase === 'uploading' || phase === 'signing' || phase === 'mining') && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                fontSize: '10px',
                color: '#666',
              }}
            >
              <span style={{ marginRight: '8px' }}>⏳</span>
              <span>Please wait...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

