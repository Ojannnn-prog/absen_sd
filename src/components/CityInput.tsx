"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Check, Loader2, Map } from "lucide-react";

export default function CityInput({ 
  defaultValue = "", 
  name = "birthPlace" 
}: { 
  defaultValue?: string,
  name?: string 
}) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch from API with debounce
  useEffect(() => {
    if (!value || value.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://kodepos.vercel.app/search/?q=${encodeURIComponent(value)}`);
        const json = await res.json();
        
        if (json && json.data) {
          // Buat format unik agar tidak ada duplikasi berlebih jika ada kelurahan dengan nama sama
          const uniqueResults = json.data.reduce((acc: any[], current: any) => {
            const formatStr = `${current.village}, Kec. ${current.district}, ${current.regency}, Prov. ${current.province}`;
            if (!acc.find(item => item.formatStr === formatStr)) {
              acc.push({ ...current, formatStr });
            }
            return acc;
          }, []).slice(0, 10); // Batasi 10 hasil terbaik
          
          setResults(uniqueResults);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input 
        type="text" 
        name={name} 
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        required 
        placeholder="Ketik nama kota, kecamatan, atau desa..."
        autoComplete="off"
        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white" 
      />
      
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
      )}
      
      {/* Custom Dropdown */}
      {isOpen && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length > 0 ? (
            <ul className="py-1 flex flex-col">
              {results.map((item, idx) => (
                <li 
                  key={idx}
                  onClick={() => {
                    setValue(item.formatStr);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-indigo-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0 ${
                    value === item.formatStr ? "bg-indigo-50" : ""
                  }`}
                >
                  <Map className={`w-4 h-4 mt-0.5 shrink-0 ${value === item.formatStr ? "text-primary" : "text-gray-400"}`} />
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className={`font-semibold ${value === item.formatStr ? "text-primary" : "text-gray-900"}`}>
                      {item.village}
                    </span>
                    <span className="text-xs text-gray-500 leading-snug">
                      Kec. {item.district}, {item.regency}, Prov. {item.province}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : !loading ? (
            <div className="px-4 py-4 text-sm text-gray-500 text-center flex flex-col gap-1 items-center">
              <span className="font-medium text-gray-700">"{value}" tidak ditemukan.</span>
              <span className="text-xs">Gunakan nama ini sebagai input manual.</span>
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-gray-500 text-center">
              Mencari data wilayah...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
