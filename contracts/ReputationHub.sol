// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistry {
    function isAgent(address agent) external view returns (bool);
}

/// @title ReputationHub
/// @notice Sistema de reputacion on-chain entre agentes registrados.
contract ReputationHub {
    IAgentRegistry public immutable agentRegistry;

    // score total acumulado por agente calificado
    mapping(address => int256) public totalScore;
    // cantidad de ratings recibidos por agente
    mapping(address => uint256) public ratingCount;
    // rating que un rater ha dado a un ratee: rater => ratee => score
    mapping(address => mapping(address => int32)) public ratings;

    event Rated(
        address indexed rater,
        address indexed ratee,
        int32 previousScore,
        int32 newScore
    );

    constructor(address _agentRegistry) {
        require(_agentRegistry != address(0), "ReputationHub: registry cero");
        agentRegistry = IAgentRegistry(_agentRegistry);
    }

    modifier onlyAgent() {
        require(agentRegistry.isAgent(msg.sender), "ReputationHub: caller no es agente");
        _;
    }

    /// @notice Emite o actualiza una calificacion hacia otro agente.
    /// @param ratee Agente que recibe la calificacion.
    /// @param score Puntuacion entre -100 y 100.
    function rate(address ratee, int32 score) external onlyAgent {
        require(agentRegistry.isAgent(ratee), "ReputationHub: ratee no es agente");
        require(ratee != msg.sender, "ReputationHub: no puedes calificarte a ti mismo");
        require(score >= -100 && score <= 100, "ReputationHub: score fuera de rango");

        int32 previous = ratings[msg.sender][ratee];

        if (previous == 0 && score != 0) {
            // Nuevo rating distinto de cero
            ratings[msg.sender][ratee] = score;
            totalScore[ratee] += int256(int32(score));
            ratingCount[ratee] += 1;
        } else if (previous != 0 && score == 0) {
            // "Retirar" rating previamente dado
            ratings[msg.sender][ratee] = 0;
            totalScore[ratee] -= int256(previous);
            ratingCount[ratee] -= 1;
        } else if (previous != 0 && score != previous) {
            // Actualizar rating existente
            ratings[msg.sender][ratee] = score;
            // ajustar total: quitar anterior, sumar nuevo
            totalScore[ratee] = totalScore[ratee] - int256(previous) + int256(score);
        } else {
            // previous == score (no cambio real) -> no hace nada
            revert("ReputationHub: score sin cambio");
        }

        emit Rated(msg.sender, ratee, previous, score);
    }

    /// @notice Obtiene la reputacion agregada de un agente.
    /// @return average Promedio (puede ser negativo).
    /// @return count Numero de ratings.
    /// @return total Suma total de scores.
    function getReputation(address agent)
        external
        view
        returns (int256 average, uint256 count, int256 total)
    {
        count = ratingCount[agent];
        total = totalScore[agent];
        if (count == 0) {
            return (0, 0, 0);
        }
        // promedio con 2 decimales de precision (p.ej. 375 = 3.75)
        average = (total * 100) / int256(uint256(count));
    }
}
