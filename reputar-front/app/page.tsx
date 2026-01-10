"use client";

import React, { useState } from 'react';
import Taskbar from '../components/Taskbar';
import Window from '../components/Window';
import AgentRegister from '../components/AgentRegister';
import ReputationDashboard from '../components/ReputationDashboard';
import RateAgent from '../components/RateAgent';
import WalletConnect from '../components/WalletConnect';

import DesktopIcon from '../components/DesktopIcon';

export default function Desktop() {
  const [showRegister, setShowRegister] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRateAgent, setShowRateAgent] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  const bringToFront = (win: string) => setActiveWindow(win);

  return (
    <div className="w-full h-screen relative overflow-hidden text-black">
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-6" style={{ zIndex: 10 }}>
        <DesktopIcon
          label="Connect Wallet"
          iconSrc="https://win98icons.alexmeub.com/icons/png/key_win-0.png"
          onClick={() => { setShowWallet(true); bringToFront('wallet'); }}
        />

        <DesktopIcon
          label="Reputation Hub"
          iconSrc="https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-3.png"
          onClick={() => { setShowDashboard(true); bringToFront('dashboard'); }}
        />

        <DesktopIcon
          label="Register Agent"
          iconSrc="https://win98icons.alexmeub.com/icons/png/users-1.png"
          onClick={() => { setShowRegister(true); bringToFront('register'); }}
        />

        <DesktopIcon
          label="Submit Rating"
          iconSrc="https://win98icons.alexmeub.com/icons/png/certificate_application-0.png"
          onClick={() => { setShowRateAgent(true); bringToFront('rateagent'); }}
        />
      </div>

      {/* Windows */}
      {showWallet && (
        <Window
          title="Connect Wallet"
          onClose={() => setShowWallet(false)}
          isActive={activeWindow === 'wallet'}
          onFocus={() => bringToFront('wallet')}
          style={{ top: 50, left: 100, width: 450 }}
        >
          <WalletConnect onConnectionSuccess={() => setShowWallet(false)} />
        </Window>
      )}

      {showRegister && (
        <Window
          title="Agent Registration"
          onClose={() => setShowRegister(false)}
          isActive={activeWindow === 'register'}
          onFocus={() => bringToFront('register')}
          style={{ top: 80, left: 150 }}
        >
          <AgentRegister />
        </Window>
      )}

      {showDashboard && (
        <Window
          title="Agent Reputation Leaderboard (Multi-Chain)"
          onClose={() => setShowDashboard(false)}
          isActive={activeWindow === 'dashboard'}
          onFocus={() => bringToFront('dashboard')}
          style={{ 
            top: 110, 
            left: 200, 
            width: 'min(95vw, 1200px)', 
            height: 'min(90vh, 800px)',
            maxWidth: '1200px',
            maxHeight: '800px',
          }}
        >
          <ReputationDashboard />
        </Window>
      )}

      {showRateAgent && (
        <Window
          title="Submit Rating"
          onClose={() => setShowRateAgent(false)}
          isActive={activeWindow === 'rateagent'}
          onFocus={() => bringToFront('rateagent')}
          style={{ 
            position: 'fixed',
            top: '10%',
            left: '50%',
            transform: 'translate(-50%, 0)',
            maxHeight: '85vh',
            width: 'min(90vw, 500px)',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <RateAgent />
        </Window>
      )}

      <Taskbar
        onOpenRegister={() => { setShowRegister(true); bringToFront('register'); }}
        onOpenDashboard={() => { setShowDashboard(true); bringToFront('dashboard'); }}
        onOpenRateAgent={() => { setShowRateAgent(true); bringToFront('rateagent'); }}
        onOpenWallet={() => { setShowWallet(true); bringToFront('wallet'); }}
      />
    </div>
  );
}
