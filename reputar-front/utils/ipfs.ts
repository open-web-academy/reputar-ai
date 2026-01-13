/**
 * Utilidades para interactuar con IPFS usando Pinata
 */

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

export interface PinataConnectionResult {
  success: boolean;
  authenticated: boolean;
  error?: string;
}

/**
 * Sube un objeto JSON a IPFS usando Pinata (pinJSONToIPFS)
 * 
 * @param metadata - Objeto JSON a subir (metadata del agente)
 * @returns Resultado con el hash IPFS o error
 */
export async function uploadToIPFS(metadata: Record<string, any>): Promise<IPFSUploadResult> {
  try {
    // Obtener las credenciales de Pinata desde las variables de entorno
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_API_KEY in your .env.local file');
    }

    // Preparar el payload para pinJSONToIPFS
    const pinataContent = {
      pinataContent: metadata,
      pinataMetadata: {
        name: metadata.name || 'Agent Metadata',
        keyvalues: {
          type: 'agent-metadata',
          standard: 'ERC-721'
        }
      },
      pinataOptions: {
        cidVersion: 1,
        wrapWithDirectory: false
      }
    };

    // Hacer la petición POST a Pinata usando pinJSONToIPFS
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinataContent),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    if (!data.IpfsHash) {
      throw new Error('Pinata response missing IPFS hash');
    }

    const ipfsHash = data.IpfsHash;
    const ipfsUrl = `ipfs://${ipfsHash}`;

    console.log(`✅ Metadata uploaded to IPFS: ${ipfsUrl}`);

    return {
      success: true,
      ipfsHash,
      ipfsUrl,
    };
  } catch (error: unknown) {
    console.error('❌ Error uploading to IPFS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Prueba la conexión con Pinata verificando las credenciales API
 * 
 * @returns Resultado de la prueba de autenticación
 */
export async function testPinataConnection(): Promise<PinataConnectionResult> {
  try {
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      return {
        success: false,
        authenticated: false,
        error: 'Pinata API keys not configured. Please set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_API_KEY in your .env.local file',
      };
    }

    // Hacer petición GET al endpoint de prueba de autenticación de Pinata
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      // Pinata retorna { authenticated: true } si las credenciales son válidas
      if (data.authenticated === true) {
        return {
          success: true,
          authenticated: true,
        };
      } else {
        return {
          success: false,
          authenticated: false,
          error: 'Authentication failed: Invalid API keys',
        };
      }
    } else if (response.status === 401) {
      return {
        success: false,
        authenticated: false,
        error: 'Invalid API Keys (401 Unauthorized)',
      };
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        authenticated: false,
        error: `Pinata connection failed: ${errorData.error || response.statusText}`,
      };
    }
  } catch (error: unknown) {
    console.error('❌ Error testing Pinata connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      authenticated: false,
      error: errorMessage,
    };
  }
}

/**
 * Construye el objeto de metadata estándar ERC-721
 * 
 * @param name - Nombre del agente
 * @param description - Descripción del agente
 * @param externalUrl - URL externa (opcional)
 * @param tags - Tags separados por comas (opcional)
 * @returns Objeto de metadata ERC-721
 */
export function buildAgentMetadata(
  name: string,
  description: string,
  externalUrl?: string,
  tags?: string
): Record<string, any> {
  const metadata: Record<string, any> = {
    name,
    description,
  };

  if (externalUrl && externalUrl.trim() !== '') {
    metadata.external_url = externalUrl;
  }

  // Agregar attributes si hay tags
  if (tags && tags.trim() !== '') {
    metadata.attributes = [
      {
        trait_type: 'Tags',
        value: tags,
      },
    ];
  }

  return metadata;
}


