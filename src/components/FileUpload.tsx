import React, { useCallback } from 'react';

interface FileUploadProps {
  onFile: (text: string, fileName: string) => void;
}

export function FileUpload({ onFile }: FileUploadProps) {
  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          onFile(text, file.name);
        }
      };
      reader.readAsText(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className="file-upload-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      role="region"
      aria-label="File upload area"
    >
      <p>Drag and drop a <code>.gfa</code> file here, or</p>
      <label className="file-upload-label">
        <input
          type="file"
          accept=".gfa"
          onChange={handleChange}
          aria-label="Upload GFA file"
          className="file-upload-input"
        />
        Browse file
      </label>
    </div>
  );
}
