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
  // Map<priceCode, sorted array of tiers from DB>
  private tierCache: Map<string, { min: number; max: number | null; price: number }[]> = new Map()
  // Global price multiplier from user profile (applies to master prices not overridden by user)
  private priceMultiplierGlobal = 1.0

  // Project data populated from calculator data
  private project: Partial<ProjectData> = {}

  private totalDoubleDoorsRemoval = 0
  private totalExteriorSlidingDoorsRemoval = 0

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

    // Asegurar que newDoors sea booleano en todas las habitaciones
    if (this.calculatorData.reform && Array.isArray(this.calculatorData.reform.rooms)) {
      this.calculatorData.reform.rooms.forEach((room: any) => {
        if (room.newDoors !== undefined) {
          room.newDoors = room.newDoors === true || room.newDoors === "true"
        } else {
          room.newDoors = false
        }
      })
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
    this.totalDoubleDoorsRemoval = 0
    this.totalExteriorSlidingDoorsRemoval = 0

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

    // 0.5 Cargar multiplicador global de precios del perfil del usuario
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("price_multiplier")
      .eq("id", user.id)
      .single()
    this.priceMultiplierGlobal = Number(profile?.price_multiplier ?? 1.0)
    if (this.priceMultiplierGlobal !== 1.0) {
      console.log(`[v0] BudgetGenerator - Global price multiplier: ${this.priceMultiplierGlobal}`)
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

    // Cache master prices first (apply global multiplier to prices not overridden by user)
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
        final_price: price.final_price * this.priceMultiplierGlobal,
        notes: price.notes,
        color: price.color,
        brand: price.brand,
        model: price.model,
        source: "master" as const,
      } as PriceItem & { source: string })
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
          source: "user" as const,
        } as PriceItem & { source: string })
      })
    }

    // 3. Fallback/Fix for Grounding Installation (Toma de Tierra)
    // If the database hasn't been updated yet, ensure 06-E-18 exists in the cache
    if (!this.priceCache.has("06-E-18")) {
      const oldItem = this.priceCache.get("02-E-10")
      if (oldItem) {
        console.log("[v0] BudgetGenerator - Auto-patching 06-E-18 from 02-E-10")
        this.priceCache.set("06-E-18", {
          ...oldItem,
          code: "06-E-18",
          category: "ELECTRICIDAD", // Override category for correct section grouping
        })
      } else {
        // Absolute fallback if not even 02-E-10 exists
        console.log("[v0] BudgetGenerator - Creating fallback for 06-E-18")
        this.priceCache.set("06-E-18", {
          id: "fallback-grounding", // Temporary ID
          code: "06-E-18",
          category: "ELECTRICIDAD",
          subcategory: "Instalaciones generales",
          description: "Instalación completa de sistema de puesta a tierra según normativa vigente.",
          unit: "Ud",
          final_price: 149.5,
          is_custom: false,
        } as PriceItem)
      }
    }

    console.log(`[v0] BudgetGenerator - Total prices in cache: ${this.priceCache.size}`)

    // 4. Cargar franjas de precio (price_tiers) para los precios del catálogo
    // Cargamos en batch todos los tiers maestros y los del usuario actual
    const priceIds = masterPrices?.map((p) => p.id) || []
    const userPriceIds = userPrices?.map((p) => p.id) || []

    if (priceIds.length > 0 || userPriceIds.length > 0) {
      const { data: allTiers, error: tiersError } = await supabaseClient
        .from("price_tiers")
        .select("price_master_id, user_price_id, min_quantity, max_quantity, price_override, sort_order")
        .or(
          [
            priceIds.length > 0 ? `price_master_id.in.(${priceIds.join(",")})` : null,
            userPriceIds.length > 0 ? `user_price_id.in.(${userPriceIds.join(",")})` : null,
          ]
            .filter(Boolean)
            .join(","),
        )
        .order("sort_order", { ascending: true })

      if (tiersError) {
        console.warn("[v0] BudgetGenerator - Could not load price tiers (table may not exist yet):", tiersError.message)
      } else if (allTiers && allTiers.length > 0) {
        console.log(`[v0] BudgetGenerator - Loaded ${allTiers.length} price tiers total`)
        // Index tiers by the price code they belong to
        const idToCode = new Map<string, string>()
        masterPrices?.forEach((p) => idToCode.set(p.id, p.code?.trim()))
        userPrices?.forEach((p) => idToCode.set(p.id, p.code?.trim()))

        allTiers.forEach((tier) => {
          const priceId = tier.price_master_id || tier.user_price_id
          const code = idToCode.get(priceId)
          if (!code) return
          if (!this.tierCache.has(code)) this.tierCache.set(code, [])
          this.tierCache.get(code)!.push({
            min: Number(tier.min_quantity),
            max: tier.max_quantity !== null ? Number(tier.max_quantity) : null,
            price: Number(tier.price_override),
          })
        })
        console.log(`[v0] BudgetGenerator - Tier cache has ${this.tierCache.size} prices with tiers`)
      }
    }
  }

  private addLineItem(priceCode: string, quantity = 1, customNotes?: string, customPrice?: number, priceMultiplier = 1) {
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
      "12": { category: "TELECOMUNICACIONES", section: "telecom" },
    }

    const categoryInfo = categoryMap[priceCode.split("-")[0]]

    const baseUnitPrice = customPrice ?? priceItem.final_price

    // Apply price tier if available and no customPrice was explicitly passed
    let effectiveUnitPrice = baseUnitPrice
    if (!customPrice) {
      const tiers = this.tierCache.get(trimmedCode)
      if (tiers && tiers.length > 0) {
        const matchingTier = tiers.find(
          (t) => quantity >= t.min && (t.max === null || quantity < t.max)
        )
        if (matchingTier) {
          // For master-based prices, apply the global multiplier to tier prices too
          const tierMultiplier = (priceItem as any).source === "master" ? this.priceMultiplierGlobal : 1.0
          effectiveUnitPrice = matchingTier.price * tierMultiplier
          console.log(`[v0] BudgetGenerator - Tier applied for ${trimmedCode}: qty=${quantity} => ${effectiveUnitPrice} (was ${baseUnitPrice})`)
        }
      }
    }

    const unitPrice = effectiveUnitPrice * priceMultiplier
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
      // Only set base_price_id for price_master records (FK constraint references price_master)
      base_price_id:
        (priceItem as any).source === "master" &&
          priceItem.id &&
          typeof priceItem.id === "string" &&
          priceItem.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          ? priceItem.id
          : undefined,
      price_type: (priceItem as any).source === "user" ? "custom" : "master",
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
    let totalWoodenSkirtingRemoval = 0
    let totalDoorsRemoval = 0
    let totalRadiatorsRemoval = 0
    let totalBathroomElementsRemoval = 0
    let totalKitchenFurnitureRemoval = 0
    let totalBedroomFurnitureRemoval = 0
    let totalLivingRoomFurnitureRemoval = 0
    let totalSewagePipesRemoval = 0

    demolition.rooms.forEach((room: any) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

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

      if (room.removeFloor || demolition.config?.removeWoodenFloor || demolition.config?.removeAllCeramic) {
        if (room.floorMaterial === "Madera") {
          totalWoodenSkirtingRemoval += room.perimeter || 0
        }
      }

      // Retirada de puertas (Desglosado por tipos)
      if (room.hasDoors && room.doorList && room.doorList.length > 0) {
        room.doorList?.forEach((door: any) => {
          if (door.type === "Doble abatible") {
            this.totalDoubleDoorsRemoval = (this.totalDoubleDoorsRemoval || 0) + 1
          } else if (door.type === "Corredera exterior" || door.type === "Corredera exterior con carril") {
            this.totalExteriorSlidingDoorsRemoval = (this.totalExteriorSlidingDoorsRemoval || 0) + 1
          } else {
            totalDoorsRemoval += 1
          }
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
      bedroomFurniture: totalBedroomFurnitureRemoval,
      livingRoomFurniture: totalLivingRoomFurnitureRemoval,
      sewagePipes: totalSewagePipesRemoval,
      skirtingWooden: totalWoodenSkirtingRemoval,
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

    // Retirada de rodapié de madera
    if (totalWoodenSkirtingRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Retirada de rodapié de madera ${totalWoodenSkirtingRemoval} m`)
      this.addLineItem("01-D-07", totalWoodenSkirtingRemoval, "Retirada de rodapié de madera")
    }

    // Desmontaje de puertas
    if (totalDoorsRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Desmontaje de puertas y marcos ${totalDoorsRemoval} ud`)
      this.addLineItem("01-D-12", totalDoorsRemoval, "Desmontaje de puertas y marcos")
    }

    // === NUEVO: Derribo de tabiques detectado automáticamente del plano ===
    const globalConfig = this.calculatorData.globalConfig || {}
    const autoDemolishedWallsM2 = globalConfig.demolishedWallAreaM2 || 0
    if (autoDemolishedWallsM2 > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida automática de plano: Demolición de tabiquería ${autoDemolishedWallsM2} m²`)
      this.addLineItem("01-D-01", autoDemolishedWallsM2, "Demolición de tabiquería interior (Autodetectado)")
    }

    if (this.totalDoubleDoorsRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Desmontaje de puertas dobles ${this.totalDoubleDoorsRemoval} ud`)
      this.addLineItem("01-D-21", this.totalDoubleDoorsRemoval, "Desmontaje de puerta doble abatible")
    }

    if (this.totalExteriorSlidingDoorsRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Desmontaje de puertas correderas exteriores ${this.totalExteriorSlidingDoorsRemoval} ud`)
      this.addLineItem("01-D-22", this.totalExteriorSlidingDoorsRemoval, "Desmontaje de puerta corredera exterior")
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

    // Retirada de radiadores
    if (totalRadiatorsRemoval > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Retirada de radiadores ${totalRadiatorsRemoval} ud`)
      this.addLineItem("01-D-20", totalRadiatorsRemoval, "Retirada de radiadores")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de retirada de radiadores (total = 0)")
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
        // Ignorar habitación técnica de ventanas
        const roomName = (room.name || "").toLowerCase()
        const roomType = (room.type || "").toLowerCase()
        const customType = (room.customRoomType || "").toLowerCase()
        if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
          return
        }

        const isBathroomOrKitchen = room.type === "Baño" || room.type === "Cocina"

        const reformRoom = reform.rooms?.find((r: any) => r.type === room.type && r.number === room.number)

        let willHaveTiling = false
        if (reformRoom) {
          const rawFloorMat = (reformRoom.floorMaterial || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
          const isCeramicMat = rawFloorMat === "ceramico" || rawFloorMat === "ceramica"
          const isOtherMat = ["madera", "suelo laminado", "suelo vinilico", "parquet flotante"].includes(rawFloorMat)
          const isNoMod = rawFloorMat === "no se modifica"

          if (isCeramicMat) {
            willHaveTiling = true
          } else if (!isOtherMat && !isNoMod) {
            willHaveTiling = tileAllFloors || (reformRoom.type === "Baño" || reformRoom.type === "Cocina")
          }
        }

        const rawFloorMat = (room.floorMaterial || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        // Levantado de suelo de madera
        if ((room.removeFloor || demolition.config?.removeWoodenFloor) && (rawFloorMat === "madera" || rawFloorMat === "parquet")) {
          console.log(
            `[v0] BudgetGenerator - Procesando suelo madera ${room.type} ${room.number}: ${room.area} m²`,
          )

          // El usuario pide que la capa compresora (solera) sea la suma de picado cerámica + madera
          screedArea += room.area || 0

          if (isWoodenOrMixedStructure) {
            // Estructura de madera/mixta → Rastrelado solo si NO va a llevar baldosa
            if (!willHaveTiling) {
              rastreladoArea += room.area || 0
              console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Agregado a RASTRELADO ${room.area} m²`)
            }
          }
        }

        // Picado de baldosa cerámica
        const shouldRemoveCeramicFloor =
          (room.removeFloor || demolition.config?.removeAllCeramic) &&
          (rawFloorMat === "ceramico" || rawFloorMat === "ceramica")

        if (shouldRemoveCeramicFloor) {
          console.log(
            `[v0] BudgetGenerator - Procesando suelo cerámico ${room.type} ${room.number}: ${room.area} m²`,
          )

          // El usuario pide que la capa compresora (solera) sea la suma de picado cerámica + madera
          screedArea += room.area || 0

          if (isWoodenOrMixedStructure && isBathroomOrKitchen) {
            // Estructura madera/mixta + baño/cocina → Arlita
            arlitaArea += room.area || 0
            console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: Agregado a ARLITA ${room.area} m²`)
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
    let netFloorTilingArea = floorTilingArea - screedArea
    if (netFloorTilingArea < 0) netFloorTilingArea = 0

    if (netFloorTilingArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Raseo previo embaldosado suelo ${netFloorTilingArea} m²`)
      this.addLineItem("02-A-10", netFloorTilingArea, "Raseo previo embaldosado suelo")
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
        this.addLineItem("02-A-08", floorTilingArea, "Colocación de solado cerámico sobre suelo radiante")
      } else {
        console.log(`[v0] BudgetGenerator - Generando partida: Embaldosado de suelos ${floorTilingArea} m²`)
        this.addLineItem("02-A-07", floorTilingArea, "Colocación de solado cerámico")
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

    // 7. Lucido de paredes (calcular desde habitaciones que no tienen alicatado o tienen cerámica parcial)
    let plasteringArea = 0
    if (reform.rooms && reform.rooms.length > 0) {
      reform.rooms.forEach((room: any) => {
        let wallHeight = reform.config?.standardHeight || 2.8
        if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
          wallHeight = room.currentCeilingHeight
        } else if (room.lowerCeiling && room.newCeilingHeight) {
          wallHeight = room.newCeilingHeight
        }

        const wallMaterial = (room.wallMaterial || "").toLowerCase()
        const isCeramicGroup = wallMaterial === "cerámica" || wallMaterial === "cerámico"
        const isPlasterGroup = wallMaterial === "lucir y pintar" || wallMaterial === "solo lucir"

        // Caso 1: Habitación estándar (no baño/cocina/terraza) con material de lucido
        if (isPlasterGroup && room.type !== "Baño" && room.type !== "Cocina" && room.type !== "Terraza") {
          plasteringArea += room.perimeter * wallHeight
        }

        // Caso 2: Habitación con cerámica parcial (venga del plano) -> lucir el resto
        if (isCeramicGroup && room.nonCeramicWallPerimeter && room.nonCeramicWallPerimeter > 0) {
          const nonCeramicMat = (room.nonCeramicWallMaterial || "").toLowerCase()
          if (nonCeramicMat === "lucir y pintar" || nonCeramicMat === "solo lucir") {
            const areaRest = room.nonCeramicWallPerimeter * wallHeight
            plasteringArea += areaRest
            console.log(`[v0] BudgetGenerator - Lucido paredes resto cerámica (${room.type}): ${areaRest.toFixed(2)}m²`)
          }
        }
      })
    }

    if (plasteringArea > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Lucido de paredes ${plasteringArea} m²`)
      this.addLineItem("02-A-11", plasteringArea, "Lucido de paredes")
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de lucido de paredes (total = 0)")
    }

    // 8. Bajada de techos (calcular desde habitaciones con techo bajo marcado o flag global)
    let ceilingLoweringArea = 0
    const lowerAllCeilings = reform.config?.lowerAllCeilings === true

    if (reform.rooms && reform.rooms.length > 0) {
      reform.rooms.forEach((room: any) => {
        // Usar flag individual o global para mayor robustez
        if (room.lowerCeiling || lowerAllCeilings) {
          ceilingLoweringArea += room.area || 0
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

    // Tapado de rozas (solo si hay más de una habitación real en reforma)
    const realRoomCount = this.getRealRoomCount()
    if (realRoomCount > 1) {
      console.log("[v0] BudgetGenerator - Generando partida: Tapado de rozas 1 ud")
      this.addLineItem("02-A-12", 1, "Tapado de rozas")
    } else {
      console.log(`[v0] BudgetGenerator - NO se genera partida de tapado de rozas (realRoomCount: ${realRoomCount})`)
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

    console.log("[v0] BudgetGenerator - Starting generatePartitionsItems")

    if (!reform) {
      console.log("[v0] BudgetGenerator - NO reform data, skipping partitions items")
      return
    }

    let brickPartitionsArea = 0
    let plasterboardPartitionsArea = 0
    let wallLiningsArea = 0

    // 1. Process partitions array (should contain Brick or Plasterboard items)
    if (reform.partitions && Array.isArray(reform.partitions)) {
      reform.partitions.forEach((partition: any, index: number) => {
        const area = (Number(partition.linearMeters) || 0) * (Number(partition.height) || 2.6)
        console.log(`[v0] BudgetGenerator - Partition #${index + 1}: type=${partition.type}, area=${area.toFixed(2)}m²`)

        if (partition.type === "ladrillo") {
          brickPartitionsArea += area
        } else if (partition.type === "placa_yeso") {
          plasterboardPartitionsArea += area
        }
      })
    }

    // 2. Process wallLinings array (should contain Trasdosado items)
    if (reform.wallLinings && Array.isArray(reform.wallLinings)) {
      reform.wallLinings.forEach((lining: any, index: number) => {
        const area = (Number(lining.linearMeters) || 0) * (Number(lining.height) || 2.6)
        console.log(`[v0] BudgetGenerator - Wall lining #${index + 1}: area=${area.toFixed(2)}m²`)
        wallLiningsArea += area
      })
    }

    console.log("[v0] BudgetGenerator - Final areas:", {
      brick: brickPartitionsArea.toFixed(2),
      pladur: plasterboardPartitionsArea.toFixed(2),
      trasdosado: wallLiningsArea.toFixed(2)
    })

    // 03-T-01: Tabiques de ladrillo cerámico (Price 41.40)
    if (brickPartitionsArea > 0) {
      this.addLineItem("03-T-01", brickPartitionsArea, "Tabiques de ladrillo cerámico")
    }

    // 03-T-02: Tabiques de placa de yeso laminado (PYL) doble cara
    const globalConfig = this.calculatorData.globalConfig || {}
    const autoNewConstructedWallM2 = globalConfig.newConstructedWallAreaM2 || 0

    const finalPlasterboardArea = plasterboardPartitionsArea + autoNewConstructedWallM2
    if (finalPlasterboardArea > 0) {
      this.addLineItem("03-T-02", finalPlasterboardArea, "Tabiques de Placa de yeso laminado (PYL) doble cara")
    }

    // 03-T-03: Trasdosado autoportante en Placa de yeso laminado (Price 67.90)
    if (wallLiningsArea > 0) {
      this.addLineItem("03-T-03", wallLiningsArea, "Trasdosado autoportante en Placa de yeso laminado")
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

    const realRooms = reform.rooms.filter((r: any) => {
      const name = (r.name || "").toLowerCase()
      const type = (r.type || "").toLowerCase()
      const custom = (r.customRoomType || "").toLowerCase()
      return !name.includes("otras ventanas") && !type.includes("otras ventanas") && !custom.includes("otras ventanas")
    })

    const bathrooms = realRooms.filter((r: any) => r.type === "Baño" && r.newBathroomElements !== false).length
    const kitchens = realRooms.filter((r: any) => r.type?.includes("Cocina")).length

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

    // Instalación de sanitarios (contando elementos específicos seleccionados en cada baño)
    if (bathrooms > 0) {
      // Contadores separados para elementos CON suministro y SIN suministro
      const counts = {
        inodoros: { withSupply: 0, withoutSupply: 0 },
        duchas: { withSupply: 0, withoutSupply: 0 },
        lavabos: { withSupply: 0, withoutSupply: 0 },
        mamparas: { withSupply: 0, withoutSupply: 0 },
        bides: { withSupply: 0, withoutSupply: 0 },
        duchetas: { withSupply: 0, withoutSupply: 0 },
        baneras: { withSupply: 0, withoutSupply: 0 },
        grifosDucha: { withSupply: 0, withoutSupply: 0 },
        grifosLavabo: { withSupply: 0, withoutSupply: 0 },
      }

      realRooms.filter((r: any) => r.type === "Baño" && r.newBathroomElements !== false).forEach((room: any) => {
        // Combinar la nueva propiedad y la antigua para compatibilidad
        const configs = room.bathroomElementsConfig?.length > 0
          ? room.bathroomElementsConfig
          : (room.bathroomElements || ["Inodoro", "Plato de ducha", "Mampara", "Mueble lavabo"]).map((e: any) => ({
            element: e,
            includeSupply: true, // Legacy siempre incluye suministro por defecto
          }))

        configs.forEach((config: any) => {
          const type = config.includeSupply ? "withSupply" : "withoutSupply"

          switch (config.element) {
            case "Inodoro":
              counts.inodoros[type]++
              break
            case "Plato de ducha":
              counts.duchas[type]++
              counts.grifosDucha[type]++
              break
            case "Mueble lavabo":
              counts.lavabos[type]++
              counts.grifosLavabo[type]++
              break
            case "Mampara":
              counts.mamparas[type]++
              break
            case "Bidé":
              counts.bides[type]++
              break
            case "Ducheta Inodoro":
              counts.duchetas[type]++
              break
            case "Bañera":
              counts.baneras[type]++
              break
          }
        })
      });

      // Función auxiliar para agregar las partidas con o sin suministro
      const addPlumbingItem = (code: string, count: { withSupply: number, withoutSupply: number }, name: string) => {
        // Con suministro (precio normal, código estandar)
        if (count.withSupply > 0) {
          console.log(`[v0] BudgetGenerator - Generando partida: ${name} (con suministro) ${count.withSupply} ud`)
          this.addLineItem(code, count.withSupply)
        }

        // SIN suministro (precio reducido, nombre adaptado)
        if (count.withoutSupply > 0) {
          console.log(`[v0] BudgetGenerator - Generando partida: Colocación ${name} s/suministro ${count.withoutSupply} ud`)
          // Descuento del ~60% (se cobra un 40% estimado de mano de obra en instalaciones estándar)
          const multiplier = 0.4
          this.addLineItem(code, count.withoutSupply, `Colocación ${name} (s/suministro)`, undefined, multiplier)
        }
      }

      // Inodoro
      addPlumbingItem("04-F-06", counts.inodoros, "Inodoro")
      // Bidé
      addPlumbingItem("04-F-14", counts.bides, "Bidé")
      // Ducheta inodoro
      addPlumbingItem("04-F-15", counts.duchetas, "Ducheta Inodoro")
      // Bañera
      addPlumbingItem("04-F-16", counts.baneras, "Bañera")
      // Plato de ducha
      addPlumbingItem("04-F-07", counts.duchas, "Plato de ducha")
      // Mueble lavabo
      addPlumbingItem("04-F-08", counts.lavabos, "Mueble lavabo")
      // Mampara
      addPlumbingItem("04-F-09", counts.mamparas, "Mampara")
      // Grifo ducha
      addPlumbingItem("04-F-10", counts.grifosDucha, "Grifaría de ducha")
      // Grifo lavabo
      addPlumbingItem("04-F-11", counts.grifosLavabo, "Grifaría de lavabo")
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de instalación de sanitarios (total bathrooms = 0)")
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
        // Ignorar habitación técnica de ventanas
        const roomName = (room.name || "").toLowerCase()
        const roomType = (room.type || "").toLowerCase()
        const customType = (room.customRoomType || "").toLowerCase()
        if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
          return
        }

        const rawFloorMaterial = room.floorMaterial || ""
        // Normalización básica similar a reform-summary
        const normalizedFloor = rawFloorMaterial
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()

        console.log(
          `[v0] BudgetGenerator - Room ${room.type} ${room.number} floorMaterial: "${rawFloorMaterial}" (norm: "${normalizedFloor}"), area: ${room.area}`,
        )

        if (normalizedFloor === "suelo laminado" || normalizedFloor === "parquet flotante") {
          console.log(`[v0] BudgetGenerator - Adding ${room.area} m² to laminateFlooringArea`)
          laminateFlooringArea += room.area || 0
        } else if (normalizedFloor === "suelo vinilico") {
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

    // Puertas abatibles dobles
    const doubleSwingDoors = this.countDoubleSwingDoors()

    // Premarcos (por cada puerta)
    const totalDoors = this.countTotalDoors()
    const singleDoorsForPreframe = totalDoors - doubleSwingDoors

    if (singleDoorsForPreframe > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Premarcos sencillos ${singleDoorsForPreframe} ud`)
      this.addLineItem("05-C-05", singleDoorsForPreframe)
    } else if (totalDoors === 0) {
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
    }

    if (doubleSwingDoors > 0) {
      console.log(`[v0] BudgetGenerator - Generando partida: Premarco doble ${doubleSwingDoors} ud`)
      this.addLineItem("05-C-21", doubleSwingDoors)
      console.log(`[v0] BudgetGenerator - Generando partida: Puertas abatibles dobles ${doubleSwingDoors} ud`)
      this.addLineItem("05-C-20", doubleSwingDoors)
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

    const heatingType = reform?.config?.reformHeatingType || demolition?.config?.heatingType || "No Tiene"
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
          // Ignorar habitación técnica de ventanas
          const roomName = (room.name || "").toLowerCase()
          const roomType = (room.type || "").toLowerCase()
          const customType = (room.customRoomType || "").toLowerCase()
          if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
            return
          }

          if (room.hasRadiator || (room.radiators && Array.isArray(room.radiators) && room.radiators.length > 0)) {
            const heaterCount = room.radiators?.length || 1
            totalElectricHeaters += heaterCount
            console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: ${heaterCount} emisores eléctricos`)
          }
        })
      }

      console.log(`[v0] BudgetGenerator - Total emisores eléctricos: ${totalElectricHeaters}`)

      if (totalElectricHeaters === 0 && heatingType === "Eléctrica") {
        totalElectricHeaters = Math.max(this.getRealRoomCount(), 3)
        console.log(`[v0] BudgetGenerator - Fallback: set totalElectricHeaters to ${totalElectricHeaters} based on room count`)
      }

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
      }
    }

    const radiatorsTypes = ["Caldera + Radiadores", "Central", "Aerotermia", "Otra"]
    if (radiatorsTypes.includes(heatingType)) {
      console.log(`[v0] BudgetGenerator - Procesando radiadores para tipo: ${heatingType}`)

      // Instalación o sustitución de caldera (solo si es Caldera + Radiadores)
      const installGasBoiler = (heatingType === "Caldera + Radiadores") && (reform?.config?.installGasBoiler || false)
      console.log("[v0] BudgetGenerator - Install gas boiler:", installGasBoiler)

      if (installGasBoiler) {
        console.log("[v0] BudgetGenerator - Generando partida: Colocación caldera de gas 1 ud")
        this.addLineItem("07-CAL-03", 1, "Colocación caldera de gas (Montaje MO)")

        // Legalización si se instala caldera
        console.log("[v0] BudgetGenerator - Generando partida: Legalización de instalación de gas 1 ud")
        this.addLineItem("07-CAL-06", 1, "Legalización de instalación de gas")
      }

      // Conteo de radiadores
      let installRadiatorsCount = 0
      let changeRadiatorsCount = 0

      if (reform?.rooms && reform.rooms.length > 0) {
        reform.rooms.forEach((room: any) => {
          // Ignorar habitación técnica de ventanas
          const roomName = (room.name || "").toLowerCase()
          const roomType = (room.type || "").toLowerCase()
          const customType = (room.customRoomType || "").toLowerCase()
          if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
            return
          }

          if (room.hasRadiator || (room.radiators && Array.isArray(room.radiators) && room.radiators.length > 0)) {
            const heaterCount = room.radiators?.length || 1
            installRadiatorsCount += heaterCount
            console.log(`[v0] BudgetGenerator - ${room.type} ${room.number}: ${heaterCount} radiadores`)
          }
        })
      }

      console.log("[v0] BudgetGenerator - Radiators to installCount:", installRadiatorsCount)
      console.log("[v0] BudgetGenerator - Radiators to changeCount:", changeRadiatorsCount)

      if (installRadiatorsCount === 0 && (heatingType === "Caldera + Radiadores" || heatingType === "Central")) {
        installRadiatorsCount = Math.max(this.getRealRoomCount(), 1)
        console.log(`[v0] BudgetGenerator - Fallback: set installRadiatorsCount to ${installRadiatorsCount} based on room count`)
      }

      const totalRadiators = installRadiatorsCount + changeRadiatorsCount

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
          // Ignorar habitación técnica de ventanas
          const roomName = (room.name || "").toLowerCase()
          const roomType = (room.type || "").toLowerCase()
          const customType = (room.customRoomType || "").toLowerCase()
          if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
            return
          }

          const roomTypeStr = room.type?.toLowerCase() || ""
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

    console.log("[v0] BudgetGenerator - Electrical config found:", {
      source: this.calculatorData.electrical?.config ? "top-level" : "reform-fallback",
      needsNewInstallation,
      hasElectricalPanel: electricalConfig?.hasElectricalPanel,
      hasConstructionPanel: electricalConfig?.hasConstructionPanel,
      hasCertificate: electricalConfig?.hasCertificate,
      hasGroundConnection: electricalConfig?.hasGroundConnection,
      relocateElectricalConnection: electricalConfig?.relocateElectricalConnection,
      hasHeatingCircuit: electricalConfig?.hasHeatingCircuit,
    })

    if (!needsNewInstallation) {
      console.log(
        "[v0] BudgetGenerator - Electrical installation NOT needed (needsNewInstallation is false). ALL electrical items will be skipped.",
      )
    } else {
      console.log("[v0] BudgetGenerator - NEW electrical installation requested (needsNewInstallation is true). General items will be processed.")
    }

    let totalCeilingLights = 0
    let totalOutlets = 0
    let totalSwitches = 0
    let totalSwitchedPoints = 0
    let totalCrossoverPoints = 0
    let totalOutdoorOutlets = 0
    let totalTVOutlets = 0
    let totalRecessedLights = 0
    let totalTimbres = 0

    reform.rooms.forEach((room: any) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

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
            case "Timbre":
            case "timbre":
              totalTimbres += quantity
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
      timbres: totalTimbres,
    })

    // If no electrical elements found in rooms, generate basic default installation 
    // BUT ONLY if needsNewInstallation is true. For partial renos, if they didn't add elements, we don't assume a full installation.
    if (needsNewInstallation && totalCeilingLights === 0 && totalOutlets === 0 && totalSwitches === 0 && totalSwitchedPoints === 0) {
      console.log("[v0] BudgetGenerator - No electrical elements found in rooms and new installation requested, using basic default installation")
      // Basic defaults: 3 rooms = 3 lights, 6 outlets, 3 switches minimum
      const roomCount = reform.rooms.length
      totalCeilingLights = Math.max(roomCount, 3)
      totalOutlets = Math.max(roomCount * 2, 6)
      totalSwitches = Math.max(roomCount, 3)
    }

    // --- GENERAL ITEMS (Only if needsNewInstallation is TRUE) ---
    if (needsNewInstallation) {
      console.log("[v0] BudgetGenerator - PROCESSING GENERAL ELECTRICAL ITEMS (needsNewInstallation is true)")

      // 06-E-01: Main electrical panel (final)
      if (electricalConfig?.hasElectricalPanel === true) {
        console.log("[v0] BudgetGenerator - [ADD] 06-E-01 (Cuadro general) because hasElectricalPanel === true")
        this.addLineItem("06-E-01", 1, "Cuadro general 18 elementos")
      } else {
        console.log("[v0] BudgetGenerator - [SKIP] 06-E-01 (Cuadro general) because hasElectricalPanel is not true")
      }

      // 06-E-02: TV and telecom cabling (always 1 for new installation)
      console.log("[v0] BudgetGenerator - [ADD] 06-E-02 (Telecomunicaciones) because new installation is requested")
      this.addLineItem("06-E-02", 1, "Canalización TV y telecomunicaciones")

      // 06-E-03 moved inside isCompleteRenovation block

      // 06-E-04: Construction panel (provisional connection)
      if (electricalConfig?.hasConstructionPanel === true) {
        console.log("[v0] BudgetGenerator - [ADD] 06-E-04 (Cuadro de obra) because hasConstructionPanel === true")
        this.addLineItem("06-E-04", 1, "Cuadro de obra")
      } else {
        console.log("[v0] BudgetGenerator - [SKIP] 06-E-04 (Cuadro de obra) because hasConstructionPanel is not true")
      }

      // Reubicación de acometida (Permanent connection relocation)
      if (electricalConfig?.relocateElectricalConnection === true) {
        console.log("[v0] BudgetGenerator - [ADD] 06-E-04 (Acometida) because relocateElectricalConnection === true")
        this.addLineItem("06-E-04", 1, "Reubicación de acometida permanente")
      } else {
        console.log("[v0] BudgetGenerator - [SKIP] 06-E-04 (Acometida) because relocateElectricalConnection is not true")
      }

      // Determine if it's a complete renovation (4 or more rooms AND includes a Salón or Dormitorio)
      // Per user request, we skip these two lines for bathroom/kitchen only or few rooms
      const hasMainRooms = reform.rooms.some((r: any) => {
        const type = (r.type || "").toLowerCase();
        return type.includes("salón") || type.includes("salon") || type.includes("dormitorio") || type.includes("habitación") || type.includes("habitacion");
      });
      const isCompleteRenovation = this.getRealRoomCount() >= 4 && hasMainRooms;

      if (isCompleteRenovation) {
        // 06-E-05: Outlet line
        console.log("[v0] BudgetGenerator - [ADD] 06-E-05 (Línea enchufes) because new installation is requested and it's a full renovation")
        this.addLineItem("06-E-05", 1, "Línea de enchufes monofásica")

        // 06-E-06: Lighting line
        console.log("[v0] BudgetGenerator - [ADD] 06-E-06 (Línea alumbrado) because new installation is requested and it's a full renovation")
        this.addLineItem("06-E-06", 1, "Línea de alumbrado")

        // 12-TEL-01: TV Antena y cuadro telecomunicaciones
        console.log("[v0] BudgetGenerator - [ADD] 12-TEL-01 (Antena TV) because it's a full renovation")
        this.addLineItem("12-TEL-01", 1, "Instalación de cableado de antena de TV, cable coaxial DA-75 por tubo empotrado corrugado LH (libre de halógenos).")

        // 06-E-12: TV outlet (General)
        console.log("[v0] BudgetGenerator - [ADD] 06-E-12 (Toma TV) because it's a full renovation")
        this.addLineItem("06-E-12", 1, "Suministro y colocación de toma final de televisión")
      } else {
        console.log(`[v0] BudgetGenerator - [SKIP] 12-TEL-01, 05, 06, 12 since it's a partial renovation`)
      }
    } else {
      console.log("[v0] BudgetGenerator - SKIPPING ALL ELECTRICAL ITEMS (needsNewInstallation is false)")
    }

    // Room-level electrical items: only if needsNewInstallation
    if (needsNewInstallation) {
      // 06-E-07: Simple light points (ceiling lights + switches)
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

      // 06-E-10: Outlets
      if (totalOutlets > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Puntos de enchufes ${totalOutlets} ud`)
        this.addLineItem("06-E-10", totalOutlets, "Puntos de enchufes")
      }

      // 06-E-12: TV outlets
      if (totalTVOutlets > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Toma de TV ${totalTVOutlets} ud`)
        this.addLineItem("06-E-12", totalTVOutlets, "Toma de TV")
      }

      // 06-E-11: Outdoor outlets
      if (totalOutdoorOutlets > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Enchufes intemperie ${totalOutdoorOutlets} ud`)
        this.addLineItem("06-E-11", totalOutdoorOutlets, "Enchufe intemperie")
      }

      // 06-E-14: Recessed lights (focos empotrados)
      if (totalRecessedLights > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Focos empotrados ${totalRecessedLights} ud`)
        this.addLineItem("06-E-14", totalRecessedLights, "Suministro y colocación focos")
      }

      // 06-E-15: Timbre
      if (totalTimbres > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Timbre ${totalTimbres} ud`)
        this.addLineItem("06-E-15", totalTimbres, "Timbre de puerta de entrada")
      }

      // 06-E-16: Heating line (only if electric heating)
      const heatingTypeForElectric = reform.config?.reformHeatingType
      if (heatingTypeForElectric === "Eléctrica") {
        console.log("[v0] BudgetGenerator - Generando partida: Línea de calefacción eléctrica 1 ud")
        this.addLineItem("06-E-16", 1, "Línea de cuatro para calefacción eléctrica")
      }

      // 06-E-17: Certification
      if (electricalConfig?.hasCertificate === true) {
        console.log("[v0] BudgetGenerator - [ADD] 06-E-17 (Boletín) because hasCertificate === true")
        this.addLineItem("06-E-17", 1, "Boletín y legalización")
      }

      // 06-E-18: Grounding installation
      if (electricalConfig?.hasGroundConnection === true) {
        console.log("[v0] BudgetGenerator - [ADD] 06-E-18 (Toma de tierra) because hasGroundConnection === true")
        this.addLineItem("06-E-18", 1, "Obligatorio para nueva instalación eléctrica")
      }
    }

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
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      let wallHeight = reform.config?.standardHeight || 2.8

      if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
        wallHeight = room.currentCeilingHeight
      } else if (room.lowerCeiling && room.newCeilingHeight) {
        wallHeight = room.newCeilingHeight
      }

      const wallMaterialRaw = room.wallMaterial || ""
      const normWall = wallMaterialRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

      const shouldPaintWalls =
        normWall === "lucir y pintar" ||
        normWall === "solo pintar" ||
        (!wallMaterialRaw && room.type !== "Baño" && room.type !== "Cocina" && room.type !== "Terraza")

      if (shouldPaintWalls) {
        wallPaintingArea += room.perimeter * wallHeight
      }

      // Paredes no cerámicas en habitaciones con cerámica parcial (importado desde plano)
      if (room.nonCeramicWallPerimeter && room.nonCeramicWallPerimeter > 0) {
        const nonCeramicMatRaw = room.nonCeramicWallMaterial || ""
        const normNonCeramic = nonCeramicMatRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

        if (normNonCeramic === "lucir y pintar" || normNonCeramic === "pintura" || normNonCeramic === "solo pintar") {
          const nonCeramicArea = room.nonCeramicWallPerimeter * wallHeight
          wallPaintingArea += nonCeramicArea
          console.log(
            `[v0] BudgetGenerator - Pintura paredes no-cerámicas (${room.type}): ${nonCeramicArea.toFixed(2)} m² (${nonCeramicMatRaw})`,
          )
        }
      }
      const shouldPaintCeilings = reform.config?.paintCeilings !== false
      if (shouldPaintCeilings && room.type !== "Terraza") {
        ceilingPaintingArea += room.area || 0
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

    // Contadores de materiales de baño (por cada baño que tenga el objeto marcado CON suministro)
    const materialCounts = {
      ducha: 0,
      valvula: 0,
      inodoro: 0,
      monomandoLavabo: 0,
      termostatica: 0,
      mampara: 0,
      muebleLavabo: 0,
    }

    reform.rooms.forEach((room: any) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      if (room.type === "Baño" && room.newBathroomElements !== false) {
        // En primer lugar, mapeamos de forma lógica las selecciones
        const configs = room.bathroomElementsConfig?.length > 0
          ? room.bathroomElementsConfig
          : (room.bathroomElements || []).map((e: string) => ({ element: e, includeSupply: true }))

        configs.forEach((config: any) => {
          if (!config.includeSupply) return // Solo contamos los de material para Materiales

          switch (config.element) {
            case "Inodoro":
              materialCounts.inodoro += 1
              break
            case "Plato de ducha":
              materialCounts.ducha += 1
              materialCounts.valvula += 1 // Asociado al plato
              materialCounts.termostatica += 1
              break
            case "Bañera":
              materialCounts.valvula += 1
              materialCounts.termostatica += 1
              break
            case "Mampara":
              materialCounts.mampara += 1
              break
            case "Mueble lavabo":
              materialCounts.muebleLavabo += 1
              materialCounts.monomandoLavabo += 1
              break
          }
        })
      }
    })

    const hasAnyBathroomMaterial = Object.values(materialCounts).some(count => count > 0)

    // Materiales de baño
    if (hasAnyBathroomMaterial) {
      if (materialCounts.ducha > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Plato de ducha ${materialCounts.ducha} ud`)
        this.addLineItem("10-M-01", materialCounts.ducha, "Plato de ducha")
      }
      if (materialCounts.valvula > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Válvula ${materialCounts.valvula} ud`)
        this.addLineItem("10-M-02", materialCounts.valvula, "Válvula")
      }
      if (materialCounts.inodoro > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Inodoro ${materialCounts.inodoro} ud`)
        this.addLineItem("10-M-03", materialCounts.inodoro, "Inodoro")
      }
      if (materialCounts.monomandoLavabo > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Monomando lavabo ${materialCounts.monomandoLavabo} ud`)
        this.addLineItem("10-M-04", materialCounts.monomandoLavabo, "Monomando lavabo")
      }
      if (materialCounts.termostatica > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Ducha termostática ${materialCounts.termostatica} ud`)
        this.addLineItem("10-M-05", materialCounts.termostatica, "Ducha termostática")
      }
      if (materialCounts.mampara > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Mampara ${materialCounts.mampara} ud`)
        this.addLineItem("10-M-06", materialCounts.mampara, "Mampara")
      }
      if (materialCounts.muebleLavabo > 0) {
        console.log(`[v0] BudgetGenerator - Generando partida: Mueble con lavabo ${materialCounts.muebleLavabo} ud`)
        this.addLineItem("10-M-07", materialCounts.muebleLavabo, "Mueble con lavabo")
      }
    } else {
      console.log("[v0] BudgetGenerator - NO se generan partidas de materiales de baño (total suministros = 0)")
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
        const rawFloorMaterial = room.floorMaterial || ""
        // Normalización robusta idéntica a Carpintería/Resumen
        const normalizedFloor = rawFloorMaterial
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()

        console.log(
          `[v0] BudgetGenerator - Materials - Room ${room.type} ${room.number} floorMaterial: "${rawFloorMaterial}" (norm: "${normalizedFloor}"), area: ${room.area}`,
        )

        if (normalizedFloor === "suelo laminado" || normalizedFloor === "parquet flotante" || normalizedFloor === "madera") {
          console.log(`[v0] BudgetGenerator - Materials - Adding ${room.area} m² to laminateFlooringArea`)
          laminateFlooringArea += room.area || 0
        } else if (normalizedFloor === "suelo vinilico") {
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
    console.log("[v0] BudgetGenerator - Thermostat debug:", {
      heatingType: heatingType,
      installGasBoiler: reform.config?.installGasBoiler,
      globalConfigInstallGasBoiler: globalConfig?.installGasBoiler
    });

    if (heatingType && heatingType !== "No" && heatingType !== "Eléctrica" && reform.config?.installGasBoiler) {
      console.log("[v0] BudgetGenerator - Generando partida: Termostato 1 ud (caldera instalada)")
      this.addLineItem("10-M-22", 1)
    } else {
      console.log("[v0] BudgetGenerator - NO se genera partida de termostato (no heating type or electric or no boiler)")
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
    return this.getRealRoomCount() > 0
  }

  private getRealRoomCount(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms || !Array.isArray(reform.rooms)) return 0

    const realRooms = reform.rooms.filter((r: any) => {
      const roomName = (r.name || "").toLowerCase()
      const roomType = (r.type || "").toLowerCase()
      const customType = (r.customRoomType || "").toLowerCase()

      const isOtherWindows =
        roomName.includes("otras ventanas") ||
        roomType.includes("otras ventanas") ||
        customType.includes("otras ventanas")

      return !isOtherWindows
    })

    console.log(`[v0] BudgetGenerator - getRealRoomCount: ${realRooms.length} rooms (filtered from ${reform.rooms.length})`)
    if (realRooms.length > 0) {
      console.log("[v0] BudgetGenerator - Real rooms list:", realRooms.map((r: any) => r.name || r.type).join(", "))
    }

    return realRooms.length
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
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      // Solo alicatar si el material de paredes es Cerámica/Cerámico y no es "No se modifica"
      const wallMaterialRaw = room.wallMaterial || ""
      const normWall = wallMaterialRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

      const isCeramic = normWall === "ceramica" || normWall === "ceramico"
      const isNotModified = normWall === "no se modifica"

      if (!isCeramic || isNotModified) {
        return // No alicatar esta habitación
      }

      // Determinar la altura correcta considerando techos bajados
      let wallHeight = standardHeight

      if (room.lowerCeiling && room.newCeilingHeight) {
        wallHeight = room.newCeilingHeight
      } else if (room.currentCeilingStatus === "lowered_keep" && room.currentCeilingHeight) {
        wallHeight = room.currentCeilingHeight
      } else if (room.height) {
        wallHeight = room.height
      }

      // Prioridad: 1) tiledWallSurfaceArea (m² exactos), 2) ceramicWallPerimeter × altura, 3) perímetro completo × altura
      let wallArea: number
      if (room.tiledWallSurfaceArea !== undefined) {
        wallArea = room.tiledWallSurfaceArea
        console.log(
          `[v0] BudgetGenerator - calculateWallTilingArea: ${room.type} ${room.number || ""} - m² EXACTOS: ${room.tiledWallSurfaceArea.toFixed(2)}m² (total pared=${((room.perimeter || 0) * wallHeight).toFixed(2)}m²)`,
        )
      } else {
        const perimeter = room.ceramicWallPerimeter ?? room.perimeter ?? 0
        wallArea = perimeter * wallHeight
        if (room.ceramicWallPerimeter !== undefined) {
          console.log(
            `[v0] BudgetGenerator - calculateWallTilingArea: ${room.type} ${room.number || ""} - PARCIAL: cerámico=${perimeter.toFixed(2)}m (total=${room.perimeter?.toFixed(2)}m), área: ${wallArea.toFixed(2)}m²`,
          )
        } else {
          console.log(
            `[v0] BudgetGenerator - calculateWallTilingArea: ${room.type} ${room.number || ""} - perímetro: ${perimeter}m, altura: ${wallHeight}m, área: ${wallArea}m²`,
          )
        }
      }

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
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      const rawMaterial = room.floorMaterial || "";
      const normFloor = rawMaterial.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const isCeramicMaterial = normFloor === "ceramico" || normFloor === "ceramica";
      const isOtherMaterial = ["madera", "suelo laminado", "suelo vinilico", "parquet flotante", "madera"].includes(normFloor);
      const isNoModifica = normFloor === "no se modifica";

      const isBathroomOrKitchen = room.type === "Baño" || room.type === "Cocina";

      if (isCeramicMaterial) {
        console.log(`[v0] BudgetGenerator - calculateFloorTilingArea - Adding ${room.area} m² from ${room.type} (Material: Ceramic)`)
        totalArea += room.area || 0
      } else if (!isOtherMaterial && !isNoModifica) {
        if (tileAllFloors || isBathroomOrKitchen) {
          console.log(
            `[v0] BudgetGenerator - calculateFloorTilingArea - Adding ${room.area} m² from ${room.type} (Reason: ${tileAllFloors ? 'tileAllFloors' : 'Room Type'})`,
          )
          totalArea += room.area || 0
        }
      }
    })

    console.log(`[v0] BudgetGenerator - calculateFloorTilingArea - Total: ${totalArea.toFixed(2)} m²`)
    return totalArea
  }

  private calculateBaseboardLength(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    // Sumar perimetro de habitaciones que NO sean Baño o Cocina (petición usuario: no rodapié cerámico por defecto)
    return reform.rooms.reduce((total: number, room: any) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return total
      }

      const type = (room.type || "").toLowerCase()
      const name = (room.name || "").toLowerCase()

      // Robust check for bathroom/kitchen
      if (
        type.includes("baño") ||
        type.includes("bano") ||
        type.includes("aseo") ||
        type.includes("cocina") ||
        name.includes("baño") ||
        name.includes("bano") ||
        name.includes("aseo") ||
        name.includes("cocina")
      ) {
        return total
      }
      return total + (room.perimeter || 0)
    }, 0)
  }

  private countTotalDoors(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let totalDoors = 0

    reform.rooms.forEach((room: any, index: number) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      // Use newDoors flag and newDoorList for reform doors
      const hasNewDoors = room.newDoors === true
      const hasList = Array.isArray(room.newDoorList) && room.newDoorList.length > 0

      if (hasNewDoors && hasList) {
        console.log(`[v0] BudgetGenerator.countTotalDoors - Room ${index} (${room.type}) adding ${room.newDoorList.length} doors`)
        totalDoors += room.newDoorList.length
      }
    })

    // Añadir puerta de entrada si existe
    if (reform.entryDoor) {
      console.log(`[v0] BudgetGenerator.countTotalDoors - Adding entrance door (+1)`)
      totalDoors += 1
    }

    console.log(`[v0] BudgetGenerator - Total doors counted: ${totalDoors}`)
    return totalDoors
  }

  private countSwingDoors(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let swingDoors = 0

    reform.rooms.forEach((room: any, index: number) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      const hasNewDoors = room.newDoors === true
      const hasList = Array.isArray(room.newDoorList) && room.newDoorList.length > 0

      if (hasNewDoors && hasList) {
        room.newDoorList.forEach((door: any, doorIndex: number) => {
          if (door.type === "Abatible") {
            console.log(`[v0] BudgetGenerator.countSwingDoors - Room ${index} (${room.type}) adding swing door ${doorIndex}`)
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

    reform.rooms.forEach((room: any, index: number) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      const hasNewDoors = room.newDoors === true
      const hasList = Array.isArray(room.newDoorList) && room.newDoorList.length > 0

      if (hasNewDoors && hasList) {
        room.newDoorList.forEach((door: any, doorIndex: number) => {
          if ((door.type === "Corredera" || door.type === "Corredera empotrada") && !door.isExterior) {
            console.log(`[v0] BudgetGenerator.countSlidingDoors - Room ${index} (${room.type}) adding sliding door ${doorIndex}`)
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

    reform.rooms.forEach((room: any, index: number) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      const hasNewDoors = room.newDoors === true
      const hasList = Array.isArray(room.newDoorList) && room.newDoorList.length > 0

      if (hasNewDoors && hasList) {
        room.newDoorList.forEach((door: any, doorIndex: number) => {
          if (door.type === "Corredera exterior" || door.type === "Corredera exterior con carril" || (door.type === "Corredera" && door.isExterior)) {
            console.log(`[v0] BudgetGenerator.countExteriorSlidingDoors - Room ${index} (${room.type}) adding exterior sliding door ${doorIndex}`)
            exteriorSlidingDoors += 1
          }
        })
      }
    })

    console.log(`[v0] BudgetGenerator - Exterior sliding doors counted: ${exteriorSlidingDoors}`)
    return exteriorSlidingDoors
  }

  private countDoubleSwingDoors(): number {
    const { reform } = this.calculatorData
    if (!reform || !reform.rooms) return 0

    let doubleSwingDoors = 0

    reform.rooms.forEach((room: any, index: number) => {
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      const hasNewDoors = room.newDoors === true
      const hasList = Array.isArray(room.newDoorList) && room.newDoorList.length > 0

      if (hasNewDoors && hasList) {
        room.newDoorList.forEach((door: any, doorIndex: number) => {
          if (door.type === "Doble abatible") {
            console.log(`[v0] BudgetGenerator.countDoubleSwingDoors - Room ${index} (${room.type}) adding double swing door ${doorIndex}`)
            doubleSwingDoors += 1
          }
        })
      }
    })

    console.log(`[v0] BudgetGenerator - Double swing doors counted: ${doubleSwingDoors}`)
    return doubleSwingDoors
  }

  private estimatePowerLines(): number {
    return Math.ceil(this.getRealRoomCount() / 3)
  }

  private estimateLightingLines(): number {
    return Math.ceil(this.getRealRoomCount() / 3)
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
      // Ignorar habitación técnica de ventanas
      const roomName = (room.name || "").toLowerCase()
      const roomType = (room.type || "").toLowerCase()
      const customType = (room.customRoomType || "").toLowerCase()
      if (roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas")) {
        return
      }

      if (room.removeFalseCeiling || room.currentCeilingStatus === "lowered_remove" || room.falseCeiling) {
        const ceilingThickness = 0.015
        const expansionCoef = 1.4
        totalDebris += (room.area || 0) * ceilingThickness * expansionCoef
      }

      if (room.removeFloor && room.floorMaterial === "Cerámico") {
        const floorThickness = demolition.settings?.floorTileThickness || 0.07
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
