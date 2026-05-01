import * as React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function Modal({ isOpen, onClose, children, title, description, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={cn("bg-background dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-lg border dark:border-gray-700 p-6 relative animate-in fade-in zoom-in-95 duration-200", className)}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4 dark:text-gray-300" />
          <span className="sr-only">Close</span>
        </button>
        
        {(title || description) && (
          <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
            {title && <h2 className="text-lg font-semibold leading-none tracking-tight dark:text-white">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground dark:text-gray-400">{description}</p>}
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}
