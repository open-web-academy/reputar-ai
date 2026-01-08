"use client";

import React, { useState } from 'react';
import { Agent } from '../hooks/useFetchAgents';
import { IDENTITY_REGISTRY_ADDRESS } from '../utils/contracts';
import { useNetwork } from '../contexts/NetworkContext';
import { getNetworkBlockExplorer, getNetworkName } from '../utils/networks';
import AgentReviewsList from './AgentReviewsList';

interface AgentCardProps {
  agent: Agent;
  isActive?: boolean; // Prop para indicar si el agente está activo
}

/**
 * Componente de tarjeta estilo Windows 95 para mostrar información de un agente
 * Con estados colapsado/expandido
 */
export default function AgentCard({ agent, isActive = true }: AgentCardProps) {
  const { currentNetworkId } = useNetwork();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedEndpointIndex, setCopiedEndpointIndex] = useState<number | null>(null);
  const [copiedOwnerAddress, setCopiedOwnerAddress] = useState(false);
  
  const blockExplorer = getNetworkBlockExplorer(currentNetworkId) || 'https://sepolia.etherscan.io';
  const networkName = getNetworkName(currentNetworkId);
  
  const agentName = agent.name && agent.name.trim() !== '' && !agent.name.toLowerCase().includes('metadata error')
    ? agent.name 
    : `Agent #${agent.tokenId}`;
  
  const agentDescription = agent.description && agent.description.trim() !== ''
    ? agent.description 
    : 'No description provided.';
  
  const agentImage = agent.imageUrl || null;
  
  const hasMetadataError = agent.metadata?.metadataFailed === true || 
                           !agent.name || 
                           agent.name.toLowerCase().includes('metadata error') ||
                           agent.name.toLowerCase() === 'unknown';
  
  const reputationScore = agent.reputation !== null && agent.reputation !== undefined 
    ? agent.reputation 
    : (agent.reputationScore || 0);
  const reputationCount = agent.reputationCount || 0;

  const capabilities: string[] = [];
  if (agent.metadata) {
    const metadata = agent.metadata;
    if (metadata.tags && Array.isArray(metadata.tags)) {
      capabilities.push(...metadata.tags);
    } else if (metadata.capabilities && Array.isArray(metadata.capabilities)) {
      capabilities.push(...metadata.capabilities);
    }
  }

  const endpoints = agent.endpoints || [];
  
  if (endpoints.length === 0 && agent.metadataURI) {
    endpoints.push(agent.metadataURI);
  }

  /**
   * Acorta una dirección Ethereum al formato 0x1234...ABCD
   */
  const shortenAddress = (addr: string): string => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyOwnerAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedOwnerAddress(true);
      setTimeout(() => {
        setCopiedOwnerAddress(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy address:', err);
      alert(`Address copied to clipboard:\n${address}`);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCopyEndpoint = async (endpoint: string, index: number) => {
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopiedEndpointIndex(index);
      setTimeout(() => {
        setCopiedEndpointIndex(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy endpoint:', err);
      // Fallback para navegadores antiguos
      alert(`Endpoint copiado al portapapeles:\n${endpoint}`);
    }
  };

  const getEndpointType = (url: string): string => {
    if (url.includes('api') || url.includes('/api/')) return 'API';
    if (url.includes('http://')) return 'HTTP';
    if (url.includes('https://')) return 'HTTPS';
    if (url.includes('ipfs://')) return 'IPFS';
    if (url.includes('ipfs.io')) return 'IPFS';
    return 'URL';
  };

  return (
    <div
      className="win95-card"
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid',
        borderColor: '#808080 #ffffff #ffffff #808080',
        padding: '3px',
        fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
        fontSize: '10px',
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: isExpanded ? 'auto' : '140px',
        cursor: 'default',
        transition: 'none',
      }}
      onMouseEnter={(e) => {
        // Efecto hover: invierte los bordes (botón presionado)
        e.currentTarget.style.borderColor = '#ffffff #808080 #808080 #ffffff';
        e.currentTarget.style.backgroundColor = '#f0f0f0';
      }}
      onMouseLeave={(e) => {
        // Restaura los bordes originales
        e.currentTarget.style.borderColor = '#808080 #ffffff #ffffff #808080';
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      {/* Header con ícono y nombre */}
      <div
        className="win95-header"
        style={{
          backgroundColor: '#000080',
          color: '#fff',
          padding: '1px 3px',
          fontWeight: 'bold',
          marginBottom: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Indicador de estado (Status Light) */}
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#00FF00' : '#808080',
              border: '1px solid',
              borderStyle: 'inset',
              borderColor: isActive ? '#00CC00' : '#606060',
              flexShrink: 0,
              boxShadow: isActive ? '0 0 2px #00FF00, inset 0 0 2px rgba(0,0,0,0.3)' : 'inset 0 0 2px rgba(0,0,0,0.3)',
            }}
            title={isActive ? 'Activo' : 'Inactivo'}
          />
          {/* Ícono/Avatar del agente */}
          {agentImage ? (
            <img
              src={agentImage}
              alt={agentName}
              style={{
                width: '24px',
                height: '24px',
                border: '1px solid #fff',
                imageRendering: 'pixelated' as React.CSSProperties['imageRendering'],
                objectFit: 'cover',
              }}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const emoji = document.createElement('span');
                  emoji.textContent = hasMetadataError ? '⚠️' : '🤖';
                  emoji.style.fontSize = '18px';
                  parent.insertBefore(emoji, target);
                }
              }}
            />
          ) : (
            <span style={{ fontSize: '18px', lineHeight: '1' }} title={hasMetadataError ? 'Metadata unavailable' : 'Agent'}>
              {hasMetadataError ? '⚠️' : '🤖'}
            </span>
          )}
          <span style={{ fontSize: '10px' }}>{agentName}</span>
          {hasMetadataError && (
            <span style={{ fontSize: '7px', opacity: 0.7, marginLeft: '4px' }} title="Metadata unavailable">
              ⚠️
            </span>
          )}
          {hasMetadataError && (
            <span style={{ fontSize: '7px', opacity: 0.7, marginLeft: '4px' }} title="Metadata unavailable">
              ⚠️
            </span>
          )}
        </div>
        <span style={{ fontSize: '8px', opacity: 0.9 }}>ID: {agent.tokenId}</span>
      </div>

      {/* Body - Contenido principal */}
      <div
        className="win95-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Reputación - Siempre visible y destacada */}
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 6px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #c0c0c0',
          }}
        >
          <div
            style={{
              fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '8px', marginBottom: '1px', color: '#808080' }}>
              Reputation:
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000080', lineHeight: 1 }}>
              {reputationScore !== null ? reputationScore : 'N/A'}
              {reputationScore !== null && <span style={{ fontSize: '14px', color: '#808080' }}>/100</span>}
            </div>
            <div style={{ fontSize: '7px', color: '#505050', marginTop: '2px' }}>
              ({reputationCount} {reputationCount === 1 ? 'Rating' : 'Ratings'})
            </div>
          </div>
        </div>

        {/* Tags/Capabilities - Badges estilo retro */}
        {capabilities.length > 0 && (
          <div style={{ marginBottom: '2px', padding: '2px 4px' }}>
            <div style={{ fontSize: '8px', marginBottom: '2px', color: '#808080', fontWeight: 'bold' }}>
              Tags:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
              {capabilities.map((capability, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    padding: '2px 4px',
                    fontSize: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #000000',
                    color: '#000000',
                    fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                    marginRight: '2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descripción - Truncada si está colapsado */}
        <div
          style={{
            fontSize: '10px',
            color: '#000',
            lineHeight: 1.3,
            padding: '2px',
            minHeight: '30px',
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {agentDescription}
        </div>

        {/* Información expandida - Solo visible cuando isExpanded es true */}
        {isExpanded && (
          <div
            style={{
              marginTop: '4px',
              paddingTop: '4px',
              borderTop: '1px dotted #808080',
              fontSize: '9px',
            }}
          >
            {/* Token ID y Owner */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ marginBottom: '2px', fontWeight: 'bold', fontSize: '9px' }}>Token ID:</div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#000080' }}>
                {agent.tokenId}
              </div>
            </div>

            <div style={{ marginBottom: '4px' }}>
              <div style={{ marginBottom: '2px', fontWeight: 'bold', fontSize: '9px' }}>Owner:</div>
              <div
                onClick={() => handleCopyOwnerAddress(agent.owner)}
                title={agent.owner}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '8px',
                  color: copiedOwnerAddress ? '#008000' : '#000080',
                  cursor: 'pointer',
                  padding: '1px 2px',
                  backgroundColor: copiedOwnerAddress ? '#e0ffe0' : 'transparent',
                  border: copiedOwnerAddress ? '1px solid #008000' : '1px solid transparent',
                  display: 'inline-block',
                  transition: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!copiedOwnerAddress) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.border = '1px solid #c0c0c0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copiedOwnerAddress) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.border = '1px solid transparent';
                  }
                }}
              >
                {copiedOwnerAddress ? '✓ Copied' : shortenAddress(agent.owner)}
              </div>
            </div>

            {/* Capabilities */}
            {capabilities.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <div style={{ marginBottom: '2px', fontWeight: 'bold', fontSize: '9px' }}>Capabilities:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                  {capabilities.map((capability, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        padding: '1px 4px',
                        fontSize: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #808080',
                        color: '#000',
                        fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                      }}
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Endpoints */}
            {endpoints.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <div style={{ marginBottom: '2px', fontWeight: 'bold', fontSize: '9px' }}>Endpoints:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {endpoints.map((endpoint, index) => {
                    const endpointType = getEndpointType(endpoint);
                    const isCopied = copiedEndpointIndex === index;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '8px',
                          fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                        }}
                      >
                        <div
                          title={endpoint}
                          style={{
                            flex: 1,
                            fontSize: '8px',
                            color: '#000',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '1px 2px',
                            backgroundColor: isCopied ? '#e0ffe0' : '#ffffff',
                            border: '1px solid #c0c0c0',
                            minWidth: 0,
                          }}
                        >
                          <span style={{ fontWeight: 'bold', color: '#000' }}>[{endpointType}]</span>{' '}
                          {endpoint}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyEndpoint(endpoint, index);
                          }}
                          style={{
                            fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                            fontSize: '8px',
                            padding: '1px 4px',
                            backgroundColor: '#c0c0c0',
                            border: '2px solid',
                            borderStyle: isCopied ? 'inset' : 'outset',
                            borderTopColor: isCopied ? '#808080' : '#ffffff',
                            borderLeftColor: isCopied ? '#808080' : '#ffffff',
                            borderRightColor: isCopied ? '#ffffff' : '#808080',
                            borderBottomColor: isCopied ? '#ffffff' : '#808080',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            color: '#000',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseDown={(e) => {
                            if (!isCopied) {
                              e.currentTarget.style.borderStyle = 'inset';
                              e.currentTarget.style.borderTopColor = '#808080';
                              e.currentTarget.style.borderLeftColor = '#808080';
                              e.currentTarget.style.borderRightColor = '#ffffff';
                              e.currentTarget.style.borderBottomColor = '#ffffff';
                            }
                          }}
                          onMouseUp={(e) => {
                            if (!isCopied) {
                              e.currentTarget.style.borderStyle = 'outset';
                              e.currentTarget.style.borderTopColor = '#ffffff';
                              e.currentTarget.style.borderLeftColor = '#ffffff';
                              e.currentTarget.style.borderRightColor = '#808080';
                              e.currentTarget.style.borderBottomColor = '#808080';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCopied) {
                              e.currentTarget.style.borderStyle = 'outset';
                              e.currentTarget.style.borderTopColor = '#ffffff';
                              e.currentTarget.style.borderLeftColor = '#ffffff';
                              e.currentTarget.style.borderRightColor = '#808080';
                              e.currentTarget.style.borderBottomColor = '#808080';
                            }
                          }}
                          title="Copiar al portapapeles"
                        >
                          {isCopied ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Historial de Calificaciones */}
            <div style={{ marginTop: '6px', marginBottom: '6px', paddingTop: '4px', borderTop: '1px dotted #808080' }}>
              <div style={{ marginBottom: '4px', fontWeight: 'bold', fontSize: '9px' }}>Rating History:</div>
              <AgentReviewsList agentId={agent.tokenId} />
            </div>

            {/* Link al explorador */}
            <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dotted #808080' }}>
              <a
                href={`${blockExplorer}/token/${IDENTITY_REGISTRY_ADDRESS}?a=${agent.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0000ff',
                  textDecoration: 'underline',
                  fontSize: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                View on {networkName} Explorer ↗
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer con botón de expandir/colapsar */}
      <div
        className="win95-footer"
        style={{
          marginTop: '4px',
          borderTop: '1px dotted #808080',
          paddingTop: '3px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={toggleExpand}
          style={{
            fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
            fontSize: '9px',
            padding: '1px 6px',
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
          {isExpanded ? 'Less Info [-]' : 'More Info [+]'}
        </button>
      </div>
    </div>
  );
}
