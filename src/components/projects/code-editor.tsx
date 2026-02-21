"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Monaco
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#1e1e2e]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  ),
});

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ code, language, onChange, readOnly = false }: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1e1e2e]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={code}
      onChange={(value) => onChange(value || "")}
      theme="vs-dark"
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: "on",
        readOnly,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        folding: true,
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        quickSuggestions: !readOnly,
      }}
    />
  );
}
