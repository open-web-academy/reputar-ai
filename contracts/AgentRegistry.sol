// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentRegistry
/// @notice Registro simple de agentes para un sistema tipo ERC-8004.
///         Cada agente está ligado a una dirección EVM.
contract AgentRegistry {
    struct Agent {
        // Dirección del agente (igual a la llave de mapping, pero útil si en el futuro
        // quieres soportar agentes no-EOA o contratos.
        address agentAddress;
        // URI a metadata off-chain (JSON con info del agente, tipo, descripción, etc.)
        string metadataURI;
        // Hash de la clave pública / identidad del agente (opcional).
        bytes32 pubKeyHash;
        // Momento de registro.
        uint256 registeredAt;
        // Estado del agente.
        bool active;
    }

    // address => Agent
    mapping(address => Agent) private _agents;

    // Para poder iterar en front si quieres (no estrictamente necesario para el MVP).
    address[] private _agentList;

    event AgentRegistered(address indexed agent, string metadataURI, bytes32 pubKeyHash);
    event AgentUpdated(address indexed agent, string metadataURI, bytes32 pubKeyHash);
    event AgentStatusChanged(address indexed agent, bool active);

    /// @notice Registra un nuevo agente.
    /// @param metadataURI URI a los datos del agente (IPFS, HTTPS, etc.)
    /// @param pubKeyHash Hash de la clave pública o identificador criptográfico.
    function registerAgent(string calldata metadataURI, bytes32 pubKeyHash) external {
        Agent storage a = _agents[msg.sender];

        if (a.registeredAt != 0) {
            // El agente ya existía. Verificamos que no esté activo actualmente.
            require(!a.active, "AgentRegistry: ya activo");

            // Reactivamos y actualizamos datos
            a.metadataURI = metadataURI;
            a.pubKeyHash = pubKeyHash;
            a.active = true;

            emit AgentUpdated(msg.sender, metadataURI, pubKeyHash);
            emit AgentStatusChanged(msg.sender, true);
        } else {
            // Primera vez que se registra
            a.agentAddress = msg.sender;
            a.metadataURI = metadataURI;
            a.pubKeyHash = pubKeyHash;
            a.registeredAt = block.timestamp;
            a.active = true;

            _agentList.push(msg.sender);
            emit AgentRegistered(msg.sender, metadataURI, pubKeyHash);
        }
    }

    /// @notice Actualiza metadata y/o pubKeyHash del agente.
    /// @dev Solo el propio agente puede actualizar sus datos.
    function updateAgent(string calldata metadataURI, bytes32 pubKeyHash) external {
        Agent storage a = _agents[msg.sender];
        require(a.active, "AgentRegistry: agente no registrado o inactivo");

        a.metadataURI = metadataURI;
        a.pubKeyHash = pubKeyHash;

        emit AgentUpdated(msg.sender, metadataURI, pubKeyHash);
    }

    /// @notice Cambia el estado activo/inactivo del agente.
    function setAgentActive(bool active) external {
        Agent storage a = _agents[msg.sender];
        require(a.agentAddress != address(0), "AgentRegistry: agente no registrado");

        a.active = active;

        emit AgentStatusChanged(msg.sender, active);
    }

    /// @notice Devuelve true si una address es un agente activo.
    function isAgent(address agent) public view returns (bool) {
        return _agents[agent].active;
    }

    /// @notice Obtiene la estructura completa del agente.
    function getAgent(address agent) external view returns (Agent memory) {
        require(_agents[agent].agentAddress != address(0), "AgentRegistry: agente inexistente");
        return _agents[agent];
    }

    /// @notice Devuelve la lista de todas las direcciones de agentes registrados.
    /// @dev Para demo/hackathon está bien; en producción podrías paginar.
    function getAllAgents() external view returns (address[] memory) {
        return _agentList;
    }
}
