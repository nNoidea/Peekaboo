import React, { useState, useEffect } from "react";

function ControlWindow() {
    const [isStopping, setIsStopping] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Animate dots while stopping
    useEffect(() => {
        if (!isStopping) return;

        const interval = setInterval(() => {
            setDots((prev) => {
                if (prev === ".") return "..";
                if (prev === "..") return "...";
                return ".";
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isStopping]);

    const handleStop = async () => {
        setIsStopping(true);
        await window.electronAPI.stopRecording();
        // Window will close automatically via main process
    };

    const isCompact = windowWidth < 150;

    return (
        <div className="d-flex align-items-center justify-content-center bg-dark text-white h-100">
            <button
                className={`btn btn-danger btn-sm ${isCompact ? "p-1" : "px-4"} d-flex align-items-center justify-content-center overflow-hidden`}
                onClick={handleStop}
                disabled={isStopping}
                style={isCompact ? { width: "24px", height: "24px", minWidth: 0 } : { whiteSpace: "nowrap" }}
                title="Stop Recording"
            >
                {isCompact ? <div style={{ width: "12px", height: "12px", backgroundColor: "white", borderRadius: "50%" }} /> : isStopping ? `Stopping${dots}` : "Stop Recording"}
            </button>
        </div>
    );
}

function MainWindow() {
    const [isRecording, setIsRecording] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [format, setFormat] = useState("MP4");
    const [fps, setFps] = useState(30);
    const [showMouse, setShowMouse] = useState(true);
    const [recordSystemAudio, setRecordSystemAudio] = useState(false);
    const [recordMic, setRecordMic] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        window.electronAPI.onRecordingStopped(() => {
            setIsRecording(false);
            setIsSaving(false);
        });

        // Load settings
        window.electronAPI.getSettings().then((settings) => {
            setFormat(settings.format);
            setFps(settings.fps);
            setShowMouse(settings.showMouse);
            if (settings.audioOptions) {
                setRecordSystemAudio(settings.audioOptions.recordSystemAudio);
                setRecordMic(settings.audioOptions.recordMic);
            }
            setIsLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (isLoaded) {
            window.electronAPI.saveSettings({
                format,
                fps,
                showMouse,
                audioOptions: { recordSystemAudio, recordMic },
            });
        }
    }, [format, fps, showMouse, recordSystemAudio, recordMic, isLoaded]);

    const handleRecord = async () => {
        try {
            if (isRecording) {
                setIsSaving(true);
                await window.electronAPI.stopRecording();
            } else {
                await window.electronAPI.startRecording({
                    format,
                    outputPath: "",
                    fps,
                    showMouse,
                    audioOptions: { recordSystemAudio, recordMic },
                });
                setIsRecording(true);
            }
        } catch (err) {
            console.error("Failed to toggle recording:", err);
            setIsSaving(false);
            setIsRecording(false);
        }
    };

    // Responsive Breakpoints - Only for window controls and record button
    const showAllWindowControls = windowWidth > 250;
    const showCloseOnly = windowWidth > 100 && windowWidth <= 250;

    return (
        <div className="d-flex flex-column h-100">
            {/* Top Bar */}
            <div
                className="draggable-topbar d-flex align-items-center justify-content-end px-2 bg-dark text-white overflow-hidden"
                style={{ height: "40px", gap: "8px" }}
            >
                {/* Recording Mode - Show only "Recording..." */}
                {isRecording && <div className="fw-bold text-nowrap text-danger">Recording...</div>}

                {/* Normal Mode - Show all controls */}
                {!isRecording && (
                    <>
                        {/* Title and Settings - Combined container that gets pushed left */}
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            {/* Title */}
                            <div className="fw-bold text-nowrap">Peekaboo</div>

                            {/* Separator */}
                            <div className="vr bg-secondary opacity-50"></div>

                            {/* Settings Controls */}
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                {/* Format dropdown */}
                                <select
                                    className="form-select form-select-sm bg-secondary text-white border-0 no-drag"
                                    style={{ width: "auto", minWidth: "70px" }}
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                >
                                    <option value="MP4">MP4</option>
                                    <option value="WEBM">WEBM</option>
                                    <option value="GIF">GIF</option>
                                </select>

                                <div className="vr bg-secondary opacity-50"></div>

                                {/* FPS input */}
                                <div
                                    className="d-flex align-items-center gap-1"
                                    title="FPS"
                                >
                                    <span className="small text-white-50">FPS</span>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm bg-secondary text-white border-0 p-1 text-center no-drag"
                                        style={{ width: "40px" }}
                                        value={fps}
                                        onChange={(e) => setFps(Number(e.target.value))}
                                        min="1"
                                        max="60"
                                    />
                                </div>

                                <div className="vr bg-secondary opacity-50"></div>

                                {/* Cursor toggle */}
                                <div
                                    className="form-check form-switch m-0 d-flex align-items-center gap-1"
                                    title="Show Mouse Cursor"
                                >
                                    <input
                                        className="form-check-input no-drag"
                                        type="checkbox"
                                        id="showMouse"
                                        checked={showMouse}
                                        onChange={(e) => setShowMouse(e.target.checked)}
                                    />
                                    <label
                                        className="form-check-label small text-white"
                                        htmlFor="showMouse"
                                    >
                                        Cursor
                                    </label>
                                </div>

                                {/* Audio controls - for MP4 and WEBM */}
                                {(format === "MP4" || format === "WEBM") && (
                                    <>
                                        <div className="vr bg-secondary opacity-50"></div>
                                        <div
                                            className="form-check form-switch m-0 d-flex align-items-center gap-1"
                                            title="Record System Audio"
                                        >
                                            <input
                                                className="form-check-input no-drag"
                                                type="checkbox"
                                                id="recordSystemAudio"
                                                checked={recordSystemAudio}
                                                onChange={(e) => setRecordSystemAudio(e.target.checked)}
                                            />
                                            <label
                                                className="form-check-label small text-white"
                                                htmlFor="recordSystemAudio"
                                            >
                                                Audio (PC)
                                            </label>
                                        </div>

                                        <div className="vr bg-secondary opacity-50"></div>
                                        <div
                                            className="form-check form-switch m-0 d-flex align-items-center gap-1"
                                            title="Record Microphone"
                                        >
                                            <input
                                                className="form-check-input no-drag"
                                                type="checkbox"
                                                id="recordMic"
                                                checked={recordMic}
                                                onChange={(e) => setRecordMic(e.target.checked)}
                                            />
                                            <label
                                                className="form-check-label small text-white"
                                                htmlFor="recordMic"
                                            >
                                                Audio (MIC)
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Record Button */}
                        <div className="no-drag d-flex align-items-center flex-shrink-0">
                            <button
                                className="btn btn-sm btn-danger d-flex align-items-center gap-2"
                                onClick={handleRecord}
                                disabled={isSaving}
                            >
                                {/* Icon */}
                                <div
                                    style={{
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "white",
                                        borderRadius: "50%",
                                    }}
                                />
                                Record
                            </button>
                        </div>

                        {/* Window Controls - All buttons */}
                        {showAllWindowControls && (
                            <div className="d-flex align-items-stretch gap-0 no-drag ms-2 h-100">
                                <button
                                    className="btn btn-sm btn-outline-light border-0 px-3 rounded-0 d-flex align-items-center"
                                    onClick={() => window.electronAPI.minimizeApp()}
                                >
                                    _
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-light border-0 px-3 rounded-0 d-flex align-items-center"
                                    onClick={() => window.electronAPI.maximizeApp()}
                                >
                                    □
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-danger border-0 px-3 rounded-0 d-flex align-items-center"
                                    onClick={() => window.electronAPI.closeApp()}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Window Controls - Close only for narrow mode */}
                        {showCloseOnly && !showAllWindowControls && (
                            <div className="d-flex align-items-stretch gap-0 no-drag ms-2 h-100">
                                <button
                                    className="btn btn-sm btn-outline-danger border-0 px-3 rounded-0 d-flex align-items-center"
                                    onClick={() => window.electronAPI.closeApp()}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Transparent Body */}
            <div
                className="flex-grow-1"
                style={{ backgroundColor: isRecording ? "transparent" : "rgba(25, 135, 84, 0.1)", border: isRecording ? "2px solid red" : "2px solid rgba(255,255,255,0.2)", borderTop: "none" }}
            >
                {/* Content area */}
            </div>
        </div>
    );
}

function App() {
    const isControlWindow = window.location.search.includes("window=control");
    return isControlWindow ? <ControlWindow /> : <MainWindow />;
}

export default App;
