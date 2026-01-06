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
      const startBlock = networkConfig?.deploymentBlock || 0;
      
      console.log(`🔍 [Feedback] Fetching feedback on chain ${currentNetworkId} starting from block ${startBlock}...`);
      console.log(`🔍 [Feedback] Querying events for Agent #${agentId} from block ${startBlock} to latest...`);

      let events: ethers.Log[] = [];
      
      try {
        const newFeedbackFilter = reputationRegistry.filters.NewFeedback(agentId);
        events = await reputationRegistry.queryFilter(newFeedbackFilter, startBlock, 'latest');
        console.log(`📡 [Feedback] Found ${events.length} NewFeedback events`);
      } catch (newFeedbackError: any) {
        console.log(`⚠️ [Feedback] NewFeedback event not found, trying FeedbackGiven...`);
        
        try {
          const feedbackGivenFilter = reputationRegistry.filters.FeedbackGiven(agentId);
          events = await reputationRegistry.queryFilter(feedbackGivenFilter, startBlock, 'latest');
          console.log(`📡 [Feedback] Found ${events.length} FeedbackGiven events`);
        } catch (feedbackGivenError: any) {
          console.warn(`⚠️ [Feedback] Neither event type found:`, feedbackGivenError.message);
          events = [];
        }
      }

      const processedReviews: Review[] = [];

      for (const event of events) {
        try {
          const decodedEvent = reputationRegistry.interface.parseLog({
            topics: event.topics as string[],
            data: event.data
          });

          if (!decodedEvent) {
            console.warn(`⚠️ [Feedback] Could not decode event:`, event);
            continue;
          }

          const args = decodedEvent.args;
          if (!args || args.length === 0) {
            continue;
          }

          const isNewFeedback = decodedEvent.name === 'NewFeedback';
          
          const client = isNewFeedback 
            ? (args.clientAddress || args[1])
            : (args.rater || args[1]);
          
          const score = Number(args.score || args[2] || 0);
          const tag1Bytes = args.tag1 || args[3] || ethers.ZeroHash;
          const tag2Bytes = args.tag2 || args[4] || ethers.ZeroHash;
          const fileuri = args.fileuri || args[5] || '';
          const filehash = isNewFeedback ? (args.filehash || args[6] || '') : undefined;

          let tag = '';
          try {
            if (tag1Bytes !== ethers.ZeroHash && tag1Bytes) {
              tag = ethers.decodeBytes32String(tag1Bytes);
            } else if (tag2Bytes !== ethers.ZeroHash && tag2Bytes) {
              tag = ethers.decodeBytes32String(tag2Bytes);
            }
          } catch (e) {
            if (tag1Bytes !== ethers.ZeroHash) {
              tag = `${tag1Bytes.slice(0, 10)}...`;
            }
          }

          processedReviews.push({
            client: client,
            score: score,
            tag: tag,
            tag1: tag1Bytes,
            tag2: tag2Bytes,
            fileuri: fileuri,
            filehash: filehash,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
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
