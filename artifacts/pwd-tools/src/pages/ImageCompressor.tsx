import imageCompression from "browser-image-compression";
import { Download, Home as HomeIcon, MapPin, Plus, X } from "lucide-react";
import piexifjs from "piexifjs";
import { useRef, useState } from "react";
import { useLocation } from "wouter";

// ── Location options — PWD Udaipur subdivisions ────────────────────────────
// Coordinates sourced from Wikipedia tehsil articles and census data
const LOCATIONS = [
  { name: "Gogunda Subdivision", lat: 24.7522, lng: 73.5270 }, // Gogunda tehsil HQ, Udaipur
  { name: "Iswal (Badgaon Subdiv)", lat: 24.6200, lng: 73.6450 }, // Iswal village, Girwa/Badgaon tehsil
  { name: "Sayra Subdivision", lat: 24.8100, lng: 73.5100 }, // Sayra village, Gogunda tehsil (pin 313704)
];

// ── Diya decoration (matches PWD Tools Suite header style) ─────────────────
const DIYAS = [
  { left: "3%", delay: "0s", dur: "2.8s" },
  { left: "11%", delay: "0.4s", dur: "3.2s" },
  { left: "21%", delay: "0.9s", dur: "2.5s" },
  { left: "33%", delay: "0.2s", dur: "3.6s" },
  { left: "46%", delay: "1.1s", dur: "2.9s" },
  { left: "59%", delay: "0.6s", dur: "3.1s" },
  { left: "70%", delay: "1.4s", dur: "2.7s" },
  { left: "81%", delay: "0.3s", dur: "3.4s" },
  { left: "91%", delay: "0.8s", dur: "2.6s" },
];

function Diyas() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
      {DIYAS.map((d, i) => (
        <div key={i} style={{ position: "absolute", bottom: "4px", left: d.left, animation: `floatBalloon ${d.dur} ${d.delay} ease-in-out infinite` }}>
          <div style={{ fontSize: "22px", lineHeight: 1, filter: "drop-shadow(0 0 6px #FFD700) drop-shadow(0 0 12px #FF8C00)" }}>🪔</div>
        </div>
      ))}
      {["8%", "25%", "43%", "62%", "78%", "95%"].map((left, i) => (
        <div key={`f${i}`} style={{ position: "absolute", top: "4px", left, fontSize: "16px", opacity: 0.7, animation: `floatBalloon ${2.4 + i * 0.3}s ${i * 0.5}s ease-in-out infinite` }}>🌸</div>
      ))}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

type ExifData = {
  "0th": Record<string, any>;
  Exif: Record<string, any>;
  GPS: Record<string, any>;
  Interop: Record<string, any>;
  "1st": Record<string, any>;
  thumbnail: string | null;
};

function createEmptyExif(): ExifData {
  return {
    "0th": {},
    Exif: {},
    GPS: {},
    Interop: {},
    "1st": {},
    thumbnail: null,
  };
}

function decimalToDmsRational(value: number): [number, number][] {
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  return [
    [degrees, 1],
    [minutes, 1],
    [Math.round(seconds * 10000), 10000],
  ];
}

function buildGpsIfd(lat: number, lng: number) {
  return {
    [piexifjs.GPSIFD.GPSVersionID]: [2, 3, 0, 0],
    [piexifjs.GPSIFD.GPSLatitudeRef]: lat >= 0 ? "N" : "S",
    [piexifjs.GPSIFD.GPSLatitude]: decimalToDmsRational(lat),
    [piexifjs.GPSIFD.GPSLongitudeRef]: lng >= 0 ? "E" : "W",
    [piexifjs.GPSIFD.GPSLongitude]: decimalToDmsRational(lng),
    [piexifjs.GPSIFD.GPSMapDatum]: "WGS-84",
  };
}

/** Read file, parse EXIF via piexifjs, return EXIF object + whether GPS tags exist */
function readExif(file: File): Promise<{ exif: ExifData | null; hasGps: boolean }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const base64 = arrayBufferToBase64(e.target?.result as ArrayBuffer);
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        const exifObj = piexifjs.load(dataUrl) as ExifData;
        // GPS IFD key is "GPS" in piexifjs; check if it has any entries
        const gpsData = exifObj["GPS"] ?? {};
        const hasGps = Object.keys(gpsData).length > 0;
        resolve({ exif: exifObj, hasGps });
      } catch {
        // Non-JPEG or no EXIF at all — treat as no GPS
        resolve({ exif: null, hasGps: false });
      }
    };
    reader.onerror = () => resolve({ exif: null, hasGps: false });
    reader.readAsArrayBuffer(file);
  });
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ImageCompressor() {
  const [, navigate] = useLocation();

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [showGpsPopup, setShowGpsPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [hasGps, setHasGps] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [contractorName, setContractorName] = useState("");
  const [roadName, setRoadName] = useState("");
  const [downloadComplete, setDownloadComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ──────────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    const { exif, hasGps } = await readExif(file);
    setExifData(exif);
    setHasGps(hasGps);
    if (!hasGps) setShowGpsPopup(true);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileSelect(file);
  };

  // ── Compress & download ─────────────────────────────────────────────────
  const compressImage = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const compressed = await imageCompression(image, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
        fileType: "image/jpeg",
      });

      let finalBlob: Blob = compressed;

      const selectedLocationDetails = !hasGps
        ? LOCATIONS.find((loc) => loc.name === selectedLocation)
        : undefined;

      const nextExif: ExifData | null = (() => {
        if (!exifData && !selectedLocationDetails) return null;

        const baseExif = exifData
          ? JSON.parse(JSON.stringify(exifData)) as ExifData
          : createEmptyExif();

        if (selectedLocationDetails) {
          baseExif.GPS = buildGpsIfd(selectedLocationDetails.lat, selectedLocationDetails.lng);
        }

        return baseExif;
      })();

      // Re-inject existing EXIF and add GPS when user selected a location
      if (nextExif) {
        finalBlob = await new Promise<Blob>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const base64 = arrayBufferToBase64(e.target?.result as ArrayBuffer);
              const dump = piexifjs.dump(nextExif);
              const inserted = piexifjs.insert(dump, `data:image/jpeg;base64,${base64}`);
              const bin = window.atob(inserted.split(",")[1]);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              resolve(new Blob([bytes], { type: "image/jpeg" }));
            } catch {
              resolve(compressed);
            }
          };
          reader.readAsArrayBuffer(compressed);
        });
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const safeContractor = contractorName.replace(/[^a-zA-Z0-9]/g, "_");
      const safeRoad = roadName.replace(/[^a-zA-Z0-9]/g, "_");
      const locationTag = hasGps ? "GPS" : selectedLocation.replace(/\s+/g, "_");

      const link = document.createElement("a");
      link.href = URL.createObjectURL(finalBlob);
      link.download = `${safeContractor}_${safeRoad}_${locationTag}_${timestamp}.jpg`;
      link.click();

      setDownloadComplete(true);
    } catch (err) {
      console.error("Compression error:", err);
    } finally {
      setProcessing(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────
  const reset = () => {
    setImage(null);
    setPreview("");
    setShowGpsPopup(false);
    setSelectedLocation("");
    setHasGps(false);
    setExifData(null);
    setContractorName("");
    setRoadName("");
    setDownloadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNextPhoto = () => {
    reset();
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');

        @keyframes floatBalloon {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .ic-card {
          background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%);
          border: 1.5px solid #e6a817;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(200,130,0,0.13);
        }
        .ic-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e6a817;
          border-radius: 10px;
          background: #fffdf5;
          color: #4a1a00;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .ic-input:focus {
          border-color: #c0392b;
          box-shadow: 0 0 0 3px rgba(192,57,43,0.12);
        }
        .ic-input::placeholder { color: #b07840; }

        .ic-upload-zone {
          border: 2px dashed #e6a817;
          border-radius: 14px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          background: linear-gradient(135deg, #fffbf0, #fff8e1);
          transition: border-color 0.2s, background 0.2s, transform 0.2s;
        }
        .ic-upload-zone:hover {
          border-color: #c0392b;
          background: linear-gradient(135deg, #fff3e0, #fce4ec);
          transform: translateY(-2px);
        }

        .ic-btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #7B0D00, #c0392b);
          color: #FFD700;
          padding: 13px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.2s;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 14px rgba(123,13,0,0.25);
        }
        .ic-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .ic-btn-primary:disabled { background: #c8b89a; color: #888; cursor: not-allowed; box-shadow: none; }

        .ic-btn-secondary {
          width: 100%;
          background: linear-gradient(135deg, #fff8e1, #fffbf0);
          color: #7B0D00;
          padding: 13px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          border: 1.5px solid #e6a817;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, transform 0.2s;
        }
        .ic-btn-secondary:hover { background: linear-gradient(135deg, #fff3e0, #fce4ec); transform: translateY(-1px); }

        .ic-location-btn {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1.5px solid #e6a817;
          background: #fffbf0;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s, border-color 0.2s;
          color: #4a1a00;
          font-weight: 600;
        }
        .ic-location-btn:hover { background: #fff3e0; border-color: #c0392b; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fff8e1 0%, #fff3e0 40%, #fce4ec 100%)", fontFamily: "'Noto Sans Devanagari','Segoe UI',sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7B0D00 0%, #c0392b 25%, #e67e22 50%, #c0392b 75%, #7B0D00 100%)", backgroundSize: "300% auto", animation: "shimmer 8s linear infinite", borderBottom: "4px solid #FFD700" }}>
          <Diyas />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "28px 24px 18px" }}>
            {/* Back button */}
            <button
              onClick={() => navigate("/")}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "1.5px solid #FFD700", borderRadius: "8px", color: "#FFD700", padding: "6px 14px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              ← वापस
            </button>
            <div style={{ fontSize: "48px", marginBottom: "6px", filter: "drop-shadow(0 0 12px #FFD700)" }}>📷</div>
            <div style={{ color: "#FFD700", fontWeight: 900, fontSize: "1.8rem", letterSpacing: "0.06em", textShadow: "0 0 16px rgba(255,215,0,0.8), 0 2px 8px rgba(0,0,0,0.5)" }}>
              🪔 Image Compressor 🪔
            </div>
            <div style={{ color: "#FFEAA7", fontWeight: 500, fontSize: "0.95rem", letterSpacing: "0.08em", marginTop: "6px" }}>
              Compress photos to 250 KB — EXIF &amp; GPS preserved
            </div>
            <div style={{ color: "#FFD700", fontWeight: 500, fontSize: "0.8rem", letterSpacing: "0.12em", marginTop: "4px", opacity: 0.85 }}>
              ✦ Initiative: Mrs. Premlata Jain, AAO, PWD Udaipur ✦
            </div>
          </div>
          <div style={{ background: "linear-gradient(90deg, #FFD700, #FF8C00, #FFD700)", height: "3px" }} />
        </div>

        {/* ── Main card ── */}
        <div style={{ maxWidth: "520px", margin: "36px auto", padding: "0 16px 40px" }}>
          <div className="ic-card" style={{ padding: "32px" }}>

            {!image ? (
              <>
                {/* Upload zone */}
                <div className="ic-upload-zone" onClick={() => fileInputRef.current?.click()}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🖼️</div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#7B2D00", marginBottom: "6px" }}>
                    Click to upload photo
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#b07840" }}>or drag and drop</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Info box */}
                <div style={{ marginTop: "20px", padding: "14px 16px", background: "linear-gradient(135deg,#fff3e0,#fce4ec)", border: "1px solid #e6a817", borderRadius: "10px", fontSize: "0.85rem", color: "#7B2D00" }}>
                  <div style={{ fontWeight: 700, marginBottom: "6px" }}>🪔 How it works</div>
                  <ul style={{ paddingLeft: "18px", margin: 0, lineHeight: 1.8 }}>
                    <li>Upload any JPEG / PNG photo</li>
                    <li>GPS &amp; EXIF metadata preserved</li>
                    <li>Output: 250 KB JPEG, ready for PWD portal</li>
                  </ul>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Preview */}
                <div style={{ position: "relative" }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ width: "100%", height: "220px", objectFit: "contain", borderRadius: "10px", background: "#fffbf0", border: "1.5px solid #e6a817" }}
                  />
                  <button
                    onClick={reset}
                    style={{ position: "absolute", top: "8px", right: "8px", background: "#c0392b", color: "#FFD700", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* GPS badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", padding: "8px 12px", borderRadius: "8px",
                  background: hasGps ? "#f0fff4" : selectedLocation ? "#fff8e1" : "#fff3e0",
                  border: `1px solid ${hasGps ? "#38a169" : selectedLocation ? "#e6a817" : "#e67e22"}`,
                }}>
                  <MapPin size={16} color={hasGps ? "#38a169" : selectedLocation ? "#e6a817" : "#e67e22"} />
                  {hasGps
                    ? <span style={{ color: "#276749", fontWeight: 600 }}>GPS data preserved ✓</span>
                    : selectedLocation
                      ? <>
                        <span style={{ color: "#7B2D00", fontWeight: 600, flex: 1 }}>📍 {selectedLocation}</span>
                        <button
                          onClick={() => setShowGpsPopup(true)}
                          style={{ fontSize: "0.75rem", color: "#c0392b", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}
                        >
                          Change
                        </button>
                      </>
                      : <span style={{ color: "#c0392b", fontWeight: 600, cursor: "pointer" }} onClick={() => setShowGpsPopup(true)}>No GPS — tap to select subdivision</span>
                  }
                </div>

                {/* Fields */}
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#7B2D00", marginBottom: "6px" }}>Contractor Name</label>
                  <input className="ic-input" type="text" value={contractorName} onChange={(e) => setContractorName(e.target.value)} placeholder="Enter contractor name" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#7B2D00", marginBottom: "6px" }}>Road Name</label>
                  <input className="ic-input" type="text" value={roadName} onChange={(e) => setRoadName(e.target.value)} placeholder="Enter road name" />
                </div>

                {/* Download button */}
                <button
                  className="ic-btn-primary"
                  onClick={compressImage}
                  disabled={processing || (!hasGps && !selectedLocation) || !contractorName || !roadName}
                >
                  {processing
                    ? "⏳ Processing..."
                    : <><Download size={20} /> Download 250 KB JPEG</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── GPS Location Popup ── */}
        {showGpsPopup && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div style={{ background: "linear-gradient(135deg,#fffbf0,#fff8e1)", border: "2px solid #e6a817", borderRadius: "16px", padding: "28px", maxWidth: "360px", width: "100%", margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#7B0D00", marginBottom: "8px" }}>📍 Select Subdivision</div>
              <p style={{ fontSize: "0.875rem", color: "#7B2D00", marginBottom: "16px" }}>Your photo has no GPS data. Select the subdivision where this photo was taken:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    className="ic-location-btn"
                    onClick={() => { setSelectedLocation(loc.name); setShowGpsPopup(false); }}
                  >
                    <MapPin size={16} color="#c0392b" style={{ flexShrink: 0 }} />
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Download Complete Popup ── */}
        {downloadComplete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div style={{ background: "linear-gradient(135deg,#fffbf0,#fff8e1)", border: "2px solid #e6a817", borderRadius: "16px", padding: "32px", maxWidth: "360px", width: "100%", margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "#7B0D00", marginBottom: "8px" }}>Download Complete!</div>
              <div style={{ fontSize: "0.875rem", color: "#7B2D00", marginBottom: "24px" }}>Your image has been compressed and saved.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button className="ic-btn-primary" onClick={handleNextPhoto}>
                  <Plus size={20} /> Next Photo
                </button>
                <button className="ic-btn-secondary" onClick={reset}>
                  <HomeIcon size={20} /> Back to Start
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", padding: "24px 16px", color: "#7B2D00", fontSize: "0.85rem", borderTop: "2px solid #e6a817", background: "linear-gradient(90deg,#fffbf0,#fff8e1,#fffbf0)" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "6px" }}>🪔 ✦ 🌸 ✦ 🪔</div>
          <div style={{ fontWeight: 700, color: "#7B0D00", marginBottom: "4px" }}>🏗️ PWD Tools Suite</div>
          <div>Prepared on Initiative of Mrs. Premlata Jain, AAO | PWD Udaipur, Rajasthan</div>
        </div>
      </div>
    </>
  );
}
