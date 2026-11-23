import React, { useRef, useEffect } from 'react';

interface SixDigitOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
}

export const SixDigitOtpInput: React.FC<SixDigitOtpInputProps> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  hasError = false,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split string into array of 6 digits (padded with empty strings)
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, char: string) => {
    const numericChars = char.replace(/\D/g, '');
    if (!numericChars) {
      // Character was non-numeric or cleared
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    // If user pasted or typed multiple digits
    if (numericChars.length > 1) {
      handlePasted(numericChars, index);
      return;
    }

    // Single digit input
    const newDigits = [...digits];
    newDigits[index] = numericChars[numericChars.length - 1];
    const newValue = newDigits.join('');
    onChange(newValue);

    // Auto-advance to next box if not at the end
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  };

  const handlePasted = (pastedText: string, startIndex: number) => {
    const numeric = pastedText.replace(/\D/g, '').slice(0, 6);
    if (!numeric) return;

    const newDigits = [...digits];
    for (let i = 0; i < numeric.length; i++) {
      if (startIndex + i < 6) {
        newDigits[startIndex + i] = numeric[i];
      }
    }
    const combined = newDigits.join('').slice(0, 6);
    onChange(combined);

    // Focus the box following the last pasted digit
    const nextFocusIndex = Math.min(startIndex + numeric.length, 5);
    inputsRef.current[nextFocusIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current cell is empty, move back and clear previous cell
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePasted(pastedData, index);
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" role="group" aria-label="6-digit verification code">
      {digits.map((digit, index) => {
        const isFilled = digit !== '';
        return (
          <React.Fragment key={index}>
            <div className="relative">
              <input
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                disabled={disabled}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(e, index)}
                onFocus={(e) => e.target.select()}
                className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border-2 transition-all duration-200 outline-none
                  bg-white dark:bg-[#0F172A]
                  text-slate-900 dark:text-white
                  ${
                    hasError
                      ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                      : isFilled
                      ? 'border-emerald-600 dark:border-blue-500 shadow-sm bg-emerald-50/20 dark:bg-blue-950/20'
                      : 'border-slate-300 dark:border-[#1E293B] hover:border-slate-400 dark:hover:border-slate-600'
                  }
                  focus:border-emerald-600 dark:focus:border-blue-500
                  focus:ring-4 focus:ring-emerald-500/20 dark:focus:ring-blue-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={`Digit ${index + 1}`}
              />
              {/* Subtle indicator bar at bottom of each box */}
              <div
                className={`absolute bottom-1 left-2.5 right-2.5 h-0.5 rounded-full transition-colors ${
                  isFilled
                    ? 'bg-emerald-600 dark:bg-blue-500'
                    : 'bg-transparent'
                }`}
              />
            </div>
            {/* Visual separator after 3rd digit */}
            {index === 2 && (
              <span className="text-slate-300 dark:text-slate-600 font-bold select-none text-lg">
                -
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
