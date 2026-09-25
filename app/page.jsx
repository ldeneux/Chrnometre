"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Play, Square, RotateCcw, Download, Trash2, Swimming, Timer, Award, CheckCircle2 } from "lucide-react";

export default function ChronoApp() {
  const [swimmer, setSwimmer] = useState("Emma");
  const [stroke, setStroke] = useState("Nage Libre");
  const [distance, setDistance] = useState(50);
  const [pool, setPool] = useState(25);
  
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const [savedSessions, setSavedSessions] = useState([]);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  const totalClicks = Math.ceil(distance / pool);
  const currentClick = laps.length;
  const isFinished = currentClick >= totalClicks;

  // Charger l'historique depuis localStorage au démarrage
  useEffect(() => {
    const localData = localStorage.getItem("chrono_natation_sessions_v1");
    if (localData) {
      try {
        setSavedSessions(JSON.parse(localData));
      } catch (e) {
        console.error("Erreur de chargement des données", e);
      }
    }
  }, []);

  // Sauvegarder dans localStorage dès qu'une session est ajoutée
  const saveSessionsToLocal = (newSessions) => {
    setSavedSessions(newSessions);
    localStorage.setItem("chrono_natation_sessions_v1", JSON.stringify(newSessions));
  };

  // Timer loop High Precision
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime;
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const msTen = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(msTen).padStart(2, "0")}`;
  };

  const handleMainTap = () => {
    if (isFinished) return;

    if (!isRunning && currentClick === 0) {
      // Premier Clic -> Démarrage
      setIsRunning(true);
    } else if (isRunning) {
      // Clic suivant -> Temps Intermédiaire ou final
      const now = elapsedTime;
      const prevTime = laps.length > 0 ? laps[laps.length - 1].rawTime : 0;
      const splitTime = now - prevTime;

      const newLap = {
        lapNumber: laps.length + 1,
        distanceCovered: (laps.length + 1) * pool,
        rawTime: now,
        formattedTime: formatTime(now),
        splitFormatted: formatTime(splitTime),
      };

      const updatedLaps = [...laps, newLap];
      setLaps(updatedLaps);

      // Si c'est le dernier clic requis
      if (updatedLaps.length >= totalClicks) {
        setIsRunning(false);
        autoSaveSession(updatedLaps, now);
      }
    }
  };

  const autoSaveSession = (completedLaps, finalTime) => {
    const newSession = {
      id: Date.now(),
      date: new Date().toLocaleDateString("fr-FR"),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      swimmer,
      stroke,
      distance: `${distance}m`,
      pool: `${pool}m`,
      finalTime: formatTime(finalTime),
      laps: completedLaps,
    };
    const updated = [newSession, ...savedSessions];
    saveSessionsToLocal(updated);
  };

  const resetChrono = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
  };

  const deleteSession = (id) => {
    const updated = savedSessions.filter((s) => s.id !== id);
    saveSessionsToLocal(updated);
  };

  const exportExcel = () => {
    if (savedSessions.length === 0) {
      alert("Aucune session enregistrée.");
      return;
    }

    const exportData = savedSessions.map((s) => {
      const row = {
        Date: s.date,
        Heure: s.time,
        Nageuse: s.swimmer,
        Epreuve: s.stroke,
        Distance: s.distance,
        Bassin: s.pool,
        "Temps Final": s.finalTime,
      };

      s.laps.forEach((l, idx) => {
        row[`Long. ${idx + 1} (${l.distanceCovered}m)`] = l.formattedTime;
        row[`Interm. L${idx + 1}`] = `+${l.splitFormatted}`;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chronos");
    XLSX.writeFile(workbook, `Chrono_Natation_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-800 shadow-2xl">
      {/* Header Updated with New Logo */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Replacement Logo Icon 96px */}
          <img 
            src="/app_icon.png" 
            alt="Logo Chrono Natation" 
            className="w-[96px] h-[96px] rounded-xl object-contain"
          />
          <div>
            <h1 className="font-bold text-lg leading-tight text-sky-400">Chrono Natation</h1>
            <p className="text-xs text-slate-400">100% Offline & PWA Vercel</p>
          </div>
        </div>
        <button
          onClick={exportExcel}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
        >
          <Download size={14} />
          <span>Excel</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="p-4 space-y-4 flex-1 flex flex-col">
        {/* Form Config */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Nageuse :</label>
            <input
              type="text"
              value={swimmer}
              disabled={isRunning || laps.length > 0}
              onChange={(e) => setSwimmer(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-sky-300 font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Nage :</label>
              <select
                value={stroke}
                disabled={isRunning || laps.length > 0}
                onChange={(e) => setStroke(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50"
              >
                <option value="Nage Libre">Nage Libre</option>
                <option value="Dos">Dos</option>
                <option value="Brasse">Brasse</option>
                <option value="Papillon">Papillon</option>
                <option value="4 Nages">4 Nages</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Distance :</label>
              <select
                value={distance}
                disabled={isRunning || laps.length > 0}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50"
              >
                <option value={50}>50m</option>
                <option value={100}>100m</option>
                <option value={200}>200m</option>
                <option value={400}>400m</option>
                <option value={800}>800m</option>
                <option value={1500}>1500m</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Bassin :</label>
              <select
                value={pool}
                disabled={isRunning || laps.length > 0}
                onChange={(e) => setPool(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50"
              >
                <option value={25}>25m</option>
                <option value={50}>50m</option>
              </select>
            </div>
          </div>

          <div className="bg-sky-950/50 border border-sky-800/40 rounded-xl p-2 text-center text-xs text-sky-200">
            Objectif : <span className="font-bold text-sky-400">{totalClicks} Clic(s)</span> ({distance}m en bassin de {pool}m)
          </div>
        </div>

        {/* Chronomètre Display */}
        <div className="bg-slate-950 rounded-2xl p-6 text-center border border-slate-800 shadow-inner">
          <div className="text-xs font-mono text-slate-500 mb-1">TEMPS ÉCOULÉ</div>
          <div className="text-5xl font-mono font-black tracking-tight text-sky-400">
            {formatTime(elapsedTime)}
          </div>
        </div>

        {/* Zone de Tap interactive principal */}
        <div className="flex-1 min-h-[160px] flex flex-col gap-2">
          {!isFinished ? (
            <button
              onClick={handleMainTap}
              className={`w-full flex-1 rounded-2xl font-bold text-xl flex flex-col items-center justify-center p-4 transition active:scale-95 shadow-xl ${
                !isRunning && currentClick === 0
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-sky-600 hover:bg-sky-500 text-white"
              }`}
            >
              {!isRunning && currentClick === 0 ? (
                <>
                  <Play size={36} className="mb-1" />
                  <span>DÉMARRER LE CHRONO</span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black mb-1">
                    CLIC {currentClick + 1} / {totalClicks}
                  </span>
                  <span className="text-xs font-normal opacity-80">
                    {currentClick + 1 === totalClicks ? "Toucher pour ARRÊTER (Temps Final)" : `Valider Longueur (${(currentClick + 1) * pool}m)`}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full flex-1 bg-slate-800 border border-emerald-500/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={40} className="text-emerald-400 mb-2" />
              <div className="font-bold text-lg text-emerald-400">Course Terminée !</div>
              <div className="text-xs text-slate-400 mt-1">Enregistrée automatiquement dans l'historique</div>
            </div>
          )}

          <button
            onClick={resetChrono}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw size={16} />
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* Laps / Temps Intermédiaires */}
        {laps.length > 0 && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-3 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intermédiaires ({laps.length}/{totalClicks})</h3>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {laps.map((lap) => (
                <div key={lap.lapNumber} className="flex justify-between items-center text-xs bg-slate-900/60 p-2 rounded-lg">
                  <span className="font-semibold text-slate-300">L{lap.lapNumber} ({lap.distanceCovered}m)</span>
                  <span className="font-mono text-sky-400">{lap.formattedTime}</span>
                  <span className="font-mono text-slate-400 text-[10px]">+ {lap.splitFormatted}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historique Local */}
        {savedSessions.length > 0 && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 p-3 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historique des Courses</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {savedSessions.map((session) => (
                <div key={session.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sky-300">{session.swimmer} - {session.stroke}</span>
                    <button onClick={() => deleteSession(session.id)} className="text-slate-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{session.distance} ({session.pool}) - {session.date}</span>
                    <span className="font-mono font-bold text-emerald-400">{session.finalTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
