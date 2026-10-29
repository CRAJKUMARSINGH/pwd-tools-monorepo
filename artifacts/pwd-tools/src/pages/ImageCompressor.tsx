import imageCompression from "browser-image-compression";
import { Download, Home as HomeIcon, MapPin, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "wouter";

import { DEFAULT_LOCATION_NAME, PWD_LOCATIONS } from "@/data/pwdLocations";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  composeExif,
  gmapsUrl,
  injectExif,
  readExifFromFile,
  readGps,
  type ExifIfds,
  type GpsDetails,
} from "@/lib/exif";

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

type GpsTab = "preset" | "device" | "manual";

// Safari private mode throws on storage access — never let that break an upload.
const rememberLastLocation = (name: string) => {
  try { localStorage.setItem("pwd.lastLocation", name); } catch { /* storage unavailable */ }
};

const recallLastLocation = (): string | null => {
  try { return localStorage.getItem("pwd.lastLocation"); } catch { return null; }
};

// ── Component ──────────────────────────────────────────────────────────────
export default function ImageCompressor() {
  useDocumentTitle("Image Compressor");
  const [, navigate] = useLocation();

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [exifData, setExifData] = useState<ExifIfds | null>(null);
  const [sourceGps, setSourceGps] = useState<GpsDetails | null>(null);
  const [gps, setGps] = useState<GpsDetails | null>(null);
  const [gpsVerified, setGpsVerified] = useState<boolean | null>(null);
  const [gpsError, setGpsError] = useState<string>("");
  const [showGpsPopup, setShowGpsPopup] = useState(false);
  const [gpsTab, setGpsTab] = useState<GpsTab>("preset");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [contractorName, setContractorName] = useState("");
  const [roadName, setRoadName] = useState("");
  const [downloadComplete, setDownloadComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ──────────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setGpsVerified(null);
    setGpsError("");

    const read = await readExifFromFile(file);
    if (read.status === "not-jpeg") {
      setGpsError(`${read.mime || "This file"} carries no EXIF — convert to JPEG first.`);
    } else if (read.status === "unreadable") {
      setGpsError("Could not read this file's metadata.");
    }

    const exif = read.status === "ok" ? read.exif : null;
    setExifData(exif);

    const found = readGps(exif);
    setSourceGps(found);

    // Reuse last chosen subdivision so batch entry is one tap, not three.
    const remembered = recallLastLocation();
    const preset = PWD_LOCATIONS.find((l) => l.name === remembered);

    if (found) {
      setGps(found);
    } else if (preset) {
      setGps({ latitude: preset.lat, longitude: preset.lng, source: "preset" });
    } else {
      // The device tab advertises a default, so honour it rather than silently
      // leaving the location null behind a popup the user may dismiss.
      const fallback = PWD_LOCATIONS.find((l) => l.name === DEFAULT_LOCATION_NAME);
      setGps(fallback ? { latitude: fallback.lat, longitude: fallback.lng, source: "preset" } : null);
      setShowGpsPopup(true);
    }
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
        maxSizeMB: 0.24,          // ← was 0.25 (=256 KB). 0.24 = 245 KB, stays under a 250 KB cap
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
        fileType: "image/jpeg",
        preserveExif: false,      // explicit — we re-inject authoritatively
      });

      const nextExif = exifData || gps ? composeExif(exifData, gps) : null;

      let finalBlob: Blob = compressed;
      if (nextExif) {
        const res = await injectExif(compressed, nextExif, /* expectGps */ !!gps);
        finalBlob = res.blob;
        setGpsVerified(res.ok);
        setGpsError(res.ok ? "" : (res.error ?? "Metadata could not be written."));
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const safeContractor = contractorName.replace(/[^a-zA-Z0-9]/g, "_");
      const safeRoad = roadName.replace(/[^a-zA-Z0-9]/g, "_");
      const tag = gps
        ? (gps.source === "exif" ? "GPS" : `${gps.latitude.toFixed(5)}_${gps.longitude.toFixed(5)}`)
        : "NOGPS";

      const link = document.createElement("a");
      link.href = URL.createObjectURL(finalBlob);
      link.download = `${safeContractor}_${safeRoad}_${tag}_${timestamp}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);

      setDownloadComplete(true);
    } catch (err) {
      // A silent console.error re-enabled the button with nothing on screen, so
      // a failed compression looked like a misfired click.
      setGpsError(err instanceof Error ? err.message : "Compression failed.");
      setDownloadComplete(false);
    } finally {
      setProcessing(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────
  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview("");
    setShowGpsPopup(false);
    setGpsTab("preset");
    setExifData(null);
    setSourceGps(null);
    setGps(null);
    setGpsVerified(null);
    setGpsError("");
    setManualLat("");
    setManualLng("");
    setContractorName("");
    setRoadName("");
    setDownloadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNextPhoto = () => {
    reset();
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) { setGpsError("Geolocation unsupported"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          timestampUtc: new Date(pos.timestamp),
          source: "device",
        });
        setGpsError("");
        setLocating(false);
        setShowGpsPopup(false);
      },
      (err) => { setGpsError(err.message); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const useManualLocation = () => {
    // Number("") is 0, which passes both bounds checks — reject blanks first or
    // an untouched form silently stamps Null Island (0.000000, 0.000000).
    if (!manualLat.trim() || !manualLng.trim()) { setGpsError("Enter both latitude and longitude."); return; }
    const lat = Number(manualLat), lng = Number(manualLng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) { setGpsError("Latitude must be −90…90"); return; }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) { setGpsError("Longitude must be −180…180"); return; }
    setGps({ latitude: lat, longitude: lng, source: "manual" });
    setGpsError("");
    setShowGpsPopup(false);
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

        .ic-tab {
          flex: 1;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1.5px solid #e6a817;
          background: #fffbf0;
          color: #7B2D00;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .ic-tab[aria-selected="true"] { background: #7B0D00; color: #FFD700; border-color: #7B0D00; }
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
                    accept="image/jpeg,image/jpg,.jpg,.jpeg"
                    onChange={handleInputChange}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Info box */}
                <div style={{ marginTop: "20px", padding: "14px 16px", background: "linear-gradient(135deg,#fff3e0,#fce4ec)", border: "1px solid #e6a817", borderRadius: "10px", fontSize: "0.85rem", color: "#7B2D00" }}>
                  <div style={{ fontWeight: 700, marginBottom: "6px" }}>🪔 How it works</div>
                  <ul style={{ paddingLeft: "18px", margin: 0, lineHeight: 1.8 }}>
                    <li>Upload a JPEG photo</li>
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

                {/* GPS panel — show the details, don't just badge them */}
                {gps ? (
                  <div style={{ fontSize: "0.8rem", background: "#f0fff4", border: "1px solid #38a169", borderRadius: "8px", padding: "10px 12px", color: "#22543d" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                      <MapPin size={15} />
                      {gps.source === "exif" ? "GPS preserved from photo" : `GPS added — ${gps.source}`}
                    </div>
                    <div style={{ fontFamily: "monospace", marginTop: 6 }}>
                      {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
                      {gps.altitude != null && <> · {gps.altitude.toFixed(1)} m</>}
                      {gps.accuracy != null && <> · ±{gps.accuracy.toFixed(1)} m</>}
                    </div>
                    {gps.timestampUtc && (
                      <div style={{ marginTop: 2 }}>{gps.timestampUtc.toISOString().replace("T", " ").slice(0, 19)} UTC</div>
                    )}
                    <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                      <a href={gmapsUrl(gps.latitude, gps.longitude)} target="_blank" rel="noreferrer">Open in Maps</a>
                      <button onClick={() => setShowGpsPopup(true)} style={{ background: "none", border: "none", color: "#22543d", cursor: "pointer", fontWeight: 700, padding: 0 }}>Change</button>
                      {gps.source !== "exif" && (
                        <button onClick={() => setGps(sourceGps)} style={{ background: "none", border: "none", color: "#22543d", cursor: "pointer", fontWeight: 700, padding: 0 }}>Revert to photo GPS</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    className="ic-btn-secondary"
                    onClick={() => setShowGpsPopup(true)}
                    style={{ justifyContent: "flex-start" }}
                  >
                    <MapPin size={16} color="#c0392b" />
                    <span style={{ color: "#c0392b" }}>No GPS — tap to add a location</span>
                  </button>
                )}

                {gpsError && <div style={{ color: "#c0392b", fontSize: "0.8rem" }}>⚠️ {gpsError}</div>}
                {gpsVerified === false && (
                  <div style={{ color: "#c0392b", fontSize: "0.8rem" }}>
                    ⚠️ Metadata could not be verified in the output file — do not upload yet.
                  </div>
                )}

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
                  disabled={processing || !gps || !contractorName || !roadName}
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

        {/* ── GPS Location Popup — Preset · My location · Manual ── */}
        {showGpsPopup && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div style={{ background: "linear-gradient(135deg,#fffbf0,#fff8e1)", border: "2px solid #e6a817", borderRadius: "16px", padding: "24px", maxWidth: "380px", width: "100%", margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#7B0D00", marginBottom: "8px" }}>📍 Set photo location</div>
              <p style={{ fontSize: "0.85rem", color: "#7B2D00", marginTop: 0, marginBottom: "14px" }}>
                {sourceGps ? "This photo already has GPS. Choosing a new location overrides it." : "Choose how to set the coordinates for this photo:"}
              </p>

              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <button className="ic-tab" aria-selected={gpsTab === "preset"} onClick={() => setGpsTab("preset")}>Subdivision</button>
                <button className="ic-tab" aria-selected={gpsTab === "device"} onClick={() => setGpsTab("device")}>My location</button>
                <button className="ic-tab" aria-selected={gpsTab === "manual"} onClick={() => setGpsTab("manual")}>Manual</button>
              </div>

              <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {gpsTab === "preset" && PWD_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    className="ic-location-btn"
                    onClick={() => {
                      setGps({ latitude: loc.lat, longitude: loc.lng, source: "preset" });
                      rememberLastLocation(loc.name);
                      setGpsError("");
                      setShowGpsPopup(false);
                    }}
                  >
                    <MapPin size={16} color="#c0392b" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{loc.name}</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{loc.division}</span>
                  </button>
                ))}

                {gpsTab === "device" && (
                  <>
                    <button className="ic-btn-secondary" disabled={locating} onClick={useDeviceLocation}>
                      <MapPin size={18} /> {locating ? "Locating…" : "Use my current location"}
                    </button>
                    <div style={{ fontSize: "0.75rem", color: "#7B2D00", opacity: 0.8 }}>
                      Writes the device coordinates plus altitude, accuracy and a UTC stamp. Default:{' '}
                      {DEFAULT_LOCATION_NAME}.
                    </div>
                  </>
                )}

                {gpsTab === "manual" && (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="ic-input" inputMode="decimal" placeholder="24.585400" value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)} />
                      <input className="ic-input" inputMode="decimal" placeholder="73.712500" value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)} />
                    </div>
                    <button className="ic-btn-primary" onClick={useManualLocation}>
                      Use these coordinates
                    </button>
                  </>
                )}
              </div>

              {gpsError && <div style={{ color: "#c0392b", fontSize: "0.8rem", marginTop: "10px" }}>⚠️ {gpsError}</div>}

              <button
                onClick={() => setShowGpsPopup(false)}
                style={{ marginTop: "14px", background: "none", border: "none", color: "#7B2D00", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Download Complete Popup ── */}
        {downloadComplete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div style={{ background: "linear-gradient(135deg,#fffbf0,#fff8e1)", border: "2px solid #e6a817", borderRadius: "16px", padding: "32px", maxWidth: "360px", width: "100%", margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>{gpsVerified === false ? "⚠️" : "✅"}</div>
              <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "#7B0D00", marginBottom: "8px" }}>
                {gpsVerified === false ? "Saved — metadata unverified" : "Download Complete!"}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#7B2D00", marginBottom: "24px" }}>
                {gpsVerified === false
                  ? "The file downloaded, but the GPS/EXIF metadata could not be verified. Do not upload it to the portal until you re-check the coordinates."
                  : "Your image has been compressed and saved."}
              </div>
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
