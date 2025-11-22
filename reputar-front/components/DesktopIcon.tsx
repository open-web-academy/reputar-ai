import React from 'react';

interface DesktopIconProps {
    label: string;
    iconSrc: string;
    onClick: () => void;
}

export default function DesktopIcon({ label, iconSrc, onClick }: DesktopIconProps) {
    return (
        <div
            className="flex flex-col items-center gap-1 w-24 cursor-pointer group relative"
            style={{ zIndex: 10 }}
            onClick={onClick}
        >
            <img
                src={iconSrc}
                alt={label}
                className="w-12 h-12 pixelated"
                style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-white text-sm text-center px-1 border border-transparent group-hover:bg-[#000080] group-hover:border-dotted group-hover:border-white">
                {label}
            </span>
        </div>
    );
}
