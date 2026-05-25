"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, defaultValue, name, placeholder = "Seleccionar..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue || (options.length > 0 ? options[0].value : ''));
  const containerRef = useRef(null);

  // Sync state if defaultValue changes (e.g. editing a different event)
  useEffect(() => {
    setSelectedValue(defaultValue || (options.length > 0 ? options[0].value : ''));
  }, [defaultValue, options]);

  const selectedOption = options.find(opt => opt.value === selectedValue) || options[0];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Hidden input to ensure form submission works seamlessly */}
      <input type="hidden" name={name} value={selectedValue} />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-iskf-red/50 focus:border-iskf-red transition-all"
      >
        <div className="flex items-center gap-3">
          {selectedOption?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOption.logoUrl} alt="" className="w-6 h-6 rounded-full object-contain bg-white shadow-sm border border-gray-100" />
          )}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-auto no-scrollbar">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                setSelectedValue(option.value);
                setIsOpen(false);
              }}
              className="flex items-center justify-between px-4 py-3 hover:bg-red-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                {option.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={option.logoUrl} alt="" className="w-6 h-6 rounded-full object-contain bg-white shadow-sm border border-gray-100" />
                )}
                <span className={`text-sm ${selectedValue === option.value ? 'font-bold text-iskf-red' : 'font-medium text-gray-700'}`}>
                  {option.label}
                </span>
              </div>
              {selectedValue === option.value && <Check size={16} className="text-iskf-red" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
