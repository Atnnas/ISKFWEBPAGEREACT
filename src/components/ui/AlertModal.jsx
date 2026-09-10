"use client";
import React from 'react';

export default function AlertModal({ isOpen, onClose, title, message, isError = false, image = null, imageAlt = '' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-gray-900">
        <div className="p-6">
          {image && (
            <div className="flex justify-center mb-4">
              <div className="relative flex items-center justify-center">
                <img 
                  src={image} 
                  alt={imageAlt || title} 
                  className="w-32 h-32 object-contain drop-shadow-xl animate-in zoom-in-90 duration-300 select-none" 
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3.5 mb-4">
            <div className={`p-3 rounded-2xl shrink-0 ${isError ? 'bg-red-50 text-[#BE1622] border border-red-200' : 'bg-blue-50 text-[#2D2E83] border border-blue-200'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isError ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 font-medium mb-6 leading-relaxed">{message}</p>
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className={`px-6 py-2 rounded-xl text-white transition-all text-xs font-bold shadow-md cursor-pointer active:scale-95 ${
                isError 
                  ? 'bg-[#BE1622] hover:bg-[#9c0f1b] shadow-red-600/20' 
                  : 'bg-[#2D2E83] hover:bg-[#232468] shadow-blue-900/20'
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
