import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPin, Check, X, Search, Sparkles } from 'lucide-react';

interface SearchableDropdownProps {
  label: string;
  sublabel?: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  badge?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  sublabel,
  value,
  options,
  placeholder = 'Select or type anywhere...',
  onChange,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync internal input query with incoming value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!isOpen) setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Debounce typed text by 400ms to avoid freezing browser with rapid API queries
    debounceTimerRef.current = setTimeout(() => {
      onChange(val);
    }, 400);
  };

  const handleSelectOption = (opt: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setQuery(opt);
    onChange(opt);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setQuery('');
    onChange('');
    if (inputRef.current) inputRef.current.focus();
    setIsOpen(true);
  };

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && inputRef.current) {
        inputRef.current.focus();
      }
      return next;
    });
  };

  // Filter options based on typed search
  const cleanQuery = query.trim().toLowerCase();
  const filteredOptions = cleanQuery
    ? options.filter((opt) => opt.toLowerCase().includes(cleanQuery))
    : options;

  const isExactMatch = options.some(
    (opt) => opt.toLowerCase() === cleanQuery
  );

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      {/* Label & Sublabel Header */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
        {sublabel && (
          <span className="text-[10px] text-blue-600 font-semibold lowercase">
            {sublabel}
          </span>
        )}
      </div>

      {/* Input Box with Icons and Controls */}
      <div
        className={`relative flex items-center bg-white border rounded-xl shadow-xs transition-all ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="pl-3 pr-2 text-slate-400 flex items-center pointer-events-none">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full py-2.5 text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
        />

        {/* Clear & Dropdown Toggle Controls */}
        <div className="flex items-center pr-2 gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggle}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Toggle options list"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Header Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Search className="w-3 h-3 text-slate-400" />
              <span>
                {cleanQuery
                  ? `Found ${filteredOptions.length} match${filteredOptions.length === 1 ? '' : 'es'}`
                  : `All ${options.length} Destinations Available`}
              </span>
            </span>
            {badge && (
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md font-bold">
                {badge}
              </span>
            )}
          </div>

          {/* Scrollable Items List */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {/* Custom entry if typed query doesn't exactly match any listed option */}
            {cleanQuery && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelectOption(query.trim())}
                className="w-full px-3 py-2.5 text-left text-xs bg-blue-50/50 hover:bg-blue-100/80 text-blue-900 font-bold flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">
                    Use custom destination: <strong className="text-blue-700 font-extrabold">"{query.trim()}"</strong>
                  </span>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold px-2 py-0.5 rounded bg-white border border-blue-200 shrink-0 ml-2">
                  Select Custom
                </span>
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value?.toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-extrabold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{opt}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              !cleanQuery && (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  No destinations found.
                </div>
              )
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-slate-50/70 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>💡 Click any destination or type any custom city</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;