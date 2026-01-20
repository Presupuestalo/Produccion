"use client"

import { useState } from "react"

interface SimpleCalculatorProps {
  onResult?: (result: number) => void
}

export function SimpleCalculator({ onResult }: SimpleCalculatorProps) {
  const [expression, setExpression] = useState("")
  const [result, setResult] = useState<number | null>(null)

  const handleNumberClick = (number: string) => {
    setExpression(expression + number)
  }

  const handleOperatorClick = (operator: string) => {
    setExpression(expression + operator)
  }

  const handleEqualsClick = () => {
    try {
      // eslint-disable-next-line no-eval
      const calculatedResult = eval(expression)
      setResult(calculatedResult)
      onResult?.(calculatedResult)
    } catch (error) {
      setResult(null)
    }
  }

  const handleClearClick = () => {
    setExpression("")
    setResult(null)
  }

  return (
    <div className="border rounded-md p-4">
      <div className="text-right mb-2">{expression}</div>
      <div className="text-right text-2xl font-bold">{result !== null ? result : 0}</div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <button onClick={() => handleNumberClick("7")} className="border p-2">
          7
        </button>
        <button onClick={() => handleNumberClick("8")} className="border p-2">
          8
        </button>
        <button onClick={() => handleNumberClick("9")} className="border p-2">
          9
        </button>
        <button onClick={() => handleOperatorClick("+")} className="border p-2">
          +
        </button>

        <button onClick={() => handleNumberClick("4")} className="border p-2">
          4
        </button>
        <button onClick={() => handleNumberClick("5")} className="border p-2">
          5
        </button>
        <button onClick={() => handleNumberClick("6")} className="border p-2">
          6
        </button>
        <button onClick={() => handleOperatorClick("-")} className="border p-2">
          -
        </button>

        <button onClick={() => handleNumberClick("1")} className="border p-2">
          1
        </button>
        <button onClick={() => handleNumberClick("2")} className="border p-2">
          2
        </button>
        <button onClick={() => handleNumberClick("3")} className="border p-2">
          3
        </button>
        <button onClick={() => handleOperatorClick("*")} className="border p-2">
          *
        </button>

        <button onClick={() => handleNumberClick("0")} className="border p-2">
          0
        </button>
        <button onClick={() => handleNumberClick(".")} className="border p-2">
          .
        </button>
        <button onClick={handleEqualsClick} className="border p-2">
          =
        </button>
        <button onClick={() => handleOperatorClick("/")} className="border p-2">
          /
        </button>
      </div>

      <button onClick={handleClearClick} className="w-full mt-4 border p-2">
        Clear
      </button>
    </div>
  )
}
