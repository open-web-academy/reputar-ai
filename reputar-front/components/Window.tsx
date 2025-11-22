import React from 'react';

interface WindowProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    isActive: boolean;
    onFocus: () => void;
    style?: React.CSSProperties;
}

export default function Window({ title, children, onClose, isActive, onFocus, style }: WindowProps) {
    return (
        <div
            className={`window ${isActive ? 'active' : ''}`}
            style={{ position: 'absolute', width: 400, zIndex: isActive ? 10 : 1, ...style }}
            onClick={onFocus}
        >
            <div className="title-bar">
                <div className="title-bar-text">{title}</div>
                <div className="title-bar-controls">
                    <button aria-label="Minimize" />
                    <button aria-label="Maximize" />
                    <button aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }} />
                </div>
            </div>
            <div className="window-body">
                {children}
            </div>
        </div>
    );
}
