import React, { useState, useEffect } from 'react';

interface TaskbarProps {
    onOpenRegister: () => void;
    onOpenDashboard: () => void;
    onOpenRateAgent: () => void;
}

export default function Taskbar({ onOpenRegister, onOpenDashboard, onOpenRateAgent }: TaskbarProps) {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [time, setTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[28px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 z-50 shadow-out">
            <div className="relative">
                <button
                    className={`font-bold px-2 py-1 flex items-center gap-1 ${isStartOpen ? 'active' : ''}`}
                    onClick={() => setIsStartOpen(!isStartOpen)}
                    style={{ minWidth: '60px' }}
                >
                    <img src="/ai-brain-logo.png" alt="AI Brain Logo" className="w-4 h-4" />
                    Start
                </button>

                {isStartOpen && (
                    <div className="absolute bottom-8 left-0 bg-[#c0c0c0] border-2 border-white border-r-gray-600 border-b-gray-600 p-1 min-w-[150px] shadow-out flex flex-col gap-1">
                        <div className="bg-[#000080] text-white px-2 py-4 font-bold mb-1 vertical-text side-bar">
                            Reputar 98
                        </div>
                        <button className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2" onClick={() => { onOpenDashboard(); setIsStartOpen(false); }}>
                            <img src="https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-3.png" className="w-4 h-4" />
                            Reputation Hub
                        </button>
                        <button className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2" onClick={() => { onOpenRegister(); setIsStartOpen(false); }}>
                            <img src="https://win98icons.alexmeub.com/icons/png/users-1.png" className="w-4 h-4" />
                            Agent Register
                        </button>
                        <button className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2" onClick={() => { onOpenRateAgent(); setIsStartOpen(false); }}>
                            <img src="https://win98icons.alexmeub.com/icons/png/certificate_application-0.png" className="w-4 h-4" />
                            Submit Rating
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1"></div>

            <div className="border-2 border-gray-500 border-b-white border-r-white px-2 py-0.5 bg-[#c0c0c0] inset-shadow">
                {time}
            </div>
        </div>
    );
}
