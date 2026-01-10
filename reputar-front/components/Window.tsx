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
    // Calcular maxHeight para window-body basado en el maxHeight del contenedor
    const containerMaxHeight = style?.maxHeight as string | undefined;
    const windowBodyMaxHeight = containerMaxHeight 
        ? `calc(${containerMaxHeight} - 30px)` // Restar altura aproximada del title-bar
        : '70vh';

    return (
        <div
            className={`window ${isActive ? 'active' : ''}`}
            style={{ 
                position: 'absolute', 
                width: 400, 
                zIndex: isActive ? 10 : 1, 
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxSizing: 'border-box',
                ...style 
            }}
            onClick={onFocus}
        >
            <div className="title-bar" style={{ flexShrink: 0 }}>
                <div className="title-bar-text">{title}</div>
                <div className="title-bar-controls">
                    <button aria-label="Minimize" />
                    <button aria-label="Maximize" />
                    <button aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }} />
                </div>
            </div>
            <div 
              className="window-body"
              style={{
                flex: '1 1 auto',
                minHeight: 0,
                maxHeight: windowBodyMaxHeight,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
                {children}
            </div>
        </div>
    );
}
