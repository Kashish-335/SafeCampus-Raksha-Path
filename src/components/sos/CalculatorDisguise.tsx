import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';

interface CalculatorDisguiseProps {
  isOpen: boolean;
  onClose: () => void;
  onSilentTriggerSOS?: () => void;
}

export const CalculatorDisguise: React.FC<CalculatorDisguiseProps> = ({
  isOpen,
  onClose,
  onSilentTriggerSOS,
}) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNum = (num: string) => {
    setDisplay((prev) => (prev === '0' ? num : prev + num));
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
  };

  const handleOp = (op: string) => {
    setPrevValue(parseFloat(display));
    setOperation(op);
    setDisplay('0');
  };

  const handleEquals = () => {
    // Secret Emergency Trigger codes
    if (display === '911' || display === '999') {
      if (onSilentTriggerSOS) onSilentTriggerSOS();
      onClose();
      return;
    }
    // Secret Exit code
    if (display === '1234') {
      onClose();
      return;
    }

    if (prevValue === null || operation === null) return;
    const current = parseFloat(display);
    let result = 0;
    switch (operation) {
      case '+':
        result = prevValue + current;
        break;
      case '-':
        result = prevValue - current;
        break;
      case '×':
        result = prevValue * current;
        break;
      case '÷':
        result = current !== 0 ? prevValue / current : 0;
        break;
    }
    setDisplay(String(result));
    setPrevValue(null);
    setOperation(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col justify-between p-6 select-none animate-fadeIn">
      {/* Stealth Header */}
      <div className="flex justify-between items-center text-xs text-slate-600">
        <span className="font-mono">Standard Calculator</span>
        {/* Subtle secret close button in top corner */}
        <button
          onClick={onClose}
          className="text-slate-700 hover:text-slate-400 p-2 text-xs"
          title="Exit disguise mode"
          aria-label="Exit disguise mode"
        >
          ✕
        </button>
      </div>

      {/* Screen */}
      <div className="text-right py-8">
        <div className="text-slate-400 text-sm h-6">
          {prevValue !== null && operation ? `${prevValue} ${operation}` : ''}
        </div>
        <div className="text-5xl font-light tracking-tight text-white overflow-x-auto scrollbar-none font-mono">
          {display}
        </div>
      </div>

      {/* Calculator Keypad */}
      <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto w-full pb-8">
        <button
          onClick={handleClear}
          className="h-16 rounded-full bg-slate-700 text-xl font-medium active:bg-slate-600"
        >
          AC
        </button>
        <button
          onClick={() => setDisplay(String(-parseFloat(display)))}
          className="h-16 rounded-full bg-slate-700 text-xl font-medium active:bg-slate-600"
        >
          ±
        </button>
        <button
          onClick={() => setDisplay(String(parseFloat(display) / 100))}
          className="h-16 rounded-full bg-slate-700 text-xl font-medium active:bg-slate-600"
        >
          %
        </button>
        <button
          onClick={() => handleOp('÷')}
          className="h-16 rounded-full bg-amber-600 text-2xl font-medium active:bg-amber-500"
        >
          ÷
        </button>

        <button
          onClick={() => handleNum('7')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          7
        </button>
        <button
          onClick={() => handleNum('8')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          8
        </button>
        <button
          onClick={() => handleNum('9')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          9
        </button>
        <button
          onClick={() => handleOp('×')}
          className="h-16 rounded-full bg-amber-600 text-2xl font-medium active:bg-amber-500"
        >
          ×
        </button>

        <button
          onClick={() => handleNum('4')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          4
        </button>
        <button
          onClick={() => handleNum('5')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          5
        </button>
        <button
          onClick={() => handleNum('6')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          6
        </button>
        <button
          onClick={() => handleOp('-')}
          className="h-16 rounded-full bg-amber-600 text-2xl font-medium active:bg-amber-500"
        >
          -
        </button>

        <button
          onClick={() => handleNum('1')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          1
        </button>
        <button
          onClick={() => handleNum('2')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          2
        </button>
        <button
          onClick={() => handleNum('3')}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          3
        </button>
        <button
          onClick={() => handleOp('+')}
          className="h-16 rounded-full bg-amber-600 text-2xl font-medium active:bg-amber-500"
        >
          +
        </button>

        <button
          onClick={() => handleNum('0')}
          className="col-span-2 h-16 rounded-full bg-slate-800 text-2xl font-light pl-7 text-left active:bg-slate-700"
        >
          0
        </button>
        <button
          onClick={() => {
            if (!display.includes('.')) setDisplay(display + '.');
          }}
          className="h-16 rounded-full bg-slate-800 text-2xl font-light active:bg-slate-700"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          className="h-16 rounded-full bg-amber-600 text-2xl font-medium active:bg-amber-500"
        >
          =
        </button>
      </div>

      <div className="text-center text-[10px] text-slate-700">
        Tip: Enter 1234= to exit disguise, or 911= to silently broadcast SOS.
      </div>
    </div>
  );
};
