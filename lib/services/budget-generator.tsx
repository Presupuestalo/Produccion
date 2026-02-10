import type { SupabaseClient } from "@supabase/supabase-js"
import type { CalculatorData } from "@/lib/types/calculator"
import type {
  DemolitionData,
  ReformData,
  PriceItem,
  CategoryInfo,
  Room,
  WallDemolition
} from "@/lib/types/budget-generator"

interface GeneratedLineItem {
  category: string
  code?: string // Código del precio (ej: "01-D-01") desde price_master
  concept_code?: string // Now stores price_master.id (UUID)
  concept: string // Now from price_master.subcategory
  description: string // Now from price_master.description
  color?: string
  brand?: string
  model?: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  is_custom: boolean
  sort_order: number
  notes?: string // Now from price_master.notes
  base_price_id?: string // Reference to price_master.id
  price_type?: "master" | "custom" | "imported" // Tipo de precio
  volume?: number // Volumen de la partida
  volume_unit?: string // Unidad del volumen (m³, L, etc.)
}

// Alias for GeneratedLineItem for clarity in updates
type LineItem = GeneratedLineItem

export interface ProjectData {
  id: string
  name: string
  structure_type?: string
  demolition: DemolitionData
  reform: ReformData
  approved_budget_id?: string | null
}

export class BudgetGenerator {
  private lineItems: LineItem[] = []
  private sortOrder = 0
  private electricHeaterOutlets = 0
  private priceCache: Map<string, PriceItem> = new Map()

  // Project data populated from calculator data
  private project: Partial<ProjectData> = {}

  constructor(
    private calculatorData: CalculatorData | any, // Keep fallback for now
    private supabase: SupabaseClient,
  ) {
    console.log("[v0] BudgetGenerator - Raw data received:", JSON.stringify(calculatorData, null, 2))
    this.normalizeData()

    // Initialize project data from normalized data if available
    if (this.calculatorData.project) {
      this.project = this.calculatorData.project
    }
  }

  /**
   * Normaliza los datos de la calculadora para asegurar que tengan la estructura esperada
   * Puede recibir una estructura anidada { demolition: {...}, reform: {...} } 
   * o una estructura plana directamente desde la base de datos.
   */
  private normalizeData() {
    // Si ya tiene la estructura anidada, no hacemos nada
    if (this.calculatorData.demolition && this.calculatorData.reform) {
      console.log("[v0] BudgetGenerator - Data already nested, no normalization needed")
      return
    }

    console.log("[v0] BudgetGenerator - Normalizing flat data to nested structure...")
    const flat = this.calculatorData

    this.calculatorData = {
      demolition: {
        rooms: flat.rooms || [],
        config: flat.global_config || flat.demolition_config || {},
        settings: flat.demolition_settings || {}
      },
      reform: {
        rooms: flat.reform_rooms || flat.reformRooms || [],
        config: flat.reform_config || flat.reformConfig || {},
        partitions: flat.partitions || [],
        wallLinings: flat.wall_linings || flat.wallLinings || []
      },
      electrical: {
        config: flat.electrical_config || flat.electricalConfig || {}
      },
      globalConfig: flat.global_config || flat.globalConfig || {},
      project: flat.project || {}
    }

    console.log("[v0] BudgetGenerator - Normalized data:", JSON.stringify(this.calculatorData, null, 2))
  }

  /**
   * Genera el presupuesto completo basado en los datos de la calculadora
   */
  async generate(): Promise<GeneratedLineItem[]> {
    this.lineItems = []
    this.sortOrder = 0
    this.electricHeaterOutlets = 0 // Reset on each generation

    console.log("[v0] BudgetGenerator - Starting generation...")

    await this.loadPriceCatalog(this.supabase) // Pass supabase client



    // 01. DERRIBOS
    console.log("[v0] BudgetGenerator - Calling generateDemolitionItems()...")
    this.generateDemolitionItems()
    console.log("[v0] BudgetGenerator - lineItems after demolition:", this.lineItems.length)

    // 02. ALBAÑILERÍA
    console.log("[v0] BudgetGenerator - Calling generateAlbanileriaBudget()...")
    this.generateAlbanileriaBudget()
    console.log("[v0] BudgetGenerator - lineItems after masonry:", this.lineItems.length)

    // 03. TABIQUES Y TRASDOSADOS
    this.generatePartitionsItems()
    console.log("[v0] BudgetGenerator - lineItems after partitions:", this.lineItems.length)

    // 04. FONTANERÍA
    this.generatePlumbingItems()
    console.log("[v0] BudgetGenerator - lineItems after plumbing:", this.lineItems.length)

    // 05. CARPINTERÍA
    this.generateCarpentryItems()
    console.log("[v0] BudgetGenerator - lineItems after carpentry:", this.lineItems.length)

    // 07. CALEFACCIÓN
    this.generateHeatingItems()
    console.log("[v0] BudgetGenerator - lineItems after heating:", this.lineItems.length)

    // 06. ELECTRICIDAD
    this.generateElectricalItems()
    console.log("[v0] BudgetGenerator - lineItems after electrical:", this.lineItems.length)

    // 08. LIMPIEZA
    this.generateCleaningItems()
    console.log("[v0] BudgetGenerator - lineItems after cleaning:", this.lineItems.length)

    // 09. PINTURA
    this.generatePaintingItems()
    console.log("[v0] BudgetGenerator - lineItems after painting:", this.lineItems.length)

    // 10. MATERIALES
    this.generateMaterialsItems()
    console.log("[v0] BudgetGenerator - lineItems after materials:", this.lineItems.length)

    // 11. VENTANAS
    this.generateWindowsItems()
    console.log("[v0] BudgetGenerator - lineItems final:", this.lineItems.length)

    return this.lineItems
  }

  private async loadPriceCatalog(supabaseClient: SupabaseClient) {
    console.log("[v0] BudgetGenerator - Loading price catalog from database...")

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error("Usuario no autenticado")
    }

    // 0. Cargar todas las categorías para mapeo manual (más robusto que joins de Supabase)
    const { data: categoriesData, error: categoriesError } = await supabaseClient
      .from("price_categories")
      .select("id, name")

    if (categoriesError) {
      console.error("[v0] BudgetGenerator - Error loading price categories:", categoriesError)
    }

    const categoryNamesMap = new Map<string, string>()
    if (categoriesData) {
      categoriesData.forEach((cat) => categoryNamesMap.set(cat.id, cat.name))
      console.log(`[v0] BudgetGenerator - Loaded ${categoriesData.length} price categories`)
    }

    // 1. Cargar precios master
    const { data: masterPrices, error: masterError } = await supabaseClient
      .from("price_master")
      .select("id, code, category_id, subcategory, description, unit, final_price, notes, color, brand, model")
      .eq("is_active", true)

    if (masterError) {
      console.error("[v0] BudgetGenerator - Error loading master prices:", {
        message: masterError.message,
        code: masterError.code,
        details: masterError.details,
        hint: masterError.hint,
      })
      throw new Error(`Error al cargar el catálogo de precios maestros: ${masterError.message}`)
    }

    if (masterPrices && masterPrices.length > 0) {
      console.log(`[v0] BudgetGenerator - Loaded ${masterPrices.length} master prices. First 5 codes:`, masterPrices.slice(0, 5).map(p => p.code))
    } else {
      console.warn("[v0] BudgetGenerator - NO master prices loaded from database (is_active=true)")
    }

    // Cache master prices first
    masterPrices?.forEach((price) => {
      const trimmedCode = price.code?.trim()
      if (!trimmedCode) return

      this.priceCache.set(trimmedCode, {
        id: price.id,
        code: trimmedCode,
        category: categoryNamesMap.get(price.category_id) || "Sin categoría",
        subcategory: price.subcategory,
        description: price.description,
        unit: price.unit,
        final_price: price.final_price,
        notes: price.notes,
        color: price.color,
        brand: price.brand,
        model: price.model,
      })
    })

    // 2. Cargar precios personalizados del usuario (sobrescriben los master)
    const { data: userPrices, error: userError } = await supabaseClient
      .from("user_prices")
      .select("id, code, category_id, subcategory, description, unit, final_price, notes, color, brand, model")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (userError) {
      console.error("[v0] BudgetGenerator - Error loading user prices:", userError)
      // No lanzar error, continuar solo con precios master
    }

    if (userPrices && userPrices.length > 0) {
      console.log(`[v0] BudgetGenerator - Loaded ${userPrices.length} personalized prices. First 5 codes:`, userPrices.slice(0, 5).map(p => p.code))
      userPrices.forEach((userPrice) => {
        const trimmedCode = userPrice.code?.trim()
        if (!trimmedCode) return

        this.priceCache.set(trimmedCode, {
          id: userPrice.id,
          code: trimmedCode,
          category: categoryNamesMap.get(userPrice.category_id) || "Sin categoría",
          subcategory: userPrice.subcategory,
          description: userPrice.description,
          unit: userPrice.unit,
          final_price: userPrice.final_price,
          notes: userPrice.notes,
          color: userPrice.color,
          brand: userPrice.brand,
          model: userPrice.model,
        })
      })
    }

    console.log(`[v0] BudgetGenerator - Total prices in cache: ${this.priceCache.size}`)
  }

  private addLineItem(priceCode: string, quantity = 1, customNotes?: string, customPrice?: number) {
    const trimmedCode = priceCode.trim()
    const priceItem = this.priceCache.get(trimmedCode)
    if (!priceItem) {
      console.warn(`[v0] BudgetGenerator - Price not found in database: "${trimmedCode}" (Cache size: ${this.priceCache.size})`)
      return
    }

    const categoryMap: Record<string, CategoryInfo> = {
      "01": { category: "DERRIBOS", section: "demolition" },
      "02": { category: "ALBAÑILERÍA", section: "masonry" },
      "03": { category: "TABIQUES Y TRASDOSADOS", section: "partitions" },
      "04": { category: "FONTANERÍA", section: "plumbing" },
      "05": { category: "CARPINTERÍA", section: "carpentry" },
      "06": { category: "ELECTRICIDAD", section: "electrical" },
      "07": { category: "CALEFACCIÓN", section: "heating" },
      "08": { category: "LIMPIEZA", section: "cleaning" },
      "09": { category: "PINTURA", section: "painting" },
      "10": { category: "MATERIALES", section: "materials" },
      "11": { category: "VENTANAS", section: "windows" },
    }

    const categoryInfo = categoryMap[priceCode.split("-")[0]]

    const unitPrice = customPrice ?? priceItem.final_price
    const totalPrice = quantity * unitPrice

    console.log(`[v0] Adding line item with base_price_id:`, {
      code: priceItem.code,
      id: priceItem.id,
      isValidUUID:
        priceItem.id &&
        typeof priceItem.id === "string" &&
        priceItem.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    })

    this.lineItems.push({
      category: categoryInfo ? categoryInfo.category : priceItem.category,
      code: priceItem.code, // Código del precio (ej: "01-D-01")
      concept: priceItem.subcategory, // Concepto desde subcategory
      description: priceItem.description, // Descripción completa
      color: priceItem.color,
      brand: priceItem.brand,
      model: priceItem.model,
      unit: priceItem.unit,
      quantity,
      unit_price: unitPrice, // Solo precio final
      total_price: totalPrice,
      is_custom: false,
      sort_order: this.sortOrder++,
      base_price_id:
        priceItem.id &&
          typeof priceItem.id === "string" &&
          priceItem.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          ? priceItem.id
          : undefined,
      price_type: "master", // Origen: catálogo maestro
      notes: customNotes || priceItem.notes, // Usar customNotes si se proporciona, sino el del catálogo
    })
  }

  private addCustomLineItem(
    category: string,
    concept: string,
    description: string,
    unit: string,
    quantity: number,
    unitPrice: number,
    notes?: string, // Ignorado, mantenido por compatibilidad
  ) {
    this.lineItems.push({
      category,
      concept,
      description,
      unit,
      quantity,
      unit_price: unitPrice,
      total_price: quantity * unitPrice,
      is_custom: true,
      sort_order: this.sortOrder++,
      price_type: "custom", // Origen: precio personalizado
      notes: notes,
    })
  }

  /**
   * 1. DERRIBOS - Genera partidas de demolición
   */
  private generateDemolitionItems() {
    // DERRIBOS
    const demolition: DemolitionData = this.calculatorData.demolition

    // This ensures that caldera/termo removal is always processed
    if (demolition?.config) {
      this.processHeatingRemoval(demolition)
    }

    if (!demolition || !demolition.rooms || demolition.rooms.length === 0) {
      console.log("[v0] BudgetGenerator - No demolition rooms found, but heating removal was processed")
      return
    }

    console.log("[v0] BudgetGenerator - Processing demolition for", demolition.rooms.length, "rooms")
    console.log("[v0] BudgetGenerator - Demolition config:", demolition.config)

    let totalFloorTileRemoval = 0
    let totalWallTileRemoval = 0
    let totalWoodenFloorRemoval = 0
    let totalGoteleRemoval = 0
    let totalWallpaperRemoval = 0
    let totalFalseCeilingRemoval = 0 // Initialize totalFalseCeilingRemoval
    let totalMoldingsRemoval = 0
    let totalSkirtingRemoval = 0
    let totalDoorsRemoval = 0
    let totalRadiatorsRemoval = 0
    let totalBathroomElementsRemoval = 0
    let totalKitchenFurnitureRemoval = 0
    let totalBedroomFurnitureRemoval = 0
    let totalLivingRoomFurnitureRemoval = 0
    let totalSewagePipesRemoval = 0

    demolition.rooms.forEach((room: any) => {
      // Picado de pavimento cerámico - verificar tanto removeFloor como removeAllCeramic
      const shouldRemoveCeramicFloor =
        (room.removeFloor || demolition.config?.removeAllCeramic) &&
        (room.floorMaterial === "Cerámico" || room.floorMaterial === "Cerámica")

      if (shouldRemoveCeramicFloor) {
        console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Picado suelo cerámico ${room.area} m²`)
        totalFloorTileRemoval += room.area || 0
      }

      // Levantado de suelo de madera
      if ((room.removeFloor || demolition.config?.removeWoodenFloor) && room.floorMaterial === "Madera") {
        totalWoodenFloorRemoval += room.area || 0
      }

      // Picado de cerámica vertical (alicatados) - Excluir habitaciones con "No se modifica"
      const shouldRemoveCeramicWalls =
        (room.removeWallTiles || demolition.config?.removeAllCeramic) &&
        (room.wallMaterial === "Cerámica" || room.wallMaterial === "Cerámico") &&
        room.wallMaterial !== "No se modifica"

      if (shouldRemoveCeramicWalls) {
        // Calcular superficie de paredes (perímetro * altura)
        let wallHeight = demolition.config?.standardHeight || 2.8

        if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
          wallHeight = room.currentCeilingHeight
        } else if (room.newCeilingHeight) {
          wallHeight = room.newCeilingHeight
        }

        const wallArea = (room.perimeter || 0) * wallHeight
        console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Picado paredes cerámicas ${wallArea} m²`)
        totalWallTileRemoval += wallArea
      }

      // Retirada de gotelé - Excluir habitaciones con "No se modifica"
      if (room.removeGotele && room.wallMaterial === "Gotelé" && room.wallMaterial !== "No se modifica") {
        let wallHeight = demolition.config?.standardHeight || 2.8

        if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
          wallHeight = room.currentCeilingHeight
        } else if (room.newCeilingHeight) {
          wallHeight = room.newCeilingHeight
        }

        totalGoteleRemoval += (room.perimeter || 0) * wallHeight
      }

      // Retirada de papel pintado
      if (room.wallMaterial === "Papel pintado") {
        let wallHeight = demolition.config?.standardHeight || 2.8

        if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
          wallHeight = room.currentCeilingHeight
        } else if (room.newCeilingHeight) {
          wallHeight = room.newCeilingHeight
        }

        totalWallpaperRemoval += (room.perimeter || 0) * wallHeight
      }

      // Retirada de falso techo
      if (room.removeFalseCeiling === true || room.currentCeilingStatus === "lowered_remove") {
        totalFalseCeilingRemoval += room.area || 0
      }

      // Retirada de molduras
      if (room.moldings) {
        totalMoldingsRemoval += room.perimeter || 0
      }

      totalSkirtingRemoval += room.perimeter || 0

      // Retirada de puertas
      if (room.hasDoors && room.doorList && room.doorList.length > 0) {
        room.doorList?.forEach((door: any) => {
          totalDoorsRemoval += 1
        })
      }

      // Retirada de radiadores
      if (room.hasRadiator) {
        totalRadiatorsRemoval += 1
      }

      // Retirada de elementos de baño
      if (room.removeBathroomElements) {
        totalBathroomElementsRemoval += 1
      }

      // Retirada de mobiliario de cocina
      if (room.removeKitchenFurniture) {
        totalKitchenFurnitureRemoval += 1
      }

      // Retirada de mobiliario de dormitorio
      if (room.removeBedroomFurniture) {
        totalBedroomFurnitureRemoval += 1
      }

      // Retirada de mobiliario de salón
      if (room.removeLivingRoomFurniture) {
        totalLivingRoomFurnitureRemoval += 1
      }

      // Retirada de bajantes fecales
      if (room.removeSewagePipes) {
        totalSewagePipesRemoval += 1
      }
    })

    console.log("[v0] BudgetGenerator - Demolition totals:", {
      floorTile: totalFloorTileRemoval,
      wallTile: totalWallTileRemoval,
      woodenFloor: totalWoodenFloorRemoval,
      gotele: totalGoteleRemoval,
      wallpaper: totalWallpaperRemoval,
      falseCeiling: totalFalseCeilingRemoval,
      moldings: totalMoldingsRemoval,
      skirting: totalSkirtingRemoval,
      doors: totalDoorsRemoval,
      radiators: totalRadiatorsRemoval,
      bathroomElements: totalBathroomElementsRemoval,
      kitchenFurniture: totalKitchenFurnitureRemoval,
      bedroomFurniture: totalBedroomFurnitureRemoval,
      livingRoomFurniture: totalLivingRoomFurnitureRemoval,
      sewagePipes: totalSewagePipesRemoval,
    })

    // Picado de pavimento cerámico
    if (totalFloorTileRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Picado de pavimento cerámico ${totalFloorTileRemoval} m²`)
      this.addLineItem("01-D-03", totalFloorTileRemoval, "Picado de pavimento cerámico")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de picado de pavimento (total = 0)")
    }

    // Picado de cerámica vertical
    if (totalWallTileRemoval > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Picado de alicatados en paredes ${totalWallTileRemoval} m²`,
      )
      this.addLineItem("01-D-02", totalWallTileRemoval, "Picado de alicatados en paredes")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de picado de alicatados (total = 0)")
    }

    // Levantado de suelo de madera
    if (totalWoodenFloorRemoval > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Retirada de tarima y rastreles ${totalWoodenFloorRemoval} m²`,
      )
      this.addLineItem("01-D-06", totalWoodenFloorRemoval, "Retirada de tarima y rastreles")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de suelo de madera (total = 0)")
    }

    // Preparación de paredes (gotelé y papel pintado)
    const totalWallPreparation = totalGoteleRemoval + totalWallpaperRemoval
    if (totalWallPreparation > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Preparación de paredes ${totalWallPreparation} m²`)
      this.addLineItem("01-D-13", totalWallPreparation, "Preparación de paredes")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de preparación de paredes (total = 0)")
    }

    // Retirada de falso techo
    if (totalFalseCeilingRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Retirada de falso techo ${totalFalseCeilingRemoval} m²`)
      this.addLineItem("01-D-04", totalFalseCeilingRemoval, "Retirada de falso techo")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de falso techo (total = 0)")
    }

    // Retirada de molduras
    if (totalMoldingsRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Retirada de molduras ${totalMoldingsRemoval} m`)
      this.addLineItem("01-D-05", totalMoldingsRemoval, "Retirada de molduras")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de molduras (total = 0)")
    }

    // Retirada de rodapié
    if (totalSkirtingRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Retirada de rodapié de madera ${totalSkirtingRemoval} m`)
      this.addLineItem("01-D-07", totalSkirtingRemoval, "Retirada de rodapié de madera")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de rodapié de madera (total = 0)")
    }

    // Desmontaje de puertas
    if (totalDoorsRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Desmontaje de puertas y marcos ${totalDoorsRemoval} ud`)
      this.addLineItem("01-D-12", totalDoorsRemoval, "Desmontaje de puertas y marcos")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de desmontaje de puertas (total = 0)")
    }

    // Retirada de elementos de baño
    if (totalBathroomElementsRemoval > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Retirada de elementos de baño ${totalBathroomElementsRemoval} ud`,
      )
      this.addLineItem("01-D-14", totalBathroomElementsRemoval, "Retirada de elementos de baño")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de elementos de baño (total = 0)")
    }

    // Retirada de mobiliario de cocina
    if (totalKitchenFurnitureRemoval > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Retirada de mobiliario de cocina ${totalKitchenFurnitureRemoval} ud`,
      )
      this.addLineItem("01-D-15", totalKitchenFurnitureRemoval, "Retirada de mobiliario de cocina")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de mobiliario de cocina (total = 0)")
    }

    // Retirada de armarios y resto de mobiliario (dormitorios + salón)
    const totalFurnitureRemoval = totalBedroomFurnitureRemoval + totalLivingRoomFurnitureRemoval
    if (totalFurnitureRemoval > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Retirada de armarios y resto mobiliario ${totalFurnitureRemoval} ud`,
      )
      this.addLineItem("01-D-16", totalFurnitureRemoval, "Retirada de armarios y resto mobiliario")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de armarios y resto mobiliario (total = 0)")
    }

    // Demolición de tabiques (desde globalConfig)
    if (demolition.config?.wallDemolitions && demolition.config.wallDemolitions.length > 0) {
      demolition.config.wallDemolitions.forEach((wallDemolition: any) => {
        if (wallDemolition.area > 0) {
          console.log(
            `[v0] BudgetGenerator - Generando partida: Demolición de tabiquería (${wallDemolition.thickness}cm) ${wallDemolition.area} m²`,
          )
          this.addLineItem("01-D-01", wallDemolition.area, `Demolición de tabiquería (${wallDemolition.thickness}cm)`)
        } else {
          console.log(
            `[v0] BudgetGenerator - NO se genera partida de demolición de tabiquería (${wallDemolition.thickness}cm) (area = 0)`,
          )
        }
      })
    }

    // Contenedor de escombros (calcular según volumen)
    const totalDebris = this.calculateTotalDebris()
    if (totalDebris > 0) {
      const containerSize = demolition.settings?.containerSize || 5
      const containersNeeded = Math.ceil(totalDebris / containerSize)
      console.log(`[v0] BudgetGenerator - Generando partida: Contenedor de ${containerSize}m³ ${containersNeeded} ud`)
      this.addLineItem("01-D-09", containersNeeded, `Contenedor de ${containerSize}m³`)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de contenedor de escombros (total debris = 0)")
    }

    // Horas de bajada de escombros
    const demolitionHours = this.calculateDemolitionHours()
    if (demolitionHours > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Bajada manual de escombros ${demolitionHours} h`)
      this.addLineItem("01-D-10", demolitionHours, "Bajada manual de escombros")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de bajada manual de escombros (total hours = 0)")
    }

    // Retirada de radiadores
    if (totalRadiatorsRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Retirada de radiadores ${totalRadiatorsRemoval} ud`)
      this.addLineItem("01-D-08", totalRadiatorsRemoval, "Retirada de radiadores")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de radiadores (total = 0)")
    }

    // Retirada de caldera o termo eléctrico
    // 01-D-18: RETIRAR CALDERA
    // 01-D-17: RETIRAR TERMO ELÉCTRICO
  }

  private processHeatingRemoval(demolition: DemolitionData) {
    console.log("[v0] processHeatingRemoval called with demolition.config:", demolition.config)

    if (!demolition.config) {
      console.log("[v0] No demolition.config found, skipping heating removal")
      return
    }

    console.log("[v0] changeBoiler:", demolition.config.changeBoiler)
    console.log("[v0] removeWaterHeater:", demolition.config.removeWaterHeater)

    if (demolition.config.changeBoiler === true) {
      console.log("[v0] Adding RETIRAR CALDERA to budget with code 01-D-18")

      // Try to get the price from the cache first
      const calderaPrice = this.priceCache.get("01-D-18")
      const unitPrice = calderaPrice?.final_price || 74.75

      this.lineItems.push({
        category: "DERRIBOS",
        code: "01-D-18",
        concept: "DESMONTAJE Y RETIRADA DE CALDERA",
        description:
          "Desmontaje y retirada de caldera existente, incluyendo desconexión de instalaciones y transporte a punto limpio",
        quantity: 1,
        unit: "ud",
        volume: 0.15,
        volume_unit: "m³",
        unit_price: unitPrice,
        total_price: unitPrice,
        is_custom: false,
        sort_order: this.sortOrder++,
        price_type: "master",
        base_price_id: calderaPrice?.id,
      } as any)

      console.log("[v0] RETIRAR CALDERA added successfully")
    }

    if (demolition.config.removeWaterHeater === true) {
      console.log("[v0] Adding RETIRAR TERMO ELÉCTRICO to budget with code 01-D-17")

      // Try to get the price from the cache first
      const termoPrice = this.priceCache.get("01-D-17")
      const unitPrice = termoPrice?.final_price || 51.75

      this.lineItems.push({
        category: "DERRIBOS",
        code: "01-D-17",
        concept: "DESMONTAJE Y RETIRADA DE TERMO",
        description:
          "Desmontaje y retirada de termo eléctrico existente, incluyendo desconexión de instalaciones y transporte a punto limpio",
        quantity: 1,
        unit: "ud",
        volume: 0.08,
        volume_unit: "m³",
        unit_price: unitPrice,
        total_price: unitPrice,
        is_custom: false,
        sort_order: this.sortOrder++,
        price_type: "master",
        base_price_id: termoPrice?.id,
      } as any)

      console.log("[v0] RETIRAR TERMO ELÉCTRICO added successfully")
    }
  }

  /**
   * 2. ALBAÑILERÍA - Genera partidas de albañilería
   */
  // Renamed from generateMasonryItems to generateAlbanileriaBudget
  private generateAlbanileriaBudget() {
    console.log("[v0] BudgetGenerator - INICIANDO generateAlbanileriaBudget")

    // Access project data for structure type
    const { demolition, reform } = this.calculatorData
    const tileAllFloors = reform.config?.tileAllFloors || false

    console.log("[v0] BudgetGenerator - generateAlbanileriaBudget called")
    console.log("[v0] BudgetGenerator - reform:", reform)
    console.log("[v0] BudgetGenerator - demolition:", demolition)

    if (!reform) {
      console.log("[v0] BudgetGenerator - NO reform data, skipping masonry items")
      return
    }

    // Calcular m² de levantado de suelo + picado de baldosa desde demolición
    let screedArea = 0
    let arlitaArea = 0 // Solo baños y cocinas con suelo picado (estructura madera/mixta)
    let rastreladoArea = 0 // Otras habitaciones con suelo de madera levantado (estructura madera/mixta)

    const structureType = this.project.structure_type || "Hormigón"
    const isWoodenOrMixedStructure = structureType === "Madera" || structureType === "Mixta"
    console.log(
      `[v0] BudgetGenerator - Tipo de estructura: ${structureType}, Es madera o mixta: ${isWoodenOrMixedStructure}`,
    )

    const floorTilingArea = this.calculateFloorTilingArea()
    console.log(`[v0] BudgetGenerator - Área que llevará embaldosado: ${floorTilingArea} m²`)

    if (demolition && demolition.rooms && demolition.rooms.length > 0) {
      demolition.rooms.forEach((room: any) => {
        const isBathroomOrKitchen = room.type === "Baño" || room.type === "Cocina"

        const reformRoom = reform.rooms?.find((r: any) => r.type === room.type && r.number === room.number)
        const willHaveTiling =
          tileAllFloors || (reformRoom && (reformRoom.type === "Baño" || reformRoom.type === "Cocina"))

        // Levantado de suelo de madera
        if ((room.removeFloor || demolition.config?.removeWoodenFloor) && room.floorMaterial === "Madera") {
          console.log(
            `[v0] BudgetGenerator - Procesando suelo madera ${room.type} ${room.number}: ${room.area} m² (willHaveTiling: ${willHaveTiling})`,
          )

          if (isWoodenOrMixedStructure) {
            // Estructura de madera/mixta → Rastrelado solo si NO va a llevar baldosa
            if (!willHaveTiling) {
              rastreladoArea += room.area || 0
              console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Agregado a RASTRELADO ${room.area} m²`)
            }
          } else {
            // Estructura hormigón → Solera solo si va a llevar baldosa
            if (willHaveTiling) {
              screedArea += room.area || 0
              console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Agregado a SOLERA ${room.area} m²`)
            }
          }
        }

        // Picado de baldosa cerámica
        const shouldRemoveCeramicFloor =
          (room.removeFloor || demolition.config?.removeAllCeramic) &&
          (room.floorMaterial === "Cerámico" || room.floorMaterial === "Cerámica")

        if (shouldRemoveCeramicFloor) {
          console.log(
            `[v0] BudgetGenerator - Procesando suelo cerámico ${room.type} ${room.number}: ${room.area} m² (willHaveTiling: ${willHaveTiling})`,
          )

          if (isWoodenOrMixedStructure && isBathroomOrKitchen) {
            // Estructura madera/mixta + baño/cocina → Arlita
            arlitaArea += room.area || 0
            console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Agregado a ARLITA ${room.area} m²`)
          } else {
            // Estructura hormigón → Solera solo si va a llevar baldosa
            if (willHaveTiling) {
              screedArea += room.area || 0
              console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Agregado a SOLERA ${room.area} m²`)
            }
          }
        }
      })
    }

    // La solera solo se aplica donde hay embaldosado, no en zonas con tarima/parquet

    console.log(
      `[v0] BudgetGenerator - Total screedArea: ${screedArea} m², arlitaArea: ${arlitaArea} m², rastreladoArea: ${rastreladoArea} m²`,
    )

    const hasRadiantFloor = reform.radiantFloor || false

    if (arlitaArea > 0 && !hasRadiantFloor) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Mortero aligerado arcilla expandida (ARLITA) ${arlitaArea} m²`,
      )
      this.addLineItem("02-A-01", arlitaArea, "Formación capa mortero aligerado arcilla expandida (ARLITA)")
    }

    // 1b. Formación de solera (capa compresora) normal - SIEMPRE PRIMERO, excepto si hay suelo radiante
    if (screedArea > 0 && !hasRadiantFloor) {
      console.log(`[v0] BudgetGenerator - Generando partida: Formación solera mortero y arlita ${screedArea} m²`)
      this.addLineItem("02-A-01", screedArea, "Formación solera mortero y arlita")
    } else if (hasRadiantFloor && screedArea > 0) {
      console.log(
        "[v0] BudgetGenerator - NO se genera partida de formación de solera porque hay suelo radiante (capa compresora incluida)",
      )
    }

    if (rastreladoArea > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Base nivelación mediante rastrelado en madera ${rastreladoArea} m²`,
      )
      this.addLineItem("05-C-01", rastreladoArea, "Ejecución base nivelación mediante rastrelado en madera")
    }

    // 3. Raseos de suelo (previo embaldosado)
    if (floorTilingArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Raseo previo embaldosado suelo ${floorTilingArea} m²`)
      this.addLineItem("02-A-10", floorTilingArea, "Raseo previo embaldosado suelo")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de raseo previo embaldosado (total = 0)")
    }

    // 4. Raseos de paredes (previo alicatado)
    const wallTilingArea = this.calculateWallTilingArea()
    if (wallTilingArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Raseo previo alicatado pared ${wallTilingArea} m²`)
      this.addLineItem("02-A-09", wallTilingArea, "Raseo previo alicatado pared")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de raseo previo alicatado (total = 0)")
    }

    // 5. Embaldosado de suelos
    if (floorTilingArea > 0) {
      // Si hay suelo radiante, usar partida específica
      if (reform.radiantFloor) {
        console.log(`[v0] BudgetGenerator - Generando partida: Embaldosado sobre suelo radiante ${floorTilingArea} m²`)
        this.addLineItem("02-A-08", floorTilingArea, "Embaldosado sobre suelo radiante")
      } else {
        console.log(`[v0] BudgetGenerator - Generando partida: Embaldosado de suelos ${floorTilingArea} m²`)
        this.addLineItem("02-A-07", floorTilingArea, "Embaldosado de suelos")
      }
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de embaldosado de suelos (total = 0)")
    }

    // 6. Alicatado de paredes
    if (wallTilingArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Alicatado de paredes ${wallTilingArea} m²`)
      this.addLineItem("02-A-06", wallTilingArea, "Alicatado de paredes")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de alicatado de paredes (total = 0)")
    }

    // 7. Lucido de paredes (calcular desde habitaciones que no tienen alicatado)
    let plasteringArea = 0
    if (reform.rooms && reform.rooms.length > 0) {
      reform.rooms.forEach((room: any) => {
        // Solo lucir paredes si el material es "Lucir y pintar" o "Solo lucir"
        const shouldPlasterWalls = room.wallMaterial === "Lucir y pintar" || room.wallMaterial === "Solo lucir"

        if (shouldPlasterWalls && room.type !== "Baño" && room.type !== "Cocina" && room.type !== "Terraza") {
          let wallHeight = reform.config?.standardHeight || 2.8

          if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
            // Techos bajados que se quedan - usar altura actual
            wallHeight = room.currentCeilingHeight
          } else if (room.lowerCeiling && room.newCeilingHeight) {
            // Bajar techo en reforma - usar nueva altura
            wallHeight = room.newCeilingHeight
          }
          // Si no hay condiciones especiales, usar standardHeight

          plasteringArea += room.perimeter * wallHeight
        }
      })
    }

    if (plasteringArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Lucido de paredes ${plasteringArea} m²`)
      this.addLineItem("02-A-11", plasteringArea, "Lucido de paredes")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de lucido de paredes (total = 0)")
    }

    // 8. Bajada de techos (calcular desde habitaciones con techo bajo)
    let ceilingLoweringArea = 0
    if (reform.rooms && reform.rooms.length > 0) {
      reform.rooms.forEach((room: any) => {
        // Si la habitación tiene una altura de techo nueva menor que la estándar, se baja el techo
        if (room.newCeilingHeight && room.newCeilingHeight < 2.8) {
          ceilingLoweringArea += room.area
        }
      })
    }

    if (ceilingLoweringArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Bajada de techos ${ceilingLoweringArea} m²`)
      this.addLineItem("02-A-16", ceilingLoweringArea, "Bajada de techos")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de bajada de techos (total = 0)")
    }

    // Otras partidas de albañilería
    // Capa autonivelante
    if (reform.selfLeveling && reform.selfLeveling > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Capa autonivelante ${reform.selfLeveling} m³`)
      this.addLineItem("02-A-02", reform.selfLeveling, "Capa autonivelante")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de capa autonivelante (total = 0)")
    }

    // Tapado de rozas (solo si hay habitaciones reales en reforma)
    if (this.hasRealRooms()) {
      console.log("[v0] BudgetGenerator - Generando partida: Tapado de rozas 1 ud")
      this.addLineItem("02-A-12", 1, "Tapado de rozas")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de tapado de rozas (no real rooms)")
    }

    // Colocación de molduras
    if (reform.moldings && reform.moldings > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Colocación de molduras ${reform.moldings} m`)
      this.addLineItem("02-A-13", reform.moldings, "Colocación de molduras")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de colocación de molduras (total = 0)")
    }

    // Cajetín puerta corredera
    const slidingDoors = this.countSlidingDoors()
    if (slidingDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Cajetín puerta corredera ${slidingDoors} ud`)
      this.addLineItem("02-A-14", slidingDoors, "Cajetín puerta corredera")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de cajetín puerta corredera (total doors = 0)")
    }

    // Ayuda a gremios (solo si hay habitaciones reales en reforma)
    if (this.hasRealRooms()) {
      console.log("[v0] BudgetGenerator - Generando partida: Ayuda a gremios 1 ud")
      this.addLineItem("02-A-15", 1, "Ayuda a gremios")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de ayuda a gremios (no real rooms)")
    }

    // Aislantes térmicos
    if (reform.insulation && reform.insulation > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Aislantes térmicos ${reform.insulation} m³`)
      this.addLineItem("02-A-17", reform.insulation, "Aislantes térmicos")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de aislantes térmicos (total = 0)")
    }
  }

  /**
   * 03. TABIQUES Y TRASDOSADOS - Genera partidas de tabiques y trasdosados
   */
  private generatePartitionsItems() {
    const reform: any = this.calculatorData.reform

    console.log("[v0] BudgetGenerator - generatePartitionsItems called")

    if (!reform) {
      console.log("[v0] BudgetGenerator - NO reform data, skipping partitions items")
      return
    }

    let brickPartitionsArea = 0
    let plasterboardPartitionsArea = 0
    let wallLiningsArea = 0

    // Calcular desde partitions array
    if (reform.partitions && Array.isArray(reform.partitions) && reform.partitions.length > 0) {
      console.log("[v0] BudgetGenerator - Processing partitions array:", reform.partitions)

      reform.partitions.forEach((partition: any) => {
        const area = (partition.linearMeters || 0) * (partition.height || 2.6)
        console.log(
          `[v0] BudgetGenerator - Partition type: ${partition.type}, linearMeters: ${partition.linearMeters}, height: ${partition.height}, area: ${area}`,
        )

        if (partition.type === "ladrillo") {
          brickPartitionsArea += area
        } else if (partition.type === "placa_yeso") {
          plasterboardPartitionsArea += area
        }
      })
    }

    // Calcular desde wallLinings array
    if (reform.wallLinings && Array.isArray(reform.wallLinings) && reform.wallLinings.length > 0) {
      console.log("[v0] BudgetGenerator - Processing wallLinings array:", reform.wallLinings)

      reform.wallLinings.forEach((lining: any) => {
        const area = (lining.linearMeters || 0) * (lining.height || 2.6)
        console.log(
          `[v0] BudgetGenerator - Wall lining linearMeters: ${lining.linearMeters}, height: ${lining.height}, area: ${area}`,
        )
        wallLiningsArea += area
      })
    }

    console.log("[v0] BudgetGenerator - Calculated areas:", {
      brickPartitions: brickPartitionsArea,
      plasterboardPartitions: plasterboardPartitionsArea,
      wallLinings: wallLiningsArea,
    })

    // Trasdosado en Placa de yeso laminado
    if (wallLiningsArea > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Trasdosado en Placa de yeso laminado ${wallLiningsArea} m²`,
      )
      this.addLineItem("03-T-01", wallLiningsArea, "Trasdosado en Placa de yeso laminado")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de trasdosado (total = 0)")
    }

    // Tabiques de ladrillo
    if (brickPartitionsArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Tabiques de ladrillo ${brickPartitionsArea} m²`)
      this.addLineItem("03-T-02", brickPartitionsArea, "Tabiques de ladrillo")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de tabiques de ladrillo (total = 0)")
    }

    // Tabiques de Placa de yeso laminado
    if (plasterboardPartitionsArea > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Tabiques de Placa de yeso laminado ${plasterboardPartitionsArea} m²`,
      )
      this.addLineItem("03-T-03", plasterboardPartitionsArea, "Tabiques de Placa de yeso laminado")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de tabiques de placa de yeso (total = 0)")
    }

    console.log("[v0] BudgetGenerator - Partitions items generation completed")
  }

  /**
   * 04. FONTANERÍA - Genera partidas de fontanería
   */
  private generatePlumbingItems() {
    const reform: any = this.calculatorData.reform
    const demolition: any = this.calculatorData.demolition

    if (!reform || !reform.rooms) return

    const bathrooms = reform.rooms.filter((r: any) => r.type === "Baño").length
    const kitchens = reform.rooms.filter((r: any) => r.type?.includes("Cocina")).length

    console.log(`[v0] BudgetGenerator - Bathrooms: ${bathrooms}, Kitchens: ${kitchens}`)

    // Red de baño (por cada baño)
    if (bathrooms > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Renovación completa de red AF y ACS en baño ${bathrooms} ud`,
      )
      this.addLineItem("04-F-01", bathrooms, "Renovación completa de red AF y ACS en baño")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de red de baño (total bathrooms = 0)")
    }

    // Red de cocina (por cada cocina)
    if (kitchens > 0) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Red de instalación de agua fría y caliente para cocina ${kitchens} ud`,
      )
      this.addLineItem("04-F-02", kitchens, "Red de instalación de agua fría y caliente para cocina")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de red de cocina (total kitchens = 0)")
    }

    // Bajante de fecales (si hay baños o si se retiran en demolición)
    const sewagePipesCount = demolition?.rooms?.filter((r: any) => r.removeSewagePipes).length || 0
    if (sewagePipesCount > 0 || (bathrooms > 0 && reform.drainPipe)) {
      console.log(
        `[v0] BudgetGenerator - Generando partida: Retirada y colocación de bajante fecal PVC-110mm ${Math.max(sewagePipesCount, bathrooms)} ud`,
      )
      this.addLineItem(
        "04-F-03",
        Math.max(sewagePipesCount, bathrooms),
        "Retirada y colocación de bajante fecal PVC-110mm",
      )
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de bajante de fecales (total pipes = 0)")
    }

    // Conducto extracción baño (por cada baño)
    if (bathrooms > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Conducto extracción baño ${bathrooms} ud`)
      this.addLineItem("04-F-04", bathrooms)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de conducto extracción baño (total bathrooms = 0)")
    }

    // Conducto campana extractora (por cada cocina)
    if (kitchens > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Conducto campana extractora ${kitchens} ud`)
      this.addLineItem("04-F-05", kitchens)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de conducto campana extractora (total kitchens = 0)")
    }

    // Instalación de sanitarios (por cada baño)
    if (bathrooms > 0) {
      // Inodoro
      console.log(`[v0] BudgetGenerator - Generando partida: Inodoro ${bathrooms} ud`)
      this.addLineItem("04-F-06", bathrooms)
      // Plato de ducha
      console.log(`[v0] BudgetGenerator - Generando partida: Plato de ducha ${bathrooms} ud`)
      this.addLineItem("04-F-07", bathrooms)
      // Mueble lavabo
      console.log(`[v0] BudgetGenerator - Generando partida: Mueble lavabo ${bathrooms} ud`)
      this.addLineItem("04-F-08", bathrooms)
      // Mampara
      console.log(`[v0] BudgetGenerator - Generando partida: Mampara ${bathrooms} ud`)
      this.addLineItem("04-F-09", bathrooms)
      // Grifo ducha
      console.log(`[v0] BudgetGenerator - Generando partida: Grifo ducha ${bathrooms} ud`)
      this.addLineItem("04-F-10", bathrooms)
      // Grifo lavabo
      console.log(`[v0] BudgetGenerator - Generando partida: Grifo lavabo ${bathrooms} ud`)
      this.addLineItem("04-F-11", bathrooms)
    } else {
      console.log("[v0] BudgetGenerator - NO se generan Partizan de instalación de sanitarios (total bathrooms = 0)")
    }

    // Montaje fregadero y electrodomésticos (por cada cocina)
    if (kitchens > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Fregadero ${kitchens} ud`)
      this.addLineItem("04-F-12", kitchens)
      console.log(`[v0] BudgetGenerator - Generando partida: Electrodomésticos ${kitchens} ud`)
      this.addLineItem("04-F-13", kitchens)
    } else {
      console.log(
        "[v0] BudgetGenerator - NO se generan partidas de montaje fregadero y electrodomésticos (total kitchens = 0)",
      )
    }
  }

  /**
   * 05. CARPINTERÍA - Genera partidas de carpintería
   */
  private generateCarpentryItems() {
    const reform: any = this.calculatorData.reform
    const demolition: any = this.calculatorData.demolition

    if (!reform) return

    let laminateFlooringArea = 0
    let vinylFlooringArea = 0

    if (reform.rooms && reform.rooms.length > 0) {
      reform.rooms.forEach((room: any) => {
        console.log(
          `[v0] BudgetGenerator - Room ${room.type} ${room.number} floorMaterial: "${room.floorMaterial}", area: ${room.area}`,
        )

        if (room.floorMaterial === "Suelo laminado" || room.floorMaterial === "Parquet flotante") {
          console.log(`[v0] BudgetGenerator - Adding ${room.area} m² to laminateFlooringArea`)
          laminateFlooringArea += room.area || 0
        } else if (room.floorMaterial === "Suelo vinílico") {
          console.log(`[v0] BudgetGenerator - Adding ${room.area} m² to vinylFlooringArea`)
          vinylFlooringArea += room.area || 0
        }
      })
    }

    console.log(`[v0] BudgetGenerator - Total laminateFlooringArea: ${laminateFlooringArea} m²`)
    console.log(`[v0] BudgetGenerator - Total vinylFlooringArea: ${vinylFlooringArea} m²`)

    // Instalación parquet flotante (MO)
    if (laminateFlooringArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Instalación parquet flotante ${laminateFlooringArea} m²`)
      this.addLineItem("05-C-02", laminateFlooringArea)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de instalación parquet flotante (total = 0)")
    }

    // Instalación suelo vinílico (MO)
    if (vinylFlooringArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Instalación suelo vinílico ${vinylFlooringArea} m²`)
      this.addLineItem("05-C-03", vinylFlooringArea)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de instalación suelo vinílico (total = 0)")
    }

    // Rodapié (perímetro total de habitaciones)
    const baseboardLength = this.calculateBaseboardLength()
    if (baseboardLength > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Rodapié ${baseboardLength} m`)
      this.addLineItem("05-C-04", baseboardLength)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de rodapié (total length = 0)")
    }

    // Premarcos (por cada puerta)
    const totalDoors = this.countTotalDoors()
    if (totalDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Premarcos ${totalDoors} ud`)
      this.addLineItem("05-C-05", totalDoors)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de premarcos (total doors = 0)")
    }

    // Puertas abatibles
    const swingDoors = this.countSwingDoors()
    if (swingDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puertas abatibles ${swingDoors} ud`)
      this.addLineItem("05-C-07", swingDoors)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de puertas abatibles (total doors = 0)")
    }

    // Puertas correderas
    const slidingDoors = this.countSlidingDoors()
    if (slidingDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puertas correderas ${slidingDoors} ud`)
      this.addLineItem("05-C-08", slidingDoors)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de puertas correderas (total doors = 0)")
    }

    // Puertas correderas exteriores con carril
    const exteriorSlidingDoors = this.countExteriorSlidingDoors()
    if (exteriorSlidingDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puertas correderas exteriores ${exteriorSlidingDoors} ud`)
      this.addLineItem("05-C-18", exteriorSlidingDoors)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de puertas correderas exteriores (total doors = 0)")
    }

    const hasEntryDoor =
      reform.config?.entranceDoorType === true ||
      reform.config?.entranceDoorType === "Acorazada" ||
      reform.config?.entranceDoorType === "Lacada"

    console.log(`[v0] BudgetGenerator - Entrance door config:`, {
      entranceDoorType: reform.config?.entranceDoorType,
      hasEntryDoor: hasEntryDoor,
    })

    // Puerta de entrada
    if (hasEntryDoor) {
      console.log("[v0] BudgetGenerator - Generando partida: Colocación puerta de seguridad entrada 1 ud")
      this.addLineItem("05-C-09", 1, "Colocación puerta de seguridad entrada")
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de puerta de entrada (no entry door)")
    }

    // Acuchillado y barnizado
    if (reform.floorSanding && reform.floorSanding > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Acuchillado y barnizado ${reform.floorSanding} m²`)
      this.addLineItem("05-C-10", reform.floorSanding)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de acuchillado y barnizado (total = 0)")
    }

    // Rebaje de puertas
    if (reform.doorTrimming && reform.doorTrimming > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Rebaje de puertas ${reform.doorTrimming} ud`)
      this.addLineItem("05-C-12", reform.doorTrimming)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de rebaje de puertas (total = 0)")
    }
  }

  /**
   * 07. CALEFACCIÓN - Genera partidas de calefacción
   */
  private generateHeatingItems() {
    console.log("[v0] BudgetGenerator - ENTRADA: generateHeatingItems")
    const demolition: any = this.calculatorData.demolition
    const reform: any = this.calculatorData.reform

    const heatingType = reform?.config?.reformHeatingType || "No Tiene"
    console.log("[v0] BudgetGenerator - Heating type:", heatingType)
    console.log("[v0] BudgetGenerator - Reform config:", reform?.config)

    // Acometida de gas - verificar si ya existe en demolición
    const hasGasInDemolition =
      demolition?.config?.heatingType === "Caldera + Radiadores" ||
      demolition?.config?.heatingType === "Acometida de Gas"

    console.log("[v0] BudgetGenerator - Has gas in demolition:", hasGasInDemolition)
    console.log("[v0] BudgetGenerator - Install gas connection:", reform?.config?.installGasConnection)

    // Instalar acometida de gas solo si no existe y se necesita
    if (!hasGasInDemolition && reform?.config?.installGasConnection) {
      console.log("[v0] BudgetGenerator - Generando partida: Acometida de gas 1 ud")
      this.addLineItem("07-CAL-08", 1, "Acometida de gas (Aprox.)")
    } else if (hasGasInDemolition) {
      console.log("[v0] BudgetGenerator - NO se genera acometida de gas (ya existe en demolición)")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera acometida de gas (no solicitada)")
    }

    if (heatingType === "Eléctrica") {
      console.log("[v0] BudgetGenerator - Procesando: Calefacción Eléctrica")

      // Contar emisores eléctricos
      let totalElectricHeaters = 0
      if (reform?.rooms && reform.rooms.length > 0) {
        reform.rooms.forEach((room: any) => {
          if (room.hasRadiator || (room.radiators && Array.isArray(room.radiators) && room.radiators.length > 0)) {
            const heaterCount = room.radiators?.length || 1
            totalElectricHeaters += heaterCount
            console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: ${heaterCount} emisores eléctricos`)
          }
        })
      }

      console.log(`[v0] BudgetGenerator - Total emisores eléctricos: ${totalElectricHeaters}`)

      if (totalElectricHeaters > 0) {
        // 1. Fijación de emisor térmico (albañilería)
        console.log(`[v0] BudgetGenerator - Generando partida: Fijación emisores térmicos ${totalElectricHeaters} ud`)
        this.addLineItem("02-A-20", totalElectricHeaters, "Fijación de emisores térmicos")

        // 2. Emisor térmico como material
        console.log(`[v0] BudgetGenerator - Generando partida: Emisores térmicos ${totalElectricHeaters} ud`)
        this.addLineItem("10-M-25", totalElectricHeaters, "Emisores térmicos")

        // Instead of adding them here separately, we'll return this value
        // to be added to the electrical outlets total
        console.log(
          `[v0] BudgetGenerator - Enchufes para emisores eléctricos: ${totalElectricHeaters} ud (se añadirán al total de enchufes)`,
        )
        // Store for later use in electrical section
        this.electricHeaterOutlets = totalElectricHeaters
      } else {
        console.log("[v0] BudgetGenerator - NO se generan partidas de calefacción eléctrica (0 emisores)")
        this.electricHeaterOutlets = 0
      }
    }

    if (heatingType === "Caldera + Radiadores") {
      console.log("[v0] BudgetGenerator - Procesando: Caldera + Radiadores")

      // Instalación o sustitución de caldera
      const installGasBoiler = reform?.config?.installGasBoiler || false
      console.log("[v0] BudgetGenerator - Install gas boiler:", installGasBoiler)

      if (installGasBoiler) {
        console.log("[v0] BudgetGenerator - Generando partida: Colocación caldera de gas 1 ud")
        this.addLineItem("07-CAL-03", 1, "Colocación caldera de gas (Montaje MO)")

        // Legalización si se instala caldera
        console.log("[v0] BudgetGenerator - Generando partida: Legalización de instalación de gas 1 ud")
        this.addLineItem("07-CAL-06", 1, "Legalización de instalación de gas")
      }

      // Conteo de radiadores
      let installRadiators = 0
      let changeRadiators = 0

      if (reform?.rooms && reform.rooms.length > 0) {
        reform.rooms.forEach((room: any) => {
          if (room.radiatorAction === "Instalar") {
            installRadiators += room.radiatorCount || 0
          } else if (room.radiatorAction === "Cambiar") {
            changeRadiators += room.radiatorCount || 0
          }
        })
      }

      console.log("[v0] BudgetGenerator - Radiators to install:", installRadiators)
      console.log("[v0] BudgetGenerator - Radiators to change:", changeRadiators)

      const totalRadiators = installRadiators + changeRadiators

      if (totalRadiators > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Fijación de radiadores ${totalRadiators} ud`)
        this.addLineItem("02-A-20", totalRadiators, "Fijación de radiadores")

        // Red por radiador
        console.log(`[v0] BudgetGenerator - Generando partida: Red alimentación por radiador ${totalRadiators} ud`)
        this.addLineItem("07-CAL-04", totalRadiators, "Red alimentación por radiador")

        // Colocación y movimiento de radiadores
        console.log(`[v0] BudgetGenerator - Generando partida: Colocación y movimiento radiadores ${totalRadiators} ud`)
        this.addLineItem("07-CAL-05", totalRadiators, "Colocación y movimiento de radiadores")
      }
    }

    if (heatingType === "Suelo Radiante") {
      console.log("[v0] BudgetGenerator - Procesando: Suelo Radiante")

      // Si se solicita instalar caldera para suelo radiante
      if (reform?.config?.installGasBoiler) {
        console.log("[v0] BudgetGenerator - Generando partida: Colocación caldera de gas para suelo radiante 1 ud")
        this.addLineItem("07-CAL-03", 1, "Colocación caldera de gas (Montaje MO) para suelo radiante")

        // Legalización si se instala caldera
        console.log("[v0] BudgetGenerator - Generando partida: Legalización de instalación de gas 1 ud")
        this.addLineItem("07-CAL-06", 1, "Legalización de instalación de gas")
      }

      let radiantFloorArea = 0
      if (reform?.rooms && reform.rooms.length > 0) {
        reform.rooms.forEach((room: any) => {
          const roomType = room.type?.toLowerCase() || ""
          const isOutdoorSpace =
            roomType.includes("terraza") ||
            roomType.includes("balcón") ||
            roomType.includes("balcon") ||
            roomType.includes("patio")

          if (!isOutdoorSpace) {
            console.log(
              `[v0] BudgetGenerator - Adding ${room.area} m² from ${room.type} ${room.number} to radiant floor`,
            )
            radiantFloorArea += room.area || 0
          } else {
            console.log(
              `[v0] BudgetGenerator - Excluding ${room.area} m² from ${room.type} ${room.number} (outdoor space)`,
            )
          }
        })
      }

      console.log(`[v0] BudgetGenerator - Total radiant floor area: ${radiantFloorArea} m²`)

      // Solo añadir la partida de suelo radiante completo (60€/m²)
      if (radiantFloorArea > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Sistema completo suelo radiante ${radiantFloorArea} m²`)
        this.addLineItem(
          "07-CAL-11",
          radiantFloorArea,
          "Sistema completo de suelo radiante (colector, aislante, tubo y capa compresora)",
        )
      } else {
        console.log("[v0] BudgetGenerator - NO se genera partida de suelo radiante (área = 0)")
      }
    }

    // Termo eléctrico
    if (reform?.electricWaterHeater) {
      console.log("[v0] BudgetGenerator - Generando partida: Instalación y conexionado termo eléctrico 1 ud")
      this.addLineItem("07-CAL-10", 1, "Instalación y conexionado termo eléctrico DBL")
    }

    console.log(
      "[v0] BudgetGenerator - SALIDA: generateHeatingItems - Items generados:",
      this.lineItems.filter((item) => item.category === "07. CALEFACCIÓN").length,
    )
  }

  /**
   * 06. ELECTRICIDAD - Genera partidas de electricidad
   */
  private generateElectricalItems() {
    console.log("[v0] BudgetGenerator - ENTRADA: generateElectricalItems")
    const reform: any = this.calculatorData.reform

    if (!reform || !reform.rooms) {
      console.log("[v0] BudgetGenerator - NO reform data, skipping electrical items")
      return
    }

    const electricalConfig = this.calculatorData.electrical?.config || reform.electricalConfig

    const needsNewInstallation = electricalConfig?.needsNewInstallation === true

    console.log("[v0] BudgetGenerator - Electrical config:", {
      electricalConfig: electricalConfig,
      needsNewInstallation: needsNewInstallation,
    })

    if (!needsNewInstallation) {
      console.log(
        "[v0] BudgetGenerator - Electrical installation NOT needed (needsNewInstallation is not true), skipping electrical items",
      )
      return
    }

    let totalCeilingLights = 0
    let totalOutlets = 0
    let totalSwitches = 0
    let totalSwitchedPoints = 0
    let totalCrossoverPoints = 0
    let totalOutdoorOutlets = 0
    let totalTVOutlets = 0
    let totalRecessedLights = 0

    reform.rooms.forEach((room: any) => {
      if (room.electricalElements && Array.isArray(room.electricalElements)) {
        room.electricalElements.forEach((element: any) => {
          const quantity = element.quantity || 0

          switch (element.id || element.type) {
            case "puntosLuzTecho":
            case "Punto de luz techo":
              totalCeilingLights += quantity
              break
            case "enchufes":
            case "Enchufe normal":
              totalOutlets += quantity
              break
            case "sencillo":
            case "Interruptor":
            case "Interruptor sencillo":
              totalSwitches += quantity
              break
            case "conmutados":
            case "Punto conmutado":
              totalSwitchedPoints += quantity
              break
            case "cruzamiento":
            case "Punto de cruzamiento":
              totalCrossoverPoints += quantity
              break
            case "intemperie":
            case "Enchufe intemperie":
              totalOutdoorOutlets += quantity
              break
            case "tomaTV":
            case "Toma de TV":
              totalTVOutlets += quantity
              break
            case "focosEmpotrados":
            case "Foco empotrado":
              totalRecessedLights += quantity
              break
          }
        })
      }
    })

    // Add electric heater outlets to the total outlets count
    const heatingType = reform?.config?.reformHeatingType || "No Tiene"
    if (heatingType === "Eléctrica" && this.electricHeaterOutlets > 0) {
      console.log(
        `[v0] BudgetGenerator - Añadiendo enchufes de emisores eléctricos al total: ${this.electricHeaterOutlets}`,
      )
      totalOutlets += this.electricHeaterOutlets
    }

    console.log("[v0] BudgetGenerator - Electrical elements totals:", {
      ceilingLights: totalCeilingLights,
      outlets: totalOutlets,
      switches: totalSwitches,
      switchedPoints: totalSwitchedPoints,
      crossoverPoints: totalCrossoverPoints,
      outdoorOutlets: totalOutdoorOutlets,
      tvOutlets: totalTVOutlets,
      recessedLights: totalRecessedLights,
    })

    // If no electrical elements found in rooms, generate basic default installation
    if (totalCeilingLights === 0 && totalOutlets === 0 && totalSwitches === 0 && totalSwitchedPoints === 0) {
      console.log("[v0] BudgetGenerator - No electrical elements found in rooms, using basic default installation")
      // Basic defaults: 3 rooms = 3 lights, 6 outlets, 3 switches minimum
      const roomCount = reform.rooms.length
      totalCeilingLights = Math.max(roomCount, 3)
      totalOutlets = Math.max(roomCount * 2, 6)
      totalSwitches = Math.max(roomCount, 3)
    }

    // 06-E-01: Main electrical panel (always 1)
    console.log("[v0] BudgetGenerator - Generando partida: Cuadro general 1 ud")
    this.addLineItem("06-E-01", 1, "Cuadro general 18 elementos")

    // 06-E-02: TV and telecom cabling (always 1)
    console.log("[v0] BudgetGenerator - Generando partida: Canalización TV y telecomunicaciones 1 ud")
    this.addLineItem("06-E-02", 1, "Canalización TV y telecomunicaciones")

    // 06-E-03: Intercom (always 1)
    console.log("[v0] BudgetGenerator - Generando partida: Portero convencional 1 ud")
    this.addLineItem("06-E-03", 1, "Suministro y instalación portero convencional")

    // 06-E-04: Construction panel (always 1)
    console.log("[v0] BudgetGenerator - Generando partida: Cuadro de obra 1 ud")
    this.addLineItem("06-E-04", 1, "Cuadro de obra")

    // 06-E-05: Outlet line (always 1)
    console.log("[v0] BudgetGenerator - Generando partida: Línea de enchufes 1 ud")
    this.addLineItem("06-E-05", 1, "Línea de enchufes monofásica")

    // 06-E-06: Lighting line (always 1)
    console.log("[v0] BudgetGenerator - Generando partida: Línea de alumbrado 1 ud")
    this.addLineItem("06-E-06", 1, "Línea de alumbrado")

    // 06-E-07: Simple light points (ceiling lights + switches)
    // Corrected logic: Simple light points should be total ceiling lights. Switches are separate.
    const simpleLightPoints = totalCeilingLights
    if (simpleLightPoints > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puntos de luz sencillos ${simpleLightPoints} ud`)
      this.addLineItem("06-E-07", simpleLightPoints, "Punto de luz sencillos")
    }

    // 06-E-08: Switched points (conmutados)
    if (totalSwitchedPoints > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puntos conmutados ${totalSwitchedPoints} ud`)
      this.addLineItem("06-E-08", totalSwitchedPoints, "Puntos conmutados")
    }

    // 06-E-09: Crossover points (cruzamiento)
    if (totalCrossoverPoints > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puntos de cruzamiento ${totalCrossoverPoints} ud`)
      this.addLineItem("06-E-09", totalCrossoverPoints, "Puntos de cruzamiento")
    }

    // 06-E-10: Outlets (now includes electric heater outlets if applicable)
    if (totalOutlets > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puntos de enchufes ${totalOutlets} ud`)
      this.addLineItem("06-E-10", totalOutlets, "Puntos de enchufes")
    }

    // 06-E-12: TV outlets
    if (totalTVOutlets > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Toma de TV ${totalTVOutlets} ud`)
      this.addLineItem("06-E-12", totalTVOutlets, "Toma de TV")
    }

    // 06-E-14: Recessed lights (focos empotrados)
    if (totalRecessedLights > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Focos empotrados ${totalRecessedLights} ud`)
      this.addLineItem("06-E-14", totalRecessedLights, "Suministro y colocación focos")
    }

    // 06-E-16: Heating line (only if electric heating)
    const heatingTypeForElectric = reform.config?.reformHeatingType
    if (heatingTypeForElectric === "Eléctrica") {
      console.log("[v0] BudgetGenerator - Generando partida: Línea de calefacción eléctrica 1 ud")
      this.addLineItem("06-E-16", 1, "Línea de cuatro para calefacción eléctrica")
    }

    // 06-E-17: Certification (always 1)
    console.log("[v0] BudgetGenerator - Generando partida: Boletín y legalización 1 ud")
    this.addLineItem("06-E-17", 1, "Boletín y legalización")

    console.log("[v0] BudgetGenerator - Nueva instalación eléctrica: agregando toma de tierra obligatoria")
    // 02-E-10: Grounding installation (always required for new electrical installations)
    this.addLineItem("02-E-10", 1, "Obligatorio para nueva instalación eléctrica")

    console.log("[v0] BudgetGenerator - Electrical items generation completed")
    console.log(
      "[v0] BudgetGenerator - Generated electrical items:",
      this.lineItems.filter((item) => item.category === "06. ELECTRICIDAD").length,
    )
  }

  /**
   * 08. LIMPIEZA - Genera partidas de limpieza
   */
  private generateCleaningItems() {
    if (this.hasRealRooms()) {
      const { reform } = this.calculatorData
      const roomCount = reform?.rooms?.length || 0
      const periodicCleanings = Math.ceil(roomCount / 2)

      if (periodicCleanings > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Limpiezas periódicas ${periodicCleanings} ud`)
        this.addLineItem("08-L-01", periodicCleanings)
      } else {
        console.log("[v0] BudgetGenerator - NO se genera partida de limpiezas periódicas (total = 0)")
      }

      console.log("[v0] BudgetGenerator - Generando partida: Limpieza final 1 ud (250€)")
      this.addLineItem("08-L-02", 1, undefined, 250.0)
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de limpieza (no real rooms)")
    }
  }

  /**
   * 09. PINTURA - Genera partidas de pintura (already correct)
   */
  private generatePaintingItems() {
    const reform: any = this.calculatorData.reform

    if (!reform || !reform.rooms || reform.rooms.length === 0) {
      console.log("[v0] BudgetGenerator - NO reform data, skipping painting items")
      return
    }

    let wallPaintingArea = 0
    let ceilingPaintingArea = 0

    reform.rooms.forEach((room: any) => {
      let wallHeight = reform.config?.standardHeight || 2.8

      if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
        wallHeight = room.currentCeilingHeight
      } else if (room.lowerCeiling && room.newCeilingHeight) {
        wallHeight = room.newCeilingHeight
      }

      const shouldPaintWalls =
        room.wallMaterial === "Lucir y pintar" ||
        room.wallMaterial === "Solo pintar" ||
        (!room.wallMaterial && room.type !== "Baño" && room.type !== "Cocina" && room.type !== "Terraza")

      if (shouldPaintWalls) {
        wallPaintingArea += room.perimeter * wallHeight
      }

      if (reform.config?.paintCeilings) {
        ceilingPaintingArea += room.area
      }
    })

    console.log("[v0] BudgetGenerator - Painting areas:", {
      walls: wallPaintingArea,
      ceilings: ceilingPaintingArea,
    })

    // Pintura de paredes
    if (wallPaintingArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Pintura de paredes ${wallPaintingArea} m²`)
      this.addLineItem("09-P-01", wallPaintingArea, "Pintura plástica lisa en paredes")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de pintura de paredes (total = 0)")
    }

    // Pintura de techos
    if (ceilingPaintingArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Pintura de techos ${ceilingPaintingArea} m²`)
      this.addLineItem("09-P-02", ceilingPaintingArea, "Pintura plástica lisa en techos")
    } else {
      console.log(
        "[v0] BudgetGenerator - NO se genera partida de pintura de techos (interruptor desactivado o total = 0)",
      )
    }
  }

  /**
   * 10. MATERIALES - Genera partidas de materiales
   */
  private generateMaterialsItems() {
    const { reform, globalConfig } = this.calculatorData

    if (!reform || !reform.rooms) return

    const bathrooms = reform.rooms.filter((r: any) => r.type === "Baño").length

    // Materiales de baño (por cada baño)
    if (bathrooms > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Plato de ducha ${bathrooms} ud`)
      this.addLineItem("10-M-01", bathrooms, "Plato de ducha")
      console.log(`[v0] BudgetGenerator - Generando partida: Válvula ${bathrooms} ud`)
      this.addLineItem("10-M-02", bathrooms, "Válvula")
      console.log(`[v0] BudgetGenerator - Generando partida: Inodoro ${bathrooms} ud`)
      this.addLineItem("10-M-03", bathrooms, "Inodoro")
      console.log(`[v0] BudgetGenerator - Generando partida: Monomando lavabo ${bathrooms} ud`)
      this.addLineItem("10-M-04", bathrooms, "Monomando lavabo")
      console.log(`[v0] BudgetGenerator - Generando partida: Ducha termostática ${bathrooms} ud`)
      this.addLineItem("10-M-05", bathrooms, "Ducha termostática")
      console.log(`[v0] BudgetGenerator - Generando partida: Mampara ${bathrooms} ud`)
      this.addLineItem("10-M-06", bathrooms, "Mampara")
      console.log(`[v0] BudgetGenerator - Generando partida: Mueble con lavabo ${bathrooms} ud`)
      this.addLineItem("10-M-07", bathrooms, "Mueble con lavabo")
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de materiales de baño (total bathrooms = 0)")
    }

    // Baldosa y azulejo (área total de alicatados y embaldosados)
    const totalTilingArea = this.calculateWallTilingArea() + this.calculateFloorTilingArea()
    if (totalTilingArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Baldosa y azulejo ${totalTilingArea} m²`)
      this.addLineItem("10-M-08", totalTilingArea)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de baldosa y azulejo (total area = 0)")
    }

    let laminateFlooringArea = 0
    let vinylFlooringArea = 0

    if (reform.rooms && reform.rooms.length > 0) {
      reform.rooms.forEach((room: any) => {
        console.log(
          `[v0] BudgetGenerator - Materials - Room ${room.type} ${room.number} floorMaterial: "${room.floorMaterial}", area: ${room.area}`,
        )

        if (room.floorMaterial === "Suelo laminado" || room.floorMaterial === "Parquet flotante") {
          console.log(`[v0] BudgetGenerator - Materials - Adding ${room.area} m² to laminateFlooringArea`)
          laminateFlooringArea += room.area || 0
        } else if (room.floorMaterial === "Suelo vinílico") {
          console.log(`[v0] BudgetGenerator - Materials - Adding ${room.area} m² to vinylFlooringArea`)
          vinylFlooringArea += room.area || 0
        }
      })
    }

    console.log(`[v0] BudgetGenerator - Materials - Total laminateFlooringArea: ${laminateFlooringArea} m²`)
    console.log(`[v0] BudgetGenerator - Materials - Total vinylFlooringArea: ${vinylFlooringArea} m²`)

    // Parquet flotante
    if (laminateFlooringArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Parquet flotante ${laminateFlooringArea} m²`)
      this.addLineItem("10-M-09", laminateFlooringArea)
      console.log(`[v0] BudgetGenerator - Generando partida: Manta parquet flotante ${laminateFlooringArea} m²`)
      this.addLineItem("10-M-11", laminateFlooringArea, "Manta")
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de parquet flotante (total = 0)")
    }

    // Suelo vinílico
    if (vinylFlooringArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Suelo vinílico ${vinylFlooringArea} m²`)
      this.addLineItem("10-M-10", vinylFlooringArea)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de suelo vinílico (total = 0)")
    }

    // Rodapié
    const baseboardLength = this.calculateBaseboardLength()
    if (baseboardLength > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Rodapié ${baseboardLength} m`)
      this.addLineItem("10-M-12", baseboardLength)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de rodapié (total length = 0)")
    }

    // Puertas
    const swingDoors = this.countSwingDoors()
    if (swingDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Puertas abatibles ${swingDoors} ud`)
      this.addLineItem("10-M-13", swingDoors)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de puertas abatibles (total doors = 0)")
    }

    const slidingDoors = this.countSlidingDoors()
    if (slidingDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Cajón puertas correderas ${slidingDoors} ud`)
      this.addLineItem("10-M-14", slidingDoors, "Cajón")
      console.log(`[v0] BudgetGenerator - Generando partida: Puerta puertas correderas ${slidingDoors} ud`)
      this.addLineItem("10-M-15", slidingDoors, "Puerta")
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de puertas correderas (total doors = 0)")
    }

    const hasEntryDoor =
      reform.config?.entranceDoorType === true ||
      reform.config?.entranceDoorType === "Acorazada" ||
      reform.config?.entranceDoorType === "Lacada"

    console.log(`[v0] BudgetGenerator - Materials - Entrance door config:`, {
      entranceDoorType: reform.config?.entranceDoorType,
      hasEntryDoor: hasEntryDoor,
    })

    // Puerta de entrada
    if (hasEntryDoor) {
      console.log("[v0] BudgetGenerator - Generando partida: Puerta de seguridad de entrada 1 ud")
      this.addLineItem("10-M-16", 1, "Puerta de seguridad de entrada")
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de puerta de entrada (no entry door)")
    }

    const heatingType = reform.config?.reformHeatingType

    console.log("[v0] BudgetGenerator - Materials - Heating type:", heatingType)

    // Caldera
    if (heatingType === "Caldera + Radiadores" && reform.config?.installGasBoiler) {
      console.log("[v0] BudgetGenerator - Generando partida: Caldera 1 ud")
      this.addLineItem("10-M-18", 1)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de caldera (not caldera + radiators or no install)")
    }

    // Count radiators by room type
    let regularRadiators = 0
    let bathroomRadiators = 0

    if (reform.rooms && reform.rooms.length > 0) {
      reform.rooms.forEach((room: any) => {
        if (room.radiators && Array.isArray(room.radiators) && room.radiators.length > 0) {
          const radiatorCount = room.radiators.length
          if (room.type === "Baño") {
            bathroomRadiators += radiatorCount
          } else {
            regularRadiators += radiatorCount
          }
        } else if (room.hasRadiator) {
          if (room.type === "Baño") {
            bathroomRadiators += 1
          } else {
            regularRadiators += 1
          }
        }
      })
    }

    console.log("[v0] BudgetGenerator - Materials - Radiators:", {
      regular: regularRadiators,
      bathroom: bathroomRadiators,
      total: regularRadiators + bathroomRadiators,
    })

    // Radiadores según tipo de calefacción
    if (heatingType === "Eléctrica" && (regularRadiators > 0 || bathroomRadiators > 0)) {
      const totalElectricRadiators = regularRadiators + bathroomRadiators
      console.log(`[v0] BudgetGenerator - Generando partida: Radiadores eléctricos ${totalElectricRadiators} ud`)
      this.addLineItem("10-M-24", totalElectricRadiators, "Radiadores eléctricos")
    } else if (heatingType === "Caldera + Radiadores") {
      // Radiadores de agua (normales)
      if (regularRadiators > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Radiadores ${regularRadiators} ud`)
        this.addLineItem("10-M-20", regularRadiators, "Radiadores")
      }
      // Radiadores toalleros (baños)
      if (bathroomRadiators > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Radiador toallero ${bathroomRadiators} ud`)
        this.addLineItem("10-M-21", bathroomRadiators, "Radiador toallero")
      }
    }

    // Termostato
    if (heatingType && heatingType !== "No") {
      console.log("[v0] BudgetGenerator - Generando partida: Termostato 1 ud")
      this.addLineItem("10-M-22", 1)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de termostato (no heating type)")
    }

    // Termo eléctrico
    if (reform.electricWaterHeater) {
      console.log("[v0] BudgetGenerator - Generando partida: Termo eléctrico 1 ud")
      this.addLineItem("10-M-23", 1)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de termo eléctrico (no config)")
    }
  }

  /**
   * 11. VENTANAS - Genera partidas de ventanas
   */
  private generateWindowsItems() {
    const { reform, demolition } = this.calculatorData

    console.log("[v0] BudgetGenerator - generateWindowsItems called")
    console.log("[v0] BudgetGenerator - calculatorData keys:", Object.keys(this.calculatorData))

    // Buscar habitaciones en múltiples lugares
    let allRooms: any[] = []

    if (reform?.rooms && Array.isArray(reform.rooms)) {
      console.log("[v0] BudgetGenerator - Found reform.rooms:", reform.rooms.length)
      allRooms = [...allRooms, ...reform.rooms]
    }

    if (demolition?.rooms && Array.isArray(demolition.rooms)) {
      console.log("[v0] BudgetGenerator - Found demolition.rooms:", demolition.rooms.length)
      // Solo añadir si no hay reform rooms
      if (allRooms.length === 0) {
        allRooms = [...allRooms, ...demolition.rooms]
      }
    }

    // También buscar en la raíz por si acaso
    if ((this.calculatorData as any).rooms && Array.isArray((this.calculatorData as any).rooms)) {
      console.log("[v0] BudgetGenerator - Found root rooms:", (this.calculatorData as any).rooms.length)
      if (allRooms.length === 0) {
        allRooms = (this.calculatorData as any).rooms
      }
    }

    if (allRooms.length === 0) {
      console.log("[v0] BudgetGenerator - NO rooms found anywhere, skipping windows items")
      return
    }

    console.log("[v0] BudgetGenerator - Total rooms to check for windows:", allRooms.length)

    // Precio por m² según país (España = 650€/m²)
    const WINDOW_PRICE_PER_SQM: Record<string, number> = {
      ES: 650,
      PT: 550,
      FR: 700,
      IT: 620,
      DE: 750,
      UK: 680,
      DEFAULT: 600,
    }

    const country = this.calculatorData.country || "ES"
    const pricePerSqm = WINDOW_PRICE_PER_SQM[country] || WINDOW_PRICE_PER_SQM.DEFAULT

    let windowIndex = 0
    let totalWindows = 0

    allRooms.forEach((room) => {
      console.log(
        `[v0] BudgetGenerator - Checking room: ${room.name || room.type}, windows:`,
        room.windows?.length || 0,
      )

      if (room.windows && Array.isArray(room.windows) && room.windows.length > 0) {
        room.windows.forEach((window: any) => {
          windowIndex++
          totalWindows++

          // Obtener dimensiones de la ventana (en metros)
          let width = window.width || 1.2
          let height = window.height || 1.2

          // Si las dimensiones son mayores a 10, asumimos que están en cm y convertimos a metros
          if (width > 10) width = width / 100
          if (height > 10) height = height / 100

          const sqm = width * height

          // Usar el precio guardado de la ventana si existe, sino calcular
          const windowPrice =
            window.price && window.price > 0 ? window.price : Math.round(sqm * pricePerSqm * 100) / 100

          // Obtener tipo de ventana
          const windowType = window.type || window.windowType || "Corredera"
          const glassType = window.glassType || window.crystalType || "Doble"
          const material = window.material || "PVC"

          // Nombre de la habitación
          const roomName = room.name || `${room.type || "Habitación"} ${room.number || ""}`

          // Crear descripción detallada con aviso de precio estimativo
          const concept = `VENTANA ${windowType.toUpperCase()} - ${material}`
          const widthCm = Math.round(width * 100)
          const heightCm = Math.round(height * 100)
          const description = `Ventana ${material} ${windowType} con cristal ${glassType}, ${widthCm}x${heightCm}cm (${sqm.toFixed(2)} m²). Ubicación: ${roomName}. **PRECIO ESTIMATIVO** - Incluye retirada de carpintería existente, transporte e instalación. Este precio es orientativo y debe ser contrastado por un profesional ventanero o empresa de carpintería metálica.`

          console.log(`[v0] BudgetGenerator - Adding window: ${concept}, Price: ${windowPrice}€`)
          this.addCustomLineItem("CARPINTERÍA METÁLICA", concept, description, "ud", 1, windowPrice)
        })
      }
    })

    if (totalWindows === 0) {
      console.log("[v0] BudgetGenerator - NO se generan partidas de ventanas (ninguna ventana encontrada)")
    } else {
      console.log(`[v0] BudgetGenerator - Total ventanas generadas: ${totalWindows}`)
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private hasDemolition(): boolean {
    const { demolition } = this.calculatorData
    if (!demolition) return false

    return (
      (demolition.partitions && demolition.partitions > 0) ||
      (demolition.wallTiling && demolition.wallTiling > 0) ||
      (demolition.floorTiling && demolition.floorTiling > 0) ||
      (demolition.falseCeiling && demolition.falseCeiling > 0) ||
      false
    )
  }

  private hasReform(): boolean {
    return !!this.calculatorData.reform
  }

  private hasRealRooms(): boolean {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms || !Array.isArray(reform.rooms)) return false

    return reform.rooms.some(
      (r: any) => r.customRoomType !== "Otras ventanas" && r.name !== "Otras ventanas"
    )
  }

  private hasElectricalWork(): boolean {
    const { reform } = this.calculatorData
    if (!reform) return false

    return (
      (reform.simpleLights && reform.simpleLights > 0) ||
      (reform.switchedLights && reform.switchedLights > 0) ||
      (reform.outlets && reform.outlets > 0) ||
      false
    )
  }

  private estimateDemolitionHours(): number {
    const { demolition } = this.calculatorData
    if (!demolition) return 0

    // Estimación: 1 hora por cada 10m² de demolición
    const totalArea =
      (demolition.partitions || 0) +
      (demolition.wallTiling || 0) +
      (demolition.floorTiling || 0) +
      (demolition.falseCeiling || 0)

    return Math.ceil(totalArea / 10)
  }

  private countBathroomElements(): number {
    const { demolition } = this.calculatorData
    if (!demolition || !demolition.rooms) return 0

    // Contar elementos de baño a retirar (3 por baño: inodoro, lavabo, ducha/bañera)
    const bathrooms = demolition.rooms.filter((r: any) => r.type === "Baño").length
    return bathrooms * 3
  }

  private calculateWallTilingArea(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let totalArea = 0
    const standardHeight = reform.config?.standardHeight || 2.8

    reform.rooms.forEach((room: any) => {
      // Solo alicatar si el material de paredes es Cerámica/Cerámico y no es "No se modifica"
      const wallMaterial = (room.wallMaterial || "").toLowerCase()
      const isCeramic = wallMaterial === "cerámica" || wallMaterial === "cerámico"
      const isNotModified = wallMaterial === "no se modifica"

      if (!isCeramic || isNotModified) {
        return // No alicatar esta habitación
      }

      // Determinar la altura correcta considerando techos bajados
      let wallHeight = standardHeight

      if (room.lowerCeiling && room.newCeilingHeight) {
        // Bajar techo en reforma - usar nueva altura
        wallHeight = room.newCeilingHeight
      } else if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
        // Techos bajados que se quedan - usar altura actual
        wallHeight = room.currentCeilingHeight
      } else if (room.height) {
        // Altura personalizada de la habitación
        wallHeight = room.height
      }

      const perimeter = room.perimeter || 0
      const wallArea = perimeter * wallHeight

      console.log(
        `[v0] BudgetGenerator - calculateWallTilingArea: ${room.type} ${room.number || ""} - perímetro: ${perimeter}m, altura: ${wallHeight}m, área: ${wallArea}m²`,
      )

      totalArea += wallArea
    })

    console.log(`[v0] BudgetGenerator - Total alicatado paredes: ${totalArea}m²`)
    return totalArea
  }

  private calculateFloorTilingArea(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    const tileAllFloors = reform.config?.tileAllFloors || false

    // Calcular área de embaldosado
    let totalArea = 0

    reform.rooms.forEach((room: any) => {
      if (tileAllFloors) {
        console.log(
          `[v0] BudgetGenerator - calculateFloorTilingArea - Adding ${room.area} m² from ${room.type} ${room.number} (tileAllFloors)`,
        )
        totalArea += room.area
      } else {
        // Otherwise, only bathrooms and kitchens
        if (room.type === "Baño" || room.type === "Cocina") {
          console.log(
            `[v0] BudgetGenerator - calculateFloorTilingArea - Adding ${room.area} m² from ${room.type} ${room.number}`,
          )
          totalArea += room.area
        }
      }
    })

    console.log(`[v0] BudgetGenerator - calculateFloorTilingArea - Total: ${totalArea} m²`)
    return totalArea
  }

  private calculateBaseboardLength(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    // Sumar perimetro de todas las habitaciones
    return reform.rooms.reduce((total: number, room: any) => total + (room.perimeter || 0), 0)
  }

  private countTotalDoors(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let totalDoors = 0

    reform.rooms.forEach((room: any) => {
      if (room.doorList && room.doorList.length > 0) {
        room.doorList.forEach((door: any) => {
          totalDoors += 1
        })
      }
    })

    // Añadir puerta de entrada si existe
    if (reform.entryDoor) {
      totalDoors += 1
    }

    console.log(`[v0] BudgetGenerator - Total doors counted: ${totalDoors}`)
    return totalDoors
  }

  private countSwingDoors(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let swingDoors = 0

    reform.rooms.forEach((room: any) => {
      if (room.doorList && room.doorList.length > 0) {
        room.doorList.forEach((door: any) => {
          if (door.type === "Abatible") {
            swingDoors += 1
          }
        })
      }
    })

    console.log(`[v0] BudgetGenerator - Swing doors counted: ${swingDoors}`)
    return swingDoors
  }

  private countSlidingDoors(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let slidingDoors = 0

    reform.rooms.forEach((room: any) => {
      if (room.doorList && room.doorList.length > 0) {
        console.log(`[v0] BudgetGenerator - Room ${room.type} ${room.number} doors:`, room.doorList)

        room.doorList.forEach((door: any) => {
          console.log(`[v0] BudgetGenerator - Door type: "${door.type}", isExterior: ${door.isExterior}`)

          if ((door.type === "Corredera" || door.type === "Corredera empotrada") && !door.isExterior) {
            slidingDoors += 1
          }
        })
      }
    })

    console.log(`[v0] BudgetGenerator - Sliding doors counted: ${slidingDoors}`)
    return slidingDoors
  }

  private countExteriorSlidingDoors(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let exteriorSlidingDoors = 0

    reform.rooms.forEach((room: any) => {
      if (room.doorList && room.doorList.length > 0) {
        room.doorList.forEach((door: any) => {
          if (door.type === "Corredera" && door.isExterior) {
            exteriorSlidingDoors += 1
          }
        })
      }
    })

    console.log(`[v0] BudgetGenerator - Exterior sliding doors counted: ${exteriorSlidingDoors}`)
    return exteriorSlidingDoors
  }

  private estimatePowerLines(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    // Estimación: 1 línea por cada 3 habitaciones
    return Math.ceil(reform.rooms.length / 3)
  }

  private estimateLightingLines(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    // Estimación: 1 línea por cada 3 habitaciones
    return Math.ceil(reform.rooms.length / 3)
  }

  private estimatePeriodicCleanings(): number {
    // Estimación: 1 limpieza por semana, duración estimada 8 semanas
    return 8
  }

  private calculateTotalDebris(): number {
    const { demolition } = this.calculatorData
    if (!demolition || !demolition.rooms) return 0

    let totalDebris = 0

    // Escombros de cerámica de suelo
    demolition.rooms.forEach((room: any) => {
      if (room.removeFalseCeiling || room.currentCeilingStatus === "lowered_remove" || room.falseCeiling) {
        const ceilingThickness = 0.015
        const expansionCoef = 1.4
        totalDebris += (room.area || 0) * ceilingThickness * expansionCoef
      }

      if (room.removeFloor && room.floorMaterial === "Cerámico") {
        const floorThickness = demolition.settings?.floorTileThickness || 0.01
        const expansionCoef = demolition.settings?.ceramicExpansionCoef || 1.4
        totalDebris += (room.area || 0) * floorThickness * expansionCoef
      }

      // Escombros de cerámica de pared
      if (room.removeWallTiles && room.wallMaterial === "Cerámica") {
        const wallHeight = room.newCeilingHeight || demolition.config?.standardHeight || 2.8
        const wallThickness = demolition.settings?.wallTileThickness || 0.01
        const expansionCoef = demolition.settings?.ceramicExpansionCoef || 1.4
        totalDebris += (room.perimeter || 0) * wallHeight * wallThickness * expansionCoef
      }

      // Escombros de madera
      if (room.removeFloor && room.floorMaterial === "Madera") {
        const floorThickness = demolition.settings?.woodenFloorThickness || 0.02
        const expansionCoef = demolition.settings?.woodenFloorExpansionCoef || 1.4
        totalDebris += (room.area || 0) * floorThickness * expansionCoef
      }

      // Escombros de falso techo
      // Removed because it's now handled by the first check for room.falseCeiling

      // Escombros de puertas
      if (room.hasDoors && room.doorList && room.doorList.length > 0) {
        room.doorList.forEach((door: any) => {
          totalDebris += 0.06
        })
      }

      // Escombros de elementos de baño
      if (room.removeBathroomElements) {
        totalDebris += 1.5
      }

      // Escombros de mobiliario de cocina
      if (room.removeKitchenFurniture) {
        totalDebris += 3.5
      }

      // Escombros de mobiliario de dormitorio
      if (room.removeBedroomFurniture) {
        totalDebris += 2.0
      }

      // Escombros de mobiliario de salón
      if (room.removeLivingRoomFurniture) {
        totalDebris += 2.0
      }
    })

    // Escombros de tabiques
    if (demolition.config?.wallDemolitions && demolition.config.wallDemolitions.length > 0) {
      demolition.config.wallDemolitions.forEach((wallDemolition: any) => {
        const thicknessInMeters = wallDemolition.thickness / 100
        const expansionCoef = 1.3
        totalDebris += wallDemolition.area * thicknessInMeters * expansionCoef
      })
    }

    return totalDebris
  }

  private calculateDemolitionHours(): number {
    const { demolition } = this.calculatorData
    if (!demolition) return 0

    const totalDebris = this.calculateTotalDebris()

    // Base: 1 m³ = 1 hora por obrero
    let baseHours = totalDebris * 1.0

    // Añadir 0.20h por piso si no hay ascensor
    if (demolition.summary?.hasElevator === false && demolition.summary?.buildingHeight) {
      const floors = Math.max(0, demolition.summary.buildingHeight - 1)
      baseHours += totalDebris * floors * 0.2
    }

    return Math.ceil(baseHours)
  }
}

/**
 * Función principal para generar un presupuesto desde datos de calculadora
 */
export async function generateBudgetFromCalculator(
  calculatorData: CalculatorData,
  supabase: SupabaseClient,
): Promise<GeneratedLineItem[]> {
  console.log("[v0] generateBudgetFromCalculator - Creating generator...")
  const generator = new BudgetGenerator(calculatorData, supabase)
  console.log("[v0] generateBudgetFromCalculator - Calling generate()...")
  const result = await generator.generate()
  console.log("[v0] generateBudgetFromCalculator - Generation complete. Items:", result.length)
  return result
}
