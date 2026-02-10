"use client"

import { useState } from "react"
import { evaluate } from "mathjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface HouseCalculatorProps {
  onResult?: (result: number) => void
  initialValue?: number
}

export function HouseCalculator({ onResult, initialValue = 0 }: HouseCalculatorProps) {
  const [expression, setExpression] = useState(initialValue ? initialValue.toString() : "")
  const [result, setResult] = useState<number | null>(initialValue || null)

  const handleNumberClick = (number: string) => {
    setExpression(expression + number)
  }

  const handleOperatorClick = (operator: string) => {
    setExpression(expression + operator)
  }

  const handleEqualsClick = () => {
    try {
      // Use mathjs evaluate for safe mathematical expression evaluation
      const calculatedResult = evaluate(expression)
      setResult(calculatedResult)
      onResult?.(calculatedResult)
    } catch (error) {
      console.error("Error evaluating expression:", error)
      setResult(null)
    }
  }

  const handleClearClick = () => {
    setExpression("")
    setResult(null)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* House Structure */}
      <div className="relative">
        {/* Roof */}
        <div className="w-full h-0 border-l-[150px] border-r-[150px] border-t-[100px] border-l-transparent border-r-transparent border-t-orange-700 mx-auto"></div>

        {/* Chimney */}
        <div className="absolute top-[-80px] right-[80px] w-[30px] h-[60px] bg-gray-700 rounded-t-md">
          <div className="w-[40px] h-[10px] bg-gray-800 absolute -top-[10px] -left-[5px]"></div>
        </div>

        {/* House Body */}
        <Card className="bg-orange-100 border-orange-300 border-2 rounded-md p-4 pt-6">
          {/* Display Window (Calculator Result) */}
          <div className="bg-white border-4 border-orange-800 rounded-t-lg mb-4 p-3 relative">
            {/* Window Frame */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-orange-800 transform -translate-y-1/2"></div>
            <div className="absolute top-0 left-1/2 w-[2px] h-full bg-orange-800 transform -translate-x-1/2"></div>

            {/* Calculator Display */}
            <div className="text-right mb-2 text-gray-600 z-10 relative">{expression}</div>
            <div className="text-right text-2xl font-bold z-10 relative">{result !== null ? result : 0}</div>
          </div>

          {/* Calculator Buttons as House Elements */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {/* First Row - Windows */}
            <Button
              onClick={() => handleNumberClick("7")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              7
            </Button>
            <Button
              onClick={() => handleNumberClick("8")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              8
            </Button>
            <Button
              onClick={() => handleNumberClick("9")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              9
            </Button>
            <Button
              onClick={() => handleOperatorClick("+")}
              className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-800 h-12"
            >
              +
            </Button>

            {/* Second Row - Windows */}
            <Button
              onClick={() => handleNumberClick("4")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              4
            </Button>
            <Button
              onClick={() => handleNumberClick("5")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              5
            </Button>
            <Button
              onClick={() => handleNumberClick("6")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              6
            </Button>
            <Button
              onClick={() => handleOperatorClick("-")}
              className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-800 h-12"
            >
              -
            </Button>

            {/* Third Row - Windows */}
            <Button
              onClick={() => handleNumberClick("1")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              1
            </Button>
            <Button
              onClick={() => handleNumberClick("2")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              2
            </Button>
            <Button
              onClick={() => handleNumberClick("3")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              3
            </Button>
            <Button
              onClick={() => handleOperatorClick("*")}
              className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-800 h-12"
            >
              *
            </Button>

            {/* Fourth Row - Door and Windows */}
            <Button
              onClick={() => handleNumberClick("0")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              0
            </Button>
            <Button
              onClick={() => handleNumberClick(".")}
              className="bg-blue-200 hover:bg-blue-300 text-black border-2 border-blue-800 rounded-t-lg h-12"
            >
              .
            </Button>
            <Button
              onClick={handleEqualsClick}
              className="bg-green-500 hover:bg-green-600 text-white border-2 border-green-800 h-12"
            >
              =
            </Button>
            <Button
              onClick={() => handleOperatorClick("/")}
              className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-800 h-12"
            >
              /
            </Button>
          </div>

          {/* Door (Clear Button) */}
          <div className="mt-4 relative">
            <Button
              onClick={handleClearClick}
              className="w-full h-16 bg-brown-600 hover:bg-brown-700 text-white border-2 border-brown-800 rounded-t-none"
              style={{ backgroundColor: "#8B4513" }}
            >
              Clear
            </Button>
            {/* Door Knob */}
            <div className="absolute right-6 top-1/2 w-3 h-3 bg-yellow-500 rounded-full border border-yellow-700"></div>
          </div>
        </Card>

        {/* Grass */}
        <div className="h-6 bg-green-500 rounded-b-lg mt-1"></div>
      </div>
    </div>
  )
}
