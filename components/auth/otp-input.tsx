"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
}

export function OTPInput({ value, onChange, onComplete, length = 6, disabled = false }: OTPInputProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, length, onComplete])

  const handleChange = (index: number, newValue: string) => {
    const sanitized = newValue.replace(/\D/g, "")

    if (sanitized.length === 0) {
      const newOtp = value.split("")
      newOtp[index] = ""
      onChange(newOtp.join(""))
      return
    }

    if (sanitized.length === 1) {
      const newOtp = value.split("")
      newOtp[index] = sanitized
      onChange(newOtp.join(""))

      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus()
        setActiveIndex(index + 1)
      }
    } else if (sanitized.length > 1) {
      const digits = sanitized.slice(0, length)
      onChange(digits.padEnd(length, ""))

      const nextIndex = Math.min(digits.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
      setActiveIndex(nextIndex)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        const newOtp = value.split("")
        newOtp[index] = ""
        onChange(newOtp.join(""))
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        setActiveIndex(index - 1)
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setActiveIndex(index - 1)
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setActiveIndex(index + 1)
    }
  }

  const handleFocus = (index: number) => {
    setActiveIndex(index)
    inputRefs.current[index]?.select()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length)
    onChange(pastedData.padEnd(length, ""))

    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
    setActiveIndex(nextIndex)
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            activeIndex === index && !disabled && "ring-2 ring-blue-500 border-blue-500",
            value[index] && "border-blue-400 bg-blue-50",
            !value[index] && "border-gray-300 bg-white",
            disabled && "bg-gray-100 cursor-not-allowed opacity-50",
          )}
        />
      ))}
    </div>
  )
}
