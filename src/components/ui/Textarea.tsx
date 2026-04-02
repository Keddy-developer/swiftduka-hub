// src/components/ui/Textarea.tsx
import React from "react";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<Props> = ({ className = "", ...props }) => {
  return <textarea className={`form-control ${className}`} {...props} />;
};
