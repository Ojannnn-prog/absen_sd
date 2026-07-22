"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

export default function RegionSelector() {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const [finalString, setFinalString] = useState("");

  // Fetch Provinces on mount
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then(setProvinces)
      .catch(console.error);
  }, []);

  // Fetch Regencies when Province changes
  useEffect(() => {
    if (!selectedProvince) return;
    const id = provinces.find((p) => p.name === selectedProvince)?.id;
    if (id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`)
        .then((res) => res.json())
        .then(setRegencies)
        .catch(console.error);
    }
  }, [selectedProvince, provinces]);

  // Fetch Districts when Regency changes
  useEffect(() => {
    if (!selectedRegency) return;
    const id = regencies.find((r) => r.name === selectedRegency)?.id;
    if (id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`)
        .then((res) => res.json())
        .then(setDistricts)
        .catch(console.error);
    }
  }, [selectedRegency, regencies]);

  // Update final string when district changes
  useEffect(() => {
    if (selectedProvince && selectedRegency && selectedDistrict) {
      // Format: Kecamatan, Kota, Provinsi
      // Note: API returns uppercase, we can format it to Title Case if we want, but let's keep it as is.
      setFinalString(`${selectedDistrict}, ${selectedRegency}, ${selectedProvince}`);
    } else {
      setFinalString("");
    }
  }, [selectedProvince, selectedRegency, selectedDistrict]);

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden input to pass to the Server Action formData */}
      <input type="hidden" name="birthPlace" value={finalString} required />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <select 
            value={selectedProvince} 
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedRegency("");
              setSelectedDistrict("");
              setRegencies([]);
              setDistricts([]);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
            required
          >
            <option value="">-- Pilih Provinsi --</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select 
            value={selectedRegency} 
            onChange={(e) => {
              setSelectedRegency(e.target.value);
              setSelectedDistrict("");
              setDistricts([]);
            }}
            disabled={!selectedProvince}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white disabled:bg-gray-100"
            required
          >
            <option value="">-- Pilih Kota/Kab --</option>
            {regencies.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select 
            value={selectedDistrict} 
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedRegency}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white disabled:bg-gray-100"
            required
          >
            <option value="">-- Pilih Kecamatan --</option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {finalString && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg flex items-center gap-1 border border-gray-100">
          <MapPin className="w-3 h-3 text-primary" />
          <span className="font-semibold text-gray-700">{finalString}</span>
        </div>
      )}
    </div>
  );
}
