"use client";

import React, { useState } from 'react';
import { useAgentFeedback, Review } from '../hooks/useAgentFeedback';

interface AgentReviewsListProps {
  agentId: number | string;
}

export default function AgentReviewsList({ agentId }: AgentReviewsListProps) {
  const { reviews, loading, error } = useAgentFeedback(agentId);
  const [expandedFileuri, setExpandedFileuri] = useState<number | null>(null);

  const shortenAddress = (addr: string): string => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const renderScoreBar = (score: number) => {
    const percentage = Math.max(0, Math.min(100, score));
    const color = percentage >= 70 ? '#00FF00' : percentage >= 40 ? '#FFFF00' : '#FF0000';
    
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '8px',
            backgroundColor: '#e0e0e0',
            border: '1px solid #808080',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: color,
              transition: 'none',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '8px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#000',
            minWidth: '30px',
            textAlign: 'right',
          }}
        >
          {score}/100
        </span>
      </div>
    );
  };

  const getFileuriType = (fileuri: string): 'ipfs' | 'http' | 'text' | 'unknown' => {
    if (!fileuri || fileuri.trim() === '') return 'unknown';
    if (fileuri.startsWith('ipfs://')) return 'ipfs';
    if (fileuri.startsWith('http://') || fileuri.startsWith('https://')) return 'http';
    if (fileuri.length < 200 && !fileuri.includes('://')) return 'text';
    return 'unknown';
  };

  const getIpfsUrl = (uri: string): string => {
    if (!uri || uri.trim() === '') return '';
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    
    let hash = '';
    if (uri.startsWith('ipfs://')) {
      hash = uri.replace('ipfs://', '').trim();
    } else if (uri.startsWith('Qm') || uri.startsWith('baf')) {
      hash = uri.trim();
    } else {
      return uri;
    }
    
    return `https://dweb.link/ipfs/${hash}`;
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '4px',
          fontSize: '8px',
          color: '#808080',
          fontStyle: 'italic',
        }}
      >
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '4px',
          fontSize: '8px',
          color: '#FF0000',
          backgroundColor: '#FFE0E0',
          border: '1px solid #FF0000',
        }}
      >
        ⚠️ Error: {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div
        style={{
          padding: '4px',
          fontSize: '8px',
          color: '#808080',
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        No ratings yet
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '2px',
      }}
    >
      {reviews.map((review: Review, index: number) => {
        const fileuriType = getFileuriType(review.fileuri);
        const isExpanded = expandedFileuri === index;
        
        return (
          <div
            key={`${review.client}-${review.transactionHash || index}`}
            style={{
              padding: '4px',
              backgroundColor: '#f8f8f8',
              border: '1px solid #c0c0c0',
              fontSize: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {/* Header: Usuario y dirección */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '10px' }}>👤</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '8px',
                  color: '#000080',
                  fontWeight: 'bold',
                }}
                title={review.client}
              >
                {shortenAddress(review.client)}
              </span>
            </div>

            {/* Score bar */}
            {renderScoreBar(review.score)}

            {/* Tag (si existe) */}
            {review.tag && review.tag.trim() !== '' && (
              <div
                style={{
                  marginTop: '2px',
                  padding: '1px 3px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #808080',
                  fontSize: '7px',
                  display: 'inline-block',
                  maxWidth: 'fit-content',
                }}
              >
                Tag: {review.tag}
              </div>
            )}

            {/* Fileuri / Evidence */}
            {review.fileuri && review.fileuri.trim() !== '' && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '3px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #808080',
                  fontSize: '7px',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '2px',
                    color: '#000080',
                  }}
                >
                  Evidence:
                </div>
                
                {fileuriType === 'ipfs' && (
                  <div>
                    <a
                      href={getIpfsUrl(review.fileuri)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#0000ff',
                        textDecoration: 'underline',
                        fontSize: '7px',
                        wordBreak: 'break-all',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      📎 View on IPFS: {review.fileuri.slice(0, 30)}...
                    </a>
                  </div>
                )}
                
                {fileuriType === 'http' && (
                  <div>
                    <a
                      href={review.fileuri}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#0000ff',
                        textDecoration: 'underline',
                        fontSize: '7px',
                        wordBreak: 'break-all',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 {review.fileuri}
                    </a>
                  </div>
                )}
                
                {(fileuriType === 'text' || fileuriType === 'unknown') && (
                  <div>
                    <button
                      onClick={() => setExpandedFileuri(isExpanded ? null : index)}
                      style={{
                        fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
                        fontSize: '7px',
                        padding: '1px 4px',
                        backgroundColor: '#c0c0c0',
                        border: '1px solid #808080',
                        cursor: 'pointer',
                        marginBottom: isExpanded ? '2px' : '0',
                      }}
                    >
                      {isExpanded ? '▼ Hide' : '▶ Show'} Details
                    </button>
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '2px',
                          padding: '2px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #c0c0c0',
                          fontSize: '7px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: '100px',
                          overflowY: 'auto',
                        }}
                      >
                        {review.fileuri}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Transaction hash (si existe) */}
            {review.transactionHash && (
              <div
                style={{
                  marginTop: '2px',
                  fontSize: '6px',
                  color: '#808080',
                  fontFamily: 'monospace',
                }}
              >
                TX: {review.transactionHash.slice(0, 10)}...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
