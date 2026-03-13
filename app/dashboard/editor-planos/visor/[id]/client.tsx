"use client"

import React, { useState, useEffect } from "react"
import { CanvasEngine } from "@/components/floor-plan-editor/CanvasEngine"
import { Ruler, Maximize2, Minus, MousePointer2 } from "lucide-react"

export default function StandaloneViewerClient({
    initialData,
    planName,
    projectName,
    variant
}: {
    initialData: any,
    planName?: string,
    projectName?: string,
    variant?: string | null
}) {
    const [viewConfig, setViewConfig] = useState({ zoom: 0.6, offset: { x: 300, y: 250 } })
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800
    })

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            })
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const noop = () => { }

    return (
        <div className="fixed inset-0 bg-slate-100 flex flex-col overflow-hidden select-none">
            {/* Professional Header */}
            <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 border-b border-slate-800 shrink-0 shadow-lg z-50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-inner">
                        <Ruler className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-orange-400 leading-none mb-0.5">Visor Profesional</span>
                        <h1 className="text-sm font-bold truncate max-w-[300px]">
                            {planName} {variant === 'after' ? '(Reforma)' : '(Estado Actual)'}
                        </h1>
                    </div>
                    {projectName && (
                        <>
                            <div className="w-px h-6 bg-slate-700 mx-2" />
                            <span className="text-xs text-slate-400 font-medium">{projectName}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                        <MousePointer2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] text-slate-300 font-medium">Click y arrastra para mover</span>
                    </div>
                </div>
            </header>

            {/* Canvas Area */}
            <main className="flex-1 relative bg-[#f8fafc] group">
                {/* Visual grid background subtle */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <CanvasEngine
                    width={windowSize.width}
                    height={windowSize.height - 56}
                    zoom={viewConfig.zoom}
                    offset={viewConfig.offset}
                    walls={initialData.walls || []}
                    rooms={initialData.rooms || []}
                    doors={initialData.doors || []}
                    windows={initialData.windows || []}
                    shunts={initialData.shunts || []}
                    currentWall={null}
                    activeTool="select"
                    hoveredWallId={null}
                    onPan={(x, y) => setViewConfig(prev => ({ ...prev, offset: { x, y } }))}
                    onZoom={(z) => setViewConfig(prev => ({ ...prev, zoom: z }))}
                    onMouseDown={noop}
                    onMouseMove={noop}
                    onMouseUp={noop}
                    onHoverWall={noop}
                    onSelectWall={noop}
                    onDragWall={noop}
                    onDragVertex={noop}
                    onDragEnd={noop}
                    onUpdateWallLength={noop}
                    onDeleteWall={noop}
                    onUpdateWall={noop}
                    onUpdateWallThickness={noop}
                    onUpdateWallInvisible={noop}
                    onUpdateRoom={noop}
                    onDeleteRoom={noop}
                    onCloneRoom={noop}
                    selectedWallIds={[]}
                    selectedRoomId={null}
                    onSelectRoom={noop}
                    onStartDragWall={noop}
                    onDragElement={noop}
                    selectedElement={null}
                    onSelectElement={noop}
                    onUpdateElement={noop}
                    onCloneElement={noop}
                    onDeleteElement={noop}
                    wallSnapshot={null}
                    showAllQuotes={true}
                    showRoomNames={true}
                    showAreas={true}
                    hideFloatingUI={true}
                    isAdvancedEnabled={false}
                    showGrid={true}
                />

                {/* Controls Overlay */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-slate-200 z-50">
                    <button
                        onClick={() => setViewConfig(p => ({ ...p, zoom: Math.max(0.05, p.zoom - 0.1) }))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-all hover:scale-105 active:scale-95"
                        title="Alejar"
                    >
                        <Minus className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Zoom</span>
                        <span className="text-sm font-bold text-slate-700">
                            {Math.round(viewConfig.zoom * 100)}%
                        </span>
                    </div>

                    <button
                        onClick={() => setViewConfig(p => ({ ...p, zoom: Math.min(3, p.zoom + 0.1) }))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-all hover:scale-105 active:scale-95"
                        title="Acercar"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-1" />

                    <button
                        onClick={() => setViewConfig({ zoom: 0.6, offset: { x: 300, y: 250 } })}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-all hover:scale-105 active:scale-95"
                        title="Restablecer Vista"
                    >
                        <RotateCcwIcon className="h-5 w-5" />
                    </button>

                    <button
                        onClick={() => {
                            if (document.fullscreenElement) {
                                document.exitFullscreen()
                            } else {
                                document.documentElement.requestFullscreen()
                            }
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
                        title="Pantalla Completa"
                    >
                        <Maximize2 className="h-5 w-5" />
                    </button>
                </div>

            </main>
        </div>
    )
}

function PlusIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
}

function RotateCcwIcon({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
}
