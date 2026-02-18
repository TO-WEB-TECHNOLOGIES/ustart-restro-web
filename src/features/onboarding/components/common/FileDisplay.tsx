import React from "react";
import { Paperclip, X } from "lucide-react";

interface FileDisplayProps {
  file: File | string | null | undefined;
  onRemove?: () => void;
}

export const FileDisplay: React.FC<FileDisplayProps> = ({ file, onRemove }) => {
  if (!file) return null;

  const isUrl =
    typeof file === "string" &&
    (file.startsWith("http") || file.startsWith("/"));
  const name =
    file instanceof File
      ? file.name
      : typeof file === "string"
        ? file.split("/").pop() || file
        : "Unknown File";

  return (
    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-700 max-w-full group">
      <Paperclip className="w-3 h-3 flex-shrink-0" />
      {isUrl ? (
        <a
          href={file as string}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate max-w-[120px] text-blue-600 hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {name}
        </a>
      ) : (
        <span className="truncate max-w-[120px]">{name}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-slate-400 hover:text-red-500 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
