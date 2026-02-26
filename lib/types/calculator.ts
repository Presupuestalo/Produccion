import type { Room, GlobalConfig } from "@/types/calculator"

export interface CalculatorData {
  demolition?: {
    rooms?: Room[]
    config?: any
    settings?: any
    [key: string]: any
  }
  reform?: {
    rooms?: Room[]
    config?: any
    partitions?: any[]
    wallLinings?: any[]
    [key: string]: any
  }
  globalConfig?: GlobalConfig
  electrical?: {
    config?: any
    [key: string]: any
  }
  [key: string]: any
}
